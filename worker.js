const SB="https://ohkecamneutxggqwhend.supabase.co/storage/v1/object/public/assets/";
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob: https://i.ytimg.com https://*.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://*.googleusercontent.com https://*.supabase.co; media-src 'self' blob: data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
function secure(r){const h=new Headers(r.headers);
  h.set("X-Content-Type-Options","nosniff");h.set("Referrer-Policy","strict-origin-when-cross-origin");h.set("X-Frame-Options","DENY");
  h.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");h.set("Content-Security-Policy",CSP);
  return new Response(r.body,{status:r.status,headers:h});}
export default{async fetch(req,env){
  const u=new URL(req.url);
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
