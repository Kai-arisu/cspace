/** Team daily agenda: each person's work for today, ticking over as they finish it. */
import type { TeamMember, TeamWork } from "../types";

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
    `<div class="tg-g">${act.map(person).join("")}</div></section>`
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
