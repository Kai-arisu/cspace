/* ---------- website only: audience numbers, creator page, account ---------- */
ICONS.globe='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>';
ICONS.trend='<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>';
(function(){
  var i=VIEWS.map(function(v){return v.id}).indexOf("viz");
  VIEWS.splice(i+1,0,{id:"aud",name:"Audience",ic:"trend",c:"var(--c-viz)",desc:"Real numbers from your channels and pages."});
  VIEWS.push({id:"cp",g:"You",name:"Handles",ic:"globe",c:"var(--c-home)",desc:"Where people find you."});
  if(window.__WS)VIEWS=VIEWS.filter(function(v){return v.id!=="aud"&&v.id!=="cp"});
})();

/* ---------- sidebar rail, sounds, breadcrumb (website only) ---------- */
var SND={ctx:null,last:0};
function sndOn(){try{return localStorage.getItem("cs-sound")!=="off"}catch(e){return true}}
function sndSet(on){try{localStorage.setItem("cs-sound",on?"on":"off")}catch(e){}}
function sndCtx(){
  if(!SND.ctx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{SND.ctx=new C()}catch(e){return null}}
  if(SND.ctx.state==="suspended")SND.ctx.resume();return SND.ctx;
}
function sndNote(c,out,f0,f1,t,dur,vol){
  var o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+0.02);
}
function sound(kind){
  if(!sndOn()||document.visibilityState==="hidden")return;
  var c=sndCtx();if(!c)return;
  var now=c.currentTime;if(kind==="tick"&&now-SND.last<0.06)return;SND.last=now;
  var lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;
  var m=c.createGain();m.gain.value=0.9;lp.connect(m);m.connect(c.destination);
  if(kind==="collapse"){sndNote(c,lp,640,430,now,0.16,0.09);sndNote(c,lp,430,290,now+0.07,0.22,0.07)}
  else if(kind==="expand"){sndNote(c,lp,290,430,now,0.16,0.07);sndNote(c,lp,430,660,now+0.07,0.22,0.09)}
  else if(kind==="on"){sndNote(c,lp,520,780,now,0.14,0.08)}
  else{sndNote(c,lp,1500,900,now,0.045,0.035)}
}
function railGet(){try{return localStorage.getItem("cs-rail")==="1"}catch(e){return false}}
function railSet(on,quiet){
  var a=document.querySelector(".app");if(!a)return;
  a.classList.toggle("rail",on);
  try{localStorage.setItem("cs-rail",on?"1":"0")}catch(e){}
  var b=$("railbtn");if(b){b.setAttribute("aria-expanded",String(!on));b.setAttribute("aria-label",on?"Expand sidebar":"Collapse sidebar")}
  var lg=$("logo");if(lg&&!quiet){lg.classList.remove("pop");void lg.offsetWidth;lg.classList.add("pop")}
  if(!quiet)sound(on?"collapse":"expand");
}
function wsBar(){
  if(!window.__WS)return;
  var d=$("wsbar")||document.createElement("div"),fresh=!d.parentNode;d.id="wsbar";d.className="wsbar";
  var W0=window.__WS,sn=W0.space&&S.spaces[0]?S.spaces[0].name:"",who=W0.self?"Working in <b>"+esc(sn||W0.label||"a private space")+"</b>":"Viewing <b>"+esc(sn?sn+" · "+String(W0.label||"").split(" · ")[0]:(W0.label||"a shared workspace"))+"</b> as "+(W0.role==="editor"?"editor":"viewer");
  d.innerHTML='<span>'+who+'</span><button data-act="sh_home">'+(W0.self?"Back to my workspace":"Back to mine")+'</button>';
  if(fresh)document.body.appendChild(d);
}
function webCrumb(){wsBar();var sb=document.getElementById("sharebtn");if(sb){sb.title="Share your public page";sb.setAttribute("aria-label","Share your public page")}
  var v=vmeta(S.view),el=$("crumb");if(!v)return;
  var g="";for(var i=0;i<VIEWS.length;i++){if(VIEWS[i].g)g=VIEWS[i].g;if(VIEWS[i].id===v.id)break}
  if(!el){var top=document.querySelector(".top .search");if(!top)return;el=document.createElement("div");el.id="crumb";el.className="crumb";top.parentNode.insertBefore(el,top)}
  el.innerHTML=(g?'<span>'+esc(g)+'</span><i>/</i>':'')+'<b>'+esc(v.name)+'</b>';
  document.querySelectorAll("#nav .si-row,#spaces .si-row").forEach(function(r){var n=r.querySelector(".nm");if(n)r.setAttribute("title",n.textContent)});
}
document.addEventListener("keydown",function(e){
  if(e.key!=="["||e.metaKey||e.ctrlKey||e.altKey)return;
  var t=e.target,tag=t&&t.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||(t&&t.isContentEditable))return;
  railSet(!document.querySelector(".app").classList.contains("rail"));
});
railSet(railGet(),true);

var WSB=window.__SB;
var PLATS=[["youtube","YouTube","#DC2626"],["instagram","Instagram","#C026D3"],["tiktok","TikTok","#0F766E"],["x","X","#374151"],["facebook","Facebook","#2563EB"]];
var W={conns:[],snaps:{},vids:{},loaded:false,loading:false,err:"",cfg:true,plat:"youtube",kind:"own",busy:false,msg:"",manual:null,timer:null,tick:0,lastRefresh:0,
  p:null,pLoaded:false,pErr:"",pSaving:false,pMsg:"",pLoadedAt:0};

function platName(id){var p=PLATS.filter(function(x){return x[0]===id})[0];return p?p[1]:id}
function platCol(id){var p=PLATS.filter(function(x){return x[0]===id})[0];return p?p[2]:"#6B7280"}
function nf(n){if(n==null)return "Hidden";n=Number(n);if(!isFinite(n))return "-";return new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:n<10000?1:0}).format(n)}
function nfull(n){return n==null?"":Number(n).toLocaleString("en-IN")}
function sinceStr(ts){if(!ts)return "never";var s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return "just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" h ago";return Math.floor(s/86400)+" d ago"}
function numOrNull(v){v=String(v==null?"":v).replace(/[,\s]/g,"");if(v==="")return null;var n=Number(v);return isFinite(n)&&n>=0?Math.round(n):NaN}

/* delta between the newest snapshot and the oldest one inside a time window */
function deltaOf(arr,field,ms){
  if(!arr||arr.length<2)return null;
  var last=arr[arr.length-1],lv=last[field];if(lv==null)return null;
  var cut=new Date(last.ts).getTime()-ms,base=null;
  for(var i=0;i<arr.length-1;i++){if(new Date(arr[i].ts).getTime()>=cut){base=arr[i];break}}
  if(!base||base[field]==null)return null;
  if(new Date(last.ts).getTime()-new Date(base.ts).getTime()<20*60*1000)return null;
  return lv-base[field];
}
function deltaHTML(d,label){
  if(d==null)return '<em class="dl">Tracking started</em>';
  if(d===0)return '<em class="dl">No change '+label+'</em>';
  return '<em class="dl '+(d>0?"up":"down")+'">'+(d>0?"+":"-")+nf(Math.abs(d))+' '+label+'</em>';
}

/* ---------- calls ---------- */
async function ytCall(body){
  try{
    var r=await WSB.functions.invoke("youtube-sync",{body:body});
    if(r.error){
      var info=null;try{info=await r.error.context.json()}catch(e){}
      return {ok:false,err:info||{error:"network",message:"Could not reach the server. Check your connection."}};
    }
    return {ok:true,data:r.data};
  }catch(e){return {ok:false,err:{error:"network",message:"Could not reach the server. Check your connection."}}}
}
async function audLoad(quiet){
  if(W.loading)return;W.loading=true;
  try{
    var c=await WSB.from("connections").select("*").order("created_at",{ascending:true});
    if(c.error)throw c.error;
    var conns=c.data||[],ids=conns.map(function(x){return x.id}),snaps={},vids={};
    if(ids.length){
      var since=new Date(Date.now()-35*864e5).toISOString();
      var s=await WSB.from("snapshots").select("connection_id,ts,followers,views,posts").in("connection_id",ids).gte("ts",since).order("ts",{ascending:true}).limit(3000);
      if(s.error)throw s.error;
      (s.data||[]).forEach(function(x){(snaps[x.connection_id]=snaps[x.connection_id]||[]).push(x)});
      var v=await WSB.from("videos").select("*").in("connection_id",ids).order("published_at",{ascending:false}).limit(300);
      if(v.error)throw v.error;
      (v.data||[]).forEach(function(x){(vids[x.connection_id]=vids[x.connection_id]||[]).push(x)});
    }
    W.conns=conns;W.snaps=snaps;W.vids=vids;W.loaded=true;W.err="";
  }catch(e){W.err="Couldn't load your channels. "+((e&&e.message)||"");if(!W.loaded)W.loaded=true}
  W.loading=false;
  if(S.view==="aud")audPaint();
}
async function audRefresh(force){
  if(W.busy)return;W.busy=true;audPaintBtn();
  var r=await ytCall({refresh:true,force:!!force});
  W.busy=false;W.lastRefresh=Date.now();var wasCfg=W.cfg;
  if(!r.ok){
    if(r.err.error==="not_configured"){W.cfg=false}
    else if(force){toast(r.err.message||"Couldn't refresh")}
  }else{W.cfg=true;if(force)toast(r.data.refreshed?"Numbers updated":"Already up to date")}
  await audLoad();audPaintBtn();
  if(wasCfg!==W.cfg&&S.view==="aud")render();
}
function audPaintBtn(){var b=document.querySelector('[data-act="aud_refresh"]');if(b){b.disabled=W.busy;b.textContent=W.busy?"Refreshing…":"Refresh numbers"}}

/* ---------- audience view ---------- */
function audSetup(){
  return '<section class="panel aud-setup"><h3>One step to switch on live YouTube numbers</h3>'+
    '<p>The numbers come from YouTube\'s official data service, which needs a free key that only you control.</p>'+
    '<ol><li>Open the <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer">YouTube Data API v3 page</a> in Google Cloud, press Enable, then create an API key under Credentials.</li>'+
    '<li>Open your <a href="https://supabase.com/dashboard/project/ohkecamneutxggqwhend/functions/secrets" target="_blank" rel="noopener noreferrer">Supabase secrets page</a> and add a secret named <b>YOUTUBE_API_KEY</b> with that key.</li>'+
    '<li>Come back here and press Refresh numbers.</li></ol></section>';
}
function audFormHTML(){
  var yt=W.plat==="youtube";
  var h='<section class="panel aud-add"><h3>Connect a channel or page</h3><div class="aud-plats">'+PLATS.map(function(p){return '<button class="chip" data-act="aud_plat" data-id="'+p[0]+'" aria-pressed="'+(W.plat===p[0])+'">'+p[1]+'</button>'}).join("")+'</div>';
  if(yt){
    h+='<div class="aud-row"><label class="aud-f">Channel link, @handle or channel ID<input class="in" id="aud-in" data-w="a.in" placeholder="https://youtube.com/@channel" maxlength="200" autocomplete="off"></label>'+
      '<div class="aud-kind" role="group" aria-label="Whose channel is it"><button class="chip" data-act="aud_kind" data-id="own" aria-pressed="'+(W.kind==="own")+'">My channel</button><button class="chip" data-act="aud_kind" data-id="watch" aria-pressed="'+(W.kind==="watch")+'">One I follow</button></div>'+
      '<button class="btn pri" data-act="aud_add"'+(W.busy?" disabled":"")+'>Connect</button></div>'+
      '<p class="muted aud-hint">Works with any public channel. Pick "One I follow" to study a channel you admire. Those never appear on your public page.</p>';
  }else{
    h+='<div class="aud-row"><label class="aud-f">Handle or page name<input class="in" id="aud-h" data-w="a.h" placeholder="@yourname" maxlength="60"></label>'+
      '<label class="aud-f sm">Followers<input class="in" id="aud-fo" data-w="a.fo" inputmode="numeric" placeholder="0"></label>'+
      '<label class="aud-f sm">Views<input class="in" id="aud-vw" data-w="a.vw" inputmode="numeric" placeholder="Optional"></label>'+
      '<label class="aud-f sm">Posts<input class="in" id="aud-po" data-w="a.po" inputmode="numeric" placeholder="Optional"></label>'+
      '<button class="btn pri" data-act="aud_addm">Add</button></div>'+
      '<p class="muted aud-hint">'+platName(W.plat)+' only shares live numbers with an approved business app, which this site does not have yet. Until then, type your numbers and update them whenever you like. They are saved with a date so you still get growth over time.</p>';
  }
  return h+'</section>';
}
function audCard(c){
  var arr=W.snaps[c.id]||[],last=arr.length?arr[arr.length-1]:null,col=platCol(c.platform),yt=c.platform==="youtube";
  var fl=yt?"subscribers":"followers";
  var series=arr.map(function(s){return s.followers==null?0:Number(s.followers)});
  var d1=deltaOf(arr,"followers",864e5),d7=deltaOf(arr,"followers",7*864e5);
  var h='<article class="acard" style="--c:'+col+'" data-id="'+c.id+'"><header class="ac-h">'+
    (c.avatar_url?'<img class="ac-av" src="'+esc(c.avatar_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ac-av ac-ini">'+esc((c.title||c.handle||"?").slice(0,1).toUpperCase())+'</span>')+
    '<div class="ac-t"><b>'+esc(c.title||c.handle||"Untitled")+'</b><span><i class="ac-dot"></i>'+esc(platName(c.platform))+' · '+(c.kind==="watch"?"Following":"Yours")+(c.source==="manual"?" · Typed in":"")+'</span></div>'+
    '<span class="ac-up">'+(c.status==="error"?'<span class="ac-err" title="'+esc(c.last_error||"")+'">Problem</span>':"Updated "+sinceStr(last?last.ts:c.last_synced))+'</span></header>';
  h+='<div class="ac-stats"><div><b title="'+esc(nfull(last&&last.followers))+'">'+nf(last?last.followers:null)+'</b><small>'+fl+'</small>'+deltaHTML(d1,"today")+(d7!=null&&d7!==0?'<em class="dl '+(d7>0?"up":"down")+'">'+(d7>0?"+":"-")+nf(Math.abs(d7))+' this week</em>':"")+'</div>'+
    '<div><b title="'+esc(nfull(last&&last.views))+'">'+nf(last?last.views:null)+'</b><small>total views</small>'+deltaHTML(deltaOf(arr,"views",864e5),"today")+'</div>'+
    '<div><b>'+nf(last?last.posts:null)+'</b><small>'+(yt?"videos":"posts")+'</small>'+deltaHTML(deltaOf(arr,"posts",7*864e5),"this week")+'</div></div>';
  if(series.length>1)h+='<div class="ac-sp" style="--c:'+col+'">'+spark(series)+'<small>'+series.length+' readings, last 35 days</small></div>';
  else h+='<p class="muted ac-note">Growth charts appear after a few readings. The numbers refresh while this page is open.</p>';
  if(c.kind==="own"){
    var cur=last&&last.followers!=null?Number(last.followers):null;
    if(W.goalEd===c.id){h+='<div class="ac-goal ed"><label>Follower goal<input class="in" id="ag-in" inputmode="numeric" placeholder="e.g. 10000" value="'+(c.goal||"")+'"></label><button class="btn pri sm" data-act="aud_gsave" data-id="'+c.id+'">Save goal</button><button class="btn sm" data-act="aud_gedit" data-id="">Cancel</button></div>'}
    else if(c.goal&&cur!=null){var pc=Math.max(0,Math.min(100,Math.round(cur/c.goal*100)));var rate=deltaOf(arr,"followers",7*864e5);var eta="";
      if(cur>=c.goal)eta="Goal reached";else if(rate>0){var wk=Math.ceil((c.goal-cur)/rate);eta="About "+(wk<=1?"1 week":wk<104?wk+" weeks":"2+ years")+" at this week's pace"}
      h+='<div class="ac-goal"><div class="ag-t"><span>Goal: '+nf(c.goal)+' '+fl+'</span><b>'+pc+'%</b></div><div class="ag-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div><small>'+nf(cur)+' of '+nf(c.goal)+(eta?' · '+eta:'')+'</small><button class="btn sm" data-act="aud_gedit" data-id="'+c.id+'">Change</button></div>'}
    else h+='<div class="ac-goal"><button class="btn sm" data-act="aud_gedit" data-id="'+c.id+'">Set a follower goal</button></div>';
  }
  if(c.status==="error"&&c.last_error)h+='<p class="ac-errmsg">'+esc(c.last_error)+'</p>';
  var vids=(W.vids[c.id]||[]).slice(0,5);
  if(vids.length){
    h+='<div class="ac-vids"><h4>Recent videos</h4>'+vids.map(function(v){
      return '<a class="ac-v" href="https://www.youtube.com/watch?v='+esc(v.video_id)+'" target="_blank" rel="noopener noreferrer">'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ac-vph"></span>')+
        '<span class="ac-vt">'+esc(v.title||"")+'</span><span class="ac-vn">'+nf(v.views)+' views</span><span class="ac-vn">'+nf(v.likes)+' likes</span></a>';
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
  h+='<button class="btn sm" data-act="aud_del" data-id="'+c.id+'">Remove</button></footer></article>';
  return h;
}
function audListHTML(){
  if(!W.loaded)return '<p class="muted">Loading your channels…</p>';
  var h="";
  if(W.err)h+='<p class="ac-errmsg">'+esc(W.err)+' <button class="btn sm" data-act="aud_reload">Try again</button></p>';
  if(!W.conns.length&&!W.err)return h+'<div class="aud-empty"><b>No channels connected yet</b><span>Paste a public YouTube channel above to see its live numbers. Use your own channel once you have one, or one you want to learn from.</span></div>';
  var own=W.conns.filter(function(c){return c.kind==="own"}),watch=W.conns.filter(function(c){return c.kind==="watch"});
  if(own.length)h+='<h3 class="aud-h">Your channels</h3><div class="aud-grid">'+own.map(audCard).join("")+'</div>';
  if(watch.length)h+='<h3 class="aud-h">Channels you follow</h3><div class="aud-grid">'+watch.map(audCard).join("")+'</div>';
  return h;
}
function audHTML(){
  var h=hero("aud","Audience",null,'<button class="btn" data-act="aud_refresh"'+(W.busy?" disabled":"")+'>'+(W.busy?"Refreshing…":"Refresh numbers")+'</button>');
  if(!W.cfg)h+=audSetup();
  h+=audFormHTML();
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

/* ---------- creator page ---------- */
var CPACC=["#12163A","#5B5BF0","#0E9F6E","#E0388A","#F59E0B","#0284C7","#DC2626"];
function suggestHandle(){
  var base=((S.profile&&S.profile.name)||(window.__EMAIL||"").split("@")[0]||"creator").toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(base.length<3)base=(base+"creator").slice(0,12);return base.slice(0,24);
}
function normKit(k){
  k=k&&typeof k==="object"?k:{};
  function pairs(a,n){return (Array.isArray(a)?a:[]).slice(0,n).map(function(x){return [String(x&&x[0]||"").slice(0,40),String(x&&x[1]||"").slice(0,60)]})}
  return {on:!!k.on,intro:String(k.intro||"").slice(0,600),email:String(k.email||"").slice(0,120),stats:pairs(k.stats,6),rates:pairs(k.rates,8),
    brands:(Array.isArray(k.brands)?k.brands:[]).slice(0,10).map(function(b){return {name:String(b&&b.name||"").slice(0,60),note:String(b&&b.note||"").slice(0,120)}})};
}
async function cpLoad(){
  try{
    var r=await WSB.from("profiles").select("*").maybeSingle();
    if(r.error)throw r.error;
    var d=r.data;
    W.p=d?{handle:d.handle||"",display_name:d.display_name||"",tagline:d.tagline||"",bio:d.bio||"",accent:d.accent||"#12163A",look:d.look||"plain",is_public:!!d.is_public,avatar_url:d.avatar_url||"",links:Array.isArray(d.links)?d.links:[],kit:normKit(d.kit),exists:true}
      :{handle:suggestHandle(),display_name:(S.profile&&S.profile.name)||"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit(),exists:false};
    W.pLoaded=true;W.pErr="";
  }catch(e){W.pErr="Couldn't load your profile. "+((e&&e.message)||"");W.pLoaded=true;if(!W.p)W.p={handle:"",display_name:"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit()}}
  if(S.view==="cp")render();
}
function cpLink(){return location.origin+"/u/"+(W.p&&W.p.handle||"")}
function cpPreviewHTML(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#111111";
  return '<div class="cp-pv" data-look="'+(p.look||"plain")+'" style="--pa:'+ac+'">'+(p.avatar_url?'<img class="cp-av" src="'+esc(p.avatar_url)+'" alt="">':'<span class="cp-av cp-ini">'+esc((p.display_name||p.handle||"?").slice(0,1).toUpperCase())+'</span>')+
    '<b>'+esc(p.display_name||p.handle||"Your name")+'</b><span class="cp-h">@'+esc(p.handle||"handle")+'</span>'+(p.tagline?'<span class="cp-tg">'+esc(p.tagline)+'</span>':"")+(p.bio?'<p>'+esc(p.bio)+'</p>':"")+
    (p.links.length?'<div class="cp-ls">'+p.links.filter(function(l){return l.label||l.url}).map(function(l){return '<span>'+esc(l.label||l.url)+'</span>'}).join("")+'</div>':"")+'</div>';
}
var HANDLES=[["YouTube","https://youtube.com/@"],["Instagram","https://instagram.com/"],["TikTok","https://tiktok.com/@"],["X","https://x.com/"],["Facebook","https://facebook.com/"],["LinkedIn","https://linkedin.com/in/"],["Website",""]];
function hdFind(name){var L=W.p.links;for(var i=0;i<L.length;i++)if(L[i].label===name)return i;return -1}
function hdValue(h){var i=hdFind(h[0]);if(i<0)return "";var u=W.p.links[i].url||"";return h[1]&&u.indexOf(h[1])===0?u.slice(h[1].length):u}
function hdSet(h,raw){
  var v=String(raw||"").trim(),i=hdFind(h[0]);
  if(!v){if(i>=0)W.p.links.splice(i,1);return}
  var url;
  if(/^https?:\/\//i.test(v))url=v;
  else if(!h[1])url="https://"+v;
  else url=h[1]+v.replace(/^@+/,"").replace(/^\/+/,"");
  if(i>=0)W.p.links[i].url=url;else W.p.links.push({label:h[0],url:url});
}
function hdRows(){
  var names=HANDLES.map(function(h){return h[0]});
  var h='<div class="hd-list">'+HANDLES.map(function(x,k){
    var v=hdValue(x),i=hdFind(x[0]);
    return '<div class="hd-row"><b>'+x[0]+'</b><label class="cp-pre">'+(x[1]?'<i>@</i>':'')+'<input class="in" data-w="h.'+k+'" maxlength="200" value="'+esc(v)+'" placeholder="'+(x[1]?"yourname":"yourwebsite.com")+'" autocapitalize="none" spellcheck="false" aria-label="'+x[0]+' handle"></label>'+
      (i>=0&&W.p.links[i].url?'<a class="btn" href="'+esc(W.p.links[i].url)+'" target="_blank" rel="noopener noreferrer">Open</a>':'<span></span>')+'</div>';
  }).join("")+'</div>';
  var extra=W.p.links.map(function(l,i){return [l,i]}).filter(function(p){return names.indexOf(p[0].label)<0});
  if(extra.length)h+='<div class="plab" style="margin-top:14px">Other links'+extra.map(function(p){var i=p[1],l=p[0];return '<div class="cp-lr"><input class="in" data-w="l.'+i+'.label" maxlength="30" placeholder="Label" value="'+esc(l.label||"")+'"><input class="in" data-w="l.'+i+'.url" maxlength="300" placeholder="https://" value="'+esc(l.url||"")+'"><button class="ico" data-act="cp_ldel" data-id="'+i+'" aria-label="Remove link">'+I("x")+'</button></div>'}).join("")+'</div>';
  if(W.p.links.length<9)h+='<button class="btn" style="margin-top:12px" data-act="cp_ladd">Add another link</button>';
  return h;
}
var ACCENTS=["#111111","#E5484D","#F5A524","#30A46C","#0091FF","#8E4EC6","#E0388A","#0F766E"];
var LOOKS=[["plain","Plain"],["tint","Tinted"],["glow","Glow"],["dark","Dark"]];
function lookPanel(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#111111";
  return '<div class="plab">Accent colour<div class="acc-row">'+ACCENTS.map(function(c){return '<button class="acc-sw" data-act="cp_acc" data-id="'+c+'" style="--c:'+c+'" aria-label="Accent '+c+'" aria-pressed="'+(c.toLowerCase()===ac.toLowerCase())+'"></button>'}).join("")+'<input type="color" class="acc-in" data-w="p.accent" value="'+ac+'" aria-label="Custom accent colour"></div></div>'+
    '<div class="plab">Page look<div class="hd-seg" role="group" aria-label="Page look">'+LOOKS.map(function(o){return '<button data-act="cp_look" data-id="'+o[0]+'" aria-pressed="'+((p.look||"plain")===o[0])+'">'+o[1]+'</button>'}).join("")+'</div></div>';
}
async function cpShareImage(){
  var p=W.p;if(!p||!p.handle){toast("Save your handle first");return}
  var stats=[];
  try{
    var cs=await WSB.from("connections").select("id,platform").eq("user_id",window.__UID).eq("show_public",true).eq("kind","own");
    var ids=(cs.data||[]).map(function(c){return c.id});
    if(ids.length){var sn=await WSB.from("snapshots").select("connection_id,followers,ts").in("connection_id",ids).order("ts",{ascending:false}).limit(100);var got={};(sn.data||[]).forEach(function(x){if(!got[x.connection_id])got[x.connection_id]=x});
      stats=(cs.data||[]).map(function(c){var s=got[c.id];return s&&s.followers!=null?[c.platform==="youtube"?"YouTube":c.platform.charAt(0).toUpperCase()+c.platform.slice(1),s.followers]:null}).filter(Boolean)}
  }catch(e){}
  if(window.csShare)window.csShare({name:p.display_name||p.handle,handle:p.handle,tagline:p.tagline,accent:p.accent,look:p.look,avatar:p.avatar_url,stats:stats});
}
function cpHTML(){
  if(!W.pLoaded){cpLoad();return hero("cp","Handles",null,"")+'<p class="muted">Loading…</p>'}
  var p=W.p,mode=themeMode();
  var h=hero("cp","Handles",null,'<button class="btn pri" data-act="cp_save"'+(W.pSaving?" disabled":"")+'>'+(W.pSaving?"Saving…":"Save")+'</button>');
  if(W.pErr)h+='<p class="ac-errmsg">'+esc(W.pErr)+'</p>';
  h+='<div class="cp-grid"><div class="cp-form" style="display:flex;flex-direction:column;gap:14px">'+
    '<section class="panel cp-form"><h3>Your handles</h3><p class="muted" style="margin:-4px 0 6px;font-size:14px">Add the accounts people can find you on. They show on your public page.</p>'+hdRows()+'</section>'+
    '<section class="panel cp-form"><h3>Public page</h3>'+
    '<div class="prow"><span class="av lg" id="cpavprev">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':esc((p.display_name||"?").slice(0,1).toUpperCase()))+'</span><div class="pbtns"><button class="btn sm" data-act="cp_avatar">Upload photo</button><button class="btn sm" data-act="cp_avrm"'+(p.avatar_url?"":" disabled")+'>Remove</button></div></div>'+
    '<label class="plab">Your link<span class="cp-pre"><i>/u/</i><input class="in" data-w="p.handle" maxlength="24" value="'+esc(p.handle)+'" placeholder="yourname" autocapitalize="none" spellcheck="false"></span></label>'+
    '<label class="plab">Name<input class="in" data-w="p.display_name" maxlength="60" value="'+esc(p.display_name)+'"></label>'+
    '<label class="plab">Tagline<input class="in" data-w="p.tagline" maxlength="90" value="'+esc(p.tagline)+'" placeholder="What you make, in one line"></label>'+
    '<label class="plab">About<textarea class="in" data-w="p.bio" rows="4" maxlength="600" placeholder="A few lines about you and your work">'+esc(p.bio)+'</textarea></label>'+
    lookPanel()+'<label class="cp-pub"><input type="checkbox" data-act="cp_pub"'+(p.is_public?" checked":"")+'> Make this page public</label>'+
    '<p id="cpmsg" class="aud-msg" role="status">'+esc(W.pMsg)+'</p></section>'+kitPanel()+(window.__WS?'':shPanel())+'</div>'+
    '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+
    '<div class="panel"><h3>Your link</h3>'+(p.exists&&p.is_public?'<p class="cp-url">'+esc(cpLink())+'</p><div class="drow"><button class="btn pri" data-act="cp_copy">Copy link</button><button class="btn" data-act="cp_open">Open page</button></div><div class="drow"><button class="btn" data-act="cp_shareimg">Share as image</button></div>':'<p class="muted" style="margin:0">'+(p.exists?'Your page is private. Turn on "Make this page public" and save to get a link.':'Save to get a link.')+'</p>')+
    '<p class="muted" style="font-size:13px;margin:12px 0 0">Channels you switch on in Audience show here with their latest numbers.</p></div>'+
    '<div class="panel"><h3>Account</h3><p style="margin:0 0 12px;font-size:14px">'+esc(window.__EMAIL||"")+'</p>'+
    '<div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>'+
    '<div class="hd-seg" role="group" aria-label="Sounds" style="margin-top:10px">'+[["on","Sounds on"],["off","Sounds off"]].map(function(o){return '<button data-act="snd" data-id="'+o[0]+'" aria-pressed="'+((o[0]==="on")===sndOn())+'">'+o[1]+'</button>'}).join("")+'</div>'+
    pushPanel()+'<div class="drow"><button class="btn" data-act="cp_pw">Email me a password reset</button><button class="btn" data-act="signout">Sign out</button></div></div></aside></div>'+
    '<input type="file" id="cpfile" accept="image/*" hidden>';
  return h;
}
function kitRows(title,key,arr,ph1,ph2,max,hint){
  var h='<div class="kt-blk"><div class="kt-h"><b>'+title+'</b>'+(arr.length<max?'<button class="btn sm" data-act="kit_add" data-id="'+key+'">Add</button>':"")+'</div>';
  if(hint&&!arr.length)h+='<p class="muted kt-hint">'+hint+'</p>';
  h+=arr.map(function(x,i){
    var a=key==="b"?x.name:x[0],b=key==="b"?x.note:x[1],f1=key==="b"?"name":"0",f2=key==="b"?"note":"1";
    return '<div class="kt-row"><input class="in" data-w="k.'+key+'.'+i+'.'+f1+'" maxlength="60" placeholder="'+ph1+'" value="'+esc(a)+'" aria-label="'+ph1+'"><input class="in" data-w="k.'+key+'.'+i+'.'+f2+'" maxlength="'+(key==="b"?120:60)+'" placeholder="'+ph2+'" value="'+esc(b)+'" aria-label="'+ph2+'"><button class="ico" data-act="kit_del" data-id="'+key+'.'+i+'" aria-label="Remove">'+I("x")+'</button></div>';
  }).join("")+'</div>';
  return h;
}
function kitPanel(){
  var k=W.p.kit;
  return '<section class="panel cp-form"><h3>Media kit</h3><p class="muted" style="margin:-4px 0 6px;font-size:14px">A page for sponsors: your numbers, rates and past brands. Send them the link or save it as a PDF.</p>'+
    '<label class="cp-pub"><input type="checkbox" data-act="kit_on"'+(k.on?" checked":"")+'> Publish my media kit</label>'+
    '<label class="plab">Intro<textarea class="in" data-w="k.intro" rows="3" maxlength="600" placeholder="Who you are, what you make and who watches">'+esc(k.intro)+'</textarea></label>'+
    '<label class="plab">Contact email<input class="in" data-w="k.email" maxlength="120" placeholder="business@yourname.com" value="'+esc(k.email)+'"></label>'+
    kitRows("Extra stats","s",k.stats,"Label, e.g. Avg. views","Value",6,"Your connected channels already show their numbers. Add things like average views or top region.")+
    kitRows("Rates","r",k.rates,"Service, e.g. Integrated video","Price",8,"Add what you charge.")+
    kitRows("Brands you have worked with","b",k.brands,"Brand","What you did",10,"Add past sponsors or collaborations.")+
    '<div class="drow"><button class="btn" data-act="kit_import">Import from Business tab</button>'+(W.p.exists&&W.p.is_public&&k.on?'<a class="btn" href="/u/'+esc(W.p.handle)+'/kit" target="_blank" rel="noopener noreferrer">Open media kit</a><button class="btn" data-act="kit_copy">Copy link</button>':'')+'</div>'+
    '<p class="muted" style="font-size:13px;margin:0">The kit is shown only when your page is public and this is switched on. Remember to press Save.</p></section>';
}
/* ---------- teammates ---------- */
var SH={loaded:false,loading:false,list:[],ws:[],email:"",role:"editor",space:"",msg:""};
async function shLoad(){
  if(SH.loading)return;SH.loading=true;
  try{
    var a=await WSB.from("shares").select("*").eq("owner_id",window.__UID).order("created_at");
    var b=await WSB.rpc("list_workspaces");
    SH.list=a.data||[];SH.ws=b.data||[];if(a.error)SH.msg="Couldn't load teammates.";
  }catch(e){SH.msg="Couldn't load teammates."}
  SH.loaded=true;SH.loading=false;if(S.view==="cp")render();
}
function shMsg(t){SH.msg=t||"";var e=$("shmsg");if(e)e.textContent=SH.msg}
function shSpaceName(id){
  if(!id)return "Everything";
  var f=(S.spaces||[]).concat(S.iso||[]).filter(function(x){return x.id===id})[0];return f?f.name:"A space";
}
function shIsIso(id){return (S.iso||[]).some(function(x){return x.id===id})}
function shAccessOpts(sel){
  var o='<option value=""'+(!sel?" selected":"")+'>Everything</option>';
  (S.spaces||[]).forEach(function(x){o+='<option value="'+esc(x.id)+'"'+(sel===x.id?" selected":"")+'>Only '+esc(x.name)+'</option>'});
  (S.iso||[]).forEach(function(x){o+='<option value="'+esc(x.id)+'"'+(sel===x.id?" selected":"")+'>Only '+esc(x.name)+' (private)</option>'});
  return o;
}
function shPanel(){
  var h='<section class="panel cp-form"><h3>Teammates</h3><p class="muted" style="margin:-4px 0 6px;font-size:14px">Let someone else work in your Creator Space. They sign in with the email you enter, then open it from this page. Choose to share everything, or only one space. A single space is kept completely apart: they cannot see your other spaces. Editors can change things. Viewers can only look.</p>'+
    '<div class="sh-add"><input class="in" data-w="sh.email" type="email" maxlength="120" placeholder="teammate@email.com" value="'+esc(SH.email)+'" aria-label="Teammate email" autocapitalize="none" spellcheck="false"><select class="wsel" data-w="sh.space" aria-label="What they can open">'+shAccessOpts(SH.space)+'</select><select class="wsel" data-w="sh.role" aria-label="Role"><option value="editor"'+(SH.role==="editor"?" selected":"")+'>Editor</option><option value="viewer"'+(SH.role==="viewer"?" selected":"")+'>Viewer</option></select><button class="btn pri" data-act="sh_invite">Invite</button></div>'+
    '<p id="shmsg" class="aud-msg" role="status">'+esc(SH.msg)+'</p>';
  if(!SH.loaded){shLoad();h+='<p class="muted">Loading…</p>'}
  else if(SH.list.length)h+='<div class="sh-list">'+SH.list.map(function(x,i){return '<div class="sh-row"><span class="sh-em">'+esc(x.invitee_email)+'<small> · '+esc(shSpaceName(x.space_id))+'</small></span><select class="wsel" data-w="sh.r.'+i+'" aria-label="Role for '+esc(x.invitee_email)+'"><option value="editor"'+(x.role==="editor"?" selected":"")+'>Editor</option><option value="viewer"'+(x.role==="viewer"?" selected":"")+'>Viewer</option></select><span class="sh-btns"><button class="btn sm" data-act="sh_mail" data-id="'+i+'">Email invite</button><button class="btn sm" data-act="sh_del" data-id="'+esc(x.id)+'">Remove</button></span></div>'}).join("")+'</div>';
  else h+='<p class="muted" style="margin:0">No teammates yet.</p>';
  if((S.iso||[]).length)h+='<h3 style="margin-top:18px">Your private spaces</h3><p class="muted" style="margin:-4px 0 6px;font-size:13px">These are kept apart so they can be shared on their own. Open one to work in it.</p><div class="sh-list">'+S.iso.map(function(x){return '<div class="sh-row"><span class="sh-em">'+esc(x.name)+'</span><button class="btn sm pri" data-act="sh_openiso" data-id="'+esc(x.id)+'">Open</button></div>'}).join("")+'</div>';
  if(SH.ws.length)h+='<h3 style="margin-top:18px">Shared with you</h3><div class="sh-list">'+SH.ws.map(function(w,i){return '<div class="sh-row"><span class="sh-em">'+esc(w.owner_email)+'<small> · '+(w.space_id?"One space · ":"")+(w.role==="editor"?"Editor":"Viewer")+'</small></span><button class="btn sm pri" data-act="sh_open" data-id="'+i+'">Open</button><button class="btn sm" data-act="sh_leave" data-id="'+i+'">Leave</button></div>'}).join("")+'</div>';
  return h+'</section>';
}
function shWsKey(){return "cs-ws-"+window.__UID}
function cpMsg(t){W.pMsg=t||"";var e=$("cpmsg");if(e)e.textContent=W.pMsg}
function cpPreviewPaint(){var e=$("cppv");if(e)e.innerHTML=cpPreviewHTML();var a=$("cpavprev");if(a&&W.p){a.innerHTML=W.p.avatar_url?'<img src="'+esc(W.p.avatar_url)+'" alt="">':esc((W.p.display_name||"?").slice(0,1).toUpperCase())}}
function kitClean(k){
  k=normKit(k);
  var ok=function(x){return x[0].trim()||x[1].trim()};
  k.stats=k.stats.filter(ok);k.rates=k.rates.filter(ok);k.brands=k.brands.filter(function(b){return b.name.trim()||b.note.trim()});
  return k;
}
async function cpSave(){
  var p=W.p;
  p.handle=(p.handle||"").trim().toLowerCase();
  if(!/^[a-z0-9_]{3,24}$/.test(p.handle)){cpMsg("Handles use 3 to 24 letters, numbers or underscores.");return}
  var links=p.links.map(function(l){return {label:(l.label||"").trim().slice(0,30),url:(l.url||"").trim()}}).filter(function(l){return l.url||l.label});
  for(var i=0;i<links.length;i++){if(!/^https?:\/\/\S+\.\S+/i.test(links[i].url)){cpMsg("Link "+(i+1)+" needs a full address starting with https://");return}}
  W.pSaving=true;cpMsg("Saving…");
  var row={user_id:window.__UID,handle:p.handle,display_name:(p.display_name||"").trim()||null,tagline:(p.tagline||"").trim()||null,bio:(p.bio||"").trim()||null,avatar_url:p.avatar_url||null,accent:p.accent,look:p.look||"plain",links:links,kit:kitClean(p.kit),is_public:!!p.is_public,updated_at:new Date().toISOString()};
  var r=await WSB.from("profiles").upsert(row,{onConflict:"user_id"});
  W.pSaving=false;
  if(r.error){cpMsg(r.error.code==="23505"?"That handle is taken. Try another.":"Couldn't save. "+r.error.message);return}
  p.links=links;p.exists=true;W.pMsg="Saved.";render();toast("Creator page saved");
}

/* ---------- actions ---------- */
function webAct(a,b){
  var id=b.dataset.id;
  switch(a){
    case "spaceadd":case "delspace":case "renamespace":if(window.__WS&&window.__WS.space){toast("This space is managed from the owner's workspace");return true}return false;
    case "push_on":pushOn();return true;
    case "push_off":pushOff();return true;
    case "push_test":pushTest();return true;
    case "calsync":calSync(false);return true;
    case "calnew":calSync(true);return true;
    case "calcopy":copy(CAL.url);return true;
    case "sharehelp":if(window.__WS){toast("Switch back to your own workspace to share your page");return true}S.view="cp";render();return true;
    case "more":sound("tick");moreOpen();return true;
    case "rail":railSet(!document.querySelector(".app").classList.contains("rail"));return true;
    case "snd":sndSet(id==="on");if(id==="on")sound("on");if($("msheet")&&!$("msheet").hidden)moreOpen();else render();return true;
    case "view":sound("tick");moreClose();return false;
    case "datadlg":moreClose();return false;
    case "ms_theme":setMode(id);if($("msheet")&&!$("msheet").hidden)moreOpen();else render();return true;
    case "aud_gedit":W.goalEd=id||null;audPaint();return true;
    case "aud_gsave":{var gi=$("ag-in"),gv=numOrNull(gi&&gi.value);if(gv!==null&&(isNaN(gv)||gv<1)){toast("Enter a whole number above zero");return true}
      WSB.from("connections").update({goal:gv}).eq("id",id).then(function(r){if(r.error){toast("Couldn't save the goal")}else{var c=W.conns.filter(function(x){return x.id===id})[0];if(c)c.goal=gv;W.goalEd=null;audPaint();toast(gv?"Goal saved":"Goal cleared")}});return true}
    case "aud_plat":W.plat=id;render();return true;
    case "aud_kind":W.kind=id;render();return true;
    case "aud_add":audAdd();return true;
    case "aud_addm":audAddManual();return true;
    case "aud_refresh":audRefresh(true);return true;
    case "aud_reload":audLoad();return true;
    case "aud_man":W.manual=id;audPaint();return true;
    case "aud_mcancel":W.manual=null;audPaint();return true;
    case "aud_msave":audSaveManual(id);return true;
    case "aud_pub":{var on=!!b.checked;WSB.from("connections").update({show_public:on}).eq("id",id).then(function(r){if(r.error){toast("Couldn't change that");audLoad()}else{var c=W.conns.filter(function(x){return x.id===id})[0];if(c)c.show_public=on;toast(on?"Shown on your public page":"Hidden from your public page")}});return true}
    case "aud_del":arm(b,function(){WSB.from("connections").delete().eq("id",id).then(function(r){if(r.error)toast("Couldn't remove it");else{W.conns=W.conns.filter(function(c){return c.id!==id});audPaint();toast("Removed")}})});return true;
    case "cp_save":cpSave();return true;
    case "sh_invite":{
      var em=String(SH.email||"").trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(em)){shMsg("Enter a valid email address.");return true}
      if(em===String(window.__EMAIL||"").toLowerCase()){shMsg("That is your own email.");return true}
      if(SH.space&&!shIsIso(SH.space)){
        var sn=shSpaceName(SH.space);
        if(S.spaces.length<2){shMsg("You need at least one other space to keep for yourself. Add another space first.");return true}
        showInfo("Share only "+sn+"?",'<p style="margin:0 0 10px">To keep <b>'+esc(sn)+'</b> apart from your other spaces, it moves into its own private area. After that:</p><ul style="margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li>You open it from <b>Your private spaces</b> on this page.</li><li>It no longer shows in your main Overview, search or reminders.</li><li>Nothing is lost. Your notes, tasks, ideas and whiteboard come with it.</li></ul><div class="row"><button class="btn" data-act="dlgclose">Cancel</button><button class="btn pri" data-act="sh_isogo">Move and invite</button></div>');
        return true}
      shAdd(em,SH.role,SH.space);return true}
    case "sh_isogo":{var gsp=SH.space,gem=String(SH.email||"").trim().toLowerCase(),grole=SH.role;infoHTML="";renderDialog();shMsg("Moving the space…");
      isolateSpace(gsp).then(function(ok){if(ok)shAdd(gem,grole,gsp);else shMsg("Couldn't move the space. Nothing was changed.")});return true}
    case "sh_openiso":{var ix=(S.iso||[]).filter(function(x){return x.id===id})[0];
      try{localStorage.setItem(shWsKey(),JSON.stringify({owner:window.__UID,space:id,label:ix?ix.name:""}))}catch(e){}location.reload();return true}
    case "sh_mail":{var mx=SH.list[+id];if(!mx)return true;
      var who=(S.profile&&S.profile.name)||String(window.__EMAIL||"").split("@")[0],role=mx.role==="editor"?"edit":"view";
      var body="Hi,\n\n"+who+" invited you to "+role+" their Creator Space.\n\n1. Open "+location.origin+"\n2. Sign in (or create an account) with this email: "+mx.invitee_email+"\n3. Open the Handles page and choose "+who+"'s workspace under \"Shared with you\".\n\nSee you there.";
      var href="mailto:"+encodeURIComponent(mx.invitee_email)+"?subject="+encodeURIComponent(who+" invited you to Creator Space")+"&body="+encodeURIComponent(body);
      var a=document.createElement("a");a.href=href;document.body.appendChild(a);a.click();a.remove();
      try{navigator.clipboard&&navigator.clipboard.writeText(body).catch(function(){})}catch(e){}
      shMsg("Your email app opened with the invite. The text is also copied in case it didn't.");return true}
    case "sh_del":WSB.from("shares").delete().eq("id",id).then(function(r){if(r.error)shMsg("Couldn't remove.");else{SH.loaded=false;shLoad()}});return true;
    case "sh_open":{var ow=SH.ws[+id];if(!ow)return true;try{localStorage.setItem(shWsKey(),JSON.stringify({owner:ow.owner_id,space:ow.space_id||"",label:ow.space_id?"":""}))}catch(e){}location.reload();return true}
    case "sh_home":try{localStorage.removeItem(shWsKey())}catch(e){}location.reload();return true;
    case "sh_leave":{var lw=SH.ws[+id];if(!lw)return true;var lq=WSB.from("shares").delete().eq("owner_id",lw.owner_id).eq("invitee_email",String(window.__EMAIL||"").toLowerCase());lq=lw.space_id?lq.eq("space_id",lw.space_id):lq.is("space_id",null);lq.then(function(r){if(r.error)shMsg("Couldn't leave.");else{SH.loaded=false;shLoad()}});return true}
    case "kit_on":W.p.kit.on=!!b.checked;return true;
    case "kit_add":{var kk=W.p.kit;if(id==="b")kk.brands.push({name:"",note:""});else kk[id==="r"?"rates":"stats"].push(["",""]);render();return true}
    case "kit_del":{var kd=id.split("."),kq=W.p.kit;(kd[0]==="b"?kq.brands:(kd[0]==="r"?kq.rates:kq.stats)).splice(+kd[1],1);render();return true}
    case "kit_import":{var bk=(S.kit&&S.kit[S.cur])||null;if(!bk){toast("Nothing in the Business tab yet");return true}
      var kz=W.p.kit,add=function(dst,src,n){(src||[]).forEach(function(x){if(x&&x[1]&&dst.length<n&&!dst.some(function(y){return y[0]===x[0]}))dst.push([String(x[0]),String(x[1])])})};
      add(kz.stats,bk.stats,6);add(kz.rates,bk.rates,8);if(!kz.email&&bk.email)kz.email=bk.email;if(!kz.intro&&bk.bio)kz.intro=bk.bio;render();toast("Imported. Press Save to publish.");return true}
    case "kit_copy":navigator.clipboard&&navigator.clipboard.writeText(location.origin+"/u/"+W.p.handle+"/kit").then(function(){toast("Media kit link copied")});return true;
    case "cp_acc":W.p.accent=id;render();return true;
    case "cp_look":W.p.look=id;render();return true;
    case "cp_shareimg":cpShareImage();return true;
    case "cp_ladd":W.p.links.push({label:"",url:""});render();return true;
    case "cp_ldel":W.p.links.splice(+id,1);render();return true;
    case "cp_pub":W.p.is_public=!!b.checked;return true;
    case "cp_avatar":{var f=$("cpfile");if(f)f.click();return true}
    case "cp_avrm":W.p.avatar_url="";render();return true;
    case "cp_copy":copy(cpLink());return true;
    case "cp_open":window.open(cpLink(),"_blank","noopener");return true;
    case "cp_pw":WSB.auth.resetPasswordForEmail(window.__EMAIL||"",{redirectTo:location.origin}).then(function(r){toast(r.error?"Couldn't send the email":"Reset link sent to your email")});return true;
    case "signout":arm(b,function(){
      if(typeof SY!=="undefined"&&SY.pending&&navigator.onLine!==false){toast("Finishing your last save. Try again in a moment.");syFlush&&syFlush();return}
      try{if(typeof SY==="undefined"||!SY.pending){["","-meta","-snap","-pref","-theme"].forEach(function(x){localStorage.removeItem(LS+x)})}}catch(e){}
      window.__signOut();
    });return true;
  }
  return false;
}
document.addEventListener("input",function(e){
  var t=e.target,w=t&&t.dataset&&t.dataset.w;if(!w)return;
  if(w.indexOf("h.")===0&&W.p){hdSet(HANDLES[+w.slice(2)],t.value);cpPreviewPaint()}
  else if(w==="sh.email"){SH.email=t.value}
  else if(w==="sh.role"){SH.role=t.value}
  else if(w==="sh.space"){SH.space=t.value}
  else if(w.indexOf("sh.r.")===0){var sx=SH.list[+w.slice(5)];if(sx){var nr=t.value;WSB.from("shares").update({role:nr}).eq("id",sx.id).then(function(r){if(r.error)shMsg("Couldn't change the role.");else{sx.role=nr;shMsg("Role updated.")}})}}
  else if(w.indexOf("k.")===0&&W.p){var kp=w.split("."),kk=W.p.kit;
    if(kp.length===2)kk[kp[1]]=t.value;
    else if(kp[1]==="b"){if(kk.brands[+kp[2]])kk.brands[+kp[2]][kp[3]]=t.value}
    else{var ka=kp[1]==="r"?kk.rates:kk.stats;if(ka[+kp[2]])ka[+kp[2]][+kp[3]]=t.value}}
  else if(w.indexOf("p.")===0&&W.p){W.p[w.slice(2)]=t.value;cpPreviewPaint()}
  else if(w.indexOf("l.")===0&&W.p){var m=w.split(".");var l=W.p.links[+m[1]];if(l){l[m[2]]=t.value;cpPreviewPaint()}}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t&&t.id==="cpfile"){
    var f=t.files&&t.files[0];t.value="";if(!f||!W.p)return;
    if(!/^image\//.test(f.type)){toast("Choose an image");return}
    if(f.size>5*1048576){toast("Choose a photo under 5 MB");return}
    if(!assets){toast("Uploads aren't ready yet");return}
    toast("Uploading…");
    assets.upload(f).then(function(r){W.p.avatar_url=r.url;render();toast("Photo added. Save the page to publish it.")}).catch(function(){toast("Upload failed. Try again.")});
  }
});

ICONS.grid='<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>';
var DOCK=["home","notes","ideas","plan"];
function webTabs(){
  return DOCK.map(function(id){var v=vmeta(id);return '<button data-act="view" data-id="'+id+'" aria-current="'+(S.view===id)+'">'+I(v.ic)+'<span>'+v.name+'</span></button>'}).join("")+
    '<button data-act="more" aria-haspopup="dialog" aria-current="'+(DOCK.indexOf(S.view)<0)+'">'+I("grid")+'<span>More</span></button>';
}
function moreInner(){
  var last="",out='<div class="msheet-box" role="dialog" aria-modal="true" aria-label="All tools"><div class="ms-grid">',open=true,mode=themeMode();
  VIEWS.forEach(function(v){
    if(v.g&&v.g!==last){last=v.g;out+='</div><p class="ms-g">'+esc(v.g)+'</p><div class="ms-grid">'}
    out+='<button data-act="view" data-id="'+v.id+'" aria-current="'+(S.view===v.id)+'">'+I(v.ic)+'<span>'+esc(v.name)+'</span></button>';
  });
  out+='</div><p class="ms-g">Sounds</p><div class="hd-seg" role="group" aria-label="Sounds">'+[["on","On"],["off","Off"]].map(function(o){return '<button data-act="snd" data-id="'+o[0]+'" aria-pressed="'+((o[0]==="on")===sndOn())+'">'+o[1]+'</button>'}).join("")+'</div><p class="ms-g">Appearance</p><div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>'+
    '<div class="ms-row"><button data-act="datadlg">Data and backup</button></div></div>';
  return out;
}
function moreOpen(){var el=$("msheet");if(!el){el=document.createElement("div");el.id="msheet";el.className="msheet";document.body.appendChild(el);el.addEventListener("click",function(e){if(e.target===el)moreClose()})}el.innerHTML=moreInner();el.hidden=false}
function moreClose(){var el=$("msheet");if(el)el.hidden=true}
document.addEventListener("keydown",function(e){if(e.key==="Escape")moreClose()});
function webView(v){
  if(v==="aud"){if(!W.loaded&&!W.loading)audLoad();return audHTML()}
  if(v==="cp")return cpHTML();
  return null;
}
function webMount(v){
  clearInterval(W.timer);W.timer=null;
  if(v==="aud"){
    ["a.in","a.h","a.fo","a.vw","a.po"].forEach(function(){});
    if(Date.now()-W.lastRefresh>60000)audRefresh(false);
    W.timer=setInterval(function(){
      if(S.view!=="aud"||document.visibilityState==="hidden"||W.busy)return;
      W.tick++;if(W.tick%5===0)audRefresh(false);else audLoad(true);
    },60000);
  }
}


/* ---- motion: count numbers up when a page opens ---- */
(function(){
  var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  window.__csCount=function(root){
    if(RM||!root)return;
    root.querySelectorAll(".stat b,.kpi b,.vz-big,.pp-num").forEach(function(el){
      if(el.children.length)return;
      var t=el.textContent,m=t.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
      if(!m)return;
      var pre=m[1],raw=m[2],suf=m[3],dec=(raw.split(".")[1]||"").length,end=parseFloat(raw.replace(/,/g,""));
      if(!isFinite(end)||end<=0||end>1e12)return;
      var t0=performance.now(),dur=750;
      (function step(now){
        var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3),v=end*e;
        el.textContent=k>=1?t:pre+(dec?v.toFixed(dec):Math.round(v).toLocaleString("en-US"))+suf;
        if(k<1)requestAnimationFrame(step)
      })(t0)
    })
  };
  /* first load: play the page entrance once */
  var n=0,iv=setInterval(function(){
    var w=document.getElementById("wrap");
    if(w&&w.children.length){clearInterval(iv);w.classList.add("enter");window.__csCount(w);setTimeout(function(){w.classList.remove("enter")},900)}
    else if(++n>40)clearInterval(iv)
  },120);
})();


/* ---- calendar sync: a private link that Google, Apple or Outlook calendar can subscribe to ---- */
var CAL={url:""};
async function calSync(fresh){
  if(window.__WS){toast("Open your own workspace to sync your calendar");return}
  try{
    var uid=window.__UID,r=await WSB.from("cal_tokens").select("token").eq("user_id",uid).maybeSingle();
    if(fresh&&r.data){await WSB.from("cal_tokens").delete().eq("user_id",uid);r={data:null}}
    if(!r.data){r=await WSB.from("cal_tokens").insert({user_id:uid}).select("token").single()}
    if(r.error||!r.data){toast("Couldn't make a calendar link. Try again.");return}
    CAL.url=location.origin+"/cal/"+r.data.token+".ics";
    var web=CAL.url.replace(/^https?:/,"webcal:");
    showInfo("Sync to your calendar",
      '<p style="margin:0 0 10px">Your scheduled posts and task due dates show up in Google Calendar, Apple Calendar or Outlook. It updates on its own, usually within a few hours.</p>'+
      '<input class="in" readonly value="'+esc(CAL.url)+'" aria-label="Calendar link" onfocus="this.select()" style="margin-bottom:10px">'+
      '<div class="drow" style="flex-wrap:wrap"><button class="btn pri" data-act="calcopy">Copy link</button>'+
      '<a class="btn" target="_blank" rel="noopener noreferrer" href="https://calendar.google.com/calendar/r?cid='+encodeURIComponent(web)+'">Add to Google Calendar</a>'+
      '<a class="btn" href="'+esc(web)+'">Apple / Outlook</a></div>'+
      '<p class="muted" style="margin:12px 0 0;font-size:13px">Anyone with this link can see the titles and dates, so keep it private. <button class="btn sm" data-act="calnew" style="margin-left:4px">Make a new link</button> stops the old one working.</p>');
  }catch(e){toast("Couldn't make a calendar link. Try again.")}
}


/* ---- phone and desktop alerts (web push) ---- */
var PUSH={ready:false,on:false,perm:"default",busy:false,msg:"",key:"BMGAVIDOgVBd8tRFH6K3h3UudIPMT-S8N3MPZXbhree40-_YO98Pv1kv7ilnMUjJe4BZnKBlrnvmPGa22_Pqvx0"};
function pushOK(){return "serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window}
function pushB64(b){var p="=".repeat((4-b.length%4)%4),r=(b+p).replace(/-/g,"+").replace(/_/g,"/"),w=atob(r),o=new Uint8Array(w.length);for(var i=0;i<w.length;i++)o[i]=w.charCodeAt(i);return o}
function pushBuf(b){var a=new Uint8Array(b),s="";for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function pushRefresh(){
  PUSH.ready=true;
  try{PUSH.perm=Notification.permission;var reg=await navigator.serviceWorker.getRegistration();var sub=reg&&await reg.pushManager.getSubscription();PUSH.on=!!sub&&PUSH.perm==="granted"}catch(e){}
  if(S.view==="cp")render();
}
function pushPanel(){
  var h='<div class="plab" style="margin:0 0 12px">Alerts<p class="muted" style="margin:2px 0 8px;font-size:13px">A morning summary of tasks and posts due today, plus a message when you reach an audience goal or a channel dips.</p>';
  if(!pushOK())return h+'<p class="muted" style="margin:0;font-size:13px">This browser can\'t show alerts. On iPhone, add Creator Space to your Home Screen first, then open it from there.</p></div>';
  if(!PUSH.ready){pushRefresh();return h+'<p class="muted" style="margin:0">Checking…</p></div>'}
  if(PUSH.perm==="denied")return h+'<p class="muted" style="margin:0;font-size:13px">Alerts are blocked for this site. Allow notifications in your browser settings, then come back.</p></div>';
  h+='<div class="drow">'+(PUSH.on?'<button class="btn" data-act="push_test"'+(PUSH.busy?" disabled":"")+'>Send a test</button><button class="btn" data-act="push_off"'+(PUSH.busy?" disabled":"")+'>Turn off here</button>':'<button class="btn pri" data-act="push_on"'+(PUSH.busy?" disabled":"")+'>Turn on alerts</button>')+'</div>';
  return h+'<p id="pushmsg" class="aud-msg" role="status">'+esc(PUSH.msg)+'</p></div>';
}
function pushMsg(t){PUSH.msg=t||"";var e=$("pushmsg");if(e)e.textContent=PUSH.msg}
async function pushOn(){
  if(PUSH.busy)return;PUSH.busy=true;pushMsg("");
  try{
    var perm=await Notification.requestPermission();PUSH.perm=perm;
    if(perm!=="granted"){PUSH.busy=false;pushMsg(perm==="denied"?"Alerts were blocked.":"Alerts weren't turned on.");render();return}
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushB64(PUSH.key)});
    var j=sub.toJSON(),k=j.keys||{};
    var tz="Asia/Kolkata";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz}catch(e){}
    var r=await WSB.from("push_subs").upsert({user_id:window.__UID,endpoint:sub.endpoint,p256dh:k.p256dh,auth:k.auth,tz:tz},{onConflict:"endpoint"});
    if(r.error)throw r.error;
    PUSH.on=true;PUSH.msg="Alerts are on for this device.";
  }catch(e){PUSH.msg="Couldn't turn on alerts. "+((e&&e.message)||"")}
  PUSH.busy=false;render();
}
async function pushOff(){
  if(PUSH.busy)return;PUSH.busy=true;
  try{
    var reg=await navigator.serviceWorker.getRegistration(),sub=reg&&await reg.pushManager.getSubscription();
    if(sub){var ep=sub.endpoint;await sub.unsubscribe();await WSB.from("push_subs").delete().eq("endpoint",ep)}
    PUSH.on=false;PUSH.msg="Alerts are off on this device.";
  }catch(e){PUSH.msg="Couldn't turn off alerts."}
  PUSH.busy=false;render();
}
async function pushTest(){
  if(PUSH.busy)return;PUSH.busy=true;pushMsg("Sending…");
  try{
    var r=await WSB.functions.invoke("push",{body:{test:true}});
    if(r.error)throw r.error;
    var d=r.data||{},ok=(d.codes||[]).filter(function(c){return c===201}).length;
    PUSH.msg=ok?"Sent. It should appear in a few seconds.":"The test didn't go through. Try turning alerts off and on again.";
  }catch(e){PUSH.msg="Couldn't send the test. Turn alerts on first."}
  PUSH.busy=false;pushMsg(PUSH.msg);
  var b=document.querySelector('[data-act="push_test"]');if(b)b.disabled=false;
}


/* ---- private spaces: move one space into its own locked area so it can be shared on its own ---- */
function shAdd(em,role,space){
  var row={owner_id:window.__UID,invitee_email:em,role:role,space_id:space||null,space_name:space?shSpaceName(space):null};
  WSB.from("shares").upsert(row,{onConflict:"owner_id,invitee_email,space_key"}).then(function(r){
    if(r.error){shMsg("Couldn't invite. "+r.error.message);return}
    SH.email="";SH.loaded=false;shMsg('Added. Press "Email invite" next to their name to send them the details.');shLoad();
  });
}
async function isolateSpace(id){
  try{
    var sp=S.spaces.filter(function(x){return x.id===id})[0];
    if(!sp||S.spaces.length<2||shIsIso(id)||!window.__mkdb||window.__WS)return false;
    var arr=["notes","ideas","tasks","mood","files","posts","clips","deals","income","invoices"],pre="sp/"+id+"/",pdb=window.__mkdb(pre);
    var N={spaces:[clone(sp)],palette:{},bmeta:{},kit:{},cfg:clone(S.cfg||{}),profile:clone(S.profile||{}),focus:{},edit:{}};
    arr.forEach(function(k){N[k]=S[k].filter(function(x){return x.sp===id}).map(clone)});
    ["palette","bmeta","kit"].forEach(function(k){if(S[k]&&S[k][id])N[k][id]=clone(S[k][id])});
    var sh=shards(N),keys={};
    for(var k in sh){
      keys[k]={n:sh[k].p.length,h:sh[k].h};
      for(var i=0;i<sh[k].p.length;i++)await pdb.doc("store/k_"+k+"_"+i).set({s:sh[k].p[i],i:i});
    }
    await pdb.doc("store/meta").set({ts:Date.now(),dev:TAB,keys:keys,v:2});
    var oldBd=[],rm=await db.doc("bd/"+id+"_m").get();
    if(rm.exists){
      var md=rm.data();
      for(var j=0;j<md.n;j++){var d=await db.doc("bd/"+id+"_"+j).get();if(!d.exists)throw new Error("board");await pdb.doc("bd/"+id+"_"+j).set(d.data());oldBd.push("bd/"+id+"_"+j)}
      await pdb.doc("bd/"+id+"_m").set(md);oldBd.push("bd/"+id+"_m");
    }
    var chk=await pdb.doc("store/meta").get();
    if(!chk.exists)throw new Error("verify");
    for(var q in keys){var c0=await pdb.doc("store/k_"+q+"_0").get();if(!c0.exists)throw new Error("verify")}
    /* the copy is safe: now take it out of the main workspace */
    arr.forEach(function(k){S[k]=S[k].filter(function(x){return x.sp!==id})});
    ["palette","bmeta","kit"].forEach(function(k){if(S[k])delete S[k][id]});
    S.spaces=S.spaces.filter(function(x){return x.id!==id});
    if(!Array.isArray(S.iso))S.iso=[];S.iso.push({id:id,name:sp.name});
    if(S.cur===id)S.cur=S.spaces[0].id;
    try{localStorage.removeItem(wbKey(id))}catch(e){}
    touch();render();
    oldBd.forEach(function(pth){db.doc(pth).delete().catch(function(){})});
    return true;
  }catch(e){return false}
}
