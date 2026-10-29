/** Notes: a list of notes and one open note, written in a light markdown. */
import type { Note } from "../types";

/** [id, button label, starting title, starting body] */
export const NTPL: [string, string, string, string][] = [
  ["blank", "Blank", "", ""],
  ["video", "Video script", "Video script", "## Hook (0:00 to 0:15)\nShow the finished result first.\n\n## Problem\nWhy the old way wastes time.\n\n## Main points\n- Point one\n- Point two\n- Point three\n\n## Call to action\nWhat should they do next?\n\n## Checklist\n- [ ] Film A-roll\n- [ ] Record voiceover\n- [ ] Edit and colour grade\n- [ ] Thumbnail and title\n"],
  ["brief", "Content brief", "Content brief", "## Goal\n\n## Audience\n\n## Key message\n\n## Format and length\n\n## References\n\n## Deadline\n"],
  ["collab", "Collab pitch", "Collab pitch", "## Brand or person\n\n## What they want\n\n## What I offer\n\n## Rates and terms\n\n## Next steps\n- [ ] Reply\n- [ ] Send media kit\n"],
  ["check", "Checklist", "Checklist", "## Checklist\n- [ ] \n- [ ] \n- [ ] \n"],
  ["meet", "Meeting notes", "Meeting notes", "## Agenda\n\n## Notes\n\n## Decisions\n\n## Action items\n- [ ] \n"],
];

const CHECK = /^\s*-\s\[( |x|X)\]\s?(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const HEADING = /^(#{1,3})\s+(.+)$/;

const current = (): Note | undefined => findIn(S.notes, selNote);
const ro = () => (readOnly ? " readonly" : "");
const dis = () => (readOnly ? " disabled" : "");

/** Read mode: headings, bullets, tickable checklists, dividers and paragraphs. */
export function nRender(body: string): string {
  let h = "";
  let inList = false;
  const close = () => { if (inList) { h += "</ul>"; inList = false; } };
  const open = () => { if (!inList) { h += '<ul class="nd-l">'; inList = true; } };
  String(body || "").split("\n").forEach((l, i) => {
    let m: RegExpMatchArray | null;
    if ((m = l.match(CHECK))) {
      open();
      const on = m[1] !== " ";
      h += `<li class="nd-c${on ? " done" : ""}"><label><input type="checkbox" data-act="nchk" data-line="${i}"${on ? " checked" : ""}${dis()}><span>${esc(m[2])}</span></label></li>`;
      return;
    }
    if ((m = l.match(BULLET))) { open(); h += `<li>${esc(m[1])}</li>`; return; }
    close();
    if ((m = l.match(HEADING))) { const n = m[1].length + 1; h += `<h${n} class="nd-h">${esc(m[2])}</h${n}>`; return; }
    if (/^-{3,}\s*$/.test(l)) { h += '<hr class="nd-hr">'; return; }
    if (!l.trim()) { h += '<div class="nd-sp"></div>'; return; }
    h += `<p>${esc(l)}</p>`;
  });
  close();
  return h || '<p class="muted">This note is empty. Switch to Write to start.</p>';
}

/** The section outline: one button per heading. */
export function nOutline(body: string): string {
  const out: { i: number; pos: number; lvl: number; t: string }[] = [];
  let pos = 0;
  String(body || "").split("\n").forEach((l, i) => {
    const m = l.match(HEADING);
    if (m) out.push({ i, pos, lvl: m[1].length, t: m[2] });
    pos += l.length + 1;
  });
  if (!out.length) return '<span class="muted" style="font-size:13px">Add headings with ## to get a section outline.</span>';
  return out.map((o) => `<button class="nsec l${o.lvl}" data-act="nsec" data-pos="${o.pos}" data-line="${o.i}">${esc(o.t)}</button>`).join("");
}

function paintOutline(body: string): void {
  const o = $("nout");
  if (o) { o.innerHTML = nOutline(body); o.hidden = !/nsec/.test(o.innerHTML); }
}

export function nToolbar(): string {
  if (readOnly) return "";
  const b = (t: string, label: string) => `<button class="btn sm" data-act="ninsert" data-t="${t}">${label}</button>`;
  return '<div class="ntool" role="toolbar" aria-label="Insert">' + b("## ", "Heading") + b("- ", "Bullet") + b("- [ ] ", "Checklist") + b("---", "Divider") +
    '<button class="btn sm" data-act="n2tasks" title="Turn unchecked checklist lines into tasks">Checklist to tasks</button></div>';
}

/** Puts a heading, bullet, checkbox or divider on the caret's line (or a new one). */
export function nInsert(pre: string): void {
  const ta = $("nbody") as HTMLTextAreaElement | null, n = current();
  if (!ta || !n || readOnly) return;
  const v = ta.value, s = ta.selectionStart ?? 0, ls = v.lastIndexOf("\n", s - 1) + 1;
  const end = v.indexOf("\n", s);
  const line = v.slice(ls, end < 0 ? v.length : end);
  const ins = (line.trim() === "" ? "" : "\n") + pre;
  const at = line.trim() === "" ? ls : ls + line.length;
  ta.value = v.slice(0, at) + ins + v.slice(at);
  const c = at + ins.length;
  ta.focus();
  ta.setSelectionRange(c, c);
  n.body = ta.value;
  n.ts = Date.now();
  touch();
  paintOutline(n.body);
}

/** Every unticked "- [ ] line" becomes a task on the board, marked "[→]" in the note. */
export function nToTasks(): void {
  const n = current();
  if (!n || readOnly) return;
  let cnt = 0;
  n.body = n.body.replace(/^(\s*[-*]\s*)\[ \]\s*(.+)$/gm, (all, pre: string, t: string) => {
    t = t.trim();
    if (!t) return all;
    S.tasks.push({ id: uid(), sp: S.cur, title: t, col: "i", due: "", pri: 0, ts: Date.now(), from: n.id });
    cnt++;
    return pre + "[→] " + t;
  });
  if (!cnt) return toast("No unchecked lines like “- [ ] task” found");
  n.ts = Date.now();
  touch();
  render();
  toast(cnt + (cnt === 1 ? " task" : " tasks") + " added to Progress");
}

function openNew(title: string, body: string): Note {
  const n: Note = { id: uid(), sp: S.cur, title, body, pin: false, ts: Date.now() };
  S.notes.push(n);
  selNote = n.id;
  noteOpen = true;
  noteMode = "write";
  S.view = "notes";
  touch();
  render();
  return n;
}

export function newNote(): void {
  openNew("", "");
  const t = $("ntitle");
  if (t) t.focus();
}

export function nFromTpl(key: string): void {
  const t = NTPL.find((x) => x[0] === key);
  if (!t || readOnly) return;
  openNew(t[2], t[3]);
  const b = $("nbody") as HTMLTextAreaElement | null;
  if (b) { b.focus(); b.setSelectionRange(0, 0); }
}

export function vNotes(): string {
  const list = mine("notes");
  if (!list.some((n) => n.id === selNote)) selNote = list.length ? list[0].id : null;
  let h = hero("notes", "Notes", null, `<button class="btn pri" data-act="newnote"${dis()}>${I("plus")}New note</button>`);
  if (!list.length)
    return h + emptyCard("notes", "Write your first note", "Scripts, outlines, briefs and pitches live here. Start from a template so you're never facing a blank page.",
      readOnly ? "" : NTPL.map((t) => `<button class="btn sm" data-act="ntpl" data-id="${t[0]}">${t[1]}</button>`).join(""));
  if (!readOnly) h += `<div class="ntpl"><span>Start from</span>${NTPL.map((t) => `<button class="chip" data-act="ntpl" data-id="${t[0]}">${t[1]}</button>`).join("")}</div>`;
  h += `<div class="notes${noteOpen ? " nopen" : ""}"><div><input class="in" id="nsearch" placeholder="Filter notes" aria-label="Filter notes" style="margin-bottom:10px"><div class="nlist" id="nlist"></div></div><div id="neditor"></div></div>`;
  return h;
}

/** The note list, pinned first, then newest; filtered by the search box. */
export function noteListHTML(q?: string): string {
  q = (q || "").toLowerCase();
  const list = mine("notes").slice()
    .sort((a, b) => (Number(b.pin) - Number(a.pin)) || (b.ts - a.ts))
    .filter((n) => !q || (n.title + " " + n.body).toLowerCase().indexOf(q) > -1);
  if (!list.length) return `<div class="empty">${q ? "No notes match." : "No notes yet."}</div>`;
  return list.map((n) => {
    const preview = (n.body || "").replace(/[#*\[\]]+/g, "").replace(/\s+/g, " ").trim().slice(0, 90) || "Empty note";
    return `<button class="ncard" data-act="opennote" data-id="${n.id}" aria-current="${n.id === selNote}"><b>${esc(n.title || "Untitled")}${n.pin ? `<i class="npin" aria-label="Pinned">${I("pin")}</i>` : ""}</b><span>${esc(preview)}</span><small>${ago(n.ts)}</small></button>`;
  }).join("");
}

export function noteEditorHTML(): string {
  const n = current();
  if (!n) return '<div class="panel empty">Create a note to start writing.</div>';
  const outl = nOutline(n.body), rd = noteMode === "read" || readOnly;
  return `<div class="panel npaper${rd ? " nread" : ""}"><div class="nbar"><button class="btn sm nback" data-act="nback">${I("left")}All notes</button>` +
    `<div class="nmode" role="group" aria-label="Note mode"><button data-act="nmode" data-id="write" aria-pressed="${!rd}"${dis()}>Write</button><button data-act="nmode" data-id="read" aria-pressed="${rd}">Read</button></div>` +
    (rd ? "" : nToolbar()) +
    `<span class="nacts"><button class="btn sm" data-act="tp_open">${I("play")}Teleprompter</button>${cbtn("#neditor .panel")}` +
    `<button class="ico" data-act="pinnote" aria-label="${n.pin ? "Unpin note" : "Pin note"}" title="${n.pin ? "Unpin" : "Pin"}" aria-pressed="${!!n.pin}">${I("pin")}</button>` +
    `<button class="ico" data-act="delnote" aria-label="Delete note" title="Delete"${dis()}>${I("trash")}</button></span></div>` +
    `<div class="nout" id="nout"${/nsec/.test(outl) ? "" : " hidden"}>${outl}</div>` +
    `<input class="ghost ntitle" id="ntitle" value="${esc(n.title)}" placeholder="Untitled" aria-label="Note title"${ro()}>` +
    (rd ? `<div class="ndoc" id="ndoc">${nRender(n.body)}</div>`
        : `<textarea class="nbody" id="nbody" placeholder="Start writing… use ## for headings, - [ ] for checklists" aria-label="Note body"${ro()}>${esc(n.body)}</textarea>`) +
    `<div class="nmeta"><span id="nwc">${words(n.body)} words · edited ${ago(n.ts)}</span></div></div>`;
}

function repaint(): void {
  const ed = $("neditor"), li = $("nlist"), q = $("nsearch") as HTMLInputElement | null;
  if (ed) ed.innerHTML = noteEditorHTML();
  if (li) li.innerHTML = noteListHTML(q ? q.value : "");
}

/** Handles the Notes screen's buttons. Returns false for actions it doesn't own. */
export function noteAct(a: string, b: HTMLElement, id: string): boolean {
  switch (a) {
    case "newnote": newNote(); return true;
    case "ntpl": nFromTpl(id); return true;
    case "ninsert": nInsert(b.dataset.t || ""); return true;
    case "n2tasks": nToTasks(); return true;
    case "opennote": selNote = id; noteOpen = true; S.view = "notes"; render(); return true;
    case "nback": noteOpen = false; render(); return true;
    case "nmode": {
      noteMode = id === "read" ? "read" : "write";
      const ed = $("neditor");
      if (ed) ed.innerHTML = noteEditorHTML();
      return true;
    }
    case "nchk": {
      // tick or untick one checklist line from read mode
      const n = current();
      if (!n) return true;
      const L = n.body.split("\n"), i = +(b.getAttribute("data-line") || -1);
      if (L[i] == null) return true;
      L[i] = /\[( )\]/.test(L[i]) ? L[i].replace("[ ]", "[x]") : L[i].replace(/\[(x|X)\]/, "[ ]");
      n.body = L.join("\n");
      n.ts = Date.now();
      touch();
      repaint();
      return true;
    }
    case "nsec": {
      // jump to a heading from the outline
      const ta = $("nbody") as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        const ps = +(b.dataset.pos || 0);
        ta.setSelectionRange(ps, ps);
        ta.scrollTop = Math.max(0, +(b.dataset.line || 0) * 27 - 40);
      }
      return true;
    }
    case "pinnote": {
      const n = current();
      if (n) { n.pin = !n.pin; touch(); render(); }
      return true;
    }
    case "delnote":
      arm(b, () => { S.notes = S.notes.filter((x) => x.id !== selNote); selNote = null; touch(); render(); });
      return true;
  }
  return false;
}

/** Typing in the title, the body or the filter box. Returns true when it handled the input. */
export function noteInput(t: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (t.id === "ntitle" || t.id === "nbody") {
    const n = current();
    if (!n) return true;
    if (t.id === "ntitle") n.title = t.value; else { n.body = t.value; paintOutline(n.body); }
    n.ts = Date.now();
    touch();
    const q = $("nsearch") as HTMLInputElement | null, li = $("nlist");
    if (li) li.innerHTML = noteListHTML(q ? q.value : "");
    const w = $("nwc");
    if (w) w.textContent = words(n.body) + " words · edited just now";
    return true;
  }
  if (t.id === "nsearch") {
    const li = $("nlist");
    if (li) li.innerHTML = noteListHTML(t.value);
    return true;
  }
  return false;
}
