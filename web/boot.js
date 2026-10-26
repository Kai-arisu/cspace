/* Creator Space website: sign-in, public creator page, Supabase-backed storage */
(function(){
var SUPA_URL="https://ohkecamneutxggqwhend.supabase.co";
var SUPA_KEY="sb_publishable_k97xm0wmC6_1gMe5H8kLqw_3W5X3sgr";
var root=document.documentElement;
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmt(n){if(n==null)return "Hidden";n=Number(n);if(!isFinite(n))return "-";return new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:n<10000?1:0}).format(n)}

if(!window.supabase||!window.supabase.createClient){
  root.className="";document.body.innerHTML='<p style="padding:32px;font:16px system-ui">Could not load the sign-in library. Check your connection and reload.</p>';
  return;
}
var SB=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.__SB=SB;
window.__SUPA={url:SUPA_URL};

/* ---------- storage layer that the app's sync engine talks to ---------- */
function mapErr(e){
  var code="unavailable",msg=(e&&e.message)||"Request failed";
  if(e&&(e.code==="42501"||e.code==="PGRST301"))code="invalid_argument";
  if(e&&e.code==="23505")code="invalid_argument";
  if(e&&/quota|storage limit|exceeded the maximum/i.test(msg))code="quota_exceeded";
  return {code:code,message:msg};
}
function makeDb(uid){
  function snap(d){return {exists:d!==undefined,data:function(){return d},metadata:{hasPendingWrites:false}}}
  function doc(path){
    var ref={
      path:path,
      get:async function(){
        var r=await SB.from("docs").select("data").eq("path",path).maybeSingle();
        if(r.error)throw mapErr(r.error);
        return snap(r.data?r.data.data:undefined);
      },
      set:async function(d){
        var r=await SB.from("docs").upsert({user_id:uid,path:path,data:d,updated_at:new Date().toISOString()},{onConflict:"user_id,path"});
        if(r.error)throw mapErr(r.error);
      },
      delete:async function(){
        var r=await SB.from("docs").delete().eq("path",path);
        if(r.error)throw mapErr(r.error);
      },
      acquire:async function(o){
        var r=await SB.rpc("acquire_lease",{p_path:path,p_holder:o.holder,p_ttl_ms:o.ttlMs||30000});
        if(r.error)throw mapErr(r.error);
        return {acquired:!!r.data};
      },
      onSnapshot:function(next,err){
        var dead=false,last=null,busy=false,ch=null,timer=null;
        async function pull(){
          if(dead||busy)return;busy=true;
          try{
            var s=await ref.get(),j=JSON.stringify(s.data());
            if(j!==last){last=j;if(!dead)next(s)}
          }catch(e){if(err&&!dead)err(e)}
          busy=false;
        }
        pull();
        timer=setInterval(function(){if(document.visibilityState!=="hidden")pull()},12000);
        try{
          ch=SB.channel("docs-"+path+"-"+Math.random().toString(36).slice(2,7)).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"user_id=eq."+uid},function(p){
            var row=(p.new&&p.new.path)?p.new:(p.old||{});if(row.path===path)pull();
          }).subscribe();
        }catch(e){}
        return function(){dead=true;clearInterval(timer);if(ch)try{SB.removeChannel(ch)}catch(e){}};
      }
    };
    return ref;
  }
  function collection(path){
    var q={};
    var o={
      where:function(f,op,v){q.where=[f,op,v];return o},
      orderBy:function(f,d){q.order=f;q.dir=d;return o},
      limit:function(n){q.limit=n;return o},
      get:async function(){
        var r=await SB.from("docs").select("path,data").like("path",path+"/%").limit(500);
        if(r.error)throw mapErr(r.error);
        var a=(r.data||[]).map(function(x){return x.data}).filter(function(d){return d&&typeof d==="object"});
        if(q.where)a=a.filter(function(d){return d[q.where[0]]===q.where[2]});
        if(q.order)a.sort(function(x,y){return q.dir==="desc"?(y[q.order]||0)-(x[q.order]||0):(x[q.order]||0)-(y[q.order]||0)});
        if(q.limit)a=a.slice(0,q.limit);
        var docs=a.map(function(d){return {data:function(){return d}}});
        return {docs:docs,size:docs.length,empty:!docs.length,forEach:function(f){docs.forEach(f)}};
      }
    };
    return o;
  }
  return {doc:doc,collection:collection};
}
function makeAssets(uid){
  function rid(){var a=new Uint8Array(12);crypto.getRandomValues(a);return Array.prototype.map.call(a,function(b){return b.toString(16).padStart(2,"0")}).join("")}
  return {
    upload:async function(blob){
      if(blob.size>20*1048576)throw {code:"too_large"};
      var id=uid+"/"+rid();
      var r=await SB.storage.from("assets").upload(id,blob,{contentType:blob.type||"application/octet-stream",upsert:false});
      if(r.error){var m=r.error.message||"";throw {code:/exceed|size/i.test(m)?"too_large":(/mime|type/i.test(m)?"unsupported_type":"upload_failed"),message:m}}
      return {id:id,url:"/_blob/"+id,sizeBytes:blob.size,contentType:blob.type||"application/octet-stream"};
    },
    delete:async function(id){await SB.storage.from("assets").remove([id])},
    list:async function(){return {assets:[],usage:{}}}
  };
}
function makeUser(uid){
  return {isOwner:async function(){return true},canEdit:async function(){return true},can:async function(){return true},
    id:async function(){return uid},me:async function(){return {id:uid,name:"",email:window.__EMAIL}}};
}

/* ---------- sign-in screen ---------- */
var mode="in";
var LOGO='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M17.2 8.4a6 6 0 1 0 0 7.2"/></svg>';
function gateHTML(){
  return '<div class="ag-card"><div class="ag-brand"><span class="logo">'+LOGO+'</span><b>Creator Space</b></div>'+
    '<h1 id="agtitle"></h1><p id="agsub" class="ag-sub"></p>'+
    '<div class="ag-tabs" id="agtabs"><button type="button" data-ag="in">Sign in</button><button type="button" data-ag="up">Create account</button></div>'+
    '<form id="agform" novalidate>'+
    '<label>Email<input id="agemail" type="email" autocomplete="email" inputmode="email" required></label>'+
    '<label id="agpwrap">Password<input id="agpass" type="password" minlength="8" required></label>'+
    '<p class="ag-msg" id="agmsg" role="alert"></p>'+
    '<button class="btn pri ag-go" id="aggo" type="submit"></button></form>'+
    '<div class="ag-foot"><button type="button" class="ag-link" id="agforgot">Forgot your password?</button></div></div>';
}
function setMode(m){
  mode=m;
  var t={in:["Welcome back","Sign in to open your workspace.","Sign in"],up:["Create your account","Your notes, boards and channel numbers, saved to your own account.","Create account"],
    forgot:["Reset your password","We will email you a link to set a new one.","Send reset link"],reset:["Choose a new password","Use at least 8 characters.","Save password"]}[m];
  $("agtitle").textContent=t[0];$("agsub").textContent=t[1];$("aggo").textContent=t[2];
  var tabs=$("agtabs");tabs.hidden=(m==="forgot"||m==="reset");
  Array.prototype.forEach.call(tabs.querySelectorAll("button"),function(b){b.setAttribute("aria-pressed",String(b.dataset.ag===m))});
  $("agpwrap").hidden=(m==="forgot");$("agemail").closest("label").hidden=(m==="reset");
  $("agpass").autocomplete=(m==="in"?"current-password":"new-password");
  $("agforgot").hidden=(m!=="in");
  $("agmsg").textContent="";$("agmsg").className="ag-msg";
}
function msg(t,ok){var e=$("agmsg");e.textContent=t;e.className="ag-msg"+(ok?" ok":"")}
function friendly(e){
  var m=(e&&e.message)||"";
  if(/invalid login/i.test(m))return "That email and password don't match.";
  if(/not confirmed/i.test(m))return "Confirm your email first. Check your inbox for the link.";
  if(/already registered|already been registered/i.test(m))return "An account with this email already exists. Sign in instead.";
  if(/password/i.test(m)&&/(short|least|weak|characters)/i.test(m))return "Use a stronger password of at least 8 characters.";
  if(/rate|too many|seconds/i.test(m))return "Too many attempts. Wait a minute and try again.";
  if(/fetch|network/i.test(m))return "No connection. Check your internet and try again.";
  return m||"Something went wrong. Try again.";
}
function showGate(startMode){
  root.className="authing";
  var g=$("authgate");g.hidden=false;g.innerHTML=gateHTML();setMode(startMode||"in");
  g.addEventListener("click",function(e){
    var b=e.target.closest("[data-ag]");if(b)setMode(b.dataset.ag);
    if(e.target.id==="agforgot")setMode("forgot");
  });
  $("agform").addEventListener("submit",async function(e){
    e.preventDefault();
    var email=$("agemail").value.trim(),pw=$("agpass").value,btn=$("aggo");
    if(mode!=="reset"&&!/^\S+@\S+\.\S+$/.test(email))return msg("Enter a valid email address.");
    if(mode!=="forgot"&&pw.length<8)return msg("Your password needs at least 8 characters.");
    btn.disabled=true;var old=btn.textContent;btn.textContent="One moment…";
    try{
      if(mode==="in"){
        var r=await SB.auth.signInWithPassword({email:email,password:pw});if(r.error)throw r.error;
      }else if(mode==="up"){
        var r2=await SB.auth.signUp({email:email,password:pw,options:{emailRedirectTo:location.origin}});if(r2.error)throw r2.error;
        if(!r2.data.session){msg("Almost done. We sent a link to "+email+". Open it, then sign in.",true);btn.disabled=false;btn.textContent=old;return}
      }else if(mode==="forgot"){
        var r3=await SB.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(r3.error)throw r3.error;
        msg("If that email has an account, a reset link is on its way.",true);btn.disabled=false;btn.textContent=old;return;
      }else if(mode==="reset"){
        var r4=await SB.auth.updateUser({password:pw});if(r4.error)throw r4.error;
        msg("Password updated.",true);setTimeout(function(){location.replace(location.pathname)},700);return;
      }
    }catch(err){msg(friendly(err));btn.disabled=false;btn.textContent=old}
  });
}

/* ---------- public creator page ---------- */
async function showPublic(handle){
  root.className="pubpage";
  var el=$("pubpage");el.hidden=false;el.innerHTML='<div class="pp-wrap"><p class="pp-load">Loading…</p></div>';
  var pr=await SB.from("profiles").select("*").eq("handle",handle).eq("is_public",true).maybeSingle();
  if(pr.error||!pr.data){el.innerHTML='<div class="pp-wrap"><div class="pp-card"><h1>Page not found</h1><p class="pp-sub">There is no public creator page at this address.</p><a class="btn pri" href="/">Go to Creator Space</a></div></div>';document.title="Not found";return}
  var p=pr.data;document.title=(p.display_name||"@"+p.handle)+" | Creator Space";
  var cs=await SB.from("connections").select("*").eq("user_id",p.user_id).eq("show_public",true).eq("kind","own").order("created_at");
  var conns=cs.data||[],ids=conns.map(function(c){return c.id}),snaps={},vids=[];
  if(ids.length){
    var sn=await SB.from("snapshots").select("connection_id,ts,followers,views,posts").in("connection_id",ids).order("ts",{ascending:false}).limit(400);
    (sn.data||[]).forEach(function(s){if(!snaps[s.connection_id])snaps[s.connection_id]=s});
    var vd=await SB.from("videos").select("*").in("connection_id",ids).order("published_at",{ascending:false}).limit(6);
    vids=vd.data||[];
  }
  var PL={youtube:"YouTube",instagram:"Instagram",tiktok:"TikTok",x:"X",facebook:"Facebook",other:"Other"};
  var accent=/^#[0-9a-f]{6}$/i.test(p.accent||"")?p.accent:"#12163A";
  var links=(Array.isArray(p.links)?p.links:[]).filter(function(l){return l&&/^https?:\/\//i.test(l.url||"")});
  var h='<div class="pp-wrap" style="--pa:'+accent+'"><div class="pp-card"><div class="pp-head">'+
    (p.avatar_url?'<img class="pp-av" src="'+esc(p.avatar_url)+'" alt="">':'<span class="pp-av pp-ini">'+esc((p.display_name||p.handle||"?").slice(0,1).toUpperCase())+'</span>')+
    '<div><h1>'+esc(p.display_name||p.handle)+'</h1><p class="pp-handle">@'+esc(p.handle)+'</p></div></div>'+
    (p.tagline?'<p class="pp-tag">'+esc(p.tagline)+'</p>':"")+(p.bio?'<p class="pp-bio">'+esc(p.bio)+'</p>':"")+
    (links.length?'<div class="pp-links">'+links.map(function(l){return '<a class="pp-link" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">'+esc(l.label||l.url)+'</a>'}).join("")+'</div>':"");
  if(conns.length){
    h+='<h2 class="pp-h">Numbers</h2><div class="pp-stats">'+conns.map(function(c){
      var s=snaps[c.id]||{};
      return '<div class="pp-stat"><span class="pp-pl">'+esc(PL[c.platform]||c.platform)+'</span><b>'+fmt(s.followers)+'</b><small>'+(c.platform==="youtube"?"subscribers":"followers")+'</small>'+
        '<span class="pp-meta">'+fmt(s.views)+' views · '+fmt(s.posts)+' posts</span>'+(s.ts?'<span class="pp-asof">as of '+new Date(s.ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"})+'</span>':"")+'</div>';
    }).join("")+'</div>';
  }
  if(vids.length){
    h+='<h2 class="pp-h">Recent videos</h2><div class="pp-vids">'+vids.map(function(v){
      return '<a class="pp-vid" href="https://www.youtube.com/watch?v='+esc(v.video_id)+'" target="_blank" rel="noopener noreferrer">'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy">':"")+'<span>'+esc(v.title||"")+'</span><small>'+fmt(v.views)+' views</small></a>';
    }).join("")+'</div>';
  }
  h+='</div><p class="pp-foot">Made with <a href="/">Creator Space</a></p></div>';
  el.innerHTML=h;
}

/* ---------- start the app after sign-in ---------- */
function startApp(session){
  var u=session.user;
  window.__UID=u.id;window.__EMAIL=u.email||"";window.__USER=u;
  var db=makeDb(u.id),assets=makeAssets(u.id),user=makeUser(u.id);
  window.claude={use:async function(n){
    if(n==="db")return db;if(n==="assets")return assets;if(n==="user")return user;return null;
  }};
  root.className="";$("authgate").hidden=true;
  var src=$("appjs").textContent.replace('var LS="creator-space-v1";','var LS="creator-space-v1-'+u.id+'";');
  var s=document.createElement("script");s.textContent=src;document.body.appendChild(s);
}
window.__signOut=async function(){try{await SB.auth.signOut()}catch(e){}location.replace("/")};

(async function init(){
  var m=location.pathname.match(/^\/u\/([a-z0-9_]{3,24})\/?$/i);
  if(m){showPublic(m[1].toLowerCase());return}
  var started=false;
  if(/type=recovery/.test(location.hash+location.search)){started=true;showGate("reset")}
  SB.auth.onAuthStateChange(function(ev,session){
    if(ev==="PASSWORD_RECOVERY"){started=true;showGate("reset");return}
    if(ev==="SIGNED_OUT"&&started){location.replace("/");return}
    if(session&&!started&&ev!=="PASSWORD_RECOVERY"){started=true;startApp(session)}
  });
  var r=await SB.auth.getSession();
  if(!r.data.session&&!started){showGate("in")}
  else if(r.data.session&&!started){started=true;startApp(r.data.session)}
})();
})();
