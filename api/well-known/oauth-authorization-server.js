/**
 * OAuth 2.0 Authorization Server Metadata
 * RFC 8414 - https://tools.ietf.org/html/rfc8414
 * 
 * Gemini fetches this to discover OAuth endpoints automatically.
 * URL: /.well-known/oauth-authorization-server
 */

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (req.method === "OPTIONS") return res.status(200).end();

  const BASE_URL = "https://proyectocafeweb.vercel.app";

  return res.status(200).json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
    token_endpoint: `${BASE_URL}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["mcp"],
    token_endpoint_auth_methods_supported: ["none"],
  });
}
