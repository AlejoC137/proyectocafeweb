import { useState, useCallback } from "react";

/**
 * Auto-repair truncated or markdown-wrapped JSON strings
 */
function repairTruncatedJson(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') return null;
  let str = jsonStr.trim();

  // Strip markdown codeblock backticks if present
  str = str.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Find start of JSON ({ or [)
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex === -1) return null;
  str = str.slice(startIndex);

  // Try direct parse first
  try {
    return JSON.parse(str);
  } catch (e) {
    // Continue to auto-repair
  }

  // Count open/close braces and brackets, handling quotes
  let inString = false;
  let isEscaped = false;
  const stack = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        stack.pop();
      }
    }
  }

  // If inside an unclosed string, close the quote
  if (inString) {
    str += '"';
  }

  // Remove trailing commas before closing
  str = str.replace(/,\s*$/, '');

  // Close remaining unclosed brackets in reverse
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') str += '}';
    else if (open === '[') str += ']';
  }

  try {
    return JSON.parse(str);
  } catch (err) {
    console.error("[cleanAndParseJson] Auto-repair parse failed:", err);
    return null;
  }
}

export function cleanAndParseJson(text) {
  if (!text || typeof text !== "string") return null;

  let clean = text.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(clean);
  } catch {
    // Try regex extraction for json object {} or array []
    const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (err) {
        console.error("[cleanAndParseJson] Regex match parse failed:", err);
      }
    }
    // Try auto-repair
    return repairTruncatedJson(clean);
  }
}

export function useDeepSeek() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = useCallback(
    async ({ systemPrompt = "", userMessage = "", temperature = 0.1 }) => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const payloadMessages = [
          {
            role: "user",
            content: userMessage
          }
        ];

        const res = await fetch("/api/deepseek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            systemContext: systemPrompt,
            temperature
          })
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}: Falló la llamada a DeepSeek`);
        }

        const json = await res.json();
        let replyText = json.reply || "";

        // Strip any markdown backticks from the raw text
        replyText = replyText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

        const parsedResult = cleanAndParseJson(replyText);

        if (!parsedResult && replyText) {
          setData(replyText);
          return replyText;
        }

        setData(parsedResult);
        return parsedResult;
      } catch (err) {
        console.error("[useDeepSeek] Error:", err);
        setError(err.message || "Error al conectar con DeepSeek");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, query };
}
