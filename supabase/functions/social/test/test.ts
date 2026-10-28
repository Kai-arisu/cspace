const E: Record<string, string> = { SUPABASE_URL: "https://proj.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "svc",
  IG_APP_ID: "igid", IG_APP_SECRET: "igsec", META_APP_ID: "fbid", META_APP_SECRET: "fbsec", GOOGLE_CLIENT_ID: "gid", GOOGLE_CLIENT_SECRET: "gsec",
  TIKTOK_CLIENT_KEY: "tk", TIKTOK_CLIENT_SECRET: "tsec", X_CLIENT_ID: "xid", X_CLIENT_SECRET: "xsec" };
for (const k in E) Deno.env.set(k, E[k]);
const { DB } = await import("./fakesb.ts");
const calls: string[] = [];
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
let igRefreshed = 0, gRefreshed = 0, xBody = "";
globalThis.fetch = (async (input: any, init: any = {}) => {
  const u = String(input); calls.push(u.split("?")[0]);
  const auth = init.headers?.Authorization || "";
  // Instagram
  if (u.startsWith("https://api.instagram.com/oauth/access_token")) return J({ access_token: "ig-short", user_id: 178, permissions: ["instagram_business_basic", "instagram_business_manage_insights"] });
  if (u.includes("graph.instagram.com/access_token")) return J({ access_token: "ig-long", expires_in: 5184000 });
  if (u.includes("graph.instagram.com/refresh_access_token")) { igRefreshed++; return J({ access_token: "ig-long2", expires_in: 5184000 }); }
  if (u.includes("graph.instagram.com/v23.0/me?")) { if (!/access_token=ig-long/.test(u)) return J({ error: { message: "bad token", type: "OAuthException", code: 190 } }, 400); return J({ user_id: "178", username: "cashtea", name: "Cash Tea", profile_picture_url: "https://x/p.jpg", followers_count: 1234, follows_count: 50, media_count: 12, account_type: "MEDIA_CREATOR" }); }
  if (u.includes("graph.instagram.com/v23.0/me/media")) return J({ data: [{ id: "m1", caption: "Bhopal chai reel\nmore", media_type: "VIDEO", media_product_type: "REELS", permalink: "https://ig/p/1", thumbnail_url: "https://t/1.jpg", timestamp: "2026-10-20T10:00:00+0000", like_count: 90, comments_count: 4 }] });
  if (u.includes("graph.instagram.com/v23.0/m1/insights")) return J({ data: [{ name: "views", values: [{ value: 5000 }] }, { name: "reach", values: [{ value: 3000 }] }] });
  if (u.includes("graph.instagram.com/v23.0/me/insights")) return J({ data: [{ name: "reach", total_value: { value: 8000 } }, { name: "views", total_value: { value: 20000 } }] });
  // Facebook
  if (u.includes("graph.facebook.com/v23.0/oauth/access_token")) return J({ access_token: u.includes("fb_exchange_token") ? "fb-long" : "fb-short", expires_in: 5000000 });
  if (u.includes("/me/accounts")) return J({ data: [{ id: "p1", name: "Cash Tea Page", access_token: "page-tok" }] });
  if (u.includes("graph.facebook.com/v23.0/p1?")) return J({ id: "p1", name: "Cash Tea Page", followers_count: 321, fan_count: 300, picture: { data: { url: "https://pic" } } });
  if (u.includes("/p1/posts")) return J({ data: [{ id: "p1_9", message: "Hello", created_time: "2026-10-21T00:00:00+0000", reactions: { summary: { total_count: 7 } }, comments: { summary: { total_count: 2 } } }] });
  if (u.includes("/p1/insights")) return J({ data: [{ name: "page_impressions_unique", values: [{ value: 10 }, { value: 900 }] }] });
  // Google
  if (u.startsWith("https://oauth2.googleapis.com/token")) { const b = String(init.body); if (b.includes("refresh_token")) { gRefreshed++; return J({ access_token: "g-acc2", expires_in: 3600 }); } return J({ access_token: "g-acc", refresh_token: "g-ref", expires_in: 3600, scope: "yt" }); }
  if (u.includes("youtube/v3/channels")) { if (!/Bearer g-acc/.test(auth)) return J({ error: { code: 401, message: "bad" } }, 401); return J({ items: [{ id: "UCxyz", snippet: { title: "Cash Tea", customUrl: "@cashtea", thumbnails: { default: { url: "https://yt" } } }, statistics: { subscriberCount: "9110", viewCount: "500000", videoCount: "24" }, contentDetails: { relatedPlaylists: { uploads: "UUxyz" } } }] }); }
  if (u.includes("youtube/v3/playlistItems")) return J({ items: [{ contentDetails: { videoId: "v1" } }] });
  if (u.includes("youtube/v3/videos")) return J({ items: [{ id: "v1", snippet: { title: "Ladakh", publishedAt: "2026-10-01T00:00:00Z", thumbnails: {} }, statistics: { viewCount: "10", likeCount: "2", commentCount: "1" }, contentDetails: { duration: "PT1M5S" } }] });
  if (u.includes("youtubeanalytics")) { if (u.includes("country")) return J({ rows: [["IN", 900], ["US", 20]] }); if (u.includes("ageGroup")) return J({ rows: [["age18-24", "male", 40]] }); if (u.includes("estimatedRevenue")) return J({ error: { code: 403, message: "forbidden" } }, 403); return J({ columnHeaders: [{ name: "views" }, { name: "estimatedMinutesWatched" }], rows: [[1200, 3400]] }); }
  // TikTok
  if (u.includes("open.tiktokapis.com/v2/oauth/token")) return J({ access_token: "tt-acc", refresh_token: "tt-ref", expires_in: 86400, refresh_expires_in: 31536000, open_id: "oid1", scope: "user.info.basic" });
  if (u.includes("open.tiktokapis.com/v2/user/info")) return J({ data: { user: { open_id: "oid1", username: "cashtea", display_name: "Cash Tea", follower_count: 777, likes_count: 9000, video_count: 30 } }, error: { code: "ok", message: "" } });
  if (u.includes("open.tiktokapis.com/v2/video/list")) return J({ data: { videos: [{ id: "tv1", title: "Chai", create_time: 1792000000, view_count: 4000, like_count: 300, comment_count: 5, duration: 15 }] }, error: { code: "ok" } });
  // X
  if (u.startsWith("https://api.x.com/2/oauth2/token")) { xBody = String(init.body); if (!/^Basic /.test(auth)) return J({ error: "unauthorized_client" }, 401); return J({ access_token: "x-acc", refresh_token: "x-ref", expires_in: 7200, scope: "users.read" }); }
  if (u.startsWith("https://api.x.com/2/users/me")) return J({ data: { id: "x1", username: "cashtea", name: "Cash Tea", public_metrics: { followers_count: 55, tweet_count: 10, following_count: 3 } } });
  return J({ error: { message: "unexpected " + u } }, 500);
}) as any;
const { handler } = await import("./fn.ts");
const req = (path: string, init: any = {}) => handler(new Request("https://proj.supabase.co/functions/v1/social" + path, init));
let fails = 0; const ok = (c: any, m: string) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const post = (p: string, body: any, tok = "good", extra: any = {}) => req(p, { method: "POST", headers: { Authorization: "Bearer " + tok, "content-type": "application/json", ...extra }, body: JSON.stringify(body) });

const st = await (await req("/status")).json();
ok(Object.values(st.ready).every(Boolean) && st.redirect.instagram === "https://proj.supabase.co/functions/v1/social/cb/instagram", "status reports all five ready with callback URLs");
ok((await post("/start", { provider: "instagram" }, "bad")).status === 401, "start refuses without login");

async function flow(p: string) {
  const s = await (await post("/start", { provider: p })).json();
  const u = new URL(s.url); const state = u.searchParams.get("state")!;
  ok(!!state && u.searchParams.get("redirect_uri") === `https://proj.supabase.co/functions/v1/social/cb/${p}`, p + ": sign-in URL carries state and redirect");
  if (p === "x") ok(u.searchParams.get("code_challenge_method") === "S256", "x: PKCE challenge sent");
  const r = await req(`/cb/${p}?code=abc&state=${state}${p === "instagram" ? "#_" : ""}`);
  const loc = new URL(r.headers.get("location")!);
  ok(r.status === 302 && loc.origin === "https://cspace.cashteaates009.workers.dev" && loc.searchParams.get("connected") === p, p + ": callback returns to the app as connected (" + loc.search + ")");
  const replay = await req(`/cb/${p}?code=abc&state=${state}`);
  ok(new URL(replay.headers.get("location")!).searchParams.get("connect_error") === p, p + ": a used state cannot be replayed");
}
for (const p of ["instagram", "facebook", "youtube", "tiktok", "x"]) await flow(p);

const C = (p: string) => DB.connections.find((c) => c.platform === p);
ok(C("instagram")?.handle === "@cashtea" && C("instagram")?.auth === "oauth" && C("instagram")?.user_id === "u1", "instagram connection saved for the user");
const snapIG = DB.snapshots.find((s) => s.connection_id === C("instagram").id);
ok(snapIG?.followers === 1234 && snapIG?.extra?.reach === 8000 && snapIG?.views === 20000, "instagram followers + 28-day reach/views saved");
const vIG = DB.videos.find((v) => v.video_id === "m1");
ok(vIG?.views === 5000 && vIG?.title === "Bhopal chai reel" && vIG?.likes === 90, "instagram reel with views from insights");
ok(C("facebook")?.title === "Cash Tea Page" && DB.snapshots.find((s) => s.connection_id === C("facebook").id)?.extra?.reach === 900, "facebook page + reach saved");
const ysn = DB.snapshots.find((s) => s.connection_id === C("youtube").id);
ok(ysn?.followers === 9110 && ysn?.extra?.watch_min === 3400 && ysn?.extra?.countries?.[0]?.[0] === "IN" && !("revenue" in ysn.extra), "youtube: subs, watch time, countries; revenue skipped when not allowed");
ok(DB.videos.find((v) => v.video_id === "v1")?.duration_s === 65, "youtube video duration parsed");
ok(DB.snapshots.find((s) => s.connection_id === C("tiktok").id)?.followers === 777 && DB.videos.find((v) => v.video_id === "tv1")?.views === 4000, "tiktok followers + videos");
ok(DB.snapshots.find((s) => s.connection_id === C("x").id)?.followers === 55 && /code_verifier=/.test(xBody), "x followers; verifier sent on exchange");
ok(DB.social_tokens.length === 5 && DB.social_tokens.every((t) => /^v1\./.test(t.access_token) && !/ig-long|g-acc|tt-acc|x-acc|page-tok/.test(JSON.stringify(t))), "all five tokens stored encrypted, no plain token anywhere");
ok(DB.oauth_states.length === 0, "states cleaned up");

// sync with tokens about to expire -> refresh happens
const ig = DB.social_tokens.find((t) => t.provider === "instagram"); ig.expires_at = new Date(Date.now() + 864e5).toISOString();
const yt = DB.social_tokens.find((t) => t.provider === "youtube"); yt.expires_at = new Date(Date.now() - 1000).toISOString();
const before = DB.snapshots.length;
const sy = await (await post("/sync", { force: true })).json();
ok(sy.refreshed === 5 && sy.errors.length === 0, "manual sync refreshes all five (" + JSON.stringify(sy) + ")");
ok(igRefreshed === 1 && gRefreshed === 1, "instagram long token and google access token renewed before use");
ok(DB.snapshots.length === before + 5, "one new snapshot per account");
const sk = await (await post("/sync", {})).json();
ok(sk.skipped === 5, "second sync within 5 minutes is skipped");

// a revoked token marks the connection, does not crash
const ig2 = DB.social_tokens.find((t) => t.provider === "instagram");
const { } = ig2; ig2.access_token = DB.social_tokens.find((t) => t.provider === "x").access_token; // wrong token for IG
const sy2 = await (await post("/sync", { force: true, connection_id: C("instagram").id })).json();
ok(sy2.errors.length === 1 && C("instagram").status === "error" && /Connect again/.test(C("instagram").last_error), "revoked token -> clear 'connect again' error on the card");

// cron needs the secret
ok((await req("/cron", { method: "POST", headers: { "x-cron-secret": "nope" } })).status === 401, "cron refuses a wrong secret");
DB.connections.forEach((c) => c.last_synced = new Date(Date.now() - 864e5).toISOString());
const cr = await (await req("/cron", { method: "POST", headers: { "x-cron-secret": "s3cret" } })).json();
ok(cr.refreshed === 4 && cr.failed === 1, "cron refreshes due connections (" + JSON.stringify(cr) + ")");

// disconnect
const tid = C("tiktok").id;
await post("/disconnect", { connection_id: tid });
ok(!DB.connections.find((c) => c.id === tid) && !DB.social_tokens.find((t) => t.connection_id === tid) && !DB.videos.find((v) => v.connection_id === tid), "disconnect removes token, channel and its videos");
const xid = C("x").id;
await post("/disconnect", { connection_id: xid, keep: true });
ok(C("x")?.auth === null && C("x")?.source === "manual" && !DB.social_tokens.find((t) => t.connection_id === xid), "disconnect with keep turns it back into a typed-numbers channel");

// cancelled sign-in
const s2 = await (await post("/start", { provider: "tiktok" })).json(); const st2 = new URL(s2.url).searchParams.get("state");
const cx = await req(`/cb/tiktok?error=access_denied&state=${st2}`);
ok(new URL(cx.headers.get("location")!).searchParams.get("reason") === "cancelled", "cancelling on the platform comes back as 'cancelled'");
console.log(fails ? "FAILURES: " + fails : "ALL PASSED");
