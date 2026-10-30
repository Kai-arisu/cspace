/** Review units: loaner devices, who has them, when the embargo lifts and when they go back. */
import type { Unit } from "../types";

const DAY = 86400000;

/** "in 3 days", "today", "2 days ago" for a moment in time. */
function when(ms: number): string {
  const d = Math.round((ms - Date.now()) / DAY);
  return d === 0 ? "today" : d > 0 ? `in ${d} day${d === 1 ? "" : "s"}` : `${-d} day${d === -1 ? "" : "s"} ago`;
}

/** Next date that needs attention for a unit still out, as a timestamp. */
function nextDue(u: Unit): number {
  const t: number[] = [];
  if (u.embargo) t.push(Date.parse(u.embargo));
  if (u.ret) t.push(Date.parse(u.ret + "T23:59:00"));
  return t.length ? Math.min(...t.filter((n) => !isNaN(n))) : Infinity;
}

function row(u: Unit): string {
  const emb = u.embargo ? Date.parse(u.embargo) : NaN;
  const ret = u.ret ? Date.parse(u.ret + "T23:59:00") : NaN;
  const out = u.status === "with";
  const embLive = !isNaN(emb) && emb > Date.now();
  const late = out && !isNaN(ret) && ret < Date.now();
  const badges =
    (!isNaN(emb) ? `<span class="un-b${embLive && out ? " hot" : ""}">${embLive ? "Embargo lifts " : "Embargo lifted "}${esc(when(emb))}</span>` : "") +
    (!isNaN(ret) ? `<span class="un-b${late ? " late" : ""}">${out ? "Return " : "Returned, was due "}${esc(when(ret))}</span>` : "");
  return (
    `<li class="un${out ? "" : " back"}"><div><b>${esc(u.name)}</b><span class="muted">${esc(u.brand)}${u.brand && u.holder ? " · " : ""}${u.holder ? "with " + esc(u.holder) : ""}</span>` +
    `<div class="un-bs">${badges}</div></div><div class="un-a">` +
    (out && !readOnly ? `<button class="btn sm" data-act="unit_back" data-id="${esc(u.id)}">Mark returned</button>` : "") +
    (readOnly ? "" : `<button class="ico" data-act="unit_del" data-id="${esc(u.id)}" aria-label="Delete unit" title="Delete">${I("trash")}</button>`) +
    `</div></li>`
  );
}

export function unitsHTML(): string {
  const all = mine("units");
  const out = all.filter((u) => u.status === "with").sort((a, b) => nextDue(a) - nextDue(b));
  const back = all.filter((u) => u.status !== "with").sort((a, b) => b.ts - a.ts);
  const holders = [...new Set(T.members.filter((m) => m.status === "active").map((m) => m.name))];
  let h = `<section class="panel" style="margin-top:16px"><h2>Review units<span class="cnt">${out.length} out</span></h2>`;
  h += `<p class="muted">Track loaner devices: who has each one, when the embargo lifts and when it goes back to the brand.</p>`;
  if (!readOnly)
    h +=
      `<div class="form un-f"><label>Device<input class="in" id="un-name" maxlength="80" placeholder="Pixel 11 Pro"></label>` +
      `<label>Brand<input class="in" id="un-brand" maxlength="60" placeholder="Google"></label>` +
      `<label>With<input class="in" id="un-holder" maxlength="60" list="un-people" placeholder="Who has it"><datalist id="un-people">${holders.map((n) => `<option value="${esc(n)}">`).join("")}</datalist></label>` +
      `<label>Embargo lifts<input class="in" id="un-emb" type="datetime-local"></label>` +
      `<label>Return by<input class="in" id="un-ret" type="date"></label>` +
      `<button class="btn pri" data-act="unit_add">Add unit</button></div>`;
  h += out.length ? `<ul class="un-l">${out.map(row).join("")}</ul>` : `<div class="empty">No units out. Add the next review sample when it arrives.</div>`;
  if (back.length) h += `<h3 class="un-h">Returned</h3><ul class="un-l">${back.slice(0, 10).map(row).join("")}</ul>`;
  return h + `</section>`;
}

export function unitAct(a: string, b: HTMLElement, id: string): boolean {
  switch (a) {
    case "unit_add": {
      const v = (k: string) => (($("un-" + k) as HTMLInputElement | null)?.value || "").trim();
      const name = v("name");
      if (!name) {
        toast("Name the device first");
        $("un-name")?.focus();
        return true;
      }
      S.units.push({ id: uid(), sp: S.cur, name, brand: v("brand"), holder: v("holder"), embargo: v("emb"), ret: v("ret"), status: "with", ts: Date.now() });
      touch();
      render();
      return true;
    }
    case "unit_back": {
      const u = findIn(S.units, id);
      if (u) {
        u.status = "returned";
        touch();
        render();
      }
      return true;
    }
    case "unit_del":
      arm(b, () => {
        S.units = S.units.filter((u) => u.id !== id);
        touch();
        render();
      });
      return true;
  }
  return false;
}

/** Units that need attention soon: embargo within 3 days or return overdue or due within 3 days. */
export function unitsDueSoon(): Unit[] {
  const soon = Date.now() + 3 * DAY;
  return mine("units").filter((u) => u.status === "with" && nextDue(u) <= soon);
}
