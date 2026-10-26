const SB="https://ohkecamneutxggqwhend.supabase.co/storage/v1/object/public/assets/";
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://i.ytimg.com https://*.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://*.googleusercontent.com https://*.supabase.co; media-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
function secure(r){const h=new Headers(r.headers);
  h.set("X-Content-Type-Options","nosniff");h.set("Referrer-Policy","strict-origin-when-cross-origin");h.set("X-Frame-Options","DENY");
  h.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");h.set("Content-Security-Policy",CSP);
  return new Response(r.body,{status:r.status,headers:h});}
const SBU="https://ohkecamneutxggqwhend.supabase.co";
const ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa2VjYW1uZXV0eGdncXdoZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMDE1ODcsImV4cCI6MjEwODU3NzU4N30.BTM-O9dy9MTA1Z2I3YjNGj9bmhPJ2PlfuVD0tL7CFxw";
const esc=t=>String(t||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
const fold=l=>{const o=[];while(l.length>73){o.push(l.slice(0,73));l=" "+l.slice(73)}o.push(l);return o.join("\r\n")};
const dnum=d=>String(d).replace(/-/g,"");
const nextDay=d=>{const x=new Date(d+"T00:00:00Z");x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10).replace(/-/g,"")};
function ics(f){
  const sp={};(f.spaces||[]).forEach(x=>sp[x.id]=x.name);
  const multi=(f.spaces||[]).length>1,now=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Creator Space//Calendar//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Creator Space","REFRESH-INTERVAL;VALUE=DURATION:PT1H","X-PUBLISHED-TTL:PT1H"];
  const ev=(uid,title,date,desc)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date||""))return;L.push("BEGIN:VEVENT","UID:"+uid+"@cspace","DTSTAMP:"+now,"DTSTART;VALUE=DATE:"+dnum(date),"DTEND;VALUE=DATE:"+nextDay(date),fold("SUMMARY:"+esc(title||"Untitled")),fold("DESCRIPTION:"+esc(desc)),"TRANSP:TRANSPARENT","END:VEVENT")};
  (f.posts||[]).forEach(p=>ev("post-"+p.id,"Post: "+p.title,p.date,[p.platform?"Platform: "+p.platform:"",p.status?"Status: "+p.status:"",multi&&sp[p.sp]?"Space: "+sp[p.sp]:""].filter(Boolean).join("\n")));
  (f.tasks||[]).forEach(t=>ev("task-"+t.id,"Due: "+t.title,t.due,multi&&sp[t.sp]?"Space: "+sp[t.sp]:""));
  L.push("END:VCALENDAR");return L.join("\r\n")+"\r\n";
}
export default{async fetch(req,env){
  const u=new URL(req.url);
  const cm=u.pathname.match(/^\/cal\/([0-9a-f-]{36})\.ics$/i);
  if(cm){
    const r=await fetch(SBU+"/rest/v1/rpc/cal_feed",{method:"POST",headers:{apikey:ANON,Authorization:"Bearer "+ANON,"content-type":"application/json"},body:JSON.stringify({p_token:cm[1]})});
    const f=r.ok?await r.json():null;
    if(!f)return new Response("Calendar link not found. Make a new one in Creator Space.",{status:404,headers:{"content-type":"text/plain"}});
    return new Response(ics(f),{headers:{"content-type":"text/calendar; charset=utf-8","cache-control":"private, max-age=300","content-disposition":'inline; filename="creator-space.ics"',"x-content-type-options":"nosniff"}});
  }
  if(u.pathname.startsWith("/_blob/")){
    const r=await fetch(SB+u.pathname.slice(7));
    const h=new Headers(r.headers);h.set("Cache-Control","public, max-age=3600");h.set("X-Content-Type-Options","nosniff");
    return new Response(r.body,{status:r.status,headers:h});
  }
  if(u.pathname.startsWith("/u/")){
    const r=await env.ASSETS.fetch(new Request(new URL("/index.html",u),req));
    const h=new Headers(r.headers);h.set("Cache-Control","no-cache");
    return secure(new Response(r.body,{status:r.status,headers:h}));
  }
  return env.ASSETS.fetch(req);
}};
