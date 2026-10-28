/* Creator Space website: sign-in, public creator page, Supabase-backed storage */
(function(){
var SUPA_URL="https://ohkecamneutxggqwhend.supabase.co";
var SUPA_KEY="sb_publishable_k97xm0wmC6_1gMe5H8kLqw_3W5X3sgr";
var root=document.documentElement;
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmt(n){if(n==null)return "Hidden";n=Number(n);if(!isFinite(n))return "-";return new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:n<10000?1:0}).format(n)}

if(!window.supabase||!window.supabase.createClient){
  /* the landing page is static, so a visitor still sees it; only signing in waits for the connection */
  if(root.classList.contains("landing")&&$("landing")){$("landing").hidden=false;window.__lpGate=function(){alert("Couldn't reach the sign-in service. Check your connection and reload.")};return}
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
function makeDb(uid,owner,pfx){
  owner=owner||uid;pfx=pfx||"";
  function snap(d){return {exists:d!==undefined,data:function(){return d},metadata:{hasPendingWrites:false}}}
  function doc(p0){
    var path=pfx+p0;
    var ref={
      path:path,
      get:async function(){
        var r=await SB.from("docs").select("data").eq("user_id",owner).eq("path",path).maybeSingle();
        if(r.error)throw mapErr(r.error);
        return snap(r.data?r.data.data:undefined);
      },
      set:async function(d){
        var r=await SB.from("docs").upsert({user_id:owner,path:path,data:d,updated_at:new Date().toISOString()},{onConflict:"user_id,path"});
        if(r.error)throw mapErr(r.error);
      },
      delete:async function(){
        var r=await SB.from("docs").delete().eq("user_id",owner).eq("path",path);
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
          ch=SB.channel("docs-"+path+"-"+Math.random().toString(36).slice(2,7)).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"user_id=eq."+owner},function(p){
            var row=(p.new&&p.new.path)?p.new:(p.old||{});if(row.path===path)pull();
          }).subscribe();
        }catch(e){}
        return function(){dead=true;clearInterval(timer);if(ch)try{SB.removeChannel(ch)}catch(e){}};
      }
    };
    return ref;
  }
  function collection(p0){
    var path=pfx+p0,q={};
    var o={
      where:function(f,op,v){q.where=[f,op,v];return o},
      orderBy:function(f,d){q.order=f;q.dir=d;return o},
      limit:function(n){q.limit=n;return o},
      get:async function(){
        var r=await SB.from("docs").select("path,data").eq("user_id",owner).like("path",path+"/%").limit(500);
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
function makeUser(uid,role){
  var ed=role!=="viewer";
  return {isOwner:async function(){return !role},canEdit:async function(){return ed},can:async function(n){return /write/.test(String(n))?ed:!role},
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
    '<div class="ag-foot"><button type="button" class="ag-link" id="agforgot">Forgot your password?</button>'+(document.getElementById("landing")?'<button type="button" class="ag-link" id="agback">Back to the start</button>':'')+'</div></div>';
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
function showLanding(){
  var l=$("landing");if(!l){showGate("in");return}
  root.className="landing";l.hidden=false;$("authgate").hidden=true;window.scrollTo(0,0);
}
window.__lpGate=function(m){showGate(m||"up");window.scrollTo(0,0);setTimeout(function(){var e=$("agemail");if(e)e.focus()},50)};
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("#landing [data-ag]");if(b){e.preventDefault();window.__lpGate(b.dataset.ag)}});
function showGate(startMode){
  root.className="authing";var lg=$("landing");if(lg)lg.hidden=true;
  var g=$("authgate");g.hidden=false;g.innerHTML=gateHTML();setMode(startMode||"in");
  g.addEventListener("click",function(e){
    var b=e.target.closest("[data-ag]");if(b)setMode(b.dataset.ag);
    if(e.target.id==="agforgot")setMode("forgot");
    if(e.target.id==="agback")showLanding();
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
var CS_LOOKS={plain:1,tint:1,glow:1,dark:1};
function setLook(p){
  var a=/^#[0-9a-f]{6}$/i.test(p.accent||"")?p.accent:"#111111";
  root.setAttribute("data-look",CS_LOOKS[p.look]?p.look:"plain");root.style.setProperty("--pa-page",a);
}
function csShare(o){
  var W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;var x=c.getContext("2d");
  var ac=/^#[0-9a-f]{6}$/i.test(o.accent||"")?o.accent:"#111111",dark=o.look==="dark";
  var bg=dark?"#0b0b0d":"#f6f5f2",fg=dark?"#f2f2f2":"#111111",mu=dark?"#9a9aa3":"#6b6b6b";
  x.fillStyle=bg;x.fillRect(0,0,W,H);
  var g=x.createRadialGradient(W*.85,0,20,W*.85,0,W*1.05);g.addColorStop(0,ac+(dark?"66":"44"));g.addColorStop(1,ac+"00");x.fillStyle=g;x.fillRect(0,0,W,H);
  function wrap(t,mx,fs,ly,lh,maxL){x.font=fs;var w=String(t||"").split(/\s+/),line="",n=0;for(var i=0;i<w.length;i++){var tt=line?line+" "+w[i]:w[i];if(x.measureText(tt).width>mx&&line){x.fillText(line,90,ly);ly+=lh;line=w[i];if(++n>=maxL-1&&i<w.length-1){x.fillText(line+"…",90,ly);return ly+lh}}else line=tt}x.fillText(line,90,ly);return ly+lh}
  function done(img){
    var cy=250;
    x.save();x.beginPath();x.arc(170,cy,80,0,7);x.clip();
    if(img){x.drawImage(img,90,cy-80,160,160)}else{x.fillStyle=ac;x.fillRect(90,cy-80,160,160);x.fillStyle="#fff";x.font="800 84px system-ui,sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(String(o.name||"?").charAt(0).toUpperCase(),170,cy+4)}
    x.restore();x.textAlign="left";x.textBaseline="alphabetic";
    x.fillStyle=fg;x.font="800 80px system-ui,sans-serif";var y=wrap(o.name,W-180,"800 80px system-ui,sans-serif",440,92,2);
    x.fillStyle=mu;x.font="500 40px system-ui,sans-serif";x.fillText("@"+o.handle,90,y-6);y+=48;
    if(o.tagline){x.fillStyle=fg;y=wrap(o.tagline,W-180,"500 46px system-ui,sans-serif",y+20,62,3)}
    var st=(o.stats||[]).slice(0,4),by=Math.max(y+40,820);
    st.forEach(function(s,i){var col=i%2,row=Math.floor(i/2),bx=90+col*450,byy=by+row*190;
      x.fillStyle=dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)";x.beginPath();x.roundRect?x.roundRect(bx,byy,420,160,28):x.rect(bx,byy,420,160);x.fill();
      x.fillStyle=mu;x.font="500 30px system-ui,sans-serif";x.fillText(s[0],bx+30,byy+52);
      x.fillStyle=fg;x.font="800 62px system-ui,sans-serif";x.fillText(fmt(s[1]),bx+30,byy+122)});
    x.fillStyle=ac;x.fillRect(90,H-170,90,8);
    x.fillStyle=fg;x.font="600 38px system-ui,sans-serif";x.fillText(location.host+"/u/"+o.handle,90,H-100);
    c.toBlob(function(b){
      if(!b)return;var f=new File([b],o.handle+"-creator-space.png",{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:o.name}).catch(function(){})}
      else{var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
    },"image/png")
  }
  if(o.avatar){var im=new Image();im.crossOrigin="anonymous";im.onload=function(){done(im)};im.onerror=function(){done(null)};im.src=o.avatar}else done(null)
}
window.csShare=csShare;
async function showPublic(handle,mode){
  root.className="pubpage";
  var el=$("pubpage");el.hidden=false;el.innerHTML='<div class="pp-wrap"><p class="pp-load">Loading…</p></div>';
  var pr=await SB.from("profiles").select("*").eq("handle",handle).eq("is_public",true).maybeSingle();
  if(pr.error||!pr.data){el.innerHTML='<div class="pp-wrap"><div class="pp-card"><h1>Page not found</h1><p class="pp-sub">There is no public creator page at this address.</p><a class="btn pri" href="/">Go to Creator Space</a></div></div>';document.title="Not found";return}
  var p=pr.data;setLook(p);document.title=(p.display_name||"@"+p.handle)+" | Creator Space";
  var cs=await SB.from("connections").select("*").eq("user_id",p.user_id).eq("show_public",true).eq("kind","own").order("created_at");
  var conns=cs.data||[],ids=conns.map(function(c){return c.id}),snaps={},vids=[];
  if(ids.length){
    var sn=await SB.from("snapshots").select("connection_id,ts,followers,views,posts").in("connection_id",ids).order("ts",{ascending:false}).limit(400);
    (sn.data||[]).forEach(function(s){if(!snaps[s.connection_id])snaps[s.connection_id]=s});
    var vd=await SB.from("videos").select("*").in("connection_id",ids).order("published_at",{ascending:false}).limit(6);
    vids=vd.data||[];
  }
  var PL={youtube:"YouTube",instagram:"Instagram",tiktok:"TikTok",x:"X",facebook:"Facebook",other:"Other"};
  var accent=/^#[0-9a-f]{6}$/i.test(p.accent||"")?p.accent:"#111111";
  var kit=p.kit&&typeof p.kit==="object"?p.kit:{};
  var name=p.display_name||p.handle,ini=esc((name||"?").slice(0,1).toUpperCase());
  function lumOf(h){var c=[1,3,5].map(function(i){var v=parseInt(h.substr(i,2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  var onA=lumOf(accent)>.36?"#1c1a17":"#ffffff";
  var av=p.avatar_url?'<img class="pg-av" src="'+esc(p.avatar_url)+'" alt="'+esc(name)+'">':'<span class="pg-av pg-ini" aria-hidden="true">'+ini+'</span>';
  var stamp=new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  var nums=conns.map(function(c){var s=snaps[c.id]||{};return {pl:PL[c.platform]||c.platform,f:s.followers,v:s.views,n:s.posts,unit:c.platform==="youtube"?"subscribers":"followers",ts:s.ts}});
  var bar='<header class="pg-bar"><a class="pg-word" href="/u/'+esc(p.handle)+'">@'+esc(p.handle)+'</a><nav class="pg-nav">'+
    (mode==="kit"?'<a href="/u/'+esc(p.handle)+'">Profile</a><button type="button" class="pg-btn" id="kitprint">Save as PDF</button>':(kit.on?'<a class="pp-kit" href="/u/'+esc(p.handle)+'/kit">Media kit</a>':"")+(kit.email?'<a class="pg-btn" href="mailto:'+esc(kit.email)+'">Work with me</a>':""))+'</nav></header>';
  var foot='<footer class="pg-foot"><span>'+esc(name)+'</span><a href="/">Made with Creator Space</a></footer>';
  if(mode==="kit"){
    if(!kit.on){el.innerHTML='<div class="pp-wrap"><div class="pp-card"><h1>No media kit</h1><p class="pp-sub">This creator has not published a media kit.</p><a class="btn pri" href="/u/'+esc(p.handle)+'">See their page</a></div></div>';document.title="Media kit";return}
    document.title=name+" media kit";
    var st=nums.map(function(x){return [x.pl+" "+x.unit,fmt(x.f)]}).concat((Array.isArray(kit.stats)?kit.stats:[]).map(function(x){return [x[0],x[1]]}));
    var rt=Array.isArray(kit.rates)?kit.rates:[],br=Array.isArray(kit.brands)?kit.brands:[];
    var kh='<div class="pg pg-kit" style="--pa:'+accent+';--on-pa:'+onA+'">'+bar+
      '<section class="pg-hero kh"><div class="pg-ht"><h1 class="pg-name">'+esc(name)+'</h1><p class="pg-tag">Media kit, '+esc(stamp)+'</p>'+
      ((kit.intro||p.bio)?'<p class="pg-bio">'+esc(kit.intro||p.bio)+'</p>':"")+'</div>'+av+'</section>';
    if(st.length)kh+='<section class="pg-band" aria-labelledby="kst"><h2 id="kst" class="pg-h">Audience</h2><div class="pg-nums">'+st.map(function(x){return '<div class="pg-n"><b>'+esc(x[1])+'</b><span>'+esc(x[0])+'</span></div>'}).join("")+'</div></section>';
    kh+='<div class="pg-two">';
    if(rt.length)kh+='<section class="pg-sec" aria-labelledby="krt"><h2 id="krt" class="pg-h2">Rates</h2><table class="pg-rates"><tbody>'+rt.map(function(x){return '<tr><th scope="row">'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>'}).join("")+'</tbody></table></section>';
    if(br.length)kh+='<section class="pg-sec" aria-labelledby="kbr"><h2 id="kbr" class="pg-h2">Worked with</h2><ul class="pg-brands">'+br.map(function(x){return '<li><b>'+esc(x.name)+'</b><span>'+esc(x.note)+'</span></li>'}).join("")+'</ul></section>';
    kh+='</div>';
    if(kit.email)kh+='<section class="pg-cta" aria-labelledby="kct"><h2 id="kct" class="pg-h2">Let\'s make something.</h2><a class="pg-mail kit-mail" href="mailto:'+esc(kit.email)+'">'+esc(kit.email)+'</a></section>';
    el.innerHTML=kh+foot+'</div>';var pb=$("kitprint");if(pb)pb.addEventListener("click",function(){window.print()});
    return;
  }
  var links=(Array.isArray(p.links)?p.links:[]).filter(function(l){return l&&/^https?:\/\//i.test(l.url||"")});
  function host(u){try{return new URL(u).hostname.replace(/^www\./,"")+new URL(u).pathname.replace(/\/$/,"")}catch(e){return u}}
  var h='<div class="pg" style="--pa:'+accent+';--on-pa:'+onA+'">'+bar+
    '<section class="pg-hero"><div class="pg-ht"><h1 class="pg-name">'+esc(name)+'</h1>'+(p.tagline?'<p class="pg-tag">'+esc(p.tagline)+'</p>':"")+'</div>'+av+'</section>';
  if(nums.length)h+='<section class="pg-band" aria-labelledby="pnum"><h2 id="pnum" class="pg-h">Where people watch</h2><div class="pg-nums">'+nums.map(function(x){
    return '<div class="pg-n"><b>'+fmt(x.f)+'</b><span>'+esc(x.pl)+' '+x.unit+'</span><small>'+fmt(x.v)+' views · '+fmt(x.n)+' posts'+(x.ts?' · '+new Date(x.ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"")+'</small></div>'}).join("")+'</div></section>';
  if(vids.length)h+='<section class="pg-sec" aria-labelledby="pvid"><h2 id="pvid" class="pg-h2">Latest videos</h2><div class="pg-vids">'+vids.map(function(v,i){
    return '<a class="pg-vid" href="https://www.youtube.com/watch?v='+esc(v.video_id)+'" target="_blank" rel="noopener noreferrer"><span class="pg-th'+(v.thumb?"":" none")+'">'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy">':'<i>'+esc(String(v.title||"").replace(/^#Shorts\s*/i,""))+'</i>')+'</span><b>'+esc(v.title||"")+'</b><small>'+fmt(v.views)+' views</small></a>'}).join("")+'</div></section>';
  h+='<section class="pg-about" aria-labelledby="pab"><h2 id="pab" class="pg-h2">About</h2><div>'+(p.bio?'<p class="pg-bio">'+esc(p.bio)+'</p>':"")+
    (links.length?'<ul class="pg-links">'+links.map(function(l){return '<li><a class="pp-link" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer"><b>'+esc(l.label||host(l.url))+'</b><span>'+esc(host(l.url))+'</span><i aria-hidden="true">↗</i></a></li>'}).join("")+'</ul>':"")+'</div></section>';
  if(kit.on||kit.email)h+='<section class="pg-cta" aria-labelledby="pct"><h2 id="pct" class="pg-h2">Working with brands</h2><div class="pg-ctas">'+(kit.on?'<a class="pg-btn big" href="/u/'+esc(p.handle)+'/kit">See the media kit</a>':"")+(kit.email?'<a class="pg-mail" href="mailto:'+esc(kit.email)+'">'+esc(kit.email)+'</a>':"")+'</div></section>';
  el.innerHTML=h+foot+'</div>';
  var sb=document.createElement("button");sb.className="pg-btn pp-share";sb.type="button";sb.textContent="Share as image";
  sb.addEventListener("click",function(){csShare({name:name,handle:p.handle,tagline:p.tagline,accent:p.accent,look:p.look,avatar:p.avatar_url,stats:conns.map(function(c){var s=snaps[c.id]||{};return [PL[c.platform]||c.platform,s.followers]}).filter(function(x){return x[1]!=null})})});
  var nv=el.querySelector(".pg-nav");if(nv)nv.insertBefore(sb,nv.firstChild);
}

/* ---------- start the app after sign-in ---------- */
async function pickWorkspace(u){
  var ws=null;
  try{ws=JSON.parse(localStorage.getItem("cs-ws-"+u.id)||"null")}catch(e){}
  if(!ws||!ws.owner)return null;
  /* one of my own private spaces, opened on its own */
  if(ws.owner===u.id&&ws.space&&/^[A-Za-z0-9_-]{1,40}$/.test(ws.space))return {owner:u.id,role:"editor",label:ws.label||"Private space",space:ws.space,self:true};
  try{
    var r=await SB.rpc("list_workspaces");
    var hit=(r.data||[]).filter(function(x){return x.owner_id===ws.owner&&(x.space_id||"")===(ws.space||"")})[0];
    if(hit)return {owner:hit.owner_id,role:hit.role,label:hit.owner_email+(hit.space_id&&ws.label?" · "+ws.label:""),space:hit.space_id||"",self:false};
  }catch(e){}
  try{localStorage.removeItem("cs-ws-"+u.id)}catch(e){}
  return null;
}
async function startApp(session){
  var u=session.user;
  window.__UID=u.id;window.__EMAIL=u.email||"";window.__USER=u;
  var ws=await pickWorkspace(u);window.__WS=ws;
  window.__mkdb=function(p){return makeDb(u.id,ws&&ws.owner,p||"")};
  var db=makeDb(u.id,ws&&ws.owner,ws&&ws.space?"sp/"+ws.space+"/":""),assets=makeAssets(u.id),user=makeUser(u.id,ws&&ws.role);
  window.claude={use:async function(n){
    if(n==="db")return db;if(n==="assets")return assets;if(n==="user")return user;return null;
  }};
  root.className="";$("authgate").hidden=true;if($("landing"))$("landing").hidden=true;
  var src=$("appjs").textContent.replace('var LS="creator-space-v1";','var LS="creator-space-v1-'+u.id+(ws?'-via-'+ws.owner+(ws.space?'-sp-'+ws.space:''):'')+'";');
  var s=document.createElement("script");s.textContent=src;document.body.appendChild(s);
}
window.__signOut=async function(){try{await SB.auth.signOut()}catch(e){}location.replace("/")};

(async function init(){
  var m=location.pathname.match(/^\/u\/([a-z0-9_]{3,24})(\/kit)?\/?$/i);
  if(m){showPublic(m[1].toLowerCase(),m[2]?"kit":"");return}
  var started=false;
  if(/type=recovery/.test(location.hash+location.search)){started=true;showGate("reset")}
  SB.auth.onAuthStateChange(function(ev,session){
    if(ev==="PASSWORD_RECOVERY"){started=true;showGate("reset");return}
    if(ev==="SIGNED_OUT"&&started){location.replace("/");return}
    if(session&&!started&&ev!=="PASSWORD_RECOVERY"){started=true;startApp(session)}
  });
  var r=await SB.auth.getSession();
  if(!r.data.session&&!started){var q=location.search;if(/[?&]signup\b/.test(q))showGate("up");else if(/[?&]signin\b/.test(q)||location.pathname!=="/")showGate("in");else showLanding()}
  else if(r.data.session&&!started){started=true;startApp(r.data.session)}
})();
})();
