// SSRF guard: a calendar link is user input, so only public http(s) hosts are fetched,
// and every redirect hop is checked again (no localhost, private/link-local IPs, internal names).
export function isPublicFeedUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.username || u.password) return false;
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h || h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h === "metadata.google.internal") return false;
  if (!h.includes(".") && !h.includes(":")) return false; // single-label names resolve inside the network
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224) return false;
  }
  if (h.includes(":")) {
    if (h === "::" || h === "::1" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith("::ffff:")) return false;
  }
  if (/^\d+$/.test(h) || /^0x/i.test(h)) return false; // decimal / hex IPv4 forms
  return true;
}

/** True for loopback, private, link-local, CGNAT, multicast/reserved IPv4 and IPv6 equivalents. */
export function isPrivateIp(ip: string): boolean {
  const h = String(ip || "").toLowerCase().replace(/^\[|\]$/g, "");
  const v4 = h.match(/^(?:::ffff:)?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (h.includes(":")) {
    return h === "::" || h === "::1" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith("::ffff:") || h.startsWith("64:ff9b:");
  }
  return true; // not an IP at all: treat as unsafe
}

export type DnsResolver = (host: string, type: "A" | "AAAA") => Promise<string[]>;

/**
 * SEC-03: the hostname check above is text only. Resolve the name and refuse when ANY address is private,
 * so a public-looking name pointing at 127.0.0.1 / 10.x is blocked. Returns "ok" | "private" | "unresolved".
 * "unsupported" when the runtime has no resolver (caller decides; we fail open and log).
 */
export async function checkResolvedHost(host: string, resolve: DnsResolver | null): Promise<"ok" | "private" | "unresolved" | "unsupported"> {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (/^[\d.]+$/.test(h) || h.includes(":")) return isPrivateIp(h) ? "private" : "ok"; // literal IP
  if (!resolve) return "unsupported";
  const addrs: string[] = [];
  for (const t of ["A", "AAAA"] as const) {
    try { addrs.push(...(await resolve(h, t))); } catch { /* no record of this type */ }
  }
  if (!addrs.length) return "unresolved";
  return addrs.some(isPrivateIp) ? "private" : "ok";
}
