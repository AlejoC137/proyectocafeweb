"""
Éxito Colombia Local HTML Parser & JSON Exporter
Lee archivos .html/.htm guardados manualmente desde www.exito.com (Ctrl+S) en ./html_guardados/
y genera exito_products.json, products_data.js y exito_summary.json para el visualizador.
"""

import glob
import html as html_lib
import json
import os
import re
import sys
import time
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def format_cop(val: float) -> str:
    try:
        return f"${int(round(val)):,}".replace(",", ".")
    except Exception:
        return f"${val}"


def parse_cop_number(text: str) -> float:
    if not text:
        return 0.0
    digits = re.sub(r"[^\d]", "", text)
    return float(digits) if digits else 0.0


def extract_from_next_data(raw_html: str) -> List[Dict[str, Any]]:
    """Intenta extraer productos desde __NEXT_DATA__ (FastStore / Next.js)."""
    m = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', raw_html, re.S | re.I)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except Exception:
        return []

    found: List[Dict[str, Any]] = []

    def walk(obj: Any):
        if isinstance(obj, dict):
            # Patrón típico de nodo de producto en FastStore / VTEX
            if ("name" in obj or "isVariantOf" in obj) and ("offers" in obj or "sku" in obj or "slug" in obj):
                found.append(obj)
                return
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(data)
    return found


def extract_from_ld_json(raw_html: str) -> List[Dict[str, Any]]:
    """Intenta extraer productos desde bloques application/ld+json."""
    products: List[Dict[str, Any]] = []
    scripts = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', raw_html, re.S | re.I)
    for s in scripts:
        try:
            data = json.loads(s.strip())
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for obj in items:
            if not isinstance(obj, dict):
                continue
            if obj.get("@type") == "ItemList":
                for el in obj.get("itemListElement") or []:
                    item = el.get("item") if isinstance(el, dict) else None
                    if isinstance(item, dict):
                        products.append(item)
            elif obj.get("@type") == "Product":
                products.append(obj)
    return products


class ProductCardHTMLParser(HTMLParser):
    """Parser de respaldo usando atributos HTML (data-fs-product-card, article, enlaces /p)."""

    def __init__(self):
        super().__init__()
        self.cards: List[Dict[str, Any]] = []
        self._in_card = False
        self._card_depth = 0
        self._current: Dict[str, Any] = {}
        self._text_parts: List[str] = []
        self._in_a = False
        self._current_href = ""

    def handle_starttag(self, tag: str, attrs):
        attr_dict = dict(attrs)
        cls = (attr_dict.get("class") or "").lower()
        is_card_start = (
            "data-fs-product-card" in attr_dict
            or (tag == "article" and ("product" in cls or "card" in cls))
            or ("productcard" in cls.replace("-", "").replace("_", ""))
        )

        if not self._in_card and is_card_start:
            self._in_card = True
            self._card_depth = 1
            self._current = {
                "attrs": attr_dict,
                "links": [],
                "images": [],
                "texts": [],
                "prices": [],
                "discount": None,
            }
            return

        if self._in_card:
            if tag not in ("img", "br", "hr", "input", "meta", "link"):
                self._card_depth += 1

            if tag == "a":
                href = attr_dict.get("href") or ""
                if href:
                    self._current["links"].append(href)
                    self._in_a = True
                    self._current_href = href
            elif tag == "img":
                src = attr_dict.get("src") or attr_dict.get("data-src") or ""
                alt = attr_dict.get("alt") or ""
                if src and not src.startswith("data:"):
                    self._current["images"].append(src)
                if alt and len(alt) > 4:
                    self._current["texts"].append(alt)

    def handle_endtag(self, tag: str):
        if not self._in_card:
            return
        if tag == "a":
            self._in_a = False
        if tag not in ("img", "br", "hr", "input", "meta", "link"):
            self._card_depth -= 1
            if self._card_depth <= 0:
                self._in_card = False
                if self._current.get("links") or self._current.get("texts"):
                    self.cards.append(self._current)
                self._current = {}

    def handle_data(self, data: str):
        if not self._in_card:
            return
        txt = re.sub(r"\s+", " ", data).strip()
        if not txt:
            return
        self._current["texts"].append(txt)
        if "$" in txt and not re.search(r"\b(?:gr|ml|kg|lt|und|un)\s+a\s*\$", txt, re.I):
            val = parse_cop_number(txt)
            if val >= 100:
                self._current["prices"].append(val)
        m_disc = re.search(r"-?\s*(\d{1,2})\s*%", txt)
        if m_disc and not self._current["discount"]:
            self._current["discount"] = int(m_disc.group(1))


def normalize_next_product(raw: Dict[str, Any], source_file: str) -> Optional[Dict[str, Any]]:
    variant_of = raw.get("isVariantOf") or {}
    name = (raw.get("name") or variant_of.get("name") or "").strip()
    if not name:
        return None

    sku = str(raw.get("sku") or raw.get("id") or "").strip()
    slug = (raw.get("slug") or "").strip()
    url = f"https://www.exito.com/{slug}/p" if slug and not slug.startswith("http") else (slug or "https://www.exito.com")

    offers = raw.get("offers") or {}
    low_price = offers.get("lowPrice") or 0
    offer_list = offers.get("offers") or []
    first_offer = offer_list[0] if offer_list else {}
    price = float(first_offer.get("price") or low_price or 0)
    list_price = float(first_offer.get("listPrice") or 0)

    compare_at = list_price if list_price > price else None
    discount_pct = round(((compare_at - price) / compare_at) * 100) if (compare_at and price > 0) else 0

    imgs = [i.get("url") for i in (raw.get("image") or []) if isinstance(i, dict) and i.get("url")]
    brand_obj = raw.get("brand") or {}
    brand = (brand_obj.get("brandName") or brand_obj.get("name") or "ÉXITO").strip()

    availability = str(first_offer.get("availability") or "").lower()
    available = "outofstock" not in availability if availability else (price > 0)

    return {
        "id": sku or slug or name,
        "title": name,
        "handle": slug,
        "url": url,
        "collection": "Mercado / Despensa",
        "vendor": brand,
        "product_type": "Despensa",
        "tags": [source_file],
        "description": f"Archivo origen: {source_file}. SKU: {sku}.",
        "sku": sku,
        "price": price,
        "price_formatted": format_cop(price),
        "compare_at_price": compare_at,
        "compare_at_formatted": format_cop(compare_at) if compare_at else None,
        "discount_percent": discount_pct,
        "on_sale": discount_pct > 0,
        "available": available,
        "image": imgs[0] if imgs else None,
        "images": imgs,
    }


def normalize_ld_product(raw: Dict[str, Any], source_file: str) -> Optional[Dict[str, Any]]:
    name = html_lib.unescape(str(raw.get("name") or "").strip())
    if not name:
        return None
    sku = str(raw.get("sku") or raw.get("mpn") or "").strip()
    url = str(raw.get("url") or "https://www.exito.com").strip()
    if url.startswith("/"):
        url = "https://www.exito.com" + url

    offers = raw.get("offers") or {}
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    price = float(offers.get("price") or offers.get("lowPrice") or 0)
    avail = str(offers.get("availability") or "").lower()
    available = "outofstock" not in avail

    img = raw.get("image")
    imgs = img if isinstance(img, list) else ([img] if isinstance(img, str) else [])
    brand_obj = raw.get("brand")
    brand = (brand_obj.get("name") if isinstance(brand_obj, dict) else str(brand_obj or "ÉXITO")).strip()

    return {
        "id": sku or url,
        "title": name,
        "handle": url.split("/")[-2] if "/p" in url else sku,
        "url": url,
        "collection": "Mercado / Despensa",
        "vendor": brand,
        "product_type": "Despensa",
        "tags": [source_file],
        "description": html_lib.unescape(str(raw.get("description") or f"Archivo origen: {source_file}.")),
        "sku": sku,
        "price": price,
        "price_formatted": format_cop(price),
        "compare_at_price": None,
        "compare_at_formatted": None,
        "discount_percent": 0,
        "on_sale": False,
        "available": available,
        "image": imgs[0] if imgs else None,
        "images": imgs,
    }


def normalize_html_card(card: Dict[str, Any], source_file: str) -> Optional[Dict[str, Any]]:
    texts = [t for t in card.get("texts", []) if "$" not in t and not re.match(r"^-?\d+%$", t) and len(t) > 3]
    # Filtrar textos de botones comunes
    skip = {"agregar", "añadir", "ver producto", "comprar", "envío gratis", "exclusivo online"}
    candidates = [t for t in texts if t.lower() not in skip]
    if not candidates:
        return None
    title = max(candidates[:4], key=len)

    links = [l for l in card.get("links", []) if "/p" in l or "exito.com" in l]
    raw_url = links[0] if links else (card["links"][0] if card.get("links") else "")
    if raw_url.startswith("/"):
        url = "https://www.exito.com" + raw_url
    elif raw_url.startswith("http"):
        url = raw_url
    else:
        url = "https://www.exito.com"

    prices = sorted(set(card.get("prices") or []))
    price = prices[0] if prices else 0.0
    compare_at = prices[-1] if len(prices) > 1 and prices[-1] > price else None
    discount_pct = card.get("discount") or (round(((compare_at - price) / compare_at) * 100) if (compare_at and price > 0) else 0)

    imgs = card.get("images") or []
    sku_match = re.search(r"-(\d+(?:-mp)?)/p", url)
    sku = sku_match.group(1) if sku_match else ""

    return {
        "id": sku or url or title,
        "title": title,
        "handle": url,
        "url": url,
        "collection": "Mercado / Despensa",
        "vendor": "ÉXITO",
        "product_type": "Despensa",
        "tags": [source_file],
        "description": f"Extraído desde HTML guardado ({source_file}).",
        "sku": sku,
        "price": price,
        "price_formatted": format_cop(price),
        "compare_at_price": compare_at,
        "compare_at_formatted": format_cop(compare_at) if compare_at else None,
        "discount_percent": discount_pct,
        "on_sale": discount_pct > 0,
        "available": price > 0,
        "image": imgs[0] if imgs else None,
        "images": imgs,
    }


def parse_html_file(filepath: str) -> List[Dict[str, Any]]:
    filename = os.path.basename(filepath)
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        raw_html = f.read()

    results: List[Dict[str, Any]] = []

    # 1. Intentar __NEXT_DATA__
    next_items = extract_from_next_data(raw_html)
    if next_items:
        for item in next_items:
            p = normalize_next_product(item, filename)
            if p:
                results.append(p)
        if results:
            print(f"  [__NEXT_DATA__] {filename}: {len(results)} productos")
            return results

    # 2. Intentar ld+json
    ld_items = extract_from_ld_json(raw_html)
    if ld_items:
        for item in ld_items:
            p = normalize_ld_product(item, filename)
            if p:
                results.append(p)
        if results:
            print(f"  [ld+json] {filename}: {len(results)} productos")
            return results

    # 3. Respaldo por atributos/DOM HTML
    parser = ProductCardHTMLParser()
    parser.feed(raw_html)
    for card in parser.cards:
        p = normalize_html_card(card, filename)
        if p:
            results.append(p)
    print(f"  [HTML Attrs] {filename}: {len(results)} productos")
    return results


def parse_text_or_markdown(raw_text: str, filename: str) -> List[Dict[str, Any]]:
    """Extrae productos desde texto/markdown copiado de www.exito.com (enlaces [Titulo](url/p) + precio + Vendido por)."""
    pattern = re.compile(
        r"\[([^\]]+)\]\((https?://www\.exito\.com/[^)\s]+/p)\)(.*?)(?=\n\[[^\]]+\]\(https?://www\.exito\.com/|\nAnterior\b|\Z)",
        re.S,
    )
    results: List[Dict[str, Any]] = []
    for m in pattern.finditer(raw_text):
        raw_title = m.group(1).strip()
        url = m.group(2).strip()
        block = m.group(3)

        # Limpiar sufijo tipo "(Gr a $ 66,52)" del título si está presente
        unit_price_note = ""
        m_unit = re.search(r"\(([^)]*a\s*\$\s*[\d\.,]+)\)\s*$", raw_title)
        if m_unit:
            unit_price_note = m_unit.group(1).strip()
            title = raw_title[:m_unit.start()].strip()
        else:
            title = raw_title

        prices = [parse_cop_number(p) for p in re.findall(r"\$\s*([\d\.]+)", block)]
        prices = [p for p in prices if p > 0]
        if not prices:
            continue

        if len(prices) >= 2 and prices[0] > prices[-1]:
            compare_at = prices[0]
            price = prices[-1]
        else:
            compare_at = None
            price = prices[-1]

        m_disc = re.search(r"(\d{1,2})\s*%", block)
        discount_pct = int(m_disc.group(1)) if m_disc else (
            round(((compare_at - price) / compare_at) * 100) if (compare_at and price > 0) else 0
        )

        m_vendor = re.search(r"Vendido por:\s*([^\n\r]+)", block)
        vendor = m_vendor.group(1).strip() if m_vendor else "Éxito"

        sku_match = re.search(r"-(\d+(?:-mp)?)/p$", url)
        sku = sku_match.group(1) if sku_match else ""

        results.append({
            "id": sku or url,
            "title": title,
            "handle": url,
            "url": url,
            "collection": "Mercado / Despensa",
            "vendor": vendor,
            "product_type": "Despensa",
            "tags": [filename],
            "description": (f"Precio por unidad: {unit_price_note}. " if unit_price_note else "") + f"Vendido por: {vendor}. Origen: {filename}.",
            "sku": sku,
            "price": price,
            "price_formatted": format_cop(price),
            "compare_at_price": compare_at,
            "compare_at_formatted": format_cop(compare_at) if compare_at else None,
            "discount_percent": discount_pct,
            "on_sale": discount_pct > 0 or (compare_at is not None),
            "available": True,
            "image": None,
            "images": [],
        })
    print(f"  [Texto/MD] {filename}: {len(results)} productos")
    return results


def parse_json_file(filepath: str) -> List[Dict[str, Any]]:
    """Lee un archivo .json exportado por el script de navegador en html_guardados/."""
    filename = os.path.basename(filepath)
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  [!] Error leyendo JSON {filename}: {e}")
        return []
    if not isinstance(data, list):
        return []
    results: List[Dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict) or not item.get("url"):
            continue
        price = float(item.get("price") or 0)
        compare_at = item.get("compare_at_price")
        compare_at = float(compare_at) if compare_at else None
        if compare_at and compare_at <= price:
            compare_at = None
        discount_pct = int(item.get("discount_percent") or 0)
        if compare_at and compare_at > price and discount_pct == 0:
            discount_pct = round((compare_at - price) / compare_at * 100)
        url = str(item["url"])
        sku_m = re.search(r"-(\d+(?:-mp)?)/p$", url)
        sku = str(item.get("sku") or (sku_m.group(1) if sku_m else ""))
        img = item.get("image")
        images = item.get("images") or ([img] if img else [])
        results.append({
            "id": str(item.get("id") or sku or url),
            "title": str(item.get("title") or "Producto Éxito"),
            "handle": url,
            "url": url,
            "collection": str(item.get("collection") or "Mercado / Despensa"),
            "vendor": str(item.get("vendor") or "Exito"),
            "product_type": str(item.get("product_type") or "Despensa"),
            "tags": item.get("tags") or [filename],
            "description": str(item.get("description") or f"Vendido por: {item.get('vendor') or 'Exito'}. Origen: {filename}."),
            "sku": sku,
            "price": price,
            "price_formatted": format_cop(price),
            "compare_at_price": compare_at,
            "compare_at_formatted": format_cop(compare_at) if compare_at else None,
            "discount_percent": discount_pct,
            "on_sale": discount_pct > 0 or (compare_at is not None),
            "available": True,
            "image": img,
            "images": images,
        })
    print(f"  [JSON] {filename}: {len(results)} productos")
    return results


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_dir = os.path.join(script_dir, "html_guardados")
    os.makedirs(html_dir, exist_ok=True)

    # Traer automáticamente archivos exito_auto*.json desde Descargas si existen
    downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
    if os.path.isdir(downloads_dir):
        import shutil
        for dl_fp in glob.glob(os.path.join(downloads_dir, "exito_auto*.json")):
            dest_fp = os.path.join(html_dir, os.path.basename(dl_fp))
            if not os.path.exists(dest_fp) or os.path.getmtime(dl_fp) > os.path.getmtime(dest_fp):
                shutil.copy2(dl_fp, dest_fp)
                print(f"  [Descargas -> html_guardados] Copiado {os.path.basename(dl_fp)}")

    html_files = sorted(
        glob.glob(os.path.join(html_dir, "*.html"))
        + glob.glob(os.path.join(html_dir, "*.htm"))
        + glob.glob(os.path.join(html_dir, "*.txt"))
        + glob.glob(os.path.join(html_dir, "*.md"))
        + glob.glob(os.path.join(html_dir, "*.json"))
    )

    if not html_files:
        print(f"[!] No se encontraron archivos .html/.txt/.md/.json en: {html_dir}")
        print("    Guarda páginas de www.exito.com con Ctrl+S en esa carpeta y vuelve a ejecutar.")
        return

    all_products: List[Dict[str, Any]] = []
    seen_ids = set()

    for fp in html_files:
        if fp.lower().endswith((".txt", ".md")):
            if os.path.basename(fp).upper() == "LEEME.TXT":
                continue
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                items = parse_text_or_markdown(f.read(), os.path.basename(fp))
        elif fp.lower().endswith(".json"):
            items = parse_json_file(fp)
        else:
            items = parse_html_file(fp)
        for p in items:
            if p["id"] not in seen_ids:
                seen_ids.add(p["id"])
                all_products.append(p)

    output_json = os.path.join(script_dir, "exito_products.json")
    output_js = os.path.join(script_dir, "products_data.js")
    output_summary = os.path.join(script_dir, "exito_summary.json")

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    with open(output_js, "w", encoding="utf-8") as f:
        f.write("window.EXITO_DATA = " + json.dumps(all_products, ensure_ascii=False) + ";")

    prices = [p["price"] for p in all_products if p["price"] > 0]
    summary = {
        "total_products": len(all_products),
        "available_products": sum(1 for p in all_products if p["available"]),
        "on_sale_products": sum(1 for p in all_products if p["on_sale"]),
        "min_price": min(prices) if prices else 0,
        "max_price": max(prices) if prices else 0,
        "avg_price": round(sum(prices) / len(prices), 2) if prices else 0,
        "source_files": len(html_files),
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(output_summary, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] Total productos únicos exportados: {len(all_products)}")
    print(f"[OK] Guardado: {output_json}")
    print(f"[OK] Guardado: {output_js}")


if __name__ == "__main__":
    main()
