/** Clips: a library of saved links, with tags, search and a trip to the moodboard or ideas. */
import type { Clip } from "../types";

let clipTag = "all";
let clipQ = "";

export function ytId(u: string): string {
  const m = String(u).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : "";
}

export function clipHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

const dis = () => (readOnly ? " disabled" : "");

function card(c: Clip): string {
  const y = ytId(c.url);
  const host = clipHost(c.url);
  let hue = 0;
  for (let i = 0; i < host.length; i++) hue = (hue * 31 + host.charCodeAt(i)) % 360;
  const th = y ? `<img src="https://i.ytimg.com/vi/${y}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">` : "";
  const tags = c.tags || [];
  return (
    `<article class="clip"><a class="cl-th${y ? "" : " noimg"}" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg,hsl(${hue} 60% 55%),hsl(${(hue + 50) % 360} 60% 40%))" aria-label="Open ${esc(c.title || host)}"><span>${esc(host.slice(0, 1).toUpperCase())}</span>${th}</a>` +
    `<div class="cl-b"><b>${esc(c.title || host)}</b><small class="muted">${esc(host)} · ${ago(c.ts)}</small>` +
    (c.note ? `<p>${esc(c.note)}</p>` : "") +
    (tags.length ? `<div class="cl-tags">${tags.map((t) => `<span class="mb-chip" style="font-size:11px;letter-spacing:.04em;text-transform:none">#${esc(t)}</span>`).join("")}</div>` : "") +
    `<div class="cl-a"><button class="ico" data-act="clipstar" data-id="${c.id}" aria-label="Star" aria-pressed="${!!c.star}"${dis()}>${I("star")}</button>` +
    `<button class="btn sm" data-act="clipmood" data-id="${c.id}"${dis()}>To moodboard</button><button class="btn sm" data-act="clipidea" data-id="${c.id}"${dis()}>To ideas</button>` +
    `<button class="ico danger" data-act="clipdel" data-id="${c.id}" aria-label="Delete clip"${dis()}>${I("x")}</button></div></div></article>`
  );
}

export function clipListHTML(): string {
  const q = clipQ.toLowerCase();
  const all = mine("clips");
  const list = all
    .slice()
    .sort((a, b) => Number(b.star) - Number(a.star) || b.ts - a.ts)
    .filter((c) => (clipTag === "all" || (c.tags || []).indexOf(clipTag) > -1) && (!q || (c.title + " " + c.note + " " + c.url).toLowerCase().indexOf(q) > -1));
  if (!list.length)
    return all.length
      ? `<div class="empty">No clips match.</div>`
      : emptyCard("link", "Build your reference library", "Paste a video, an article or any link you want to learn from. Add a note like #lighting to find it later, or send it to your moodboard.", "");
  return `<div class="clips">${list.map(card).join("")}</div>`;
}

export function vClips(): string {
  const all = mine("clips");
  const tags: Record<string, number> = {};
  all.forEach((c) => (c.tags || []).forEach((t) => (tags[t] = 1)));
  let h = hero("clips", "Clips", "Save links and videos, and upload files. Add #tags to find links later.", "");
  if (!readOnly)
    h +=
      `<div class="form clipform"><label style="flex:2 1 260px"><span class="vh">Link</span><input class="in" id="clurl" placeholder="Paste a link" maxlength="400"></label>` +
      `<label style="flex:1 1 160px"><span class="vh">Title</span><input class="in" id="cltitle" placeholder="Optional" maxlength="90"></label>` +
      `<label style="flex:2 1 220px"><span class="vh">Note and #tags</span><input class="in" id="clnote" placeholder="Why it is worth keeping #lighting" maxlength="240"></label>` +
      `<button class="btn pri" data-act="clipadd">Save</button></div>`;
  h +=
    `<div class="chips" role="group" aria-label="Filter clips"><button class="chip" data-act="clipf" data-id="all" aria-pressed="${clipTag === "all"}">All ${all.length}</button>` +
    Object.keys(tags)
      .sort()
      .map((t) => `<button class="chip" data-act="clipf" data-id="${esc(t)}" aria-pressed="${clipTag === t}">#${esc(t)}</button>`)
      .join("") +
    `<input class="in" id="clipq" data-clipq="1" placeholder="Search clips" style="max-width:220px;margin-left:auto" value="${esc(clipQ)}" aria-label="Search clips"></div><div id="cliplist">${clipListHTML()}</div>`;
  return h + vFiles();
}

export function clipAdd(): void {
  let u = (($("clurl") as HTMLInputElement).value || "").trim();
  if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const p = new URL(u);
    if (!/^https?:$/.test(p.protocol)) throw 0;
  } catch {
    toast("Paste a valid link");
    return;
  }
  const note = (($("clnote") as HTMLInputElement).value || "").trim();
  const tags = (note.match(/#[\w-]+/g) || []).map((t) => t.slice(1).toLowerCase());
  const c: Clip = { id: uid(), sp: S.cur, url: u, title: (($("cltitle") as HTMLInputElement).value || "").trim(), note: note.replace(/\s*#[\w-]+/g, "").trim(), tags, star: false, ts: Date.now() };
  S.clips.push(c);
  touch();
  render();
  if (!c.title && ytId(u)) {
    fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(u))
      .then((r) => r.json())
      .then((j) => {
        if (j && j.title) {
          c.title = String(j.title).slice(0, 90);
          touch();
          if (S.view === "clips") render();
        }
      })
      .catch(() => {});
  }
}

/** Handles the Clips screen's buttons. Returns false for actions it doesn't own. */
export function clipAct(a: string, b: HTMLElement, id: string): boolean {
  switch (a) {
    case "clipadd":
      clipAdd();
      return true;
    case "clipf":
      clipTag = id;
      render();
      return true;
    case "clipstar": {
      const c = findIn(S.clips, id);
      if (c) { c.star = !c.star; touch(); render(); }
      return true;
    }
    case "clipdel":
      arm(b, () => { S.clips = S.clips.filter((x) => x.id !== id); touch(); render(); });
      return true;
    case "clipmood": {
      const c = findIn(S.clips, id);
      if (c) {
        S.mood.push({ id: uid(), sp: S.cur, kind: "link", sec: "links", value: c.url, label: c.title || clipHost(c.url) });
        touch();
        toast("Added to the moodboard");
      }
      return true;
    }
    case "clipidea": {
      const c = findIn(S.clips, id);
      if (c) {
        aiSaveIdea((c.title || clipHost(c.url)) + (c.note ? ": " + c.note : "") + " " + (c.tags || []).map((t) => "#" + t).join(" "));
        touch();
        toast("Saved as an idea");
      }
      return true;
    }
  }
  return false;
}

/** Live search as you type. Returns true when the input was the search box. */
export function clipInput(t: HTMLElement): boolean {
  if (!t.dataset || !t.dataset.clipq) return false;
  clipQ = (t as HTMLInputElement).value;
  const cl = $("cliplist");
  if (cl) cl.innerHTML = clipListHTML();
  return true;
}
