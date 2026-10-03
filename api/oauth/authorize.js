/**
 * OAuth 2.0 Authorization endpoint for MCP + Gemini integration
 * 
 * Flow:
 * 1. Gemini redirects user here with: client_id, redirect_uri, state, response_type=code
 * 2. We show a simple consent page
 * 3. User clicks "Autorizar" → we redirect back to Gemini's redirect_uri with a code
 */

// Simple in-memory store for auth codes (valid for 5 minutes)
// On Vercel, each function invocation is stateless — we encode everything in the code itself
// using a signed token approach (HMAC).

import crypto from "crypto";

const MCP_SECRET = process.env.MCP_SECRET || "proyectocafe-mcp-secret-2024";

function generateCode(clientId, redirectUri) {
  const payload = JSON.stringify({
    clientId,
    redirectUri,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 16);
  return `${encoded}.${sig}`;
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { client_id, redirect_uri, state, response_type } = req.query;

  if (!redirect_uri || !state) {
    return res.status(400).send("Parámetros incompletos: se requiere redirect_uri y state");
  }

  // If user already approved (query param ?approved=1), issue the code
  if (req.query.approved === "1") {
    const code = generateCode(client_id, redirect_uri);
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);
    return res.redirect(302, callbackUrl.toString());
  }

  // Show consent page
  const approveUrl = new URL(`https://proyectocafeweb.vercel.app/api/oauth/authorize`);
  approveUrl.searchParams.set("client_id", client_id || "");
  approveUrl.searchParams.set("redirect_uri", redirect_uri);
  approveUrl.searchParams.set("state", state);
  approveUrl.searchParams.set("response_type", response_type || "code");
  approveUrl.searchParams.set("approved", "1");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Conectar Gemini — Proyecto Café</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a0a00;
      color: #f5e6d3;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #2d1a0a;
      border: 1px solid #8B4513;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .icon { font-size: 3rem; margin-bottom: 16px; }
    h1 { font-size: 1.4rem; margin-bottom: 8px; color: #f5e6d3; }
    p { color: #c4a882; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5; }
    .perms {
      background: #1a0a00;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }
    .perms h3 { font-size: 0.8rem; text-transform: uppercase; color: #8B4513; letter-spacing: 1px; margin-bottom: 12px; }
    .perm { display: flex; gap: 10px; margin-bottom: 8px; font-size: 0.85rem; color: #c4a882; }
    .perm span:first-child { color: #4CAF50; }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary { background: #8B4513; color: white; margin-bottom: 12px; }
    .btn-primary:hover { background: #a0522d; }
    .btn-secondary { background: transparent; color: #c4a882; border: 1px solid #8B4513; }
    .btn-secondary:hover { background: #1a0a00; }
    .warning { font-size: 0.75rem; color: #8B4513; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">☕</div>
    <h1>Conectar Gemini al Café</h1>
    <p>Gemini quiere acceder a los datos de tu cafetería para ayudarte con consultas en tiempo real.</p>

    <div class="perms">
      <h3>Gemini podrá ver</h3>
      <div class="perm"><span>✓</span><span>Menú y precios</span></div>
      <div class="perm"><span>✓</span><span>Recetas</span></div>
      <div class="perm"><span>✓</span><span>Historial de ventas</span></div>
      <div class="perm"><span>✓</span><span>Inventario del almacén</span></div>
      <div class="perm"><span>✓</span><span>Agenda de eventos</span></div>
      <div class="perm"><span>✓</span><span>Historial de compras</span></div>
    </div>

    <a href="${approveUrl.toString()}" class="btn btn-primary">☕ Autorizar acceso</a>
    <a href="https://gemini.google.com" class="btn btn-secondary">Cancelar</a>

    <p class="warning">Solo tú tienes acceso a esta conexión. Los datos son de solo lectura.</p>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}
