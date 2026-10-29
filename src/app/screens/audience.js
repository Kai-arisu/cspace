/* ---------- audience view ---------- */
function audSetup(){
  return '<section class="panel aud-setup"><h3>One step to switch on live YouTube numbers</h3>'+
    '<p>The numbers come from YouTube\'s official data service, which needs a free key that only you control.</p>'+
    '<ol><li>Open the <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer">YouTube Data API v3 page</a> in Google Cloud, press Enable, then create an API key under Credentials.</li>'+
    '<li>Open your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> and add a secret named <b>YOUTUBE_API_KEY</b> with that key.</li>'+
    '<li>Come back here and press Refresh numbers.</li></ol></section>';
}
var SOCWHAT={instagram:"Followers, reach, views and per-post insights",facebook:"Page followers, reach and post engagement",youtube:"Watch time, audience, countries and revenue",tiktok:"Followers, likes and views on your latest videos",x:"Followers and post count"};
function socConnectBtn(p,label){var busy=SOC.busy===p;return '<button class="btn pri soc-btn" data-act="soc_start" data-id="'+p+'"'+(SOC.busy?" disabled":"")+'>'+(busy?"Opening "+SOCN[p]+"…":(label||"Connect with "+SOCN[p]))+'</button>'}
function audFormHTML(){
  var pl=W.plat,yt=pl==="youtube",ready=!!SOC.ready[pl];
  var h='<section class="panel aud-add"><h3>Connect a channel or page</h3><div class="aud-plats">'+PLATS.map(function(p){return '<button class="chip" data-act="aud_plat" data-id="'+p[0]+'" aria-pressed="'+(W.plat===p[0])+'">'+p[1]+(SOC.ready[p[0]]?'<i class="soc-on" aria-label="sign-in ready"></i>':'')+'</button>'}).join("")+'</div>';
  /* sign in with the platform: live numbers */
  h+='<div class="soc-live"><div class="soc-t"><b>'+(yt?"Your channel, with private analytics":"Live "+platName(pl)+" numbers")+'</b><span>'+esc(SOCWHAT[pl])+', refreshed daily.</span></div>'+
    (ready?socConnectBtn(pl):(SOC.loaded?'<button class="btn" data-act="soc_guide" data-id="'+pl+'">Set up sign-in</button>':'<span class="muted">Checking…</span>'))+'</div>';
  if(yt){
    h+='<div class="soc-or"><span>or follow any public channel by link</span></div>'+
      '<div class="aud-row"><label class="aud-f">Channel link, @handle or channel ID<input class="in" id="aud-in" data-w="a.in" placeholder="https://youtube.com/@channel" maxlength="200" autocomplete="off"></label>'+
      '<div class="aud-kind" role="group" aria-label="Whose channel is it"><button class="chip" data-act="aud_kind" data-id="own" aria-pressed="'+(W.kind==="own")+'">My channel</button><button class="chip" data-act="aud_kind" data-id="watch" aria-pressed="'+(W.kind==="watch")+'">One I follow</button></div>'+
      '<button class="btn" data-act="aud_add"'+(W.busy?" disabled":"")+'>Add</button></div>'+
      '<p class="muted aud-hint">Public numbers only: subscribers, views and videos. Pick “One I follow” to study a channel you admire. Those never appear on your public page.</p>';
  }else if(!ready||W.typeIt){
    h+='<div class="soc-or"><span>'+(ready?"or type your numbers":"until then, type your numbers")+'</span></div>'+
      '<div class="aud-row"><label class="aud-f">Handle or page name<input class="in" id="aud-h" data-w="a.h" placeholder="@yourname" maxlength="60" autocomplete="off"></label>'+
      '<label class="aud-f sm">Followers<input class="in" id="aud-fo" data-w="a.fo" inputmode="numeric" placeholder="0" autocomplete="off"></label>'+
      '<label class="aud-f sm">Views<input class="in" id="aud-vw" data-w="a.vw" inputmode="numeric" placeholder="Optional" autocomplete="off"></label>'+
      '<label class="aud-f sm">Posts<input class="in" id="aud-po" data-w="a.po" inputmode="numeric" placeholder="Optional" autocomplete="off"></label>'+
      '<button class="btn" data-act="aud_addm">Add</button></div>'+
      '<p class="muted aud-hint">Typed numbers are saved with a date, so you still see growth over time.</p>';
  }else h+='<button class="lnk soc-type" data-act="soc_type">Type numbers instead</button>';
  return h+'</section>';
}
/* the 28-day insight line for a signed-in account */
var INSL=[["reach","Reach"],["views","Views"],["engaged","Accounts engaged"],["interactions","Interactions"],["link_taps","Link taps"],["page_views","Page views"],
  ["watch_min","Watch time"],["avg_view_s","Avg view"],["subs_gained","New subscribers"],["revenue","Est. revenue"],["likes_total","Total likes"],["following","Following"]];
function insVal(k,v){if(v==null)return null;if(k==="watch_min")return v>=120?nf(Math.round(v/60))+" h":Math.round(v)+" min";if(k==="avg_view_s")return Math.floor(v/60)+":"+String(Math.round(v%60)).padStart(2,"0");
  if(k==="revenue")return "$"+Number(v).toFixed(2);return nf(v)}
function insRow(c,last){
  var x=last&&last.extra;if(!x||x.manual)return "";
  var cells=INSL.filter(function(k){return x[k[0]]!=null}).slice(0,6).map(function(k){return '<div><b>'+insVal(k[0],x[k[0]])+'</b><small>'+k[1]+'</small></div>'}).join("");
  var ct=Array.isArray(x.countries)&&x.countries.length?'<p class="ac-ctry">Top countries: '+x.countries.slice(0,3).map(function(r){return esc(r[0])+" "+nf(r[1])}).join(" · ")+'</p>':"";
  if(!cells&&!ct)return "";
  return '<div class="ac-ins"><h4>'+(x.period==="28d"?"Last 28 days":"Account")+'</h4>'+(cells?'<div class="ac-insg">'+cells+'</div>':"")+ct+'</div>';
}
function audCard(c){
  var arr=W.snaps[c.id]||[],last=arr.length?arr[arr.length-1]:null,col=audCol(c.platform),yt=c.platform==="youtube";
  var fl=yt?"subscribers":"followers";
  var series=arr.map(function(s){return s.followers==null?0:Number(s.followers)});
  var d1=deltaOf(arr,"followers",864e5),d7=deltaOf(arr,"followers",7*864e5);
  var h='<article class="acard" style="--c:'+col+'" data-id="'+c.id+'"><header class="ac-h">'+
    (c.avatar_url?'<img class="ac-av" src="'+esc(c.avatar_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ac-av ac-ini">'+esc((c.title||c.handle||"?").slice(0,1).toUpperCase())+'</span>')+
    '<div class="ac-t"><b>'+esc(c.title||c.handle||"Untitled")+'</b><span><i class="ac-dot"></i>'+esc(platName(c.platform))+' · '+(c.kind==="watch"?"Following":"Yours")+(socLive(c)?' · <span class="ac-live">Live</span>':(c.source==="manual"?" · Typed in":""))+'</span></div>'+
    '<span class="ac-up">'+(c.status==="error"?'<span class="ac-err" title="'+esc(c.last_error||"")+'">Problem</span>':"Updated "+sinceStr(last?last.ts:c.last_synced))+'</span></header>';
  h+='<div class="ac-stats"><div><b title="'+esc(nfull(last&&last.followers))+'">'+nf(last?last.followers:null)+'</b><small>'+fl+'</small>'+deltaHTML(d1,"today")+(d7!=null&&d7!==0?'<em class="dl '+(d7>0?"up":"down")+'">'+(d7>0?"+":"-")+nf(Math.abs(d7))+' this week</em>':"")+'</div>'+
    '<div><b title="'+esc(nfull(last&&last.views))+'">'+(last&&last.views==null&&socLive(c)?"–":nf(last?last.views:null))+'</b><small>'+(socLive(c)?({instagram:"views, last 28 days",tiktok:"views, latest videos"})[c.platform]||"total views":"total views")+'</small>'+deltaHTML(deltaOf(arr,"views",864e5),"today")+'</div>'+
    '<div><b>'+nf(last?last.posts:null)+'</b><small>'+(yt?"videos":"posts")+'</small>'+deltaHTML(deltaOf(arr,"posts",7*864e5),"this week")+'</div></div>';
  if(series.length>1)h+='<div class="ac-sp" style="--c:'+col+'">'+spark(series)+'<small>'+series.length+' readings, last 35 days</small></div>';
  else h+='<p class="muted ac-note">Growth charts appear after a few readings. The numbers refresh while this page is open.</p>';
  h+=insRow(c,last);
  if(c.kind==="own"){
    var cur=last&&last.followers!=null?Number(last.followers):null;
    if(W.goalEd===c.id){h+='<div class="ac-goal ed"><label>Follower goal<input class="in" id="ag-in" inputmode="numeric" placeholder="e.g. 10000" value="'+(c.goal||"")+'"></label><button class="btn pri sm" data-act="aud_gsave" data-id="'+c.id+'">Save goal</button><button class="btn sm" data-act="aud_gedit" data-id="">Cancel</button></div>'}
    else if(c.goal&&cur!=null){var pc=Math.max(0,Math.min(100,Math.round(cur/c.goal*100)));var rate=deltaOf(arr,"followers",7*864e5);var eta="";
      if(cur>=c.goal)eta="Goal reached";else if(rate>0){var wk=Math.ceil((c.goal-cur)/rate);eta="About "+(wk<=1?"1 week":wk<104?wk+" weeks":"2+ years")+" at this week's pace"}
      h+='<div class="ac-goal"><div class="ag-t"><span>Goal: '+nf(c.goal)+' '+fl+'</span><b>'+pc+'%</b></div><div class="ag-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div><small>'+nf(cur)+' of '+nf(c.goal)+(eta?' · '+eta:'')+'</small><button class="btn sm" data-act="aud_gedit" data-id="'+c.id+'">Change</button></div>'}
    else h+='<div class="ac-goal"><button class="btn sm" data-act="aud_gedit" data-id="'+c.id+'">Set a follower goal</button></div>';
  }
  if(c.status==="error"&&c.last_error)h+='<p class="ac-errmsg">'+esc(c.last_error)+(socLive(c)&&SOC.ready[c.platform]?' '+socConnectBtn(c.platform,"Connect again"):"")+'</p>';
  var vids=(W.vids[c.id]||[]).slice(0,5);
  if(vids.length){
    h+='<div class="ac-vids"><h4>'+(c.platform==="youtube"||c.platform==="tiktok"?"Recent videos":"Recent posts")+'</h4>'+vids.map(function(v){
      var href=c.platform==="youtube"?"https://www.youtube.com/watch?v="+v.video_id:(c.url||"#");
      return '<a class="ac-v" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ac-vph"></span>')+
        '<span class="ac-vt">'+esc(v.title||"")+'</span><span class="ac-vn">'+(v.views==null?"–":nf(v.views))+' views</span><span class="ac-vn">'+nf(v.likes)+' likes</span></a>';
    }).join("")+'</div>';
  }
  if(W.manual===c.id){
    h+='<div class="ac-man"><label>Followers<input class="in" id="am-fo" inputmode="numeric" value="'+(last&&last.followers!=null?last.followers:"")+'"></label><label>Views<input class="in" id="am-vw" inputmode="numeric" value="'+(last&&last.views!=null?last.views:"")+'"></label><label>Posts<input class="in" id="am-po" inputmode="numeric" value="'+(last&&last.posts!=null?last.posts:"")+'"></label>'+
      '<button class="btn pri sm" data-act="aud_msave" data-id="'+c.id+'">Save numbers</button><button class="btn sm" data-act="aud_mcancel">Cancel</button></div>';
  }
  h+='<footer class="ac-f">';
  if(c.source==="manual"&&W.manual!==c.id)h+='<button class="btn sm" data-act="aud_man" data-id="'+c.id+'">Update numbers</button>';
  if(c.url)h+='<a class="btn sm" href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer">Open</a>';
  if(c.kind==="own")h+='<label class="ac-pub"><input type="checkbox" data-act="aud_pub" data-id="'+c.id+'"'+(c.show_public?" checked":"")+'> Show on my public page</label>';
  h+=socLive(c)?'<button class="btn sm" data-act="soc_disc" data-id="'+c.id+'">Disconnect</button></footer></article>':'<button class="btn sm" data-act="aud_del" data-id="'+c.id+'">Remove</button></footer></article>';
  return h;
}
function audListHTML(){
  if(!W.loaded)return '<p class="muted">Loading your channels…</p>';
  var h="";
  if(W.err)h+='<p class="ac-errmsg">'+esc(W.err)+' <button class="btn sm" data-act="aud_reload">Try again</button></p>';
  if(!W.conns.length&&!W.err)return h+'<div class="aud-empty"><b>No channels connected yet</b><span>Pick a platform above and sign in to pull your live numbers, or follow a public YouTube channel by its link.</span></div>';
  var own=W.conns.filter(function(c){return c.kind==="own"}),watch=W.conns.filter(function(c){return c.kind==="watch"});
  if(own.length)h+='<h3 class="aud-h">Your channels</h3><div class="aud-grid">'+own.map(audCard).join("")+'</div>';
  if(watch.length)h+='<h3 class="aud-h">Channels you follow</h3><div class="aud-grid">'+watch.map(audCard).join("")+'</div>';
  return h;
}
function audHTML(){
  var h=hero("aud","Audience",null,(W.loaded&&W.conns.length?'<button class="btn" data-act="aud_toggleadd">'+(W.showAdd?"Close":"+ Add channel")+'</button>':'')+'<button class="btn" data-act="aud_refresh"'+(W.busy?" disabled":"")+'>'+(W.busy?"Refreshing…":"Refresh numbers")+'</button>');
  if(W.loaded&&W.conns.some(function(c){return (W.vids[c.id]||[]).length})){
    h+='<div class="cp-tabs" role="tablist">'+[["ch","Channels"],["ins","Video insights"]].map(function(x){return '<button role="tab" data-act="aud_tab" data-id="'+x[0]+'" aria-selected="'+((W.audTab||"ch")===x[0])+'">'+x[1]+'</button>'}).join("")+'</div>';
    if(W.audTab==="ins")return h+insHTML();
  }
  if(!W.cfg&&!SOC.ready.youtube&&(W.conns.some(function(c){return c.platform==="youtube"&&!socLive(c)})||(W.plat==="youtube"&&(W.showAdd||!W.conns.length))))h+=audSetup();
  if(!W.loaded||!W.conns.length||W.showAdd)h+=audFormHTML();
  h+='<div id="audmsg" class="aud-msg" role="status">'+esc(W.msg)+'</div><div id="audlist">'+audListHTML()+'</div>';
  return h;
}
function audPaint(){var e=$("audlist");if(e)e.innerHTML=audListHTML()}
function audMsg(t){W.msg=t||"";var e=$("audmsg");if(e)e.textContent=W.msg}

async function audAdd(){
  var inp=$("aud-in"),v=inp?inp.value.trim():"";
  if(!v){audMsg("Paste a channel link, an @handle, or a channel ID.");return}
  W.busy=true;audMsg("Looking up the channel…");audPaintBtn();
  var r=await ytCall({input:v,kind:W.kind});
  W.busy=false;
  if(!r.ok){
    if(r.err.error==="not_configured"){W.cfg=false;audMsg("");render();return}
    audMsg(r.err.message||"Couldn't connect that channel.");audPaintBtn();return;
  }
  W.cfg=true;if(inp)inp.value="";audMsg("Connected "+(r.data.title||"channel")+".");
  await audLoad();audPaintBtn();
}
async function audAddManual(){
  var h=($("aud-h").value||"").trim(),fo=numOrNull($("aud-fo").value),vw=numOrNull($("aud-vw").value),po=numOrNull($("aud-po").value);
  if(!h){audMsg("Enter the handle or page name.");return}
  if(fo==null||isNaN(fo)||isNaN(vw)||isNaN(po)){audMsg("Enter your follower count as a number. Views and posts are optional.");return}
  var ext=h.toLowerCase().replace(/^@/,"");
  var c=await WSB.from("connections").upsert({platform:W.plat,kind:"own",handle:h,external_id:ext,title:h,source:"manual",status:"ok",last_synced:new Date().toISOString()},{onConflict:"user_id,platform,external_id"}).select("id").single();
  if(c.error){audMsg("Couldn't save that. "+c.error.message);return}
  var s=await WSB.from("snapshots").insert({connection_id:c.data.id,followers:fo,views:vw,posts:po,extra:{manual:true}});
  if(s.error){audMsg("Couldn't save the numbers. "+s.error.message);return}
  ["aud-h","aud-fo","aud-vw","aud-po"].forEach(function(i){var e=$(i);if(e)e.value=""});
  audMsg("Added "+h+".");await audLoad();
}
async function audSaveManual(id){
  var fo=numOrNull($("am-fo").value),vw=numOrNull($("am-vw").value),po=numOrNull($("am-po").value);
  if(fo==null||isNaN(fo)||isNaN(vw)||isNaN(po)){toast("Enter your follower count as a number.");return}
  var s=await WSB.from("snapshots").insert({connection_id:id,followers:fo,views:vw,posts:po,extra:{manual:true}});
  if(s.error){toast("Couldn't save the numbers");return}
  await WSB.from("connections").update({last_synced:new Date().toISOString()}).eq("id",id);
  W.manual=null;await audLoad();toast("Numbers saved");
}

/* ---------- sign-in connections (Instagram, Facebook, YouTube, TikTok, X) ---------- */
var SOC={ready:{},redirect:{},links:{},loaded:false,busy:""};
var SOCN={instagram:"Instagram",facebook:"Facebook",youtube:"Google",tiktok:"TikTok",x:"X"};
async function socCall(path,body){
  try{
    var r=await WSB.functions.invoke("social/"+path,body===undefined?{method:"GET"}:{body:body});
    if(r.error){var info=null;try{info=await r.error.context.json()}catch(e){}return {ok:false,err:info||{error:"network",message:"Could not reach the server. Check your connection."}}}
    return {ok:true,data:r.data};
  }catch(e){return {ok:false,err:{error:"network",message:"Could not reach the server. Check your connection."}}}
}
async function socLoad(){
  var st=await socCall("status");
  if(st.ok&&st.data){SOC.ready=st.data.ready||{};SOC.redirect=st.data.redirect||{}}
  try{var l=await WSB.rpc("my_social_links");var m={};(l.data||[]).forEach(function(x){m[x.connection_id]=x});SOC.links=m}catch(e){}
  SOC.loaded=true;
  if(S.view==="aud")render();
}
function socLive(c){return !!(c&&(SOC.links[c.id]||c.auth==="oauth"))}
async function socStart(p){
  if(SOC.busy)return;SOC.busy=p;render();
  var r=await socCall("start",{provider:p});
  if(!r.ok||!r.data||!r.data.url){SOC.busy="";render();
    if(r.err&&r.err.error==="not_configured"){SOC.ready[p]=false;render();socGuide(p)}else toast((r.err&&r.err.message)||"Couldn't start the sign-in");return}
  location.href=r.data.url;
}
async function socDisconnect(id){
  var r=await socCall("disconnect",{connection_id:id});
  if(!r.ok){toast((r.err&&r.err.message)||"Couldn't disconnect");return}
  W.conns=W.conns.filter(function(c){return c.id!==id});delete SOC.links[id];audPaint();toast("Disconnected. The sign-in was removed.");
}
async function socSync(force){
  if(!Object.keys(SOC.links).length)return null;
  var r=await socCall("sync",{force:!!force});
  return r.ok?r.data:null;
}
/* coming back from a platform's sign-in page */
(function(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return}
  var ok=q.get("connected"),bad=q.get("connect_error");if(!ok&&!bad)return;
  var REASON={cancelled:"You cancelled the sign-in.",expired:"The sign-in took too long or was already used. Try again.",denied:"The platform did not give permission.",
    no_pages:"No Facebook Pages were found on that account. Create a Page, or make sure you are an admin of one.",failed:"The platform sent an error"};
  var name=q.get("name")||"",n=+(q.get("n")||1),msg=q.get("msg")||"";
  try{history.replaceState(null,"",location.pathname+location.hash)}catch(e){}
  var tries=0;(function wait(){
    if(!window.__UID||typeof go!=="function"||typeof S==="undefined"||!S||!S.spaces||!document.querySelector(".app")){if(++tries<80)setTimeout(wait,250);return}
    W.audTab="ch";W.showAdd=false;go("aud");W.loaded=false;audLoad();socLoad();
    if(ok)toast("Connected "+(SOCN[ok]==="Google"?"YouTube":SOCN[ok]||ok)+(name?" · "+name:"")+(n>1?" ("+n+" pages)":""));
    else toast((REASON[q.get("reason")]||"Couldn't connect.")+(msg&&q.get("reason")==="failed"?": "+msg:""));
  })();
})();

/* the name typed on the landing page becomes the first space */
(function(){
  var n;try{n=localStorage.getItem("cs-new-space")}catch(e){return}if(!n)return;
  var tries=0;(function wait(){
    if(typeof S==="undefined"||!S||!S.spaces||!S.spaces.length||!window.__UID){if(++tries<80)setTimeout(wait,250);return}
    try{localStorage.removeItem("cs-new-space")}catch(e){}
    if(window.__WS)return;
    var sp=S.spaces.filter(function(x){return x.id===S.cur})[0]||S.spaces[0];
    if(S.spaces.length===1&&sp&&sp.name==="My channel"){sp.name=String(n).slice(0,40);S.cfg=S.cfg||{};S.cfg.spNamed=true;touch();render()}
  })();
})();

/* ---------- setup guide, shown until a platform's developer app is added ---------- */
var SOCG={
  instagram:{t:"Instagram",what:"followers, reach, views, accounts engaged, link taps, and views, likes and saves for each post and reel",
    need:"An Instagram Creator or Business account.",
    steps:['Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a>, log in with Facebook, and press <b>Create app</b>. Choose the use case <b>Manage messaging & content on Instagram</b>, name it “Creator Space”.',
      'In the app, open <b>Instagram › API setup with Instagram login</b>. Under <b>Set up Instagram business login</b>, add this redirect URL: <code data-copy>{R}</code>',
      'Under <b>Generate access tokens</b>, add your own Instagram account as a tester (accept the invite in Instagram › Settings › Website permissions › Apps and websites).',
      'Copy the <b>Instagram app ID</b> and <b>Instagram app secret</b> from the same page (not the Facebook app ID).',
      'Open your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> and add <code>IG_APP_ID</code> and <code>IG_APP_SECRET</code>.',
      'Come back here and press <b>Connect with Instagram</b>.'],
    note:"While the app is in development mode, only accounts you add as testers can connect. To let any creator connect, submit the app for Meta's App Review (instagram_business_basic and instagram_business_manage_insights)."},
  facebook:{t:"Facebook Page",what:"page followers, 28-day reach, post engagement and page views, and reactions and comments on recent posts",
    need:"A Facebook Page you manage.",
    steps:['Use the same Meta app as Instagram (or create one at <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a>). Add the product <b>Facebook Login for Business</b>.',
      'In <b>Facebook Login › Settings</b>, add this to <b>Valid OAuth Redirect URIs</b>: <code data-copy>{R}</code>',
      'In <b>App settings › Basic</b>, copy the <b>App ID</b> and <b>App secret</b>.',
      'Add them on your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> as <code>META_APP_ID</code> and <code>META_APP_SECRET</code>.',
      'Come back here and press <b>Connect with Facebook</b>. Pick the Pages to share.'],
    note:"Other people's Pages need Meta App Review for pages_read_engagement and read_insights before they can connect."},
  youtube:{t:"YouTube (deeper data)",what:"watch time, average view length, subscribers gained and lost, top countries, age and gender, and estimated revenue if the channel is monetised",
    need:"The Google account that owns the channel.",
    steps:['Open <a href="https://console.cloud.google.com/apis/library/youtubeanalytics.googleapis.com" target="_blank" rel="noopener noreferrer">YouTube Analytics API</a> and press <b>Enable</b> (in the same project as your YouTube Data API key). Enable <b>YouTube Data API v3</b> too if it isn\'t on.',
      'Open <a href="https://console.cloud.google.com/auth/branding" target="_blank" rel="noopener noreferrer">Google Auth Platform</a>, set the app name to “Creator Space”, audience <b>External</b>, and add yourself as a test user.',
      'Under <b>Clients</b>, create an <b>OAuth client ID</b> of type <b>Web application</b>, with this <b>Authorised redirect URI</b>: <code data-copy>{R}</code>',
      'Copy the client ID and secret into your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> as <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>.',
      'Come back here and press <b>Connect with Google</b>.'],
    note:"Set the app's publishing status to In production under Audience, otherwise Google ends the sign-in after 7 days. Until Google verifies the app, people see an “unverified app” screen they can click through (up to 100 users)."},
  tiktok:{t:"TikTok",what:"followers, total likes, video count, and views, likes, comments and shares on your latest 20 videos",
    need:"A TikTok account.",
    steps:['Go to <a href="https://developers.tiktok.com/apps" target="_blank" rel="noopener noreferrer">developers.tiktok.com</a>, register, and create an app. Add the products <b>Login Kit</b> and <b>Display API</b>, with scopes <code>user.info.basic</code>, <code>user.info.profile</code>, <code>user.info.stats</code> and <code>video.list</code>.',
      'In Login Kit, add this <b>Redirect URI</b> (Web): <code data-copy>{R}</code>',
      'To try it before review, switch to <b>Sandbox</b> and add your TikTok account as a target user.',
      'Copy the <b>Client key</b> and <b>Client secret</b> to your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> as <code>TIKTOK_CLIENT_KEY</code> and <code>TIKTOK_CLIENT_SECRET</code>.',
      'Come back here and press <b>Connect with TikTok</b>.'],
    note:"TikTok reviews the app (it asks for a demo video and a privacy policy link) before accounts outside the sandbox can connect."},
  x:{t:"X (Twitter)",what:"followers, following and post count",
    need:"An X account, and X API credits on your developer account (a profile lookup costs about $0.01, so a daily refresh is roughly $0.30 a month per account).",
    steps:['Go to <a href="https://developer.x.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">developer.x.com</a>, sign up, and add pay-per-use credits.',
      'Create a project and an app. In <b>User authentication settings</b>, turn on <b>OAuth 2.0</b>, type <b>Web App</b>, permissions <b>Read</b>.',
      'Set the <b>Callback URI</b> to <code data-copy>{R}</code> and the website to https://cspace.cashteaates009.workers.dev',
      'Copy the <b>OAuth 2.0 Client ID</b> and <b>Client Secret</b> to your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> as <code>X_CLIENT_ID</code> and <code>X_CLIENT_SECRET</code>.',
      'Come back here and press <b>Connect with X</b>.'],
    note:""}
};
function socRedirect(p){return SOC.redirect[p]||("https://ohkecamneutxggqwhend.supabase.co/functions/v1/social/cb/"+p)}
function socGuide(p){
  var g=SOCG[p];if(!g)return;var R=socRedirect(p);
  showInfo("Set up live "+g.t+" numbers",'<p style="margin:0 0 6px">Once set up, Creator Space reads your '+g.what+', and refreshes them every day.</p><p class="muted" style="margin:0 0 12px">You need: '+g.need+' This is a one-time setup, about 10 minutes.</p>'+
    '<ol class="soc-steps">'+g.steps.map(function(x){return '<li>'+x.replace("{R}",esc(R))+'</li>'}).join("")+'</ol>'+
    (g.note?'<p class="muted soc-note">'+g.note+'</p>':"")+'<div class="row" style="justify-content:flex-start;margin-bottom:0"><button class="btn" data-act="soc_copyr" data-id="'+p+'">Copy redirect URL</button></div>');
}

