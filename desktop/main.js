const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const SITE = process.env.CS_URL || "https://cspace.cashteaates009.workers.dev";
const ORIGIN = new URL(SITE).origin;

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win;
function create() {
  win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 420, minHeight: 600,
    backgroundColor: "#f2f2f4", title: "Creator Space", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  win.loadURL(SITE);
  win.webContents.on("did-fail-load", (_e, code, _d, url, isMain) => {
    if (isMain && code !== -3) win.loadFile(path.join(__dirname, "offline.html"));
  });
  // links to other sites open in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(ORIGIN)) return { action: "allow" };
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN) && !url.startsWith("file:")) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
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
