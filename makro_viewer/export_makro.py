"""
Makro Colombia Product Scraper & JSON Exporter
Extrae productos de tienda.makro.com.co (Next.js App Router) recorriendo todas las páginas de cada categoría.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Dict, List, Any, Optional, Tuple

# Asegurar codificación UTF-8 en consola de Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Categorías configuradas (puedes agregar más slugs de tienda.makro.com.co/ca/<slug>)
DEFAULT_COLLECTIONS = [
    {"slug": "navidad-makro/CP_23", "name": "Navidad en Makro"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
}


def format_cop(val: float) -> str:
    """Formatea valor numérico como moneda colombiana COP."""
    try:
        return f"${int(round(val)):,}".replace(",", ".")
    except Exception:
        return f"${val}"


def fetch_html(url: str, retries: int = 3, delay: float = 1.0) -> Optional[str]:
    """Descarga HTML con manejo de reintentos."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status == 200:
                    return response.read().decode("utf-8", errors="ignore")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print(f"[429 Rate Limit] Esperando {delay * 2}s...")
                time.sleep(delay * 2)
            else:
                print(f"[HTTP {e.code}] Error al consultar {url}")
                return None
        except Exception as e:
            print(f"[Error] {e} en {url} (intento {attempt + 1}/{retries})")
            time.sleep(delay)
    return None


def extract_products_and_pagination(html: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Extrae el arreglo de productos y la paginación desde los chunks self.__next_f de Next.js."""
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', html, re.S)
    decoder = json.JSONDecoder()

    for raw_chunk in chunks:
        try:
            decoded = json.loads(f'"{raw_chunk}"')
        except Exception:
            decoded = raw_chunk

        idx = decoded.find('"products":[')
        if idx == -1:
            continue

        try:
            products, _ = decoder.raw_decode(decoded[idx + len('"products":'):])
        except Exception:
            continue

        pagination = {}
        pidx = decoded.find('"pagination":{')
        if pidx != -1:
            try:
                pagination, _ = decoder.raw_decode(decoded[pidx + len('"pagination":'):])
            except Exception:
                pass

        return products, pagination

    return [], {}


def parse_product(item: Dict[str, Any], collection_name: str, collection_slug: str) -> Dict[str, Any]:
    """Normaliza y extrae los campos clave de un producto de Makro."""
    sku = str(item.get("sku") or "").strip()
    slug = str(item.get("slug") or "").strip()
    name = str(item.get("name") or "").strip()

    try:
        price = float(item.get("price") or 0)
    except (ValueError, TypeError):
        price = 0.0

    prev_price = None
    if item.get("previousPrice"):
        try:
            prev_price = float(item["previousPrice"])
        except (ValueError, TypeError):
            prev_price = None

    compare_at_price = prev_price if (prev_price and prev_price > price) else None
    discount_pct = 0
    if compare_at_price and price > 0:
        discount_pct = round(((compare_at_price - price) / compare_at_price) * 100)

    # Detectar promociones especiales (ej. specialPrice por cantidad)
    promo_label = None
    promo = item.get("promotion")
    if isinstance(promo, dict) and promo.get("isActive"):
        conditions = promo.get("conditions") or []
        if conditions:
            cond = conditions[0]
            cond_price = cond.get("price")
            cond_qty = cond.get("quantity")
            if cond_price and cond_qty and float(cond_price) < price:
                promo_pct = round(((price - float(cond_price)) / price) * 100)
                if cond_qty > 1:
                    promo_label = f"Lleva {cond_qty}+ a {format_cop(float(cond_price))} c/u (-{promo_pct}%)"
                else:
                    compare_at_price = price
                    price = float(cond_price)
                    discount_pct = promo_pct
                    promo_label = f"Oferta {format_cop(price)} (-{promo_pct}%)"

    images = [u for u in (item.get("photosUrl") or []) if u]
    primary_image = images[0] if images else None

    # Categorías y subcategorías
    subcats = []
    for c in item.get("categories") or []:
        cname = (c.get("name") or "").strip()
        if cname and cname not in subcats:
            subcats.append(cname)

    brand = str(item.get("brand") or "").strip() or "MAKRO"
    unit = str(item.get("unit") or "").strip()
    sub_unit = str(item.get("subUnit") or "").strip()
    sub_qty = item.get("subQty")
    presentation = f"{sub_qty} {sub_unit}".strip() if sub_qty and sub_unit else unit

    eans = item.get("ean") or []
    ean = str(eans[0]) if eans else ""

    stock = item.get("stock") or 0
    is_available = bool(item.get("isAvailable", False)) and bool(item.get("isActive", True))

    return {
        "id": sku or slug,
        "title": name,
        "handle": slug,
        "url": f"https://tienda.makro.com.co/p/{slug}" if slug else "https://tienda.makro.com.co",
        "collection": collection_name,
        "collection_handle": collection_slug,
        "subcategories": subcats,
        "vendor": brand,
        "product_type": subcats[-1] if subcats else collection_name,
        "tags": subcats,
        "description": f"Presentación: {presentation}. SKU: {sku}." + (f" EAN: {ean}." if ean else ""),
        "sku": sku,
        "ean": ean,
        "price": price,
        "price_formatted": format_cop(price),
        "compare_at_price": compare_at_price,
        "compare_at_formatted": format_cop(compare_at_price) if compare_at_price else None,
        "discount_percent": discount_pct,
        "on_sale": discount_pct > 0 or bool(promo_label),
        "promo_label": promo_label,
        "available": is_available,
        "stock": stock,
        "unit": unit,
        "presentation": presentation,
        "image": primary_image,
        "images": images,
    }


def scrape_collection(slug: str, name: str, max_pages: int = 100) -> List[Dict[str, Any]]:
    """Descarga todos los productos de una categoría paginada de Makro."""
    products: List[Dict[str, Any]] = []
    seen_ids = set()
    page = 1
    total_pages = None

    print(f"\n==========================================")
    print(f"[+] Extrayendo categoría: '{name}' ({slug})")
    print(f"==========================================")

    while page <= max_pages:
        if total_pages is not None and page > total_pages:
            break

        url = f"https://tienda.makro.com.co/ca/{slug}?currentPage={page}"
        print(f"  -> Solicitando página {page}" + (f"/{total_pages}" if total_pages else "") + "...")
        html = fetch_html(url)
        if not html:
            print("  [Fin] No se pudo descargar la página.")
            break

        raw_products, pagination = extract_products_and_pagination(html)
        if pagination and total_pages is None:
            total_pages = int(pagination.get("pages") or 1)
            total_items = (pagination.get("total") or {}).get("value", "?")
            print(f"  [Info] Total reportado por Makro: {total_items} productos en {total_pages} páginas.")

        if not raw_products:
            print(f"  [Fin] Sin productos en la página {page}.")
            break

        new_count = 0
        for raw in raw_products:
            parsed = parse_product(raw, name, slug)
            pid = parsed["id"]
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                products.append(parsed)
                new_count += 1

        print(f"  -> Página {page}: {len(raw_products)} productos ({new_count} nuevos). Total acumulado: {len(products)}")

        if total_pages is not None and page >= total_pages:
            break

        page += 1
        time.sleep(0.35)

    return products


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_json = os.path.join(script_dir, "makro_products.json")
    output_summary = os.path.join(script_dir, "makro_summary.json")
    output_js = os.path.join(script_dir, "products_data.js")

    all_products: List[Dict[str, Any]] = []
    seen_global_ids = set()
    start_time = time.time()

    for col in DEFAULT_COLLECTIONS:
        col_products = scrape_collection(col["slug"], col["name"])
        for p in col_products:
            if p["id"] not in seen_global_ids:
                seen_global_ids.add(p["id"])
                all_products.append(p)
            else:
                for existing in all_products:
                    if existing["id"] == p["id"]:
                        if col["name"] not in existing["collection"]:
                            existing["collection"] += f", {col['name']}"
                        break

    elapsed = round(time.time() - start_time, 2)
    print(f"\n[OK] Extracción completada en {elapsed}s.")
    print(f"Total productos únicos recopilados: {len(all_products)}")

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"[OK] Archivo guardado: {output_json}")

    with open(output_js, "w", encoding="utf-8") as f:
        f.write("window.MAKRO_DATA = " + json.dumps(all_products, ensure_ascii=False) + ";")
    print(f"[OK] Archivo JS guardado: {output_js}")

    categories_stat: Dict[str, int] = {}
    available_count = 0
    on_sale_count = 0
    prices = []

    for p in all_products:
        cat = p["collection"]
        categories_stat[cat] = categories_stat.get(cat, 0) + 1
        if p["available"]:
            available_count += 1
        if p["on_sale"]:
            on_sale_count += 1
        if p["price"] > 0:
            prices.append(p["price"])

    summary = {
        "total_products": len(all_products),
        "available_products": available_count,
        "out_of_stock": len(all_products) - available_count,
        "on_sale_products": on_sale_count,
        "categories": categories_stat,
        "min_price": min(prices) if prices else 0,
        "max_price": max(prices) if prices else 0,
        "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
        "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "duration_seconds": elapsed,
    }

    with open(output_summary, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[OK] Resumen estadístico guardado: {output_summary}")


if __name__ == "__main__":
    main()
