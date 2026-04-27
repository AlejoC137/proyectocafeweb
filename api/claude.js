import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildUserMessage, parseClaudeResponse } from "./_claudeHelpers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { recipeType, porciones = 1, sources = [], itemsAlmacen = [], produccionInterna = [] } = req.body;

  if (!recipeType) {
    return res.status(400).json({ error: "recipeType es requerido" });
  }

  const activeSources = sources.filter((s) => s.enabled && s.content?.trim());
  if (!activeSources.length) {
    return res.status(400).json({ error: "Al menos una fuente activa es requerida" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en el servidor" });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt({ recipeType, porciones, itemsAlmacen, produccionInterna }),
      messages: [{ role: "user", content: buildUserMessage(sources) }],
    });

    const payload = parseClaudeResponse(response.content[0].text);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
