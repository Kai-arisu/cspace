// Creator Space as an MCP server, so a person's own AI (Claude, ChatGPT, Gemini, anything that
// speaks MCP over HTTP) can read their workspace and add ideas, tasks and notes.
//   POST /functions/v1/mcp     JSON-RPC 2.0: initialize, tools/list, tools/call
//   Authorization: Bearer csk_...   a token the person made in the app (stored as a SHA-256 hash)
// Reads come from the synced workspace (docs store/k_*). Writes go to ai_inbox and the app
// imports them, so this function never edits the synced workspace itself.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) || "";
const admin = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const send = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256hex(s: string) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return [...d].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** The person this token belongs to, or null. */
async function who(req: Request): Promise<{ uid: string; tokenId: string } | null> {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(csk_[0-9a-f]{48})$/);
  if (!m) return null;
  const sb = admin();
  const { data } = await sb.from("ai_tokens").select("id,user_id").eq("token_hash", await sha256hex(m[1])).maybeSingle();
  if (!data) return null;
  sb.from("ai_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});
  return { uid: data.user_id, tokenId: data.id };
}

/** One list from the person's synced workspace ("ideas", "tasks", "notes"), checked against its hash. */
async function readList(uid: string, key: string): Promise<Record<string, unknown>[]> {
  const sb = admin();
  const meta = await sb.from("docs").select("data").eq("user_id", uid).eq("path", "store/meta").maybeSingle();
  const k = (meta.data?.data as { keys?: Record<string, { n: number }> } | undefined)?.keys?.[key];
  if (!k) return [];
  let s = "";
  for (let i = 0; i < k.n; i++) {
    const r = await sb.from("docs").select("data").eq("user_id", uid).eq("path", `store/k_${key}_${i}`).maybeSingle();
    s += (r.data?.data as { s?: string } | undefined)?.s || "";
  }
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const TOOLS = [
  { name: "list_ideas", description: "The person's saved ideas, newest first.", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
  { name: "list_tasks", description: "Tasks on their board. col is i (idea), m (making), r (review) or s (shipped).", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
  { name: "list_notes", description: "Titles and bodies of their notes.", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
  { name: "search", description: "Search ideas, tasks and notes for a word or phrase.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "add_idea", description: "Add an idea. #tags in the text become tags.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "add_task", description: "Add a task to their board. due is YYYY-MM-DD (optional).", inputSchema: { type: "object", properties: { title: { type: "string" }, due: { type: "string" } }, required: ["title"] } },
  { name: "add_note", description: "Add a note. body is Markdown.", inputSchema: { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title"] } },
];

async function call(name: string, a: Record<string, unknown>, uid: string, tokenId: string): Promise<string> {
  const lim = Math.max(1, Math.min(100, Number(a.limit) || 30));
  if (name === "list_ideas") return JSON.stringify((await readList(uid, "ideas")).sort((x, y) => Number(y.ts) - Number(x.ts)).slice(0, lim).map((i) => ({ text: i.text, tags: i.tags, starred: !!i.star })));
  if (name === "list_tasks") return JSON.stringify((await readList(uid, "tasks")).slice(0, lim).map((t) => ({ title: t.title, col: t.col, due: t.due || null })));
  if (name === "list_notes") return JSON.stringify((await readList(uid, "notes")).slice(0, lim).map((n) => ({ title: n.title, body: clip(n.body, 4000) })));
  if (name === "search") {
    const q = clip(a.query, 100).toLowerCase();
    if (!q) return "[]";
    const out: unknown[] = [];
    for (const [k, f] of [["ideas", "text"], ["tasks", "title"], ["notes", "body"]] as const) {
      for (const r of await readList(uid, k)) {
        if (`${r[f] ?? ""} ${r.title ?? ""}`.toLowerCase().includes(q)) out.push({ kind: k, title: r.title ?? r.text, text: clip(r[f], 300) });
      }
    }
    return JSON.stringify(out.slice(0, 30));
  }
  const kind = name === "add_idea" ? "idea" : name === "add_task" ? "task" : name === "add_note" ? "note" : "";
  if (!kind) throw new Error("unknown tool " + name);
  const payload =
    kind === "idea" ? { text: clip(a.text, 240) }
    : kind === "task" ? { title: clip(a.title, 200), due: /^\d{4}-\d{2}-\d{2}$/.test(String(a.due || "")) ? String(a.due) : "" }
    : { title: clip(a.title, 200), body: clip(a.body, 20000) };
  if (!Object.values(payload)[0]) throw new Error("nothing to add");
  const sb = admin();
  const pending = await sb.from("ai_inbox").select("id", { count: "exact", head: true }).eq("user_id", uid).is("imported_at", null);
  if ((pending.count || 0) >= 200) throw new Error("the inbox is full; open Creator Space to import what is waiting");
  const { error } = await sb.from("ai_inbox").insert({ user_id: uid, kind, payload, source: tokenId });
  if (error) throw new Error("could not save");
  return `Added the ${kind}. It appears in Creator Space the next time the app is open.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return send({ error: "POST JSON-RPC to this URL" }, 405);
  const me = await who(req);
  if (!me) return send({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Missing or unknown token" } }, 401);
  let msg: { id?: unknown; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };
  try { msg = await req.json(); } catch { return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  const id = msg.id ?? null;
  if (msg.method === "initialize")
    return send({ jsonrpc: "2.0", id, result: { protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "creator-space", version: "1.0.0" } } });
  if (msg.method === "notifications/initialized") return new Response(null, { status: 202, headers: CORS });
  if (msg.method === "ping") return send({ jsonrpc: "2.0", id, result: {} });
  if (msg.method === "tools/list") return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  if (msg.method === "tools/call") {
    try {
      const text = await call(String(msg.params?.name), msg.params?.arguments || {}, me.uid, me.tokenId);
      return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } });
    } catch (e) {
      return send({ jsonrpc: "2.0", id, result: { isError: true, content: [{ type: "text", text: (e as Error).message }] } });
    }
  }
  return send({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
});
