/** Team daily agenda: each person's work for today, ticking over as they finish it. */
import type { AgendaItem, TeamMember, TeamWork } from "../types";

declare const WSB: {
  from(table: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
};

/** How often the agenda reloads (tests shorten it with window.__agendaPoll). */
const POLL_MS: number = (window as unknown as { __agendaPoll?: number }).__agendaPoll || 30000;
let timer: number | undefined;

function today(): string {
  return ymd(new Date());
}

/** Work that belongs to today: due today, overdue and open, or finished today. */
function dayWork(m: TeamMember): { open: TeamWork[]; done: TeamWork[] } {
  const td = today();
  const mine = T.work.filter((w) => w.member_id === m.id);
  const open = mine.filter((w) => w.status !== "done" && w.due && w.due <= td);
  const done = mine.filter((w) => w.status === "done" && !!w.done_at && w.done_at.slice(0, 10) === td);
  open.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  return { open, done };
}

function person(m: TeamMember): string {
  const { open, done } = dayWork(m);
  const total = open.length + done.length;
  const td = today();
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const line = (w: TeamWork, isDone: boolean) =>
    `<li class="${isDone ? "done" : w.due < td ? "late" : ""}"><span class="ag-tick" aria-hidden="true">${isDone ? I("check") : ""}</span><span>${esc(w.title)}</span>${
      !isDone && w.due < td ? `<em>late</em>` : ""
    }</li>`;
  return (
    `<article class="tg-p"><header><b>${esc(m.name)}</b><span class="muted">${esc(m.role_title || "")}</span>` +
    `<span class="tg-n">${total ? `${done.length} of ${total}` : "free"}</span></header>` +
    (total
      ? `<div class="tg-bar" role="img" aria-label="${pct}% of today's work done"><i style="width:${pct}%"></i></div><ul>` +
        open.map((w) => line(w, false)).join("") +
        done.map((w) => line(w, true)).join("") +
        `</ul>`
      : `<p class="muted tg-free">Nothing due today.</p>`) +
    `</article>`
  );
}

const todays = (items: AgendaItem[] | undefined): AgendaItem[] => (items || []).filter((a) => a.day === today());

function agendaLine(a: AgendaItem, act: string, canDelete: boolean): string {
  return (
    `<li class="${a.done ? "done" : ""}"><button class="ag-tk" data-act="${act}" data-id="${esc(a.id)}" aria-pressed="${a.done}" aria-label="${a.done ? "Mark not done" : "Mark done"}: ${esc(a.text)}"><span class="ag-tick">${a.done ? I("check") : ""}</span></button><span>${esc(a.text)}</span>` +
    (canDelete ? `<button class="ico" data-act="ag_del" data-id="${esc(a.id)}" aria-label="Remove from agenda" title="Remove">${I("x")}</button>` : "") +
    `</li>`
  );
}

/** The owner's agenda editor: the plan for the day that the team sees. */
function plan(): string {
  const items = todays(T.agenda);
  const done = items.filter((a) => a.done).length;
  return (
    `<div class="tg-plan"><h3>Today's agenda <span class="muted">${items.length ? `${done} of ${items.length} done` : "what the team follows today"}</span></h3>` +
    (items.length ? `<ul class="ag-l">${items.map((a) => agendaLine(a, "ag_tick", true)).join("")}</ul>` : `<p class="muted">Nothing set yet. Add what the team should focus on today.</p>`) +
    `<div class="aic-row"><input class="in" id="ag-in" maxlength="200" placeholder="Add to today's agenda" aria-label="Add to today's agenda"><button class="btn" data-act="ag_add">Add</button></div></div>`
  );
}

/** What a team member sees: the owner's agenda for today, with boxes they can tick. */
export function memberAgendaHTML(m: { agenda?: AgendaItem[]; owner_email?: string }): string {
  const items = todays(m.agenda);
  if (!items.length) return "";
  const done = items.filter((a) => a.done).length;
  return (
    `<section class="panel tg"><div class="tg-h"><div><h2 style="margin:0">Today's agenda</h2><span class="muted">From ${esc(m.owner_email || "your team lead")} · ${done} of ${items.length} done</span></div>` +
    `<span class="tg-live" title="Refreshes every 30 seconds"><i></i>Live</span></div><ul class="ag-l">${items.map((a) => agendaLine(a, "ag_mtick", false)).join("")}</ul></section>`
  );
}

export function agendaAct(a: string, _b: HTMLElement, id: string): boolean {
  switch (a) {
    case "ag_add": {
      const el = $("ag-in") as HTMLInputElement | null;
      const text = (el?.value || "").trim();
      if (!text) {
        toast("Type the agenda item first");
        el?.focus();
        return true;
      }
      void WSB.from("team_agenda")
        .insert({ day: today(), text })
        .select("*")
        .single()
        .then((r: { data: AgendaItem | null; error: { message: string } | null }) => {
          if (r.error || !r.data) toast("Couldn't add that. Try again.");
          else T.agenda.push(r.data);
          render();
        });
      return true;
    }
    case "ag_tick": {
      const it = T.agenda.find((x) => x.id === id);
      if (!it) return true;
      it.done = !it.done;
      render();
      void WSB.from("team_agenda").update({ done: it.done, done_at: it.done ? new Date().toISOString() : null }).eq("id", id).then(() => {});
      return true;
    }
    case "ag_mtick": {
      let it: AgendaItem | undefined;
      T.my.forEach((m) => (m.agenda || []).forEach((x) => { if (x.id === id) it = x; }));
      if (!it) return true;
      const want = !it.done;
      it.done = want;
      render();
      void WSB.rpc("my_agenda_tick", { p_id: id, p_done: want }).then((r) => {
        if (r.error || r.data === false) { if (it) it.done = !want; toast("Couldn't update that"); render(); }
      });
      return true;
    }
    case "ag_del":
      T.agenda = T.agenda.filter((x) => x.id !== id);
      render();
      void WSB.from("team_agenda").delete().eq("id", id).then(() => {});
      return true;
  }
  return false;
}

/** The owner's view of the team's day. Empty when there is no team. */
export function agendaHTML(): string {
  if (readOnly || window.__WS || !T.loaded) return "";
  const act = T.members.filter((m) => m.status === "active");
  if (!act.length) return "";
  const all = act.map(dayWork);
  const done = all.reduce((n, d) => n + d.done.length, 0);
  const total = all.reduce((n, d) => n + d.open.length + d.done.length, 0);
  startPolling();
  return (
    `<section class="panel tg"><div class="tg-h"><div><h2 style="margin:0">Team today</h2>` +
    `<span class="muted">${total ? `${done} of ${total} pieces of work done` : "Nothing due today"}</span></div>` +
    `<span class="tg-live" title="Refreshes every 30 seconds"><i></i>Live</span></div>` +
    plan() + `<div class="tg-g">${act.map(person).join("")}</div></section>`
  );
}

/** Reloads the team on a timer while the agenda is on screen. */
function startPolling(): void {
  if (timer !== undefined) return;
  timer = window.setInterval(() => {
    if (document.hidden || (S.view !== "home" && S.view !== "team")) return;
    if (!T.loading) void tmLoad();
  }, POLL_MS);
}
