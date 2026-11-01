"""
Supermú Product Scraper & JSON Exporter
Extrae productos de Supermú (Shopify) recorriendo todas las páginas y colecciones.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Dict, List, Any

# Asegurar codificación UTF-8 en consola de Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Colecciones principales solicitadas por el usuario (ver imagen de navegación)
DEFAULT_COLLECTIONS = [
    {"handle": "carnes-res-cerdo", "name": "Carnes, pollo y pescado"},
    {"handle": "frutas-y-verduras", "name": "Frutas y Verduras"},
    {"handle": "desayuno", "name": "Desayuno"},
    {"handle": "despensa", "name": "Despensa"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

def clean_html(raw_html: str) -> str:
    """Elimina etiquetas HTML y limpia el texto descriptivo."""
    if not raw_html:
        return ""
    clean = re.sub(r"<style[\s\S]*?</style>", "", raw_html, flags=re.IGNORECASE)
    clean = re.sub(r"<script[\s\S]*?</script>", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"<[^>]+>", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def format_cop(val: float) -> str:
    """Formatea valor numérico como moneda colombiana COP."""
    try:
        return f"${int(val):,}".replace(",", ".")
    except Exception:
        return f"${val}"

def fetch_json(url: str, retries: int = 3, delay: float = 1.0) -> Any:
    """Descarga JSON con manejo de reintentos."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    data = response.read().decode("utf-8")
                    return json.loads(data)
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

def parse_product(item: Dict[str, Any], collection_name: str, collection_handle: str) -> Dict[str, Any]:
    """Normaliza y extrae los campos clave de un producto de Shopify."""
    variants = item.get("variants", [])
    primary_variant = variants[0] if variants else {}

    price_str = primary_variant.get("price", "0")
    try:
        price = float(price_str)
    except ValueError:
        price = 0.0

    compare_at_str = primary_variant.get("compare_at_price")
    compare_at_price = None
    discount_pct = 0
    if compare_at_str:
        try:
            compare_at_price = float(compare_at_str)
            if compare_at_price > price:
                discount_pct = round(((compare_at_price - price) / compare_at_price) * 100)
        except ValueError:
            pass

    images = [img.get("src") for img in item.get("images", []) if img.get("src")]
    primary_image = images[0] if images else None

    # Limpiar descripción
    body_html = item.get("body_html", "")
    description = clean_html(body_html)

    return {
        "id": item.get("id"),
        "title": item.get("title", "").strip(),
        "handle": item.get("handle", ""),
        "url": f"https://supermu.com/products/{item.get('handle', '')}",
        "collection": collection_name,
        "collection_handle": collection_handle,
        "vendor": item.get("vendor", "").strip() or "SUPERMU",
        "product_type": item.get("product_type", "").strip() or collection_name,
        "tags": item.get("tags", []),
        "description": description,
        "sku": primary_variant.get("sku", ""),
        "price": price,
        "price_formatted": format_cop(price),
        "compare_at_price": compare_at_price,
        "compare_at_formatted": format_cop(compare_at_price) if compare_at_price else None,
        "discount_percent": discount_pct,
        "on_sale": discount_pct > 0,
        "available": bool(primary_variant.get("available", False)),
        "grams": primary_variant.get("grams", 0),
        "image": primary_image,
        "images": images,
        "variants_count": len(variants),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }

def scrape_collection(handle: str, name: str, max_pages: int = 100, page_limit: int = 250) -> List[Dict[str, Any]]:
    """Descarga todos los productos de una colección paginada (hasta 250 por página)."""
    products = []
    seen_ids = set()
    page = 1

    print(f"\n==========================================")
    print(f"[+] Extrayendo categoria: '{name}' ({handle})")
    print(f"==========================================")

    while page <= max_pages:
        url = f"https://supermu.com/collections/{handle}/products.json?limit={page_limit}&page={page}"
        print(f"  -> Solicitando página {page}...")
        data = fetch_json(url)

        if not data or "products" not in data:
            print("  [Fin] No se recibieron más datos o respuesta vacía.")
            break

        page_products = data.get("products", [])
        if not page_products:
            print(f"  [Fin] Categoría completada en la página {page - 1}.")
            break

        new_count = 0
        for raw in page_products:
            pid = raw.get("id")
            if pid not in seen_ids:
                seen_ids.add(pid)
                parsed = parse_product(raw, name, handle)
                products.append(parsed)
                new_count += 1

        print(f"  -> Página {page}: {len(page_products)} productos ({new_count} nuevos). Total acumulado: {len(products)}")

        if len(page_products) < page_limit:
            # Última página alcanzada
            break

        page += 1
        time.sleep(0.3)  # Pausa respetuosa

    return products

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_json = os.path.join(script_dir, "supermu_products.json")
    output_summary = os.path.join(script_dir, "supermu_summary.json")

    all_products = []
    seen_global_ids = set()

    start_time = time.time()

    for col in DEFAULT_COLLECTIONS:
        col_products = scrape_collection(col["handle"], col["name"])
        for p in col_products:
            if p["id"] not in seen_global_ids:
                seen_global_ids.add(p["id"])
                all_products.append(p)
            else:
                # Si ya existe en otra colección, añadir tag
                for existing in all_products:
                    if existing["id"] == p["id"]:
                        if col["name"] not in existing["collection"]:
                            existing["collection"] += f", {col['name']}"
                        break

    elapsed = round(time.time() - start_time, 2)
    print(f"\n[OK] Extraccion completada en {elapsed}s.")
    print(f"Total productos unicos recopilados: {len(all_products)}")

    # Guardar JSON completo
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"[OK] Archivo guardado: {output_json}")

    # Guardar resumen estadístico
    categories_stat = {}
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
    print(f"[OK] Resumen estadistico guardado: {output_summary}")

if __name__ == "__main__":
    main()
