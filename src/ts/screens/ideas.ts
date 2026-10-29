/** Ideas: a wall of index cards, filtered by tag or star. */
import type { Idea } from "../types";

const TAG = /#[\w-]+/g;

/** The idea's words without its #tags. */
export function ideaTitle(text: string): string {
  return String(text || "").replace(/\s*#[\w-]+/g, "").trim() || text;
}

function isPlanned(i: Idea): boolean {
  return S.posts.some((p) => p.ideaId === i.id);
}

type Status = "On the board" | "Planned" | "Loose";
function statusOf(i: Idea): Status {
  return i.task ? "On the board" : isPlanned(i) ? "Planned" : "Loose";
}

function matches(i: Idea, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "star") return !!i.star;
  return (i.tags || []).indexOf(filter) > -1;
}

const dis = () => (readOnly ? " disabled" : "");

function card(i: Idea): string {
  const st = statusOf(i);
  const planned = isPlanned(i);
  const tags = i.tags || [];
  return (
    `<article class="icard${i.star ? " starred" : ""}"><header>` +
    `<span class="ic-st${st === "Loose" ? "" : " on"}">${st}</span><span class="ic-when">${ago(i.ts)}</span>` +
    `<button class="ico star" data-act="staridea" data-id="${i.id}" aria-pressed="${!!i.star}" aria-label="${i.star ? "Unstar" : "Star"} idea">${I("star")}</button></header>` +
    `<h3 class="ic-t">${esc(ideaTitle(i.text))}</h3>` +
    (tags.length ? `<div class="ic-tags">${tags.map((t) => `<button class="tag" data-act="ifilter" data-id="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : "") +
    `<footer class="acts">` +
    (i.task ? "" : `<button class="btn sm" data-act="idea2task" data-id="${i.id}"${dis()}>${I("board")}Make task</button>`) +
    (planned ? "" : `<button class="btn sm" data-act="idea2post" data-id="${i.id}"${dis()}>${I("calendar")}Plan post</button>`) +
    (readOnly ? "" : `<button class="btn sm" data-act="rp_open" data-id="idea:${i.id}">Repurpose</button>`) +
    `<button class="ico" data-act="delidea" data-id="${i.id}" aria-label="Delete idea" title="Delete"${dis()}>${I("trash")}</button></footer></article>`
  );
}

export function vIdeas(): string {
  const all = mine("ideas");
  const tags: Record<string, number> = {};
  all.forEach((i) => (i.tags || []).forEach((t) => (tags[t] = (tags[t] || 0) + 1)));

  let h = hero("ideas", "Ideas", "Catch ideas before they disappear. Any idea becomes a task or a planned post in one click.", "");
  h += `<div class="capture"><input class="in" id="ideain" placeholder="A video about…  add #tags to sort it later" maxlength="240" aria-label="New idea" autocomplete="off"${dis()}><button class="btn pri" data-act="addidea"${dis()}>Add idea</button></div>`;
  if (!all.length)
    return h + emptyCard("bulb", "Catch your first idea", "Type it above and press Add idea. Use #tags like #vlog to sort them. Any idea becomes a task or a planned post in one click.", "");

  const shown = all.filter((i) => matches(i, ideaFilter)).sort((a, b) => b.ts - a.ts);
  const starred = all.filter((i) => i.star).length;
  const onBoard = all.filter((i) => i.task).length;
  const planned = all.filter(isPlanned).length;
  const loose = all.filter((i) => statusOf(i) === "Loose").length;
  const byCount = Object.keys(tags).sort((a, b) => tags[b] - tags[a] || (a < b ? -1 : 1));
  const chip = (id: string, label: string, n: number) =>
    `<button class="chip" data-act="ifilter" data-id="${esc(id)}" aria-pressed="${ideaFilter === id}">${label} <b>${n}</b></button>`;

  h +=
    `<div class="id-bar"><div class="id-chips" role="group" aria-label="Show ideas">` +
    chip("all", "All", all.length) +
    chip("star", I("star") + "Starred", starred) +
    byCount.map((t) => chip(t, "#" + esc(t), tags[t])).join("") +
    `</div><p class="id-sum2"><span><b>${loose}</b> still loose</span><span><b>${onBoard}</b> on the board</span><span><b>${planned}</b> planned as posts</span></p></div>`;
  if (!shown.length)
    return h + `<div class="empty id-none">No ideas match this filter. <button class="lnk" data-act="ifilter" data-id="all">Show all</button></div>`;
  return h + `<div class="id-wall">${shown.map(card).join("")}</div>`;
}

/** Saves an idea; #tags in the text become its tags. */
export function addIdeaText(text: string, keep?: boolean): void {
  const tags = (text.match(TAG) || []).map((t) => t.slice(1).toLowerCase());
  S.ideas.push({ id: uid(), sp: S.cur, text, tags, star: false, task: false, ts: Date.now() });
  touch();
  if (!keep) S.view = "ideas";
  render();
  const n = $("ideain");
  if (keep && n) n.focus();
}

export function addIdea(): void {
  const el = $("ideain") as HTMLInputElement | null;
  if (!el) return;
  const text = el.value.trim();
  if (!text) {
    toast("Type an idea first");
    el.focus();
    return;
  }
  addIdeaText(text, true);
}

/** Handles the Ideas screen's buttons. Returns false for actions it doesn't own. */
export function ideaAct(a: string, b: HTMLElement, id: string): boolean {
  switch (a) {
    case "addidea":
      addIdea();
      return true;
    case "ifilter":
      ideaFilter = id;
      render();
      return true;
    case "staridea": {
      const i = findIn(S.ideas, id);
      if (i) { i.star = !i.star; touch(); render(); }
      return true;
    }
    case "delidea":
      arm(b, () => { S.ideas = S.ideas.filter((x) => x.id !== id); touch(); render(); });
      return true;
    case "idea2post": {
      const i = findIn(S.ideas, id);
      if (i) {
        const dt = ymd(new Date(Date.now() + 86400000));
        S.posts.push({ id: uid(), sp: S.cur, title: ideaTitle(i.text), platform: "YouTube", date: dt, status: "idea", ideaId: i.id, ts: Date.now() });
        calSel = dt;
        const d = dparse(dt);
        calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        touch();
        go("cal");
        toast("Planned for tomorrow. Pick another day any time.");
      }
      return true;
    }
    case "idea2task": {
      const i = findIn(S.ideas, id);
      if (i) {
        S.tasks.push({ id: uid(), sp: S.cur, title: ideaTitle(i.text), col: "i", due: "", ts: Date.now() });
        i.task = true;
        touch();
        render();
        toast("Added to Progress");
      }
      return true;
    }
  }
  return false;
}
