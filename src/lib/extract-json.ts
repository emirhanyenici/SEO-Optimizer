// Robust JSON extraction from an LLM text response.
// Strategy:
//   1. Prefer a fenced ```json ... ``` code block.
//   2. Otherwise scan for the first brace-balanced { ... } or [ ... ] block,
//      tracking string literals/escapes so braces inside strings don't fool us.
//   3. Fall back to the trimmed text.
// A balanced scan avoids the old greedy regex bug where a second JSON-ish blob
// in the response extended the match to the wrong closing brace.

function balancedSlice(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  // Choose whichever structure appears first in the text (object or array).
  const objStart = text.indexOf('{');
  const arrStart = text.indexOf('[');
  const objectFirst =
    objStart !== -1 && (arrStart === -1 || objStart < arrStart);

  const primary = objectFirst
    ? balancedSlice(text, '{', '}')
    : balancedSlice(text, '[', ']');
  if (primary) return primary.trim();

  // Try the other structure type as a fallback.
  const secondary = objectFirst
    ? balancedSlice(text, '[', ']')
    : balancedSlice(text, '{', '}');
  if (secondary) return secondary.trim();

  return text.trim();
}
