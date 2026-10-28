// Creator Space: sign in with Instagram, Facebook, YouTube, TikTok or X and keep live numbers.
// Routes (all under /functions/v1/social):
//   GET  /status              which platforms are set up (no login needed)
//   POST /start   {provider}  returns the platform's sign-in URL (login needed)
//   GET  /cb/<provider>       the platform sends the person back here after sign-in
//   POST /sync    {connection_id?, force?}  refresh this person's signed-in connections
//   POST /disconnect {connection_id, keep?} forget the sign-in (and the channel unless keep)
//   POST /cron                daily refresh of every signed-in connection (x-cron-secret)
// Tokens are AES-GCM encrypted and stored where the browser cannot read them.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://cspace.cashteaates009.workers.dev";
const FN_URL = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "") + "/functions/v1/social";
const META_V = "v23.0";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const env = (k: string) => Deno.env.get(k) || "";
const admin = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

type Prov = "instagram" | "facebook" | "youtube" | "tiktok" | "x";
const PROVS: Prov[] = ["instagram", "facebook", "youtube", "tiktok", "x"];
const CRED: Record<Prov, [string, string]> = {
  instagram: ["IG_APP_ID", "IG_APP_SECRET"],
  facebook: ["META_APP_ID", "META_APP_SECRET"],
  youtube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  x: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
};
const ready = (p: Prov) => !!(env(CRED[p][0]) && env(CRED[p][1]));
const cid = (p: Prov) => env(CRED[p][0]);
const csec = (p: Prov) => env(CRED[p][1]);
const redirect = (p: Prov) => `${FN_URL}/cb/${p}`;

/* ---------- small helpers ---------- */
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
async function sha256u(s: string) { return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))); }
let KEY: CryptoKey | null = null;
async function key() {
  if (KEY) return KEY;
  // TOKEN_KEY (base64, 32 bytes) if set; otherwise a key derived from this project's service secret
  const raw = env("TOKEN_KEY") ? Uint8Array.from(atob(env("TOKEN_KEY")), (c) => c.charCodeAt(0))
    : new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cspace-social-v1:" + env("SUPABASE_SERVICE_ROLE_KEY"))));
  KEY = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  return KEY;
}
async function enc(s: string | null | undefined) {
  if (!s) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(s)));
  return "v1." + b64u(iv) + "." + b64u(ct);
}
async function dec(s: string | null | undefined) {
  if (!s) return null;
  const [, a, b] = s.split(".");
  const un = (x: string) => Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((x.length + 3) % 4)), (c) => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: un(a) }, await key(), un(b));
  return new TextDecoder().decode(pt);
}
const iso = (secs?: number | null) => (secs ? new Date(Date.now() + secs * 1000).toISOString() : null);
const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number(v));
const day = (d: Date) => d.toISOString().slice(0, 10);

class Up extends Error { code: string; constructor(code: string, msg: string) { super(msg); this.code = code; } }
async function call(url: string, init: RequestInit = {}, what = "request") {
  const r = await fetch(url, init);
  const t = await r.text();
  let b: any = {}; try { b = JSON.parse(t); } catch { b = { raw: t.slice(0, 200) }; }
  const bad = !r.ok || (b?.error && typeof b.error === "object" && b.error.code && b.error.code !== "ok") || (typeof b?.error === "string" && !b?.access_token && !b?.data);
  if (bad) {
    const m = b?.error?.message || b?.error_description || b?.error?.error_user_msg || b?.detail || b?.title || b?.raw || `${what} failed (${r.status})`;
    const auth = r.status === 401 || /OAuthException|invalid_grant|expired|revoked|access_token_invalid/i.test(JSON.stringify(b).slice(0, 400));
    throw new Up(auth ? "auth" : "upstream", String(m).slice(0, 240));
  }
  return b;
}
const form = (o: Record<string, string>) => ({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(o).toString() });
const bearer = (t: string, extra: RequestInit = {}) => ({ ...extra, headers: { ...(extra.headers || {}), Authorization: `Bearer ${t}` } });
async function safe<T>(f: () => Promise<T>): Promise<T | null> { try { return await f(); } catch { return null; } }

/* ---------- sign-in URLs ---------- */
async function authUrl(p: Prov, state: string, verifier: string | null) {
  const ru = redirect(p);
  if (p === "instagram") return "https://www.instagram.com/oauth/authorize?" + new URLSearchParams({
    client_id: cid(p), redirect_uri: ru, response_type: "code", state,
    scope: "instagram_business_basic,instagram_business_manage_insights", enable_fb_login: "0", force_reauth: "true" });
  if (p === "facebook") return `https://www.facebook.com/${META_V}/dialog/oauth?` + new URLSearchParams({
    client_id: cid(p), redirect_uri: ru, state, response_type: "code",
    scope: "pages_show_list,pages_read_engagement,read_insights" });
  if (p === "youtube") return "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: cid(p), redirect_uri: ru, response_type: "code", state, access_type: "offline", prompt: "consent", include_granted_scopes: "true",
    scope: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly", "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"].join(" ") });
  if (p === "tiktok") return "https://www.tiktok.com/v2/auth/authorize/?" + new URLSearchParams({
    client_key: cid(p), redirect_uri: ru, response_type: "code", state,
    scope: "user.info.basic,user.info.profile,user.info.stats,video.list" });
  return "https://x.com/i/oauth2/authorize?" + new URLSearchParams({
    response_type: "code", client_id: cid(p), redirect_uri: ru, state,
    scope: "tweet.read users.read offline.access", code_challenge: await sha256u(verifier!), code_challenge_method: "S256" });
}

/* ---------- code -> tokens ---------- */
type Tok = { access: string; refresh?: string | null; exp?: string | null; rexp?: string | null; scopes?: string; meta?: any };
async function exchange(p: Prov, code: string, verifier: string | null): Promise<Tok> {
  const ru = redirect(p);
  if (p === "instagram") {
    const s = await call("https://api.instagram.com/oauth/access_token", form({ client_id: cid(p), client_secret: csec(p), grant_type: "authorization_code", redirect_uri: ru, code }), "Instagram sign-in");
    const l = await call("https://graph.instagram.com/access_token?" + new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: csec(p), access_token: s.access_token }), {}, "Instagram token");
    return { access: l.access_token, exp: iso(l.expires_in || 5184000), scopes: (s.permissions || []).join(","), meta: { ig_user: String(s.user_id || "") } };
  }
  if (p === "facebook") {
    const s = await call(`https://graph.facebook.com/${META_V}/oauth/access_token?` + new URLSearchParams({ client_id: cid(p), client_secret: csec(p), redirect_uri: ru, code }), {}, "Facebook sign-in");
    const l = await call(`https://graph.facebook.com/${META_V}/oauth/access_token?` + new URLSearchParams({ grant_type: "fb_exchange_token", client_id: cid(p), client_secret: csec(p), fb_exchange_token: s.access_token }), {}, "Facebook token");
    return { access: l.access_token, exp: iso(l.expires_in || 5184000) };
  }
  if (p === "youtube") {
    const t = await call("https://oauth2.googleapis.com/token", form({ code, client_id: cid(p), client_secret: csec(p), redirect_uri: ru, grant_type: "authorization_code" }), "Google sign-in");
    return { access: t.access_token, refresh: t.refresh_token, exp: iso(t.expires_in), scopes: t.scope };
  }
  if (p === "tiktok") {
    const t = await call("https://open.tiktokapis.com/v2/oauth/token/", form({ client_key: cid(p), client_secret: csec(p), code, grant_type: "authorization_code", redirect_uri: ru }), "TikTok sign-in");
    return { access: t.access_token, refresh: t.refresh_token, exp: iso(t.expires_in), rexp: iso(t.refresh_expires_in), scopes: t.scope, meta: { open_id: t.open_id } };
  }
  const t = await call("https://api.x.com/2/oauth2/token", {
    ...form({ code, grant_type: "authorization_code", client_id: cid(p), redirect_uri: ru, code_verifier: verifier || "" }),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + btoa(cid(p) + ":" + csec(p)) },
  }, "X sign-in");
  return { access: t.access_token, refresh: t.refresh_token, exp: iso(t.expires_in), scopes: t.scope };
}

/* ---------- keep tokens fresh ---------- */
async function fresh(sb: any, row: any): Promise<string> {
  const p = row.provider as Prov;
  let access = (await dec(row.access_token))!;
  const exp = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const soon = (ms: number) => exp && exp - Date.now() < ms;
  let upd: Record<string, unknown> | null = null;
  if (p === "instagram" && soon(15 * 864e5)) {
    const r = await call("https://graph.instagram.com/refresh_access_token?" + new URLSearchParams({ grant_type: "ig_refresh_token", access_token: access }), {}, "Instagram refresh");
    access = r.access_token; upd = { access_token: await enc(access), expires_at: iso(r.expires_in || 5184000) };
  } else if ((p === "youtube" || p === "tiktok" || p === "x") && soon(5 * 60e3)) {
    const rt = await dec(row.refresh_token);
    if (!rt) throw new Up("auth", "The sign-in has ended. Connect again.");
    let r: any;
    if (p === "youtube") r = await call("https://oauth2.googleapis.com/token", form({ client_id: cid(p), client_secret: csec(p), refresh_token: rt, grant_type: "refresh_token" }), "Google refresh");
    else if (p === "tiktok") r = await call("https://open.tiktokapis.com/v2/oauth/token/", form({ client_key: cid(p), client_secret: csec(p), refresh_token: rt, grant_type: "refresh_token" }), "TikTok refresh");
    else r = await call("https://api.x.com/2/oauth2/token", { ...form({ refresh_token: rt, grant_type: "refresh_token", client_id: cid(p) }), headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + btoa(cid(p) + ":" + csec(p)) } }, "X refresh");
    access = r.access_token;
    upd = { access_token: await enc(access), expires_at: iso(r.expires_in) };
    if (r.refresh_token) upd.refresh_token = await enc(r.refresh_token);
    if (r.refresh_expires_in) upd.refresh_expires_at = iso(r.refresh_expires_in);
  }
  if (upd) await sb.from("social_tokens").update({ ...upd, updated_at: new Date().toISOString() }).eq("connection_id", row.connection_id);
  return access;
}

/* ---------- read an account ---------- */
type Acct = { external_id: string; handle?: string | null; title?: string | null; avatar?: string | null; url?: string | null;
  followers?: number | null; views?: number | null; posts?: number | null; extra?: Record<string, unknown>; videos?: any[]; tok?: string };

async function readInstagram(t: string): Promise<Acct> {
  const G = `https://graph.instagram.com/${META_V}`;
  const me = await call(`${G}/me?` + new URLSearchParams({ fields: "user_id,username,name,profile_picture_url,followers_count,follows_count,media_count,account_type", access_token: t }), {}, "Instagram profile");
  const media = await safe(() => call(`${G}/me/media?` + new URLSearchParams({ fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count", limit: "40", access_token: t })));
  const vids: any[] = [];
  for (const m of (media?.data || []).slice(0, 40)) {
    const ins = vids.length < 25 ? await safe(() => call(`${G}/${m.id}/insights?` + new URLSearchParams({ metric: "views,reach,saved,shares", access_token: t }))) : null;
    const g = (n: string) => num(ins?.data?.find((x: any) => x.name === n)?.values?.[0]?.value);
    vids.push({ video_id: m.id, title: String(m.caption || "").split("\n")[0].slice(0, 140) || (m.media_product_type === "REELS" ? "Reel" : "Post"),
      thumb: m.thumbnail_url || (m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url : null),
      published_at: m.timestamp, views: g("views"), likes: num(m.like_count), comments: num(m.comments_count), duration_s: null,
      kind: m.media_product_type === "REELS" ? "short" : "post", url: m.permalink, reach: g("reach"), saves: g("saved"), shares: g("shares") });
  }
  const until = Math.floor(Date.now() / 1000), since = until - 28 * 86400;
  const acc = await safe(() => call(`${G}/me/insights?` + new URLSearchParams({ metric: "reach,views,accounts_engaged,total_interactions,profile_links_taps", period: "day", metric_type: "total_value", since: String(since), until: String(until), access_token: t })));
  const tv = (n: string) => num(acc?.data?.find((x: any) => x.name === n)?.total_value?.value);
  return { external_id: String(me.user_id || me.id), handle: me.username ? "@" + me.username : null, title: me.name || me.username, avatar: me.profile_picture_url || null,
    url: me.username ? `https://www.instagram.com/${me.username}/` : null, followers: num(me.followers_count), posts: num(me.media_count),
    views: tv("views"), extra: { period: "28d", reach: tv("reach"), views: tv("views"), engaged: tv("accounts_engaged"), interactions: tv("total_interactions"), link_taps: tv("profile_links_taps"), following: num(me.follows_count), account_type: me.account_type },
    videos: vids };
}

async function listPages(userTok: string) {
  const r = await call(`https://graph.facebook.com/${META_V}/me/accounts?` + new URLSearchParams({ fields: "id,name,access_token,picture{url},followers_count,fan_count,link", limit: "50", access_token: userTok }), {}, "Facebook pages");
  return (r.data || []) as any[];
}
async function readFacebook(pageTok: string, pageId: string): Promise<Acct> {
  const G = `https://graph.facebook.com/${META_V}`;
  const pg = await call(`${G}/${pageId}?` + new URLSearchParams({ fields: "id,name,username,link,picture{url},followers_count,fan_count", access_token: pageTok }), {}, "Facebook page");
  const posts = await safe(() => call(`${G}/${pageId}/posts?` + new URLSearchParams({ fields: "id,message,created_time,full_picture,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)", limit: "25", access_token: pageTok })));
  const vids = (posts?.data || []).map((m: any) => ({ video_id: m.id, title: String(m.message || "Post").split("\n")[0].slice(0, 140), thumb: m.full_picture || null,
    published_at: m.created_time, views: null, likes: num(m.reactions?.summary?.total_count), comments: num(m.comments?.summary?.total_count), duration_s: null,
    kind: "post", url: m.permalink_url, shares: num(m.shares?.count) }));
  const ins = await safe(() => call(`${G}/${pageId}/insights?` + new URLSearchParams({ metric: "page_impressions_unique,page_post_engagements,page_views_total", period: "days_28", access_token: pageTok })));
  const last = (n: string) => { const v = ins?.data?.find((x: any) => x.name === n)?.values; return v?.length ? num(v[v.length - 1].value) : null; };
  return { external_id: pg.id, handle: pg.username ? "@" + pg.username : null, title: pg.name, avatar: pg.picture?.data?.url || null, url: pg.link || `https://www.facebook.com/${pg.id}`,
    followers: num(pg.followers_count ?? pg.fan_count), posts: null, views: null,
    extra: { period: "28d", reach: last("page_impressions_unique"), interactions: last("page_post_engagements"), page_views: last("page_views_total"), likes: num(pg.fan_count) }, videos: vids };
}

async function readYouTube(t: string): Promise<Acct> {
  const Y = "https://www.googleapis.com/youtube/v3";
  const res = await call(`${Y}/channels?` + new URLSearchParams({ part: "snippet,statistics,contentDetails", mine: "true" }), bearer(t), "YouTube channel");
  const c = res.items?.[0];
  if (!c) throw new Up("empty", "This Google account has no YouTube channel yet.");
  const st = c.statistics || {};
  const vids: any[] = [];
  const up = c.contentDetails?.relatedPlaylists?.uploads;
  if (up) {
    const pl = await safe(() => call(`${Y}/playlistItems?` + new URLSearchParams({ part: "contentDetails", playlistId: up, maxResults: "50" }), bearer(t)));
    const ids = (pl?.items || []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
    if (ids.length) {
      const v = await safe(() => call(`${Y}/videos?` + new URLSearchParams({ part: "snippet,statistics,contentDetails", id: ids.join(",") }), bearer(t)));
      for (const i of v?.items || []) {
        const m = String(i.contentDetails?.duration || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const secs = m ? (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0)) : null;
        vids.push({ video_id: i.id, title: i.snippet?.title, thumb: i.snippet?.thumbnails?.medium?.url || i.snippet?.thumbnails?.default?.url,
          published_at: i.snippet?.publishedAt, views: num(i.statistics?.viewCount), likes: num(i.statistics?.likeCount), comments: num(i.statistics?.commentCount), duration_s: secs });
      }
    }
  }
  const end = new Date(), start = new Date(Date.now() - 28 * 864e5);
  const A = "https://youtubeanalytics.googleapis.com/v2/reports?";
  const base = { ids: "channel==MINE", startDate: day(start), endDate: day(end) };
  const tot = await safe(() => call(A + new URLSearchParams({ ...base, metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,shares" }), bearer(t)));
  const row = tot?.rows?.[0] || [];
  const cols = (tot?.columnHeaders || []).map((h: any) => h.name);
  const g = (n: string) => { const i = cols.indexOf(n); return i < 0 ? null : num(row[i]); };
  const rev = await safe(() => call(A + new URLSearchParams({ ...base, metrics: "estimatedRevenue" }), bearer(t)));
  const ctry = await safe(() => call(A + new URLSearchParams({ ...base, dimensions: "country", metrics: "views", sort: "-views", maxResults: "5" }), bearer(t)));
  const demo = await safe(() => call(A + new URLSearchParams({ ...base, dimensions: "ageGroup,gender", metrics: "viewerPercentage" }), bearer(t)));
  return { external_id: c.id, handle: c.snippet?.customUrl || null, title: c.snippet?.title, avatar: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url,
    url: `https://www.youtube.com/channel/${c.id}`, followers: st.hiddenSubscriberCount ? null : num(st.subscriberCount), views: num(st.viewCount), posts: num(st.videoCount),
    extra: { period: "28d", views: g("views"), watch_min: g("estimatedMinutesWatched"), avg_view_s: g("averageViewDuration"), subs_gained: g("subscribersGained"), subs_lost: g("subscribersLost"),
      likes: g("likes"), shares: g("shares"), revenue: rev?.rows?.[0]?.[0] ?? null,
      countries: (ctry?.rows || []).map((r: any) => [r[0], num(r[1])]), demographics: (demo?.rows || []).map((r: any) => [r[0], r[1], num(r[2])]) },
    videos: vids };
}

async function readTikTok(t: string): Promise<Acct> {
  const T = "https://open.tiktokapis.com/v2";
  const u = await call(`${T}/user/info/?fields=open_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count,profile_deep_link`, bearer(t), "TikTok profile");
  const me = u.data?.user || {};
  const vl = await safe(() => call(`${T}/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,duration,view_count,like_count,comment_count,share_count`,
    bearer(t, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ max_count: 20 }) })));
  const vids = (vl?.data?.videos || []).map((v: any) => ({ video_id: v.id, title: (v.title || v.video_description || "TikTok").split("\n")[0].slice(0, 140), thumb: v.cover_image_url,
    published_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null, views: num(v.view_count), likes: num(v.like_count), comments: num(v.comment_count),
    duration_s: num(v.duration), kind: "short", url: v.share_url, shares: num(v.share_count) }));
  return { external_id: me.open_id, handle: me.username ? "@" + me.username : null, title: me.display_name || me.username, avatar: me.avatar_url, url: me.profile_deep_link || (me.username ? `https://www.tiktok.com/@${me.username}` : null),
    followers: num(me.follower_count), posts: num(me.video_count), views: vids.reduce((a: number, v: any) => a + (v.views || 0), 0) || null,
    extra: { likes_total: num(me.likes_count), following: num(me.following_count) }, videos: vids };
}

async function readX(t: string): Promise<Acct> {
  const u = await call("https://api.x.com/2/users/me?user.fields=public_metrics,profile_image_url,username,name", bearer(t), "X profile");
  const d = u.data || {}, pm = d.public_metrics || {};
  return { external_id: d.id, handle: d.username ? "@" + d.username : null, title: d.name, avatar: d.profile_image_url, url: d.username ? `https://x.com/${d.username}` : null,
    followers: num(pm.followers_count), posts: num(pm.tweet_count), views: null, extra: { following: num(pm.following_count), listed: num(pm.listed_count), likes_given: num(pm.like_count) }, videos: [] };
}

async function read(p: Prov, access: string, meta: any): Promise<Acct> {
  if (p === "instagram") return readInstagram(access);
  if (p === "facebook") return readFacebook(access, meta.page_id);
  if (p === "youtube") return readYouTube(access);
  if (p === "tiktok") return readTikTok(access);
  return readX(access);
}

/* ---------- write what we read ---------- */
async function save(sb: any, uid: string, p: Prov, a: Acct, connId?: string) {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = { user_id: uid, platform: p, external_id: a.external_id, handle: a.handle, title: a.title, avatar_url: a.avatar, url: a.url,
    source: "api", auth: "oauth", kind: "own", status: "ok", last_error: null, last_synced: now };
  let id = connId;
  if (id) await sb.from("connections").update(row).eq("id", id);
  else {
    const { data, error } = await sb.from("connections").upsert(row, { onConflict: "user_id,platform,external_id" }).select("id").single();
    if (error) throw new Up("db", error.message);
    id = data.id;
  }
  const extra = Object.fromEntries(Object.entries(a.extra || {}).filter(([, v]) => v !== null && v !== undefined));
  await sb.from("snapshots").insert({ connection_id: id, user_id: uid, followers: a.followers ?? null, views: a.views ?? null, posts: a.posts ?? null, extra });
  const vids = (a.videos || []).filter((v) => v.video_id).map((v) => ({ connection_id: id, user_id: uid, video_id: String(v.video_id), title: v.title || null, thumb: v.thumb || null,
    published_at: v.published_at || null, views: v.views ?? null, likes: v.likes ?? null, comments: v.comments ?? null, duration_s: v.duration_s ?? null, updated_at: now }));
  if (vids.length) await sb.from("videos").upsert(vids, { onConflict: "connection_id,video_id" });
  return id!;
}

async function syncRow(sb: any, row: any) {
  const p = row.provider as Prov;
  try {
    const access = await fresh(sb, row);
    const a = await read(p, access, row.meta || {});
    await save(sb, row.user_id, p, a, row.connection_id);
    return { ok: true };
  } catch (e: any) {
    const msg = e?.code === "auth" ? "The sign-in has ended or was removed. Connect again." : String(e?.message || "Sync failed").slice(0, 200);
    await sb.from("connections").update({ status: "error", last_error: msg }).eq("id", row.connection_id);
    return { ok: false, error: msg };
  }
}

async function userOf(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return null;
  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: auth } } });
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}
const back = (q: Record<string, string>) => new Response(null, { status: 302, headers: { Location: `${APP_URL}/?${new URLSearchParams(q)}` } });

/* ---------- routes ---------- */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/social/, "") || "/";
  const sb = admin();
  try {
    if (path === "/status") return json({ ok: true, ready: Object.fromEntries(PROVS.map((p) => [p, ready(p)])), redirect: Object.fromEntries(PROVS.map((p) => [p, redirect(p)])) });

    if (path === "/start" && req.method === "POST") {
      const u = await userOf(req); if (!u) return json({ error: "unauthorized" }, 401);
      const body = await req.json().catch(() => ({}));
      const p = body.provider as Prov;
      if (!PROVS.includes(p)) return json({ error: "bad_provider" }, 400);
      if (!ready(p)) return json({ error: "not_configured", message: "This platform has not been set up yet." }, 503);
      const state = rand(24), verifier = p === "x" ? rand(48) : null;
      await sb.from("oauth_states").delete().lt("created_at", new Date(Date.now() - 3600e3).toISOString());
      const { error } = await sb.from("oauth_states").insert({ state, user_id: u.id, provider: p, verifier });
      if (error) return json({ error: "db", message: error.message }, 500);
      return json({ ok: true, url: await authUrl(p, state, verifier) });
    }

    const cb = path.match(/^\/cb\/(instagram|facebook|youtube|tiktok|x)$/);
    if (cb && req.method === "GET") {
      const p = cb[1] as Prov;
      const state = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "";
      const denied = url.searchParams.get("error") || url.searchParams.get("error_reason");
      const { data: st } = await sb.from("oauth_states").select("*").eq("state", state).maybeSingle();
      if (st) await sb.from("oauth_states").delete().eq("state", state);
      if (!st || st.provider !== p || Date.now() - new Date(st.created_at).getTime() > 15 * 60e3) return back({ connect_error: p, reason: "expired" });
      if (denied || !code) return back({ connect_error: p, reason: denied === "access_denied" || denied === "user_denied" ? "cancelled" : "denied" });
      const tok = await exchange(p, code.replace(/#_$/, ""), st.verifier);
      const store = async (connId: string, access: string, meta: any) => {
        await sb.from("social_tokens").upsert({ connection_id: connId, user_id: st.user_id, provider: p, access_token: await enc(access), refresh_token: await enc(tok.refresh || null),
          expires_at: p === "facebook" ? null : tok.exp || null, refresh_expires_at: tok.rexp || null, scopes: tok.scopes || null, meta, updated_at: new Date().toISOString() });
      };
      let n = 0, name = "";
      if (p === "facebook") {
        const pages = await listPages(tok.access);
        if (!pages.length) return back({ connect_error: p, reason: "no_pages" });
        for (const pg of pages) {
          const a = await readFacebook(pg.access_token, pg.id);
          const id = await save(sb, st.user_id, p, a);
          await store(id, pg.access_token, { page_id: pg.id });
          n++; name = name || a.title || "";
        }
      } else {
        const a = await read(p, tok.access, tok.meta || {});
        const id = await save(sb, st.user_id, p, a);
        await store(id, tok.access, tok.meta || {});
        n = 1; name = a.handle || a.title || "";
      }
      return back({ connected: p, n: String(n), name });
    }

    if (path === "/sync" && req.method === "POST") {
      const u = await userOf(req); if (!u) return json({ error: "unauthorized" }, 401);
      const body = await req.json().catch(() => ({}));
      let q = sb.from("social_tokens").select("*").eq("user_id", u.id);
      if (body.connection_id) q = q.eq("connection_id", body.connection_id);
      const { data: rows } = await q;
      const { data: conns } = await sb.from("connections").select("id,last_synced").eq("user_id", u.id).eq("auth", "oauth");
      const last = Object.fromEntries((conns || []).map((c: any) => [c.id, c.last_synced]));
      let done = 0, skipped = 0; const errors: string[] = [];
      for (const r of rows || []) {
        if (!body.force && last[r.connection_id] && Date.now() - new Date(last[r.connection_id]).getTime() < 5 * 60e3) { skipped++; continue; }
        if (!ready(r.provider)) { skipped++; continue; }
        const o = await syncRow(sb, r); if (o.ok) done++; else errors.push(o.error!);
      }
      return json({ ok: true, refreshed: done, skipped, errors });
    }

    if (path === "/disconnect" && req.method === "POST") {
      const u = await userOf(req); if (!u) return json({ error: "unauthorized" }, 401);
      const body = await req.json().catch(() => ({}));
      if (!body.connection_id) return json({ error: "bad_input" }, 400);
      await sb.from("social_tokens").delete().eq("connection_id", body.connection_id).eq("user_id", u.id);
      if (body.keep) await sb.from("connections").update({ auth: null, source: "manual" }).eq("id", body.connection_id).eq("user_id", u.id);
      else {
        await sb.from("videos").delete().eq("connection_id", body.connection_id).eq("user_id", u.id);
        await sb.from("snapshots").delete().eq("connection_id", body.connection_id).eq("user_id", u.id);
        await sb.from("connections").delete().eq("id", body.connection_id).eq("user_id", u.id);
      }
      return json({ ok: true });
    }

    if (path === "/cron" && req.method === "POST") {
      const given = req.headers.get("x-cron-secret") || "";
      const { data: okSecret } = await sb.rpc("check_cron_secret", { p: given });
      if (!given || okSecret !== true) return json({ error: "unauthorized" }, 401);
      const since = new Date(Date.now() - 20 * 3600e3).toISOString();
      const { data: due } = await sb.from("connections").select("id").eq("auth", "oauth").or(`last_synced.is.null,last_synced.lt.${since}`).limit(300);
      const ids = (due || []).map((c: any) => c.id);
      let done = 0, failed = 0;
      if (ids.length) {
        const { data: rows } = await sb.from("social_tokens").select("*").in("connection_id", ids);
        for (const r of rows || []) { if (!ready(r.provider)) continue; const o = await syncRow(sb, r); if (o.ok) done++; else failed++; }
      }
      return json({ ok: true, refreshed: done, failed });
    }
    return json({ error: "not_found" }, 404);
  } catch (e: any) {
    const m = String(e?.message || "Something went wrong").slice(0, 200);
    const cbm = path.match(/^\/cb\/(\w+)/);
    if (cbm) return back({ connect_error: cbm[1], reason: "failed", msg: m });
    return json({ error: e?.code || "failed", message: m }, e?.code === "auth" ? 401 : 502);
  }
});
