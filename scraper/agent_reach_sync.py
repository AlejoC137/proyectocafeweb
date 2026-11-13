"""
Puente Agent Reach -> Supabase (CapturasProveedor & PreciosHistoricosProducto)

Uso:
  python scraper/agent_reach_sync.py --list-providers
  python scraper/agent_reach_sync.py --proveedor-id <uuid> [--dry-run]
  python scraper/agent_reach_sync.py --url "https://supermu.com/collections/despensa" --proveedor-id <uuid>

Intenta usar `agent-reach` (CLI o módulo Python en ../Agent-Reach) y hace fallback
a Jina Reader (`https://r.jina.ai/<url>`) si `agent-reach` no está en el PATH.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def load_env(env_path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip("'\"")
    return env


def supabase_request(
    base_url: str,
    anon_key: str,
    method: str,
    path: str,
    body: Optional[Any] = None,
) -> Any:
    url = f"{base_url.rstrip('/')}/rest/v1/{path}"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else None


def read_with_agent_reach(target_url: str) -> Tuple[str, str]:
    """Ejecuta `agent-reach read <url>` o usa Jina Reader como respaldo."""
    try:
        proc = subprocess.run(
            ["agent-reach", "read", target_url],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=60,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return proc.stdout.strip(), "agent-reach"
    except FileNotFoundError:
        pass
    except Exception:
        pass

    # Fallback: Jina Reader (el mismo backend que usa el canal `web` de Agent Reach)
    jina_url = f"https://r.jina.ai/{target_url}"
    req = urllib.request.Request(
        jina_url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; ProyectoCafeAgentReach/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", errors="ignore"), "agent-reach"


def parse_units_and_quantity(text: str) -> Tuple[float, str]:
    t = (text or "").lower()
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilo)\b", t)
    if m:
        return round(float(m.group(1)) * 1000, 2), "gr"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:gr|g|gramos)\b", t)
    if m:
        return round(float(m.group(1)), 2), "gr"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lt|lts|litro|litros)\b", t)
    if m:
        return round(float(m.group(1)) * 1000, 2), "ml"
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:ml|cc|cm3)\b", t)
    if m:
        return round(float(m.group(1)), 2), "ml"
    m = re.search(r"(\d+)\s*(?:und|unid|unidades|un)\b", t)
    if m:
        return float(int(m.group(1))), "und"
    return 1.0, "und"


def parse_cop_price(raw_price: str) -> float:
    cleaned = re.sub(r"[^\d.,]", "", raw_price or "")
    if not cleaned:
        return 0.0
    # Formato colombiano típico: $12.500 o $12.500,00
    if "." in cleaned and "," not in cleaned:
        parts = cleaned.split(".")
        if all(len(p) == 3 for p in parts[1:]):
            cleaned = "".join(parts)
    cleaned = cleaned.replace(".", "").replace(",", ".") if "," in cleaned else cleaned
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def extract_products_from_text(raw_text: str) -> List[Dict[str, Any]]:
    """Extrae productos y precios desde JSON de Agent Reach o texto/Markdown."""
    stripped = (raw_text or "").strip()
    if stripped.startswith("{") or stripped.startswith("["):
        try:
            data = json.loads(stripped)
            items = data.get("items", data) if isinstance(data, dict) else data
            if isinstance(items, list):
                parsed = []
                for it in items:
                    if not isinstance(it, dict):
                        continue
                    title = str(it.get("title") or it.get("nombre") or it.get("name") or "").strip()
                    price = float(it.get("price") or it.get("precio") or it.get("costo_total") or 0)
                    if not title:
                        continue
                    qty, unit = parse_units_and_quantity(title)
                    if it.get("cantidad"):
                        qty = float(it["cantidad"])
                    if it.get("unidades") or it.get("unidad"):
                        unit = str(it.get("unidades") or it.get("unidad"))
                    unit_price = round(price / qty, 4) if qty > 0 else price
                    parsed.append(
                        {
                            "nombre_detectado": title,
                            "precio_total": price,
                            "cantidad": qty,
                            "unidad": unit,
                            "precio_unitario": unit_price,
                            "url_producto": it.get("url") or "",
                        }
                    )
                if parsed:
                    return parsed
        except Exception:
            pass

    # Fallback Markdown / texto plano: líneas con precio $X.XXX
    products: List[Dict[str, Any]] = []
    seen = set()
    lines = [ln.strip() for ln in stripped.splitlines() if ln.strip()]
    for idx, line in enumerate(lines):
        price_match = re.search(r"\$\s*([\d.,]+)", line)
        if not price_match:
            continue
        price = parse_cop_price(price_match.group(1))
        if price <= 0:
            continue
        candidate_name = re.sub(r"\$\s*[\d.,]+", "", line).strip(" -|•*[]()")
        if len(candidate_name) < 3 and idx > 0:
            candidate_name = lines[idx - 1].strip(" -|•*#[]()")
        if len(candidate_name) < 3 or candidate_name.lower() in seen:
            continue
        seen.add(candidate_name.lower())
        qty, unit = parse_units_and_quantity(candidate_name)
        products.append(
            {
                "nombre_detectado": candidate_name[:180],
                "precio_total": price,
                "cantidad": qty,
                "unidad": unit,
                "precio_unitario": round(price / qty, 4) if qty > 0 else price,
                "url_producto": "",
            }
        )
    return products


def main() -> None:
    parser = argparse.ArgumentParser(description="Sincroniza capturas de Agent Reach hacia Supabase")
    parser.add_argument("--list-providers", action="store_true", help="Lista proveedores con PAGINA_WEB")
    parser.add_argument("--proveedor-id", type=str, help="UUID del proveedor en tabla Proveedores")
    parser.add_argument("--url", type=str, help="URL específica a leer (por defecto usa PAGINA_WEB)")
    parser.add_argument("--dry-run", action="store_true", help="No escribe en Supabase; imprime JSON")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    env = load_env(repo_root / ".env")
    sb_url = env.get("VITE_SUPABASE_URL")
    sb_key = env.get("VITE_SUPABASE_ANON_KEY")
    if not sb_url or not sb_key:
        print("Error: Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env", file=sys.stderr)
        sys.exit(1)

    if args.list_providers:
        provs = supabase_request(
            sb_url, sb_key, "GET", "Proveedores?select=_id,Nombre_Proveedor,PAGINA_WEB&order=Nombre_Proveedor.asc"
        )
        for p in provs or []:
            web = (p.get("PAGINA_WEB") or "").strip()
            if web:
                print(f"{p['_id']} | {p.get('Nombre_Proveedor')} | {web}")
        return

    if not args.proveedor_id:
        print("Error: Debes pasar --proveedor-id o --list-providers", file=sys.stderr)
        sys.exit(1)

    provs = supabase_request(
        sb_url,
        sb_key,
        "GET",
        f"Proveedores?select=_id,Nombre_Proveedor,PAGINA_WEB&_id=eq.{urllib.parse.quote(args.proveedor_id)}",
    )
    if not provs:
        print(f"Error: Proveedor {args.proveedor_id} no encontrado.", file=sys.stderr)
        sys.exit(1)

    prov = provs[0]
    target_url = (args.url or prov.get("PAGINA_WEB") or "").strip()
    if not target_url:
        print("Error: El proveedor no tiene PAGINA_WEB y no se especificó --url.", file=sys.stderr)
        sys.exit(1)

    raw_extract, method = read_with_agent_reach(target_url)
    products = extract_products_from_text(raw_extract)
    now_iso = datetime.now(timezone.utc).isoformat()

    if args.dry_run:
        print(
            json.dumps(
                {
                    "proveedor": prov.get("Nombre_Proveedor"),
                    "proveedor_id": prov["_id"],
                    "fecha_captura": now_iso,
                    "url_fuente": target_url,
                    "metodo": method,
                    "total_productos": len(products),
                    "productos": products[:25],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return

    captura_res = supabase_request(
        sb_url,
        sb_key,
        "POST",
        "CapturasProveedor",
        {
            "proveedor_id": prov["_id"],
            "fecha_captura": now_iso,
            "url_fuente": target_url,
            "metodo": method,
            "extracto_raw": raw_extract[:50000],
            "total_productos": len(products),
            "estado": "pendiente",
        },
    )
    captura_id = captura_res[0]["_id"]

    if products:
        rows = [
            {
                "captura_id": captura_id,
                "proveedor_id": prov["_id"],
                "fecha_captura": now_iso,
                "nombre_detectado": p["nombre_detectado"],
                "precio_total": p["precio_total"],
                "cantidad": p["cantidad"],
                "unidad": p["unidad"],
                "precio_unitario": p["precio_unitario"],
                "url_producto": p.get("url_producto") or target_url,
                "aplicado_a_almacen": False,
            }
            for p in products
        ]
        supabase_request(sb_url, sb_key, "POST", "PreciosHistoricosProducto", rows)

    print(f"OK: Captura {captura_id} guardada ({len(products)} productos) para {prov.get('Nombre_Proveedor')}.")


if __name__ == "__main__":
    main()
