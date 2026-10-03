/**
 * OAuth 2.0 Token endpoint for MCP + Gemini integration
 * 
 * Exchanges the authorization code for an access token.
 * The "access token" is the same secret used to verify requests to /api/mcp.
 */

import crypto from "crypto";

const MCP_SECRET = process.env.MCP_SECRET || "proyectocafe-mcp-secret-2024";

function verifyCode(code) {
  const parts = code.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 16);
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

function generateAccessToken() {
  // Issue a long-lived token (1 year) — just a signed timestamp
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 32);
  return `mcpat_${encoded}.${sig}`;
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { grant_type, code, redirect_uri } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  if (!code) {
    return res.status(400).json({ error: "invalid_request", error_description: "Missing code" });
  }

  const payload = verifyCode(code);
  if (!payload) {
    return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
  }

  const accessToken = generateAccessToken();

  return res.status(200).json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 31536000, // 1 year
    scope: "mcp",
  });
}
