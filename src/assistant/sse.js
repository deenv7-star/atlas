/**
 * Server-sent events reader shared by the browser client and the tests.
 * Understands the ai-chat v4 frames ({"d":"text"} … {"done":true} / {"error":"code"}) and, for safety,
 * raw OpenAI frames ({"choices":[{"delta":{"content":"…"}}]}) and the literal "[DONE]".
 */
export function createSSEParser(onEvent) {
  let buf = '';
  return {
    push(chunk) {
      buf += chunk;
      let i;
      while ((i = buf.search(/\r?\n\r?\n/)) >= 0) {
        const block = buf.slice(0, i);
        buf = buf.slice(i).replace(/^\r?\n\r?\n/, '');
        const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        if (data === '[DONE]') { onEvent({ done: true }); continue; }
        let j; try { j = JSON.parse(data); } catch { continue; }
        if (typeof j.d === 'string') onEvent({ delta: j.d });
        else if (j.error) onEvent({ error: String(j.error) });
        else if (j.done) onEvent({ done: true, meta: j });
        else if (j.choices?.[0]?.delta?.content) onEvent({ delta: j.choices[0].delta.content });
      }
    },
  };
}

/** Split a finished text into small word-sized pieces for a calm reveal (used for JSON answers and the demo). */
export function chunkText(text, size = 3) {
  const words = String(text || '').split(/(\s+)/);
  const out = [];
  for (let i = 0; i < words.length; i += size * 2) out.push(words.slice(i, i + size * 2).join(''));
  return out.filter(Boolean);
}
