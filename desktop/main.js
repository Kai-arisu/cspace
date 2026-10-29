// Creator Space for Windows, macOS and Linux.
// One window on the live app, so every release of the site reaches the desktop
// app at once. The shell adds what a browser tab can't: its own window and icon,
// a remembered size and position, a single running copy, and links to other
// sites opened in the default browser.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const SITE = process.env.CS_URL || "https://cspace.cashteaates009.workers.dev";
const ORIGIN = new URL(SITE).origin;
// ?app=desktop tells the site to skip the marketing page and open on sign-in
const START = SITE + "/?app=desktop";

// sign-in and "connect your account" pass through these; they stay in the window
// so the flow can come back to the app
const AUTH_HOSTS = ["supabase.co", "instagram.com", "facebook.com", "google.com", "tiktok.com", "x.com", "twitter.com"];
function staysInside(url) {
  try {
    const u = new URL(url);
    if (u.origin === ORIGIN || u.protocol === "file:") return true;
    return AUTH_HOSTS.some((d) => u.hostname === d || u.hostname.endsWith("." + d));
  } catch { return false; }
}

// window size and position, remembered between launches
const STATE = path.join(app.getPath("userData"), "window.json");
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return {}; }
}
function saveBounds(w) {
  try { fs.writeFileSync(STATE, JSON.stringify({ ...w.getNormalBounds(), max: w.isMaximized() })); } catch {}
}

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win;
function create() {
  const b = loadBounds();
  win = new BrowserWindow({
    width: b.width || 1360, height: b.height || 880, x: b.x, y: b.y,
    minWidth: 420, minHeight: 600,
    backgroundColor: "#ffffff", title: "Creator Space", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  if (b.max) win.maximize();
  ["resize", "move", "close"].forEach((ev) => win.on(ev, () => saveBounds(win)));

  win.loadURL(START);
  win.webContents.on("did-fail-load", (_e, code, _d, _url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, "offline.html"));
  });
  // new-tab links (a public page, a video, a reference) open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // a plain link to another site leaves the app for the browser
  win.webContents.on("will-navigate", (e, url) => {
    if (!staysInside(url)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
  // downloads (moodboard image, exports, share images) go to Downloads and are shown there
  win.webContents.session.on("will-download", (_e, item) => {
    const dir = app.getPath("downloads");
    let name = item.getFilename() || "creator-space-download", p = path.join(dir, name), n = 1;
    const ext = path.extname(name), stem = path.basename(name, ext);
    while (fs.existsSync(p)) p = path.join(dir, `${stem} (${n++})${ext}`);
    item.setSavePath(p);
    item.once("done", (_ev, state) => { if (state === "completed") shell.showItemInFolder(p); });
  });
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "reload" }, { role: "togglefullscreen" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }] },
    { role: "windowMenu" }
  ]));
  create();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) create(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
