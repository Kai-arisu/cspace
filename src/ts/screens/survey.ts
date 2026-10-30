/** Welcome survey: a role, then a sub-type. Two taps, and the app fits the person. */
type Opt = [value: string, label: string];

const ROLES: Opt[] = [
  ["creator", "I'm a creator"],
  ["business", "I run a business"],
  ["team", "I lead a team"],
  ["college", "It's a college project"],
];

const SUBS: Record<string, Opt[]> = {
  creator: [["video", "Videos"], ["social", "Reels and posts"], ["education", "Education"], ["tech", "Tech or gadgets"]],
  business: [["finance", "Finance or consulting"], ["shop", "A shop or brand"], ["agency", "An agency"], ["other", "Something else"]],
  team: [["production", "Reels or video production"], ["startup", "A startup"], ["agency", "An agency"], ["other", "Something else"]],
  college: [["event", "A club or event"], ["class", "A class project"], ["research", "Research"], ["other", "Something else"]],
};

/** Answer picked so far, before the second tap saves it. */
let pickedRole = "";

export const roleLabel = (role: string): string => ROLES.find((r) => r[0] === role)?.[1] || "";
export const subLabel = (role: string, sub: string): string => (SUBS[role] || []).find((s) => s[0] === sub)?.[1] || "";

export function surveyDone(): boolean {
  return !!(S.cfg && S.cfg.survey);
}

/** Whether a feature that belongs to one sub-type should be on show. Everything shows until a sub-type is chosen. */
export function surveyShows(sub: string): boolean {
  const sv = S.cfg && S.cfg.survey;
  return !sv || !sv.sub || sv.sub === sub;
}

export function surveyHTML(): string {
  if (readOnly || window.__WS || (S.cfg && (S.cfg.obDone || S.cfg.survey))) return "";
  const chip = (act: string, id: string, label: string, on: boolean) =>
    `<button class="chip" data-act="${act}" data-id="${esc(id)}" aria-pressed="${on}">${esc(label)}</button>`;
  const q1 = `<div class="sv-q" role="group" aria-label="What best describes you"><h3>What best describes you?</h3><div class="sv-o">${ROLES.map((r) => chip("sv_role", r[0], r[1], pickedRole === r[0])).join("")}</div></div>`;
  const q2 = pickedRole
    ? `<div class="sv-q" role="group" aria-label="What kind"><h3>What kind?</h3><div class="sv-o">${SUBS[pickedRole].map((s) => chip("sv_sub", s[0], s[1], false)).join("")}</div></div>`
    : "";
  return (
    `<section class="panel sv"><div class="ob-h"><div><h2 style="margin:0">Make it yours</h2><span class="muted">Two taps and the app fits what you do. You can change this any time.</span></div>` +
    `<div class="ob-acts"><button class="btn sm" data-act="sv_skip">Skip</button></div></div>${q1}${q2}</section>`
  );
}

/** Extra checklist steps for what this person said they do. */
export function surveySteps(): { k: string; done: boolean; t: string; d: string; a: string }[] {
  const sv = S.cfg && S.cfg.survey;
  if (!sv) return [];
  const out: { k: string; done: boolean; t: string; d: string; a: string }[] = [];
  const btn = (view: string, label: string) => `<button class="btn sm" data-act="view" data-id="${view}">${label}</button>`;
  if (sv.sub === "tech") {
    out.push({ k: "sv-unit", done: S.units.length > 0, t: "Log your first review unit", d: "Track a loaner device: who has it, when the embargo lifts and when it goes back.", a: `<button class="btn sm" data-act="sv_goto" data-id="units">Open Review units</button>` });
    out.push({ k: "sv-radar", done: S.launches.length > 0, t: "Add an upcoming launch", d: "Put a phone, laptop or AI launch on the radar and turn it into a content plan.", a: `<button class="btn sm" data-act="sv_goto" data-id="radar">Open Launch radar</button>` });
  }
  if (sv.role === "business" || sv.sub === "finance")
    out.push({ k: "sv-money", done: S.income.length > 0, t: "Log your first income", d: "Add what a client or brand paid you, and see the month add up.", a: btn("biz", "Open Business") });
  if (sv.role === "business" || sv.role === "team")
    out.push({ k: "sv-team", done: T.members.length > 0, t: "Add a teammate", d: "Give each person their own work and see what is done today.", a: btn("team", "Open Team") });
  if (sv.role === "college")
    out.push({ k: "sv-plan", done: S.tasks.some((t) => t.due), t: "Put a deadline on a task", d: "Dated tasks show on the calendar and in the bell when they are due.", a: btn("cal", "Open Calendar") });
  if (sv.sub === "education")
    out.push({ k: "sv-script", done: S.notes.length > 0, t: "Draft a lesson script", d: "Notes keep outlines and checklists together.", a: btn("notes", "Open Notes") });
  return out;
}

export function surveyAct(a: string, _b: HTMLElement, id: string): boolean {
  switch (a) {
    case "sv_role":
      pickedRole = id;
      render();
      return true;
    case "sv_sub": {
      const role = pickedRole;
      if (!role) return true;
      S.cfg.survey = { role, sub: id, ts: Date.now() };
      pickedRole = "";
      touch();
      render();
      toast("Saved. You can change this from Today.");
      return true;
    }
    case "sv_skip":
      S.cfg.survey = { role: "", sub: "", ts: Date.now() };
      pickedRole = "";
      touch();
      render();
      return true;
    case "sv_reset":
      delete S.cfg.survey;
      pickedRole = "";
      if (S.cfg.obDone) delete S.cfg.obDone;
      touch();
      render();
      return true;
    case "sv_goto":
      bizTab = id;
      go("biz");
      return true;
  }
  return false;
}

/** A line at the bottom of Today that shows the answer and lets the person change it. */
export function surveyFootHTML(): string {
  const sv = S.cfg && S.cfg.survey;
  if (readOnly || window.__WS || !sv || !sv.role) return "";
  return `<div class="sv-foot muted">Set up for: <b>${esc(roleLabel(sv.role))}${sv.sub ? " · " + esc(subLabel(sv.role, sv.sub)) : ""}</b> <button class="lnk" data-act="sv_reset">Change</button></div>`;
}
