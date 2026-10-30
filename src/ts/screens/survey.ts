/** Welcome survey: three taps on Today for a new person, then the checklist fits them. */
import type { Survey } from "../types";

interface Question {
  key: keyof Omit<Survey, "ts">;
  title: string;
  options: [value: string, label: string][];
}

const QUESTIONS: Question[] = [
  {
    key: "kind",
    title: "What do you make?",
    options: [
      ["video", "Videos"],
      ["social", "Reels and posts"],
      ["tech", "Tech or code content"],
      ["business", "A business or brand"],
    ],
  },
  {
    key: "size",
    title: "Who works on it?",
    options: [
      ["solo", "Just me"],
      ["small", "2 to 5 people"],
      ["large", "6 or more"],
    ],
  },
  {
    key: "goal",
    title: "What matters most right now?",
    options: [
      ["grow", "Grow my audience"],
      ["plan", "Plan content on time"],
      ["money", "Track what I earn"],
      ["team", "Run my team"],
    ],
  },
];

/** Answers picked so far, before the person presses Done. */
let draft: Partial<Record<Question["key"], string>> = {};

export function surveyDone(): boolean {
  return !!(S.cfg && S.cfg.survey);
}

export function surveyHTML(): string {
  if (readOnly || window.__WS || (S.cfg && (S.cfg.obDone || S.cfg.survey))) return "";
  const ready = QUESTIONS.every((q) => draft[q.key]);
  const rows = QUESTIONS.map(
    (q) =>
      `<div class="sv-q" role="group" aria-label="${esc(q.title)}"><h3>${esc(q.title)}</h3><div class="sv-o">` +
      q.options
        .map(
          ([v, label]) =>
            `<button class="chip" data-act="sv_pick" data-id="${q.key}:${v}" aria-pressed="${draft[q.key] === v}">${esc(label)}</button>`,
        )
        .join("") +
      `</div></div>`,
  ).join("");
  return (
    `<section class="panel sv"><div class="ob-h"><div><h2 style="margin:0">Make it yours</h2><span class="muted">Three taps and your checklist fits what you do</span></div>` +
    `<div class="ob-acts"><button class="btn sm" data-act="sv_skip">Skip</button></div></div>` +
    rows +
    `<div class="sv-go"><button class="btn pri" data-act="sv_save"${ready ? "" : " disabled"}>Done</button></div></section>`
  );
}

/** Extra checklist steps for what this person said they do. */
export function surveySteps(): { k: string; done: boolean; t: string; d: string; a: string }[] {
  const sv = S.cfg && S.cfg.survey;
  if (!sv) return [];
  const out: { k: string; done: boolean; t: string; d: string; a: string }[] = [];
  const btn = (view: string, label: string) => `<button class="btn sm" data-act="view" data-id="${view}">${label}</button>`;
  if (sv.goal === "money")
    out.push({ k: "sv-money", done: S.income.length > 0, t: "Log your first income", d: "Add what a brand or platform paid you, and see the month add up.", a: btn("bank", "Open Money") });
  if (sv.goal === "team" || sv.size !== "solo")
    out.push({ k: "sv-team", done: T.members.length > 0, t: "Add a teammate", d: "Give each person their own work and see what is done today.", a: btn("team", "Open Team") });
  if (sv.kind === "tech")
    out.push({ k: "sv-tech", done: S.notes.length > 0, t: "Write a script note", d: "Notes handle code blocks and checklists, so scripts and outlines live in one place.", a: btn("notes", "Open Notes") });
  if (sv.goal === "grow")
    out.push({ k: "sv-grow", done: S.posts.length > 0, t: "Plan your next post", d: "Pick a date on the calendar so growth work has a deadline.", a: btn("cal", "Open Calendar") });
  return out;
}

export function surveyAct(a: string, _b: HTMLElement, id: string): boolean {
  switch (a) {
    case "sv_pick": {
      const [key, value] = id.split(":");
      if (QUESTIONS.some((q) => q.key === key)) draft[key as Question["key"]] = value;
      render();
      return true;
    }
    case "sv_save": {
      if (!QUESTIONS.every((q) => draft[q.key])) return true;
      S.cfg.survey = { kind: draft.kind!, size: draft.size!, goal: draft.goal!, ts: Date.now() };
      draft = {};
      touch();
      render();
      toast("Saved. Your checklist now fits what you do.");
      return true;
    }
    case "sv_skip":
      S.cfg.survey = { kind: "", size: "", goal: "", ts: Date.now() };
      draft = {};
      touch();
      render();
      return true;
  }
  return false;
}
