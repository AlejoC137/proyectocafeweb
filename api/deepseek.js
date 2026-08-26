async function extractUrlContext(text) {
  if (!text || typeof text !== 'string') return '';
  const urlRegex = /(https?:\/\/[^\s<"']+)/g;
  const matches = text.match(urlRegex);
  if (!matches || matches.length === 0) return '';

  const uniqueUrls = Array.from(new Set(matches)).slice(0, 3);
  let extractedInfo = '';

  for (const rawUrl of uniqueUrls) {
    const url = rawUrl.replace(/[,\);]+$/, '');
    try {
      // 1. Check if URL is a collection / catalog (Shopify products.json endpoint)
      if (url.includes('/collections/') || url.includes('/catalog/') || url.includes('/categoria/')) {
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');
        const jsonUrl = cleanUrl.endsWith('/products.json') ? cleanUrl : `${cleanUrl}/products.json`;

        try {
          const jsonRes = await fetch(jsonUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          });
          if (jsonRes.ok) {
            const catalogData = await jsonRes.json();
            if (catalogData && catalogData.products && Array.isArray(catalogData.products)) {
              extractedInfo += `\n\n--- [CATÁLOGO COMPLETO EXTRAÍDO EN TIEMPO REAL: ${url}] ---\n`;
              extractedInfo += `Total productos en la colección: ${catalogData.products.length}\n\n`;

              catalogData.products.slice(0, 50).forEach((p, idx) => {
                const variant = p.variants?.[0] || {};
                const price = variant.price || '0';
                const grams = variant.grams ? `${variant.grams}g` : '';
                extractedInfo += `${idx + 1}. ${p.title} - Precio: $${price} COP ${grams ? `(${grams})` : ''} [SKU: ${variant.sku || p.id}]\n`;
              });

              extractedInfo += `\nINSTRUCCIÓN CRÍTICA: La URL corresponde a una COLECCIÓN COMPLETA. Devuelve SIEMPRE un ARRAY JSON con TODOS los productos enumerados arriba respetando el esquema del prompt.\n`;
              continue;
            }
          }
        } catch (e) {
          console.warn('[url-scraper] Collection products.json check failed, falling back to html:', e.message);
        }
      }

      // 2. Standard Webpage HTML Scraping
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!response.ok) continue;
      const html = await response.text();

      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';

      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                      html.match(/<meta[^>]*content=["']([^"']+)["']*property=["']og:title["']/i)?.[1] || '';
      const ogPrice = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                      html.match(/<meta[^>]*content=["']([^"']+)["']*property=["']og:price:amount["']/i)?.[1] || '';
      const ogCurrency = html.match(/<meta[^>]*property=["']og:price:currency["'][^>]*content=["']([^"']+)["']/i)?.[1] || 'COP';
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                     html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      let jsonLdSummary = '';
      for (const jMatch of jsonLdMatches) {
        const rawJson = jMatch.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        if (rawJson.includes('"price"') || rawJson.includes('"Price"') || rawJson.includes('"Product"') || rawJson.includes('"offers"')) {
          jsonLdSummary += rawJson + '\n';
        }
      }

      const cleanBody = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 3000);

      extractedInfo += `\n\n--- [INFORMACIÓN EN TIEMPO REAL EXTRAÍDA DE LA URL: ${url}] ---\n`;
      if (title || ogTitle) extractedInfo += `Título del producto/página: ${ogTitle || title}\n`;
      if (ogPrice) extractedInfo += `PRECIO REAL DETECTADO EN LA PÁGINA: ${ogPrice} ${ogCurrency}\n`;
      if (ogDesc) extractedInfo += `Descripción: ${ogDesc}\n`;
      if (jsonLdSummary) extractedInfo += `Datos estructurados JSON-LD/Schema:\n${jsonLdSummary.slice(0, 1500)}\n`;
      extractedInfo += `Texto extraído de la página web:\n${cleanBody}\n`;

    } catch (e) {
      console.error(`[url-scraper] Error scraping ${url}:`, e.message);
    }
  }

  return extractedInfo;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], systemContext = "", temperature = 0.1 } = req.body;

    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-827f80354e05495497b879e9bbf606b8";
    if (!apiKey) {
      return res.status(500).json({ error: "DEEPSEEK_API_KEY no configurada en el servidor" });
    }

    const defaultSystem = `Eres el Asistente Inteligente oficial de Proyecto Café Web.
REGLA DE SALIDA ESTRICTA: Si la solicitud requiere una respuesta en formato JSON o estructurada, entrega ÚNICAMENTE la estructura JSON válida requerida, sin preámbulos, ni explicaciones conversacionales.`;

    const fullTextToScan = JSON.stringify(messages) + " " + systemContext;
    const scrapedWebContext = await extractUrlContext(fullTextToScan);

    const systemMessage = {
      role: "system",
      content: `${defaultSystem}\n\n[CONTEXTO Y REGLAS MAESTRAS DE LA APLICACIÓN]\n${systemContext}${scrapedWebContext}`
    };

    const payloadMessages = [systemMessage, ...messages];

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: payloadMessages,
        temperature: typeof temperature === 'number' ? temperature : 0.1,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[deepseek-api] DeepSeek API error response:", errorText);
      return res.status(response.status).json({
        error: `Error de la API de DeepSeek (${response.status}): ${errorText}`
      });
    }

    const data = await response.json();
    const replyContent = data.choices?.[0]?.message?.content || "No se recibió respuesta del modelo.";

    return res.status(200).json({
      reply: replyContent,
      usage: data.usage || null,
      model: data.model || "deepseek-chat"
    });
  } catch (err) {
    console.error("[deepseek-api] Exception:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
}
