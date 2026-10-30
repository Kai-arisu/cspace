/** Launch radar: upcoming product launches, each one turned into a content plan in one click. */
import type { Launch } from "../types";

const KINDS: [Launch["kind"], string][] = [["phone", "Phone"], ["laptop", "Laptop"], ["ai", "AI model"], ["other", "Other"]];
const DAY = 86400000;

function addDays(date: string, n: number): string {
  return ymd(new Date(dparse(date).getTime() + n * DAY));
}

function row(l: Launch): string {
  const days = Math.round((dparse(l.date).getTime() - dparse(ymd(new Date())).getTime()) / DAY);
  const label = days === 0 ? "Launches today" : days > 0 ? `In ${days} day${days === 1 ? "" : "s"}` : `${-days} day${days === -1 ? "" : "s"} ago`;
  const kind = KINDS.find((k) => k[0] === l.kind)?.[1] || "Other";
  return (
    `<li class="un${days < 0 ? " back" : ""}"><div><b>${esc(l.name)}</b><span class="muted">${esc(kind)} · ${esc(l.date)}</span>` +
    `<div class="un-bs"><span class="un-b${days >= 0 && days <= 7 ? " hot" : ""}">${esc(label)}</span>${l.planned ? `<span class="un-b">Content planned</span>` : ""}</div></div>` +
    `<div class="un-a">` +
    (readOnly ? "" : (l.planned ? "" : `<button class="btn sm" data-act="launch_plan" data-id="${esc(l.id)}">Plan content</button>`) +
      `<button class="ico" data-act="launch_del" data-id="${esc(l.id)}" aria-label="Delete launch" title="Delete">${I("trash")}</button>`) +
    `</div></li>`
  );
}

export function radarHTML(): string {
  const all = mine("launches").slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const today = ymd(new Date());
  const next = all.filter((l) => l.date >= today);
  const past = all.filter((l) => l.date < today).reverse().slice(0, 5);
  let h = `<section class="panel" style="margin-top:16px"><h2>Launch radar<span class="cnt">${next.length} coming</span></h2>`;
  h += `<p class="muted">Add the launches you want to cover. “Plan content” adds a teaser, a launch-day video and a follow-up to your calendar, plus a prep task.</p>`;
  if (!readOnly)
    h +=
      `<div class="form un-f"><label>Launch<input class="in" id="lr-name" maxlength="80" placeholder="Galaxy S27 Ultra"></label>` +
      `<label>Type<select class="wsel" id="lr-kind">${KINDS.map((k) => `<option value="${k[0]}">${k[1]}</option>`).join("")}</select></label>` +
      `<label>Date<input class="in" id="lr-date" type="date"></label><button class="btn pri" data-act="launch_add">Add launch</button></div>`;
  h += next.length ? `<ul class="un-l">${next.map(row).join("")}</ul>` : `<div class="empty">No launches yet. Add the next event you plan to cover.</div>`;
  if (past.length) h += `<h3 class="un-h">Recent</h3><ul class="un-l">${past.map(row).join("")}</ul>`;
  return h + `</section>`;
}

export function radarAct(a: string, b: HTMLElement, id: string): boolean {
  switch (a) {
    case "launch_add": {
      const name = (($("lr-name") as HTMLInputElement | null)?.value || "").trim();
      const date = ($("lr-date") as HTMLInputElement | null)?.value || "";
      const kind = (($("lr-kind") as HTMLSelectElement | null)?.value || "other") as Launch["kind"];
      if (!name || !date) {
        toast("Add a name and a date");
        return true;
      }
      S.launches.push({ id: uid(), sp: S.cur, name, kind, date, planned: false, ts: Date.now() });
      touch();
      render();
      return true;
    }
    case "launch_plan": {
      const l = findIn(S.launches, id);
      if (!l || l.planned) return true;
      const t = Date.now();
      const post = (title: string, date: string, status: string) =>
        S.posts.push({ id: uid(), sp: S.cur, title, platform: "YouTube", date, status, ts: t });
      post(`${l.name}: teaser`, addDays(l.date, -2), "idea");
      post(`${l.name}: launch day video`, l.date, "idea");
      post(`${l.name}: follow-up (what changed my mind)`, addDays(l.date, 7), "idea");
      S.tasks.push({ id: uid(), sp: S.cur, title: `Prep for ${l.name}: script, b-roll, thumbnail`, col: "i", due: addDays(l.date, -3), ts: t });
      l.planned = true;
      touch();
      render();
      toast("Added 3 posts and a prep task");
      return true;
    }
    case "launch_del":
      arm(b, () => {
        S.launches = S.launches.filter((l) => l.id !== id);
        touch();
        render();
      });
      return true;
  }
  return false;
}
