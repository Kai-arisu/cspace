/** Bring your own AI: make a token, paste it into an assistant, and import what it adds. */
import type { AiToken, AiInboxRow } from "../types";

declare const WSB: {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
};

const MCP_URL = "https://ohkecamneutxggqwhend.supabase.co/functions/v1/mcp";

const ui: { open: boolean; loaded: boolean; tokens: AiToken[]; fresh: string; msg: string } = {
  open: false,
  loaded: false,
  tokens: [],
  fresh: "",
  msg: "",
};

async function load(): Promise<void> {
  const r = await WSB.from("ai_tokens").select("id,name,created_at,last_used_at").order("created_at");
  if (r.error) ui.msg = "Couldn't load your tokens.";
  else ui.tokens = (r.data || []) as AiToken[];
  ui.loaded = true;
  render();
}

function snippet(token: string): string {
  return JSON.stringify({ mcpServers: { "creator-space": { type: "http", url: MCP_URL, headers: { Authorization: "Bearer " + token } } } }, null, 2);
}

export function aiConnectHTML(): string {
  if (readOnly || window.__WS) return "";
  let h = `<section class="panel aic"><button class="aic-h" data-act="ai_toggle" aria-expanded="${ui.open}"><b>Connect your AI</b><span class="muted">Let Claude, ChatGPT or Gemini read your workspace and add to it</span></button>`;
  if (ui.open) {
    h += `<p class="muted">Make a token, then paste the setup below into any assistant that supports MCP. It can read your ideas, tasks and notes, and add new ones. You can revoke a token at any time.</p>`;
    if (ui.fresh)
      h +=
        `<div class="aic-new"><b>Copy this now. It won't be shown again.</b><pre>${esc(snippet(ui.fresh))}</pre>` +
        `<div class="aic-row"><button class="btn sm" data-act="ai_copy">Copy setup</button><button class="btn sm" data-act="ai_done">I've saved it</button></div></div>`;
    h += `<div class="aic-row"><input class="in" id="ainame" maxlength="60" placeholder="Name it, like “Claude on my laptop”" aria-label="Token name"><button class="btn pri" data-act="ai_make">Make token</button></div>`;
    if (ui.msg) h += `<p class="ac-errmsg">${esc(ui.msg)}</p>`;
    h += ui.tokens.length
      ? `<ul class="aic-l">` +
        ui.tokens
          .map(
            (t) =>
              `<li><span><b>${esc(t.name)}</b><small class="muted">${t.last_used_at ? "Used " + esc(ago(Date.parse(t.last_used_at))) : "Not used yet"}</small></span><button class="btn sm" data-act="ai_revoke" data-id="${esc(t.id)}">Revoke</button></li>`,
          )
          .join("") +
        `</ul>`
      : ui.loaded
        ? `<p class="muted">No tokens yet.</p>`
        : `<p class="muted">Loading…</p>`;
  }
  return h + `</section>`;
}

/** Brings in what an assistant added since the app was last open. */
export async function aiImport(): Promise<void> {
  if (readOnly || window.__WS) return;
  const r = await WSB.from("ai_inbox").select("id,kind,payload").is("imported_at", null).order("created_at");
  const rows = ((r.error ? [] : r.data) || []) as AiInboxRow[];
  if (!rows.length) return;
  const now = Date.now();
  for (const x of rows) {
    const p = x.payload || {};
    if (x.kind === "idea") {
      const text = String(p.text || "").slice(0, 240);
      if (!text) continue;
      S.ideas.push({ id: uid(), sp: S.cur, text, tags: (text.match(/#[\w-]+/g) || []).map((t) => t.slice(1).toLowerCase()), star: false, task: false, ts: now });
    } else if (x.kind === "task") {
      const title = String(p.title || "").slice(0, 200);
      if (title) S.tasks.push({ id: uid(), sp: S.cur, title, col: "i", due: /^\d{4}-\d{2}-\d{2}$/.test(String(p.due || "")) ? String(p.due) : "", ts: now });
    } else if (x.kind === "note") {
      const title = String(p.title || "").slice(0, 200);
      if (title) S.notes.push({ id: uid(), sp: S.cur, title, body: String(p.body || "").slice(0, 20000), pin: false, ts: now });
    }
  }
  await WSB.from("ai_inbox").update({ imported_at: new Date(now).toISOString() }).in(
    "id",
    rows.map((x) => x.id),
  );
  touch();
  render();
  toast(rows.length === 1 ? "Your assistant added 1 item" : `Your assistant added ${rows.length} items`);
}

export function aiAct(a: string, _b: HTMLElement, id: string): boolean {
  switch (a) {
    case "ai_toggle": {
      ui.open = !ui.open;
      if (ui.open && !ui.loaded) void load();
      else render();
      return true;
    }
    case "ai_make": {
      const el = $("ainame") as HTMLInputElement | null;
      void WSB.rpc("create_ai_token", { p_name: el ? el.value : "" }).then((r) => {
        if (r.error) ui.msg = r.error.message;
        else {
          ui.fresh = String(r.data);
          ui.msg = "";
        }
        void load();
      });
      return true;
    }
    case "ai_copy":
      void navigator.clipboard.writeText(snippet(ui.fresh)).then(() => toast("Copied"));
      return true;
    case "ai_done":
      ui.fresh = "";
      render();
      return true;
    case "ai_revoke":
      arm(_b, () => {
        void WSB.from("ai_tokens").delete().eq("id", id).then(() => load());
      });
      return true;
  }
  return false;
}
