// tiny in-memory stand-in for the supabase-js query builder (only what the function uses)
export const DB: Record<string, any[]> = { connections: [], snapshots: [], videos: [], social_tokens: [], oauth_states: [] };
let seq = 0;
const PK: Record<string, string[]> = { social_tokens: ["connection_id"], oauth_states: ["state"], videos: ["connection_id", "video_id"] };
class Q {
  t: string; f: ((r: any) => boolean)[] = []; op = "select"; payload: any = null; opts: any = {}; _s = 0; lim = 1e9;
  constructor(t: string) { this.t = t; }
  select(_c?: string) { if (this.op === "select") this.op = "select"; this.wantRows = true; return this; }
  wantRows = false;
  eq(k: string, v: any) { this.f.push((r) => r[k] === v); return this; }
  lt(k: string, v: any) { this.f.push((r) => r[k] < v); return this; }
  in(k: string, v: any[]) { this.f.push((r) => v.includes(r[k])); return this; }
  or(_s: string) { return this; }
  limit(n: number) { this.lim = n; return this; }
  insert(p: any) { this.op = "insert"; this.payload = p; return this; }
  upsert(p: any, o: any = {}) { this.op = "upsert"; this.payload = p; this.opts = o; return this; }
  update(p: any) { this.op = "update"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  maybeSingle() { this._s = 1; return this; }
  singleRow() { return this; }
  then(res: any, rej: any) { return Promise.resolve(this.run()).then(res, rej); }
  run() {
    const T = DB[this.t]; const m = (r: any) => this.f.every((f) => f(r));
    if (this.op === "select") { const rows = T.filter(m).slice(0, this.lim); return { data: this._s ? rows[0] || null : rows, error: null }; }
    if (this.op === "delete") { DB[this.t] = T.filter((r) => !m(r)); return { data: null, error: null }; }
    if (this.op === "update") { T.filter(m).forEach((r) => Object.assign(r, this.payload)); return { data: null, error: null }; }
    const arr = Array.isArray(this.payload) ? this.payload : [this.payload]; const out: any[] = [];
    for (const p0 of arr) {
      const p = { ...p0 };
      const keys = this.op === "upsert" ? (this.opts.onConflict ? this.opts.onConflict.split(",") : PK[this.t] || ["id"]) : null;
      const ex = keys ? T.find((r) => keys.every((k: string) => r[k] === p[k])) : null;
      if (ex) { Object.assign(ex, p); out.push(ex); }
      else { if (this.t === "connections" && !p.id) p.id = "c" + (++seq); if (!p.created_at) p.created_at = new Date().toISOString(); T.push(p); out.push(p); }
    }
    return { data: this._s === 2 ? out[0] : out, error: null };
  }
}
(Q.prototype as any).single = function () { this._s = 2; return this; };
export const USER = { id: "u1" };
export function createClient(_u: string, _k: string, o: any = {}) {
  return {
    from: (t: string) => new Q(t),
    rpc: async (_n: string, a: any) => ({ data: a.p === "s3cret" }),
    auth: { getUser: async () => ({ data: { user: o?.global?.headers?.Authorization === "Bearer good" ? USER : null } }) },
  };
}
