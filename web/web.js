/* ---------- website only: audience numbers, creator page, account ---------- */
ICONS.globe='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>';
ICONS.team='<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.5 2.3 4.5 4.8"/>';
ICONS.trend='<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>';
(function(){
  var i=VIEWS.map(function(v){return v.id}).indexOf("viz");
  VIEWS.splice(i+1,0,{id:"aud",name:"Audience",ic:"trend",c:"var(--c-viz)",desc:"Real numbers from your channels and pages."});
  var ci=VIEWS.map(function(v){return v.id}).indexOf("clips");
  VIEWS.splice(ci+1,0,{id:"bank",name:"Caption bank",ic:"text",c:"var(--c-ideas)",desc:"Captions, hashtag sets and hooks you reuse. Tap one to copy it."});
  var bi=VIEWS.map(function(v){return v.id}).indexOf("biz");
  VIEWS.splice(bi+1,0,{id:"team",name:"Team",ic:"team",c:"var(--c-board)",desc:"The people who work with you: their work, progress and pay."});
  VIEWS.push({id:"imp",g:"You",name:"Import",ic:"upload",c:"var(--c-home)",desc:"Bring your data in from other apps."});
  VIEWS.push({id:"cp",name:"Profile & settings",ic:"globe",c:"var(--c-home)",desc:"Your public page, handles, alerts and account."});
  if(window.__WS)VIEWS=VIEWS.filter(function(v){return v.id!=="aud"&&v.id!=="cp"&&v.id!=="team"});
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
  if(!el){var tb=document.querySelector(".top");if(!tb)return;el=document.createElement("div");el.id="crumb";el.className="crumb";var mb=tb.querySelector(".mbrand");tb.insertBefore(el,mb?mb.nextSibling:tb.firstChild)}
  placeChrome();
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
function audCol(id){var p=PLATS.filter(function(x){return x[0]===id})[0];return p?p[2]:"#6B7280"}
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
    var c=await WSB.from("connections").select("*").eq("user_id",window.__UID).order("created_at",{ascending:true});
    if(c.error)throw c.error;
    var conns=c.data||[],ids=conns.map(function(x){return x.id}),snaps={},vids={};
    if(ids.length){
      var since=new Date(Date.now()-35*864e5).toISOString();
      var s=await WSB.from("snapshots").select("connection_id,ts,followers,views,posts,extra").in("connection_id",ids).gte("ts",since).order("ts",{ascending:true}).limit(3000);
      if(s.error)throw s.error;
      (s.data||[]).forEach(function(x){(snaps[x.connection_id]=snaps[x.connection_id]||[]).push(x)});
      var v=await WSB.from("videos").select("*").in("connection_id",ids).order("published_at",{ascending:false}).limit(2000);
      if(v.error)throw v.error;
      (v.data||[]).forEach(function(x){(vids[x.connection_id]=vids[x.connection_id]||[]).push(x)});
    }
    W.conns=conns;W.snaps=snaps;W.vids=vids;W.loaded=true;W.err="";
  }catch(e){W.err="Couldn't load your channels. "+((e&&e.message)||"");if(!W.loaded)W.loaded=true}
  W.loading=false;
  if(S.view==="aud"){if(!W.painted){W.painted=1;render()}else audPaint()}else if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render();
}
async function audRefresh(force){
  if(W.busy)return;W.busy=true;audPaintBtn();
  var r=await ytCall({refresh:true,force:!!force});
  var so=await socSync(force);
  W.busy=false;W.lastRefresh=Date.now();var wasCfg=W.cfg;
  if(!r.ok){
    if(r.err.error==="not_configured"){W.cfg=false}
    else if(force){toast(r.err.message||"Couldn't refresh")}
  }else{W.cfg=true;if(force)toast((r.data.refreshed||(so&&so.refreshed))?"Numbers updated":"Already up to date")}
  if(force&&so&&so.errors&&so.errors.length)toast(so.errors[0]);
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
    var r=await WSB.from("profiles").select("*").eq("user_id",window.__UID).maybeSingle();
    if(r.error)throw r.error;
    var d=r.data;
    W.p=d?{handle:d.handle||"",display_name:d.display_name||"",tagline:d.tagline||"",bio:d.bio||"",accent:d.accent||"#12163A",look:d.look||"plain",is_public:!!d.is_public,avatar_url:d.avatar_url||"",links:Array.isArray(d.links)?d.links:[],kit:normKit(d.kit),exists:true}
      :{handle:suggestHandle(),display_name:(S.profile&&S.profile.name)||"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit(),exists:false};
    W.pLoaded=true;W.pErr="";
    try{S.profile=S.profile||{};
      if(!W.p.avatar_url&&S.profile.avatar)W.p.avatar_url="/_blob/"+S.profile.avatar;
      else if(W.p.avatar_url&&!S.profile.avatar&&W.p.avatar_url.indexOf("/_blob/")===0){S.profile.avatar=W.p.avatar_url.slice(7);touch()}
      if(!W.p.display_name&&S.profile.name)W.p.display_name=S.profile.name;
      else if(W.p.display_name&&!S.profile.name){S.profile.name=W.p.display_name;touch()}
      if(typeof paintProfile==="function")paintProfile()}catch(e){}
  }catch(e){W.pErr="Couldn't load your profile. "+((e&&e.message)||"");W.pLoaded=true;if(!W.p)W.p={handle:"",display_name:"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit()}}
  if(S.view==="cp")render();
}
function cpLink(){return location.origin+"/u/"+(W.p&&W.p.handle||"")}
function cpPreviewHTML(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#111111";
  return '<div class="cp-pv" data-look="'+(p.look||"plain")+'" style="--pa:'+ac+'">'+(cpAvatarSrc()?'<img class="cp-av" src="'+esc(cpAvatarSrc())+'" alt="">':'<span class="cp-av cp-ini">'+esc((p.display_name||p.handle||"?").slice(0,1).toUpperCase())+'</span>')+
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
function cpAvatarHTML(size){var p=W.p,src=cpAvatarSrc();return '<span class="av '+(size||"xl")+'">'+(src?'<img src="'+esc(src)+'" alt="">':'<span>'+esc(((p&&p.display_name)||(S.profile&&S.profile.name)||"?").slice(0,1).toUpperCase())+'</span>')+'</span>'}
function cpAvatarSrc(){var a=S.profile&&S.profile.avatar;if(a)return "/_blob/"+a;return (W.p&&W.p.avatar_url)||""}
function cpTabs(){var t=W.cpTab||"profile";return '<div class="cp-tabs" role="tablist">'+[["profile","Profile"],["page","Public page"],["settings","Settings"]].map(function(x){return '<button role="tab" data-act="cp_tab" data-id="'+x[0]+'" aria-selected="'+(t===x[0])+'">'+x[1]+'</button>'}).join("")+'</div>'}
function cpLinkCard(){
  var p=W.p;
  if(!(p.exists&&p.is_public))return '<div class="panel"><h3>Your link</h3><p class="muted" style="margin:0;font-size:13.5px">'+(p.exists?"Your page is private. Switch on “Make this page public” and save to get a link.":"Pick your link name and save to create your page.")+'</p></div>';
  return '<div class="panel"><h3>Your link</h3><p class="cp-url">'+esc(cpLink())+'</p><div class="drow"><button class="btn pri sm" data-act="cp_copy">Copy link</button><button class="btn sm" data-act="cp_open">Open page</button><button class="btn sm" data-act="cp_shareimg">Share as image</button></div></div>';
}
function cpHTML(){
  if(!W.pLoaded){cpLoad();return hero("cp","Profile & settings",null,"")+'<p class="muted">Loading…</p>'}
  var p=W.p,mode=themeMode(),tab=W.cpTab||"profile";
  var save=tab==="settings"?"":'<button class="btn pri" data-act="cp_save"'+(W.pSaving?" disabled":"")+'>'+(W.pSaving?"Saving…":"Save changes")+'</button>';
  var h=hero("cp","Profile & settings",null,save)+cpTabs();
  if(W.pErr)h+='<p class="ac-errmsg">'+esc(W.pErr)+'</p>';
  if(W.pMsg&&tab!=="settings")h+='<p id="cpmsg" class="cp-note" role="status">'+esc(W.pMsg)+'</p>';else h+='<p id="cpmsg" class="cp-note" role="status" hidden></p>';
  if(tab==="profile"){
    h+='<div class="cp-grid"><div class="cp-main">'+
      '<section class="panel"><h3>You</h3><div class="cp-me">'+cpAvatarHTML("xl")+'<div class="cp-mebtn"><button class="btn sm" data-act="cp_avatar">'+(cpAvatarSrc()?"Change photo":"Upload photo")+'</button>'+(cpAvatarSrc()?'<button class="btn sm" data-act="cp_avrm">Remove</button>':'')+'<small class="muted">Used everywhere: sidebar, team, public page.</small></div></div>'+
      '<div class="cp-two"><label class="plab">Name<input class="in" data-w="p.display_name" maxlength="60" value="'+esc(p.display_name||(S.profile&&S.profile.name)||"")+'"></label>'+
      '<label class="plab">Role<input class="in" data-w="s.role" maxlength="40" value="'+esc((S.profile&&S.profile.role)||"")+'" placeholder="Creator, editor, podcaster…"></label></div>'+
      '<label class="plab">Tagline<input class="in" data-w="p.tagline" maxlength="90" value="'+esc(p.tagline)+'" placeholder="What you make, in one line"></label>'+
      '<label class="plab">About<textarea class="in" data-w="p.bio" rows="3" maxlength="600" placeholder="A few lines about you and your work">'+esc(p.bio)+'</textarea></label></section>'+
      '<section class="panel"><h3>Where people find you</h3>'+hdRows()+'</section></div>'+
      '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+cpLinkCard()+'</aside></div>';
  }else if(tab==="page"){
    h+='<div class="cp-grid"><div class="cp-main">'+
      '<section class="panel"><h3>Your page</h3>'+
      '<label class="plab">Link<span class="cp-pre"><i>'+esc(location.host)+'/u/</i><input class="in" data-w="p.handle" maxlength="24" value="'+esc(p.handle)+'" placeholder="yourname" autocapitalize="none" spellcheck="false"></span></label>'+
      '<label class="cp-sw"><input type="checkbox" data-act="cp_pub"'+(p.is_public?" checked":"")+'><span><b>Make this page public</b><small>Anyone with the link can see your name, photo, handles and the channels you choose in Audience.</small></span></label>'+
      lookPanel()+'</section>'+kitPanel()+'</div>'+
      '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+cpLinkCard()+'</aside></div>';
  }else{
    h+='<div class="cp-set">'+
      '<section class="panel"><h3>Appearance</h3>'+
      '<div class="setrow"><span>Theme</span><div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div></div>'+
      '<div class="setrow"><span>Sounds</span><div class="hd-seg" role="group" aria-label="Sounds">'+[["on","On"],["off","Off"]].map(function(o){return '<button data-act="snd" data-id="'+o[0]+'" aria-pressed="'+((o[0]==="on")===sndOn())+'">'+o[1]+'</button>'}).join("")+'</div></div></section>'+
      '<section class="panel"><h3>Phone alerts</h3>'+pushPanel().replace('>Alerts<p','><p')+'</section>'+
      (window.__WS?'':shPanel())+
      '<section class="panel"><h3>Account</h3>'+
      '<div class="setrow"><span>Signed in as</span><b>'+esc(window.__EMAIL||"")+'</b></div>'+
      '<div class="setrow"><span>Your data</span><span style="display:flex;gap:6px"><button class="btn sm" data-act="imp_open">Import from other apps</button><button class="btn sm" data-act="datadlg">Backup and export</button></span></div>'+
      '<div class="setrow"><span>Password</span><button class="btn sm" data-act="cp_pw">Email me a reset link</button></div>'+
      '<div class="setrow"><span>Sign out of this device</span><button class="btn sm" data-act="signout">Sign out</button></div></section></div>';
  }
  return h+'<input type="file" id="cpfile" accept="image/*" hidden>';
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
function cpMsg(t){W.pMsg=t||"";var e=$("cpmsg");if(e){e.textContent=W.pMsg;e.hidden=!W.pMsg}}
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
    case "tm_tab":T.tab=id;T.tabSet=true;render();return true;
    case "tm_add":T.form=!T.form;render();return true;
    case "tm_create":tmCreate();return true;
    case "tm_det":T.detOpen=T.detOpen||{};T.detOpen[id]=!T.detOpen[id];render();return true;
    case "tm_open":T.sel=T.sel===id?null:id;render();return true;
    case "tm_del":arm(b,function(){tmDelete(id)});return true;
    case "tm_end":{var em1=tmM(id);if(em1)tmPatch(id,{status:em1.status==="ended"?"active":"ended"},true);return true}
    case "tm_mail":tmMail(id);return true;
    case "tm_wadd":tmWorkAdd(id);return true;
    case "tm_wdel":tmWorkDel(id);return true;
    case "tk_assign":tkAssignDlg(id);return true;
    case "tk_assignto":tkAssign(b.dataset.task,id);return true;
    case "tm_padd":tmPayAdd(id,false);return true;
    case "tm_salary":tmPayAdd(id,true);return true;
    case "tm_pdel":tmPayDel(id);return true;
    case "tm_ppaid":tmPayToggle(id);return true;
    case "tm_kind":T.f.kind=id;render();return true;
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
    case "aud_plat":W.plat=id;W.showAdd=true;W.typeIt=false;render();return true;
    case "aud_kind":W.kind=id;W.showAdd=true;render();return true;
    case "ob_hide":S.cfg.obDone=true;touch();render();return true;
    case "ob_sample":obSample();return true;
    case "ob_focus":{var q=$("qcin");if(q){q.focus();q.placeholder="Your first idea… then press Idea"}return true}
    case "ob_name":{var on=$("obname"),nv=on?on.value.trim():"";if(!nv){toast("Type a name first");return true}var sp=S.spaces.filter(function(x){return x.id===S.cur})[0];if(sp)sp.name=nv.slice(0,40);S.cfg.spNamed=true;touch();render();toast("Space renamed");return true}
    case "aud_toggleadd":W.showAdd=!W.showAdd;render();return true;
    case "soc_start":socStart(id);return true;
    case "soc_guide":socGuide(id);return true;
    case "soc_type":W.typeIt=true;render();return true;
    case "soc_copyr":copy(socRedirect(id));return true;
    case "soc_disc":arm(b,function(){socDisconnect(id)});return true;
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
      if(!b.dataset.fallback){sendInvite(mx.invitee_email,function(){webAct("sh_mail",{dataset:{id:id,fallback:"1"}})},function(m){shMsg(m)});return true}
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
    case "tp_open":tpOpen();return true;
    case "tp_close":tpClose();return true;
    case "tp_play":tpToggle();return true;
    case "tp_speed":tpSpeed(+b.dataset.d);return true;
    case "tp_size":tpSize(+b.dataset.d);return true;
    case "tp_mirror":TP.mirror=!TP.mirror;tpPaint();return true;
    case "tp_restart":TP.y=0;tpApply();return true;
    case "bk_kind":BK.kind=id;render();return true;
    case "bk_filter":BK.f=id;render();return true;
    case "bk_save":bkSave();return true;
    case "bk_copy":bkCopy(id);return true;
    case "bk_edit":BK.edit=id;render();var bx=$("bktext");if(bx)bx.focus();return true;
    case "bk_cancel":BK.edit=null;render();return true;
    case "bk_del":arm(b,function(){S.bank=S.bank.filter(function(x){return x.id!==id});touch();render()});return true;
    case "bk_starter":bkStarter();return true;
    case "bk_use":{var pid=b.dataset.post,it=S.bank.filter(function(x){return x.id===id})[0],po=S.posts.filter(function(x){return x.id===pid})[0];if(it&&po){po.caption=((po.caption||"").trim()?po.caption.trim()+"\n\n":"")+it.text;it.uses=(it.uses||0)+1;touch();render();toast("Added to the post")}return true}
    case "rp_open":rpOpen(id);return true;
    case "rp_go":rpGo();return true;
    case "rp_cancel":infoHTML="";renderDialog();return true;
    case "aud_tab":W.audTab=id;render();return true;
    case "ins_ch":W.insCh=id;render();return true;
    case "ins_kind":W.insKind=id;render();return true;
    case "imp_paste":{var pt=($("imppaste")||{}).value||"";if(!pt.trim()){toast("Paste some cells first");return true}impParse(pt,"Pasted data");return true}
    case "imp_reset":IMP.step="drop";IMP.msg="";render();return true;
    case "imp_target":IMP.target=id;IMP.map=impAutoMap(id);if((id==="videos"||id==="audience")&&!IMP.conn){var oc=(W.conns||[]).filter(function(c){return c.kind==="own"});IMP.conn=oc.length?oc[0].id:"new"}render();return true;
    case "imp_go":impGo();return true;
    case "imp_undo":impUndo(id);return true;
    case "imp_open":go("imp");return true;
    case "imp_notes":{var nid="imp"+uid(),nn=0;IMP.notes.forEach(function(n){S.notes.push({id:uid(),sp:S.cur,title:n.title,body:n.body,pin:false,ts:Date.now(),imp:nid});nn++});impLog({id:nid,t:"notes",n:nn,file:IMP.name,key:"notes"});IMP.step="drop";IMP.notes=null;toast("Imported "+nn+" notes");go("notes");return true}
    case "cp_tab":W.cpTab=id;W.pMsg="";render();return true;
    case "cp_avrm":W.p.avatar_url="";if(S.profile){S.profile.avatar="";touch()}if(typeof paintProfile==="function")paintProfile();if(W.p.exists)WSB.from("profiles").update({avatar_url:null}).eq("user_id",window.__UID).then(function(){});render();return true;
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
  else if(w==="s.role"){S.profile=S.profile||{};S.profile.role=t.value;touch();if(typeof paintProfile==="function")paintProfile()}
  else if(w.indexOf("p.")===0&&W.p){W.p[w.slice(2)]=t.value;if(w==="p.display_name"){S.profile=S.profile||{};S.profile.name=t.value;touch();if(typeof paintProfile==="function")paintProfile()}cpPreviewPaint()}
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
    assets.upload(f).then(function(r){W.p.avatar_url=r.url;if(S.profile){S.profile.avatar=r.id;touch()}if(typeof paintProfile==="function")paintProfile();
      if(W.p.exists)WSB.from("profiles").update({avatar_url:r.url}).eq("user_id",window.__UID).then(function(){});
      render();toast("Photo updated")}).catch(function(){toast("Upload failed. Try again.")});
  }
});

ICONS.grid='<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>';
var DOCK=["home","notes","ideas","cal"];
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
  if(v==="aud"){if(!W.loaded&&!W.loading)audLoad();if(!SOC.loaded&&!SOC.loading){SOC.loading=1;socLoad()}return audHTML()}
  if(v==="cp")return cpHTML();
  if(v==="bank")return bankHTML();
  if(v==="imp"){if(!W.loaded&&!W.loading)audLoad(true);return impHTML()}
  if(v==="team"){if(!T.loaded&&!T.loading)tmLoad();return tmHTML()}
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


/* ---------------- Team: people who work with you ---------------- */
var T={loaded:false,loading:false,members:[],work:[],pay:[],my:[],sel:null,tab:"team",form:false,msg:"",f:{name:"",role:"",email:"",kind:"salary",amount:"",start:"",end:"",login:true,seepay:true},wf:{},pf:{}};
function tmM(id){return T.members.filter(function(x){return x.id===id})[0]}
function tmErr(e){T.msg=(e&&e.message)||"Something went wrong. Try again.";render()}
async function tmLoad(){
  T.loading=true;
  try{
    var uid=window.__UID;
    var r=await Promise.all([
      WSB.from("team_members").select("*").eq("owner_id",uid).order("created_at"),
      WSB.from("team_work").select("*").eq("owner_id",uid).order("created_at",{ascending:false}),
      WSB.from("team_pay").select("*").eq("owner_id",uid).order("created_at",{ascending:false}),
      WSB.rpc("my_team")]);
    if(r[0].error)throw r[0].error;
    T.members=r[0].data||[];T.work=r[1].data||[];T.pay=r[2].data||[];T.my=Array.isArray(r[3].data)?r[3].data:[];
    if(!T.members.length&&T.my.length&&!T.tabSet){T.tab="mywork"}
    T.msg="";
  }catch(e){T.msg="Couldn't load your team. "+((e&&e.message)||"")}
  T.loaded=true;T.loading=false;tkSync();if(S.view==="team")render();
}
function tmProg(id){
  var w=T.work.filter(function(x){return x.member_id===id}),done=w.filter(function(x){return x.status==="done"}).length,td=ymd(new Date());
  var over=w.filter(function(x){return x.status!=="done"&&x.due&&x.due<td}).length;
  return {total:w.length,done:done,open:w.length-done,over:over,pct:w.length?Math.round(done/w.length*100):0};
}
function tmPayInfo(id){
  var p=T.pay.filter(function(x){return x.member_id===id}),due=0,paid=0;
  p.forEach(function(x){if(x.status==="paid")paid+=Number(x.amount);else due+=Number(x.amount)});
  return {due:due,paid:paid,n:p.length};
}
function tmBar(pct,c){return '<span class="vtrack" style="margin:6px 0"><span class="vfill" style="--c:'+(c||"var(--st-s)")+';width:'+pct+'%"></span></span>'}
function tmKind(m){return m.kind==="temp"?"Temporary":"Salary"}
function tmAmt(m){return m.kind==="temp"?money(m.amount)+" total":money(m.amount)+" / month"}
function tmHTML(){
  var own=T.tab!=="mywork"||!T.my.length;
  var h=hero("team","Team",own?"The people who work with you. Add work for them, see how it is going, and keep track of what you owe and have paid.":"Work other creators have given you, and how it is going.",
    own?'<button class="btn pri" data-act="tm_add">'+(T.form?"Close":"Add member")+'</button>':'');
  if(T.my.length)h+='<div class="hd-seg tm-tabs" role="group" aria-label="Team pages"><button data-act="tm_tab" data-id="team" aria-pressed="'+own+'">My team</button><button data-act="tm_tab" data-id="mywork" aria-pressed="'+!own+'">My work for others</button></div>';
  if(!T.loaded)return h+'<p class="muted">Loading…</p>';
  if(T.msg)h+='<p class="ac-errmsg">'+esc(T.msg)+'</p>';
  if(T.tab==="mywork"&&T.my.length)return h+tmMyHTML();
  var act=T.members.filter(function(m){return m.status==="active"}),openW=0,overW=0,due=0,paidM=0,mon=ymd(new Date()).slice(0,7);
  act.forEach(function(m){var g=tmProg(m.id);openW+=g.open;overW+=g.over});
  T.pay.forEach(function(x){if(x.status==="due")due+=Number(x.amount);else if(x.paid_on&&x.paid_on.slice(0,7)===mon)paidM+=Number(x.amount)});
  if(T.members.length)h+='<div class="stats tm-stats"><div class="stat"><b>'+act.length+'</b><span>Active members</span></div><div class="stat"><b>'+openW+'</b><span>Open work'+(overW?' · '+overW+' late':'')+'</span></div><div class="stat"><b>'+money(due)+'</b><span>To pay</span></div><div class="stat"><b>'+money(paidM)+'</b><span>Paid this month</span></div></div>';
  if(T.form)h+=tmFormHTML();
  if(!T.members.length&&!T.form)h+=emptyCard("users","No team yet","Add someone who works with you, like an editor or a designer. Give them work, track progress and keep a record of what you've paid. You choose whether they can sign in.",'<button class="btn pri sm" data-act="tm_add">Add your first member</button>');
  h+='<div class="tm-list">'+T.members.map(tmCardHTML).join("")+'</div>';
  return h;
}
function tmFormHTML(){
  var f=T.f,temp=f.kind==="temp";
  return '<section class="panel tm-form"><h3>New team member</h3>'+
   '<div class="tm-grid"><label class="plab">Name<input class="in" data-tmf="name" maxlength="80" value="'+esc(f.name)+'" placeholder="Their name"></label>'+
   '<label class="plab">Role<input class="in" data-tmf="role" maxlength="60" value="'+esc(f.role)+'" placeholder="Video editor, designer…"></label>'+
   '<label class="plab">Email (so they can sign in)<input class="in" type="email" data-tmf="email" maxlength="120" value="'+esc(f.email)+'" placeholder="name@email.com" autocapitalize="none" spellcheck="false"></label>'+
   '<div class="plab">How you pay them<div class="hd-seg" role="group"><button data-act="tm_kind" data-id="salary" aria-pressed="'+(!temp)+'">Monthly salary</button><button data-act="tm_kind" data-id="temp" aria-pressed="'+temp+'">Temporary hire</button></div></div>'+
   '<label class="plab">'+(temp?"Total fee":"Salary per month")+'<input class="in" inputmode="decimal" data-tmf="amount" maxlength="12" value="'+esc(f.amount)+'" placeholder="0"></label>'+
   '<label class="plab">Starts<input class="in" type="date" data-tmf="start" value="'+esc(f.start)+'"></label>'+
   (temp?'<label class="plab">Ends<input class="in" type="date" data-tmf="end" value="'+esc(f.end)+'"></label>':'')+'</div>'+
   '<label class="cp-pub"><input type="checkbox" data-tmf="login"'+(f.login?" checked":"")+'> Can sign in and see their own work</label>'+
   '<label class="cp-pub"><input type="checkbox" data-tmf="seepay"'+(f.seepay?" checked":"")+'> Can see their own pay</label>'+
   '<div class="drow"><button class="btn pri" data-act="tm_create">Add to team</button></div></section>';
}
function tmCardHTML(m){
  var g=tmProg(m.id),pi=tmPayInfo(m.id),open=T.sel===m.id,ended=m.status==="ended";
  var h='<article class="panel tm-card'+(ended?" ended":"")+'"><div class="tm-top"><span class="av lg tm-av">'+esc((m.name||"?").slice(0,1).toUpperCase())+'</span><div class="tm-id"><b>'+esc(m.name)+'</b><span class="muted">'+esc(m.role_title||"No role set")+'</span></div>'+
   '<span class="tm-badge '+(m.kind==="temp"?"temp":"sal")+'">'+tmKind(m)+(ended?" · ended":"")+'</span></div>'+
   '<div class="tm-meta"><span>'+tmAmt(m)+'</span><span>'+(m.can_login&&m.email?"Can sign in":"No sign-in")+'</span><span>'+(m.see_pay?"Sees own pay":"Pay hidden from them")+'</span></div>'+
   (g.total?'<div class="tm-prog"><span>'+g.done+' of '+g.total+' done'+(g.over?' · <b class="late">'+g.over+' late</b>':'')+'</span><span>'+g.pct+'%</span></div>'+tmBar(g.pct):'<p class="muted tm-none">No work assigned yet.</p>')+
   '<div class="tm-meta"><span>To pay: <b>'+money(pi.due)+'</b></span><span>Paid: <b>'+money(pi.paid)+'</b></span></div>'+
   '<div class="drow"><button class="btn sm" data-act="tm_open" data-id="'+m.id+'">'+(open?"Close":"Open")+'</button></div>';
  if(open)h+=tmDetailHTML(m);
  return h+'</article>';
}
function tmDetailHTML(m){
  var id=m.id,temp=m.kind==="temp",td=ymd(new Date());
  var det='<div class="tm-grid">'+
   '<label class="plab">Name<input class="in" data-tm="name" data-id="'+id+'" maxlength="80" value="'+esc(m.name)+'"></label>'+
   '<label class="plab">Role<input class="in" data-tm="role_title" data-id="'+id+'" maxlength="60" value="'+esc(m.role_title||"")+'"></label>'+
   '<label class="plab">Email<input class="in" type="email" data-tm="email" data-id="'+id+'" maxlength="120" value="'+esc(m.email||"")+'" autocapitalize="none"></label>'+
   '<label class="plab">'+(temp?"Total fee":"Salary per month")+'<input class="in" inputmode="decimal" data-tm="amount" data-id="'+id+'" maxlength="12" value="'+esc(m.amount)+'"></label>'+
   '<label class="plab">Starts<input class="in" type="date" data-tm="start_date" data-id="'+id+'" value="'+esc(m.start_date||"")+'"></label>'+
   (temp?'<label class="plab">Ends<input class="in" type="date" data-tm="end_date" data-id="'+id+'" value="'+esc(m.end_date||"")+'"></label>':'')+'</div>'+
   '<label class="cp-pub"><input type="checkbox" data-tm="can_login" data-id="'+id+'"'+(m.can_login?" checked":"")+'> Can sign in and see their own work</label>'+
   '<label class="cp-pub"><input type="checkbox" data-tm="see_pay" data-id="'+id+'"'+(m.see_pay?" checked":"")+'> Can see their own pay</label>'+
   '<label class="plab">Private notes (only you see these)<textarea class="in" rows="2" data-tm="notes" data-id="'+id+'" maxlength="2000">'+esc(m.notes||"")+'</textarea></label>'+
   '<div class="drow">'+(m.email?'<button class="btn sm" data-act="tm_mail" data-id="'+id+'">Email sign-in details</button>':'')+'<button class="btn sm" data-act="tm_end" data-id="'+id+'">'+(m.status==="ended"?"Bring back":"Mark as ended")+'</button><button class="btn sm" data-act="tm_del" data-id="'+id+'">Remove</button></div>';
  var h='<div class="tm-det">';
  var w=T.work.filter(function(x){return x.member_id===id});
  h+='<h4>Work</h4><div class="tm-add"><input class="in" data-tmw="title" data-id="'+id+'" maxlength="200" placeholder="Give them a piece of work" value="'+esc((T.wf[id]||{}).title||"")+'"><input class="in" type="date" data-tmw="due" data-id="'+id+'" value="'+esc((T.wf[id]||{}).due||"")+'" aria-label="Due date"><button class="btn pri" data-act="tm_wadd" data-id="'+id+'">Add</button></div>';
  h+=w.length?'<div class="tm-rows">'+w.map(function(x){var late=x.status!=="done"&&x.due&&x.due<td;return '<div class="tm-row"><span class="tm-t'+(x.status==="done"?" done":"")+'">'+esc(x.title)+(x.due?'<small class="'+(late?"late":"")+'"> · '+(late?"late · ":"")+esc(fmtDue(x.due))+'</small>':'')+'</span><select class="wsel" data-tmws="'+x.id+'" aria-label="Status"><option value="todo"'+(x.status==="todo"?" selected":"")+'>To do</option><option value="doing"'+(x.status==="doing"?" selected":"")+'>Doing</option><option value="done"'+(x.status==="done"?" selected":"")+'>Done</option></select><button class="ico" data-act="tm_wdel" data-id="'+x.id+'" aria-label="Delete work">'+I("x")+'</button></div>'}).join("")+'</div>':'<p class="muted tm-none">Nothing assigned.</p>';
  var pr=T.pay.filter(function(x){return x.member_id===id});
  var pf=T.pf[id]||{};
  h+='<h4>Pay</h4><div class="tm-add"><input class="in" data-tmp="label" data-id="'+id+'" maxlength="80" placeholder="What for, e.g. Nov 2026" value="'+esc(pf.label||"")+'"><input class="in" inputmode="decimal" data-tmp="amount" data-id="'+id+'" maxlength="12" placeholder="Amount" value="'+esc(pf.amount||"")+'"><button class="btn pri" data-act="tm_padd" data-id="'+id+'">Add</button></div>'+
   (temp?'':'<div class="drow"><button class="btn sm" data-act="tm_salary" data-id="'+id+'">Add '+esc(tmMonth())+' salary ('+money(m.amount)+')</button></div>');
  h+=pr.length?'<div class="tm-rows">'+pr.map(function(x){return '<div class="tm-row"><span class="tm-t">'+esc(x.label)+'<small> · '+money(x.amount)+(x.status==="paid"&&x.paid_on?' · paid '+esc(fmtDue(x.paid_on)):'')+'</small></span><button class="btn sm'+(x.status==="paid"?"":" pri")+'" data-act="tm_ppaid" data-id="'+x.id+'">'+(x.status==="paid"?"Paid":"Mark paid")+'</button><button class="ico" data-act="tm_pdel" data-id="'+x.id+'" aria-label="Delete pay entry">'+I("x")+'</button></div>'}).join("")+'</div>':'<p class="muted tm-none">No pay records yet.</p>';
  var dop=!!(T.detOpen&&T.detOpen[id]);
  return h+'<div class="tm-more"><button class="tm-mh" data-act="tm_det" data-id="'+id+'" aria-expanded="'+dop+'">'+I(dop?"chevu":"chevd")+'Details and access</button>'+(dop?det:'')+'</div></div>';
}
function tmMonth(){return new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"})}
function tmMyHTML(){
  var td=ymd(new Date());
  return '<div class="tm-list">'+T.my.map(function(m,mi){
    var w=m.work||[],done=w.filter(function(x){return x.status==="done"}).length,pct=w.length?Math.round(done/w.length*100):0;
    var h='<article class="panel tm-card"><div class="tm-top"><span class="av lg tm-av">'+esc((m.owner_email||"?").slice(0,1).toUpperCase())+'</span><div class="tm-id"><b>Working for '+esc(m.owner_email||"")+'</b><span class="muted">'+esc(m.role_title||"Team member")+'</span></div><span class="tm-badge '+(m.kind==="temp"?"temp":"sal")+'">'+tmKind(m)+'</span></div>';
    if(m.see_pay&&m.amount!=null)h+='<div class="tm-meta"><span>'+tmAmt(m)+'</span>'+(m.start_date?'<span>From '+esc(fmtDue(m.start_date))+'</span>':'')+(m.end_date?'<span>Until '+esc(fmtDue(m.end_date))+'</span>':'')+'</div>';
    h+=(w.length?'<div class="tm-prog"><span>'+done+' of '+w.length+' done</span><span>'+pct+'%</span></div>'+tmBar(pct):'<p class="muted tm-none">No work assigned to you yet.</p>');
    h+=w.length?'<h4>Your work</h4><div class="tm-rows">'+w.map(function(x){var late=x.status!=="done"&&x.due&&x.due<td;return '<div class="tm-row"><span class="tm-t'+(x.status==="done"?" done":"")+'">'+esc(x.title)+(x.due?'<small class="'+(late?"late":"")+'"> · '+(late?"late · ":"")+esc(fmtDue(x.due))+'</small>':'')+'</span><select class="wsel" data-tmmy="'+x.id+'" aria-label="Status"><option value="todo"'+(x.status==="todo"?" selected":"")+'>To do</option><option value="doing"'+(x.status==="doing"?" selected":"")+'>Doing</option><option value="done"'+(x.status==="done"?" selected":"")+'>Done</option></select></div>'}).join("")+'</div>':'';
    if(m.see_pay&&Array.isArray(m.pay)){h+='<h4>Your pay</h4>'+(m.pay.length?'<div class="tm-rows">'+m.pay.map(function(x){return '<div class="tm-row"><span class="tm-t">'+esc(x.label)+'<small> · '+money(x.amount)+'</small></span><span class="tm-badge '+(x.status==="paid"?"sal":"temp")+'">'+(x.status==="paid"?"Paid"+(x.paid_on?" "+esc(fmtDue(x.paid_on)):""):"Due")+'</span></div>'}).join("")+'</div>':'<p class="muted tm-none">No pay records yet.</p>')}
    else h+='<p class="muted tm-none" style="margin-top:10px">Pay details are not shared with you here.</p>';
    return h+'</article>'}).join("")+'</div>';
}
async function tmCreate(){
  var f=T.f,name=(f.name||"").trim(),em=(f.email||"").trim().toLowerCase(),amt=Number(String(f.amount||"0").replace(/,/g,""));
  if(!name){T.msg="Add a name first.";render();return}
  if(em&&!/^\S+@\S+\.\S+$/.test(em)){T.msg="That email doesn't look right.";render();return}
  if(em&&em===String(window.__EMAIL||"").toLowerCase()){T.msg="That is your own email.";render();return}
  if(!isFinite(amt)||amt<0){T.msg="Enter the amount as a number.";render();return}
  var row={name:name,role_title:(f.role||"").trim()||null,email:em||null,kind:f.kind,amount:amt,start_date:f.start||null,end_date:f.kind==="temp"?(f.end||null):null,can_login:!!(f.login&&em),see_pay:!!f.seepay};
  var r=await WSB.from("team_members").insert(row).select("*").single();
  if(r.error){T.msg=r.error.code==="23505"?"You already added someone with that email.":"Couldn't add them. "+r.error.message;render();return}
  T.members.push(r.data);T.form=false;T.sel=r.data.id;T.msg="";
  T.f={name:"",role:"",email:"",kind:"salary",amount:"",start:"",end:"",login:true,seepay:true};
  toast(name+" added to your team");render();
}
async function tmPatch(id,patch,rerender){
  var m=tmM(id);if(!m)return;
  var r=await WSB.from("team_members").update(patch).eq("id",id);
  if(r.error){T.msg=r.error.code==="23505"?"Someone with that email is already on your team.":"Couldn't save. "+r.error.message;render();return}
  Object.assign(m,patch);T.msg="";if(rerender)render();
}
async function tmDelete(id){
  var r=await WSB.from("team_members").delete().eq("id",id);
  if(r.error){T.msg="Couldn't remove them.";render();return}
  T.members=T.members.filter(function(x){return x.id!==id});T.work=T.work.filter(function(x){return x.member_id!==id});T.pay=T.pay.filter(function(x){return x.member_id!==id});
  if(T.sel===id)T.sel=null;toast("Removed from your team");render();
}
function tmMail(id,fb){
  var m=tmM(id);if(!m||!m.email)return;
  if(!fb){sendInvite(m.email,function(){tmMail(id,true)},function(t){toast(t)});return}
  var who=(S.profile&&S.profile.name)||String(window.__EMAIL||"").split("@")[0];
  var body="Hi "+m.name+",\n\nI added you to my team on Creator Space.\n\n1. Open "+location.origin+"\n2. Sign in, or create an account, with this email: "+m.email+"\n3. Open Team and choose \"My work for others\" to see your work"+(m.see_pay?", progress and pay":" and progress")+".\n\nThanks,\n"+who;
  var a=document.createElement("a");a.href="mailto:"+encodeURIComponent(m.email)+"?subject="+encodeURIComponent(who+" added you to their team")+"&body="+encodeURIComponent(body);
  document.body.appendChild(a);a.click();a.remove();
  try{navigator.clipboard&&navigator.clipboard.writeText(body).catch(function(){})}catch(e){}
  toast("Your email app opened. The text is also copied.");
}
async function tmWorkAdd(id){
  var f=T.wf[id]||{},t=(f.title||"").trim();if(!t){toast("Type what the work is first");return}
  var r=await WSB.from("team_work").insert({member_id:id,title:t,due:f.due||null}).select("*").single();
  if(r.error){T.msg="Couldn't add the work. "+r.error.message;render();return}
  T.work.unshift(r.data);T.wf[id]={};render();
}
async function tmWorkDel(id){var r=await WSB.from("team_work").delete().eq("id",id);if(!r.error){T.work=T.work.filter(function(x){return x.id!==id});render()}}
async function tmWorkStatus(id,st){
  var w=T.work.filter(function(x){return x.id===id})[0];if(!w)return;
  var patch={status:st,done_at:st==="done"?new Date().toISOString():null};
  var r=await WSB.from("team_work").update(patch).eq("id",id);if(!r.error){Object.assign(w,patch);tkSync();render()}
}
async function tmPayAdd(id,salary){
  var m=tmM(id);if(!m)return;var pf=T.pf[id]||{},label,amt;
  if(salary){label=tmMonth()+" salary";amt=Number(m.amount)}
  else{label=(pf.label||"").trim();amt=Number(String(pf.amount||"").replace(/,/g,""))}
  if(!label){toast("Say what the payment is for");return}
  if(!isFinite(amt)||amt<=0){toast("Enter an amount above zero");return}
  var r=await WSB.from("team_pay").insert({member_id:id,label:label,amount:amt}).select("*").single();
  if(r.error){T.msg="Couldn't add the payment. "+r.error.message;render();return}
  T.pay.unshift(r.data);T.pf[id]={};render();
}
async function tmPayToggle(id){
  var p=T.pay.filter(function(x){return x.id===id})[0];if(!p)return;
  var patch=p.status==="paid"?{status:"due",paid_on:null}:{status:"paid",paid_on:ymd(new Date())};
  var r=await WSB.from("team_pay").update(patch).eq("id",id);if(!r.error){Object.assign(p,patch);render()}
}
async function tmPayDel(id){var r=await WSB.from("team_pay").delete().eq("id",id);if(!r.error){T.pay=T.pay.filter(function(x){return x.id!==id});render()}}
async function tmMyStatus(id,st){
  var r=await WSB.rpc("my_work_update",{p_id:id,p_status:st});
  if(r.error||r.data!==true){toast("Couldn't update that");return}
  T.my.forEach(function(m){(m.work||[]).forEach(function(x){if(x.id===id){x.status=st;x.done_at=st==="done"?new Date().toISOString():null}})});render();
}
document.addEventListener("input",function(e){
  var t=e.target;if(!t||!t.dataset)return;var d=t.dataset;
  if(d.tmf){T.f[d.tmf]=t.type==="checkbox"?t.checked:t.value}
  else if(d.tmw){(T.wf[d.id]=T.wf[d.id]||{})[d.tmw]=t.value}
  else if(d.tmp){(T.pf[d.id]=T.pf[d.id]||{})[d.tmp]=t.value}
});
document.addEventListener("change",function(e){
  var t=e.target;if(!t||!t.dataset)return;var d=t.dataset;
  if(d.tmf&&t.type==="checkbox"){T.f[d.tmf]=t.checked}
  else if(d.tmf==="start"||d.tmf==="end"){T.f[d.tmf]=t.value}
  else if(d.tmws){tmWorkStatus(d.tmws,t.value)}
  else if(d.tmmy){tmMyStatus(d.tmmy,t.value)}
  else if(d.tm){
    var f=d.tm,v=t.type==="checkbox"?t.checked:t.value,patch={};
    if(f==="amount"){v=Number(String(v).replace(/,/g,""));if(!isFinite(v)||v<0){toast("Enter the amount as a number");return}}
    else if(f==="email"){v=String(v).trim().toLowerCase()||null;if(v&&!/^\S+@\S+\.\S+$/.test(v)){toast("That email doesn't look right");return}}
    else if(f==="start_date"||f==="end_date"){v=v||null}
    else if(f==="name"){v=String(v).trim();if(!v){toast("A name is needed");return}}
    else if(f==="role_title"||f==="notes"){v=String(v).trim()||null}
    patch[f]=v;tmPatch(d.id,patch,t.type==="checkbox"||f==="amount"||f==="name"||f==="email");
  }
});
/* v11: load team in the background so late team work reaches the bell and Today */
(function(){var tries=0;function go(){if(window.__WS){return}if(!window.__UID||!WSB){if(++tries<40)setTimeout(go,500);return}
  try{if(!W.loaded&&!W.loading)audLoad(true)}catch(e){}
  try{isoLoad()}catch(e){}
  try{Promise.all([W.pLoaded?0:cpLoad(),PUSH.ready?0:pushRefresh()]).then(function(){if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()})}catch(e){}
  if(T.loaded||T.loading)return;tmLoad().then(function(){try{paintBell();if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()}catch(e){}})}
  setTimeout(go,1200)})();

function todayAud(many){
  try{if(typeof W==="undefined"||!W.loaded)return "";var own=W.conns.filter(function(c){return c.kind==="own"});if(!own.length||(many&&own.length<2))return "";
  return '<section class="panel td-aud"><h2>Audience <span class="cnt">'+own.length+'</span><button class="lnk" data-act="view" data-id="aud">View all</button></h2><div class="td-audl">'+own.slice(0,3).map(function(c){
    var arr=W.snaps[c.id]||[],last=arr.length?arr[arr.length-1]:null,cur=last&&last.followers!=null?Number(last.followers):null,d7=deltaOf(arr,"followers",7*864e5);
    var pc=c.goal&&cur!=null?Math.max(0,Math.min(100,Math.round(cur/c.goal*100))):null;
    return '<button class="td-ac" data-act="view" data-id="aud" style="--c:'+audCol(c.platform)+'"><span class="tn"><i></i>'+esc(c.title||c.handle||platName(c.platform))+'</span><b>'+nf(cur)+'</b>'+(d7?'<em class="dl '+(d7>0?"up":"down")+'">'+(d7>0?"+":"-")+nf(Math.abs(d7))+' this week</em>':'<em class="muted">No change this week</em>')+
      (pc!=null?'<span class="td-gl"><span style="width:'+pc+'%"></span></span><small>'+pc+'% of '+nf(c.goal)+' goal</small>':'')+'</button>'}).join("")+'</div></section>'}catch(e){return ""}
}

/* v11: board task <-> team work */
function tkMembers(){return (typeof T!=="undefined"&&T.loaded&&!window.__WS)?T.members.filter(function(m){return m.status==="active"}):[]}
function tkAssignDlg(taskId){
  var t=S.tasks.filter(function(x){return x.id===taskId})[0];if(!t)return;var ms=tkMembers();
  if(!ms.length){showInfo("Assign to a teammate",'<p style="margin:0 0 12px">Add people on the Team page first, then you can hand them tasks from the board.</p><button class="btn pri" data-act="view" data-id="team">Open Team</button>');return}
  showInfo("Assign “"+t.title+"”",'<p class="muted" style="margin:0 0 10px">They see it under “My work”. When they mark it done, the task moves to Review here.</p><div class="tk-ms">'+ms.map(function(m){
    return '<button class="tk-m" data-act="tk_assignto" data-id="'+m.id+'" data-task="'+t.id+'"><span class="av sm">'+esc((m.name||"?").slice(0,1).toUpperCase())+'</span><span><b>'+esc(m.name)+'</b><i>'+esc(m.role_title||"")+'</i></span></button>'}).join("")+'</div>');
}
async function tkAssign(taskId,mid){
  var t=S.tasks.filter(function(x){return x.id===taskId})[0],m=tmM(mid);if(!t||!m)return;
  var r=await WSB.from("team_work").insert({member_id:mid,title:t.title,due:t.due||null}).select("*").single();
  if(r.error){toast("Couldn't assign. "+r.error.message);return}
  T.work.unshift(r.data);t.tw=r.data.id;t.who=m.name;if(t.col==="i")t.col="m";touch();
  try{infoHTML="";renderDialog()}catch(e){}render();toast("Assigned to "+m.name);
}
function tkSync(){
  try{var ch=false;S.tasks.forEach(function(t){if(!t.tw)return;var w=T.work.filter(function(x){return x.id===t.tw})[0];
    if(!w){delete t.tw;delete t.who;ch=true;return}
    if(w.status==="done"&&(t.col==="i"||t.col==="m")){t.col="r";ch=true;toast((t.who||"A teammate")+" finished “"+t.title+"”")}});
  if(ch){touch();render()}}catch(e){}
}

/* v12: first-run checklist + sample space */
function obSteps(){
  var named=!!(S.cfg&&S.cfg.spNamed)||S.spaces.some(function(x){return x.name!=="My channel"&&!/^Sample/.test(x.name)});
  var ch=typeof W!=="undefined"&&W.loaded&&W.conns.some(function(c){return c.kind==="own"});
  var pg=typeof W!=="undefined"&&W.p&&W.p.exists;
  var al=typeof PUSH!=="undefined"&&PUSH.on;
  return [
    {k:"name",done:named,t:"Name your space",d:"A space holds one channel or project. Call it what you call your channel."},
    {k:"idea",done:S.ideas.length>0,t:"Capture your first idea",d:"Type it in the box above and press Idea. Add #tags to sort later.",a:'<button class="btn sm" data-act="ob_focus">Write an idea</button>'},
    {k:"task",done:S.tasks.some(function(t){return t.due}),t:"Plan a task with a date",d:"Dated tasks show on your Calendar and in the bell when they're due.",a:'<button class="btn sm" data-act="view" data-id="cal">Open Calendar</button>'},
    {k:"chan",done:ch,t:"Connect your channel",d:"Paste your YouTube link to track subscribers and set a goal.",a:'<button class="btn sm" data-act="view" data-id="aud">Connect</button>'},
    {k:"page",done:pg,t:"Publish your creator page",d:"One link with your handles and live numbers, for your bio.",a:'<button class="btn sm" data-act="view" data-id="cp">Set up page</button>'},
    {k:"push",done:al,t:"Turn on phone alerts",d:"A morning summary of what's due, and a ping when you hit a goal.",a:'<button class="btn sm" data-act="view" data-id="cp">Turn on</button>'}
  ];
}
function obHTML(){
  if(readOnly||window.__WS||(S.cfg&&S.cfg.obDone))return "";
  var st=obSteps(),n=st.filter(function(x){return x.done}).length;if(n===st.length)return "";
  var nextIdx=st.map(function(x){return x.done}).indexOf(false);
  var h='<section class="panel ob"><div class="ob-h"><div><h2 style="margin:0">Get set up</h2><span class="muted">'+n+' of '+st.length+' done</span></div><div class="ob-acts">'+
    (S.spaces.some(function(x){return /^Sample/.test(x.name)})?'':'<button class="btn sm" data-act="ob_sample">Explore with sample data</button>')+'<button class="btn sm" data-act="ob_hide">Hide</button></div></div>'+
    '<div class="ob-bar"><i style="width:'+Math.round(n/st.length*100)+'%"></i></div><ol class="ob-l">';
  st.forEach(function(x,i){
    var open=i===nextIdx;
    h+='<li class="'+(x.done?"done":"")+(open?" open":"")+'"><span class="ob-c">'+(x.done?I("check"):(i+1))+'</span><div class="ob-t"><b>'+x.t+'</b>'+(open?'<p>'+x.d+'</p>'+(x.k==="name"?'<div class="ob-name"><input class="in" id="obname" maxlength="40" value="'+esc(spaceName())+'" aria-label="Space name"><button class="btn pri sm" data-act="ob_name">Save</button></div>':(x.a||"")):'')+'</div></li>';
  });
  return h+'</ol></section>';
}
function obFresh(){return !mine("tasks").length&&!mine("ideas").length&&!mine("notes").length&&!mine("posts").length}
function obSample(){
  var id="s"+uid(),d=function(n){return ymd(new Date(Date.now()+n*864e5))},now=Date.now(),U=function(){return uid()};
  S.spaces.push({id:id,name:"Sample: Travel vlog"});
  var i1=U(),i2=U();
  S.ideas.push({id:i1,sp:id,text:"Street food tour in Jaipur #food #vlog",tags:["food","vlog"],star:true,task:false,ts:now-36e5},{id:i2,sp:id,text:"Budget travel hacks for students #travel",tags:["travel"],star:false,task:false,ts:now-72e5},{id:U(),sp:id,text:"What I packed for 7 days in Ladakh #packing",tags:["packing"],star:false,task:false,ts:now-9e6});
  S.tasks.push({id:U(),sp:id,title:"Design thumbnail",col:"i",due:d(-1),pri:2,ts:now-5e6},{id:U(),sp:id,title:"Edit Ladakh vlog",col:"m",due:d(1),pri:1,ts:now-4e6},{id:U(),sp:id,title:"Write captions for reels",col:"i",due:d(3),pri:0,ts:now-3e6},{id:U(),sp:id,title:"Reply to sponsor email",col:"s",due:d(-2),pri:0,ts:now-2e6,done:now-1e6});
  S.notes.push({id:U(),sp:id,title:"Ladakh vlog script",body:"## Hook\n7 days, one backpack.\n\n## Checklist\n- [ ] Film the sunrise at Pangong\n- [ ] Record voiceover\n\n## Outro\nAsk people to subscribe.",pin:true,ts:now-3e6});
  S.posts.push({id:U(),sp:id,title:"Jaipur street food reel",platform:"Instagram",date:d(0),status:"scheduled",ideaId:"",ts:now},{id:U(),sp:id,title:"Ladakh vlog: 7 days",platform:"YouTube",date:d(2),status:"editing",ideaId:"",ts:now},{id:U(),sp:id,title:"Budget travel tips short",platform:"YouTube",date:d(5),status:"script",ideaId:i2,ts:now});
  S.clips.push({id:U(),sp:id,url:"https://www.youtube.com/@NatGeo",title:"Great travel intro",note:"Study the pacing",tags:["editing"],star:false,ts:now});
  S.deals.push({id:U(),sp:id,brand:"Trail Bags Co.",amount:20000,status:"talking",due:d(10),ts:now});
  S.income.push({id:U(),sp:id,date:d(-6),source:"YouTube AdSense",amount:8200,cat:"Ads"});
  S.cur=id;touch();go("home");toast("Sample space added. Delete it any time from Space settings at the bottom of Today.");
}

/* v12: read private (isolated) spaces so the bell and search can see them */
var ISO={loaded:false,loading:false,d:{}};
async function isoLoad(){
  if(window.__WS||!Array.isArray(S.iso)||!S.iso.length||ISO.loading)return;ISO.loading=true;
  try{
    for(var i=0;i<S.iso.length;i++){
      var sp=S.iso[i],r=await WSB.from("docs").select("path,data").like("path","sp/"+sp.id+"/store/k_%");
      if(r.error)continue;var parts={};
      (r.data||[]).forEach(function(row){var m=row.path.match(/store\/k_(.+)_(\d+)$/);if(!m||!row.data)return;(parts[m[1]]=parts[m[1]]||[])[+m[2]]=row.data.s||""});
      var out={name:sp.name};
      Object.keys(parts).forEach(function(k){try{var v=JSON.parse(parts[k].join(""));if(Array.isArray(v))out[k]=v}catch(e){}});
      ISO.d[sp.id]=out;
    }
    ISO.loaded=true;
  }catch(e){}
  ISO.loading=false;try{paintBell();if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()}catch(e){}
}
function isoAll(k){
  var out=[];if(!ISO.loaded)return out;
  Object.keys(ISO.d).forEach(function(id){(ISO.d[id][k]||[]).forEach(function(x){var c=Object.assign({},x);c.sp=id;c._iso=1;out.push(c)})});
  return out;
}
function isoName(id){var x=(S.iso||[]).filter(function(i){return i.id===id})[0];return x?x.name:""}

/* v12: real invite emails, falling back to the email app */
async function sendInvite(email,fallback,say){
  say("Sending the invite…");
  try{
    var r=await WSB.functions.invoke("invite",{body:{email:email}});
    if(!r.error){say(r.data&&r.data.kind==="login"?"They already have an account, so we emailed them a sign-in link.":"Invite email sent to "+email+".");return}
    var info=null;try{info=await r.error.context.json()}catch(e){}
    if(info&&(info.error==="already_sent"||info.error==="not_invited"||info.error==="bad_email"||info.error==="self")){say(info.message);return}
  }catch(e){}
  say("Couldn't send it from here, so your email app will open instead.");fallback();
}

/* v14: teleprompter */
var TP={on:false,run:false,y:0,speed:3,size:44,mirror:false,raf:0,last:0,lock:null,count:0};
function tpText(){var n=S.notes.filter(function(x){return x.id===selNote})[0];if(!n)return "";
  return (n.title?n.title+"\n\n":"")+String(n.body||"").replace(/^#{1,6}\s*/gm,"").replace(/^\s*[-*]\s+\[[ xX]\]\s*/gm,"").replace(/^\s*[-*]\s+/gm,"• ").replace(/^---+$/gm,"")}
function tpOpen(){
  var t=tpText();if(!t.trim()){toast("Write something in this note first");return}
  try{var pr=JSON.parse(localStorage.getItem("cs-tp")||"{}");if(pr.speed)TP.speed=pr.speed;if(pr.size)TP.size=pr.size;TP.mirror=!!pr.mirror}catch(e){}
  var el=$("tp");if(!el){el=document.createElement("div");el.id="tp";el.className="tp";document.body.appendChild(el)}
  TP.on=true;TP.run=false;TP.y=0;TP.count=0;
  el.innerHTML='<div class="tp-view" id="tpview"><div class="tp-text" id="tptext"></div></div><div class="tp-line"></div><div class="tp-count" id="tpcount" hidden></div>'+
    '<div class="tp-bar"><button class="tp-b" data-act="tp_close" aria-label="Close">'+I("x")+'</button><button class="tp-b" data-act="tp_restart" aria-label="Back to start">'+I("undo")+'</button>'+
    '<span class="tp-g"><button class="tp-b" data-act="tp_speed" data-d="-1" aria-label="Slower">'+I("minus")+'</button><span id="tpsp" class="tp-v"></span><button class="tp-b" data-act="tp_speed" data-d="1" aria-label="Faster">'+I("plus")+'</button></span>'+
    '<button class="tp-play" data-act="tp_play" id="tpplay" aria-label="Play">'+I("play")+'</button>'+
    '<span class="tp-g"><button class="tp-b" data-act="tp_size" data-d="-4" aria-label="Smaller text">A−</button><button class="tp-b" data-act="tp_size" data-d="4" aria-label="Bigger text">A+</button></span>'+
    '<button class="tp-b" data-act="tp_mirror" id="tpmir" aria-label="Mirror">⇋</button></div>';
  $("tptext").textContent=t;el.hidden=false;document.documentElement.classList.add("tp-open");tpPaint();tpApply();
}
function tpSave(){try{localStorage.setItem("cs-tp",JSON.stringify({speed:TP.speed,size:TP.size,mirror:TP.mirror}))}catch(e){}}
function tpPaint(){var t=$("tptext");if(!t)return;t.style.fontSize=TP.size+"px";$("tpview").classList.toggle("mir",TP.mirror);$("tpmir").setAttribute("aria-pressed",TP.mirror);$("tpsp").textContent="Speed "+TP.speed;$("tpplay").innerHTML=I(TP.run?"pause":"play");$("tpplay").setAttribute("aria-label",TP.run?"Pause":"Play");tpSave()}
function tpApply(){var t=$("tptext");if(t)t.style.transform="translateY("+(-TP.y)+"px)"}
function tpSpeed(d){TP.speed=Math.max(1,Math.min(10,TP.speed+d));tpPaint()}
function tpSize(d){TP.size=Math.max(24,Math.min(96,TP.size+d));tpPaint()}
function tpStep(ts){
  if(!TP.run)return;var dt=TP.last?Math.min(100,ts-TP.last):16;TP.last=ts;
  var t=$("tptext"),v=$("tpview");if(!t||!v){TP.run=false;return}
  TP.y+=TP.speed*TP.size*0.012*dt/16;var max=t.scrollHeight-v.clientHeight*0.3;
  if(TP.y>=max){TP.y=max;TP.run=false;tpPaint()}
  tpApply();if(TP.run)TP.raf=requestAnimationFrame(tpStep);
}
function tpToggle(){
  if(TP.run){TP.run=false;cancelAnimationFrame(TP.raf);tpPaint();return}
  var c=$("tpcount");if(TP.count)return;
  if(TP.y===0&&c){TP.count=3;c.hidden=false;c.textContent="3";var iv=setInterval(function(){TP.count--;if(TP.count>0){c.textContent=String(TP.count)}else{clearInterval(iv);c.hidden=true;tpGo()}},800);return}
  tpGo();
}
function tpGo(){TP.count=0;TP.run=true;TP.last=0;tpPaint();TP.raf=requestAnimationFrame(tpStep);try{if(navigator.wakeLock&&!TP.lock)navigator.wakeLock.request("screen").then(function(l){TP.lock=l}).catch(function(){})}catch(e){}}
function tpClose(){TP.on=false;TP.run=false;cancelAnimationFrame(TP.raf);var el=$("tp");if(el){el.hidden=true;el.innerHTML=""}document.documentElement.classList.remove("tp-open");try{if(TP.lock){TP.lock.release();TP.lock=null}}catch(e){}}
document.addEventListener("keydown",function(e){
  if(!TP.on)return;
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();tpClose()}
  else if(e.key===" "||e.key==="Enter"){e.preventDefault();e.stopPropagation();tpToggle()}
  else if(e.key==="ArrowUp"){e.preventDefault();tpSpeed(1)}
  else if(e.key==="ArrowDown"){e.preventDefault();tpSpeed(-1)}
  else if(e.key==="ArrowLeft"){e.preventDefault();TP.y=Math.max(0,TP.y-TP.size*3);tpApply()}
  else if(e.key==="ArrowRight"){e.preventDefault();TP.y+=TP.size*3;tpApply()}
},true);
document.addEventListener("click",function(e){if(TP.on&&e.target&&e.target.closest&&e.target.closest("#tpview"))tpToggle()});
document.addEventListener("wheel",function(e){if(TP.on&&e.target.closest&&e.target.closest("#tpview")){TP.y=Math.max(0,TP.y+e.deltaY);tpApply()}},{passive:true});

/* v14: caption & hashtag bank */
var BK={kind:"caption",f:"all",q:"",edit:null};
var BKK=[["caption","Caption"],["tags","Hashtags"],["hook","Hook"]];
function bkList(){return Array.isArray(S.bank)?S.bank:(S.bank=[])}
function bkTags(t){return (String(t).match(/#[\wऀ-ॿ]+/g)||[])}
function bankHTML(){
  var L=bkList(),ed=BK.edit?L.filter(function(x){return x.id===BK.edit})[0]:null,kind=ed?ed.kind:BK.kind;
  var h=hero("bank","Caption bank",null,"");
  if(!readOnly)h+='<section class="panel bk-form"><div class="hd-seg" role="group" aria-label="Type">'+BKK.map(function(k){return '<button data-act="bk_kind" data-id="'+k[0]+'" aria-pressed="'+(kind===k[0])+'"'+(ed?" disabled":"")+'>'+k[1]+'</button>'}).join("")+'</div>'+
    '<input class="in" id="bktitle" aria-label="Caption name" maxlength="60" placeholder="Name it, e.g. Travel reel caption" value="'+esc(ed?ed.title||"":"")+'">'+
    '<textarea class="in" id="bktext" aria-label="Caption text" rows="4" maxlength="2200" placeholder="'+(kind==="tags"?"#travel #vlog #india …":kind==="hook"?"The first line that stops the scroll…":"Your caption. Use {topic} where the topic changes.")+'">'+esc(ed?ed.text:"")+'</textarea>'+
    '<div class="bk-fa"><span class="muted" id="bkcount"></span>'+(ed?'<button class="btn sm" data-act="bk_cancel">Cancel</button>':'')+'<button class="btn pri sm" data-act="bk_save">'+(ed?"Save changes":"Save to bank")+'</button></div></section>';
  if(!L.length)return h+emptyCard("text","Build your caption bank","Keep the captions, hashtag sets and opening hooks you use again and again. Copy them with one tap, or drop them into a planned post from the Calendar.",readOnly?"":'<button class="btn sm" data-act="bk_starter">Add a starter set</button>');
  var cnt={all:L.length};BKK.forEach(function(k){cnt[k[0]]=L.filter(function(x){return x.kind===k[0]}).length});
  h+='<div class="bk-bar"><div class="chips" role="group" aria-label="Filter">'+[["all","All"]].concat(BKK.map(function(k){return [k[0],k[1]==="Hook"?"Hooks":k[1]+(k[0]==="caption"?"s":"")]})).map(function(k){return '<button class="chip" data-act="bk_filter" data-id="'+k[0]+'" aria-pressed="'+(BK.f===k[0])+'">'+k[1]+' '+cnt[k[0]]+'</button>'}).join("")+'</div><input class="in" id="bkq" placeholder="Search the bank" value="'+esc(BK.q)+'" aria-label="Search the bank"></div>';
  h+='<div class="bk-grid" id="bkgrid">'+bkCards()+'</div>';
  return h;
}
function bkCards(){
  var q=BK.q.toLowerCase(),L=bkList().filter(function(x){return (BK.f==="all"||x.kind===BK.f)&&(!q||(x.title+" "+x.text).toLowerCase().indexOf(q)>-1)}).sort(function(a,b){return (b.uses||0)-(a.uses||0)||b.ts-a.ts});
  if(!L.length)return '<div class="empty">Nothing matches.</div>';
  return L.map(function(x){
    var tags=x.kind==="tags"?bkTags(x.text):[];
    return '<article class="bk-card k-'+x.kind+'"><div class="bk-h"><span class="bk-k">'+(x.kind==="tags"?"#":x.kind==="hook"?"Hook":"Caption")+'</span><b>'+esc(x.title||x.text.split("\n")[0].slice(0,40))+'</b></div>'+
      (x.kind==="tags"?'<div class="bk-tags">'+tags.slice(0,14).map(function(t){return '<span>'+esc(t)+'</span>'}).join("")+(tags.length>14?'<span>+'+(tags.length-14)+'</span>':'')+'</div>':'<p class="bk-t">'+esc(x.text)+'</p>')+
      '<div class="bk-f"><span class="muted">'+(x.kind==="tags"?tags.length+" tags · ":"")+x.text.length+' chars'+(x.uses?' · used '+x.uses+'×':'')+'</span><span class="bk-a"><button class="btn sm pri" data-act="bk_copy" data-id="'+x.id+'">Copy</button>'+(readOnly?'':'<button class="ico" data-act="bk_edit" data-id="'+x.id+'" aria-label="Edit">'+I("pen")+'</button><button class="ico danger" data-act="bk_del" data-id="'+x.id+'" aria-label="Delete">'+I("x")+'</button>')+'</span></div></article>';
  }).join("");
}
function bkSave(){
  var t=($("bktext").value||"").trim(),ti=($("bktitle").value||"").trim();if(!t){toast("Write something first");return}
  if(BK.edit){var x=bkList().filter(function(z){return z.id===BK.edit})[0];if(x){x.text=t;x.title=ti;x.ts=Date.now()}BK.edit=null;toast("Saved")}
  else{bkList().unshift({id:uid(),kind:BK.kind,title:ti,text:t,uses:0,ts:Date.now()});toast("Saved to your bank")}
  touch();render();
}
function bkCopy(id){
  var x=bkList().filter(function(z){return z.id===id})[0];if(!x)return;
  var done=function(){x.uses=(x.uses||0)+1;if(!readOnly)touch();var g=$("bkgrid");if(g)g.innerHTML=bkCards();toast("Copied")};
  try{navigator.clipboard.writeText(x.text).then(done,function(){bkFallback(x.text);done()})}catch(e){bkFallback(x.text);done()}
}
function bkFallback(t){var a=document.createElement("textarea");a.value=t;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove()}
function bkStarter(){
  var n=Date.now(),L=bkList();
  [["caption","Behind the scenes","Here's what it actually took to make this one 👇\n\nSave it for later and tell me what you'd do differently."],
   ["caption","Question to comments","Be honest: would you try this? Yes or no in the comments 👇"],
   ["hook","Mistake hook","I wasted months doing this wrong, so you don't have to."],
   ["hook","Result first","This is the result. Here's exactly how I got there."],
   ["tags","Travel set","#travel #travelvlog #india #backpacking #budgettravel #wanderlust #explore #travelgram"],
   ["tags","Creator set","#contentcreator #youtuber #creatorlife #behindthescenes #filmmaking #vlog"]].forEach(function(r,i){L.push({id:uid(),kind:r[0],title:r[1],text:r[2],uses:0,ts:n-i})});
  touch();render();toast("Starter set added. Edit them to sound like you.");
}
document.addEventListener("input",function(e){
  var t=e.target;if(!t)return;
  if(t.id==="bkq"){BK.q=t.value;var g=$("bkgrid");if(g)g.innerHTML=bkCards()}
  if(t.id==="bktext"){var c=$("bkcount");if(c){var tg=bkTags(t.value).length;c.textContent=t.value.length+" chars"+(tg?" · "+tg+" tags":"")+(tg>30?" · Instagram allows 30":"")}}
});

/* v14: repurpose one idea into a planned set */
var RPF=[
  ["long","Long video","YouTube",0,true,"Edit the long video"],
  ["shorts","Shorts","Shorts",1,true,"Cut the Shorts"],
  ["reel","Reel","Instagram",1,true,"Cut the Reel"],
  ["tiktok","TikTok","TikTok",2,true,""],
  ["carousel","Carousel","Instagram",3,false,"Design the carousel"],
  ["thread","Thread","X",0,false,"Write the thread"],
  ["linkedin","Post","LinkedIn",4,false,""],
  ["news","Newsletter","Newsletter",6,false,"Write the newsletter"],
  ["blog","Blog post","Blog",7,false,"Write the blog post"]];
var RP={src:"",title:"",date:"",post:null,idea:null};
function rpOpen(src){
  var k=String(src).split(":"),title="",date=ymd(new Date(Date.now()+864e5)),post=null,idea=null;
  if(k[0]==="idea"){idea=S.ideas.filter(function(x){return x.id===k[1]})[0];if(!idea)return;title=idea.text.replace(/\s*#[\w-]+/g,"").trim()||idea.text}
  else{post=S.posts.filter(function(x){return x.id===k[1]})[0];if(!post)return;title=post.title;date=post.date||date}
  RP={src:src,title:title,date:date,post:post,idea:idea};
  var rows=RPF.map(function(f){
    var main=post&&f[0]==="long";
    return '<label class="rp-row'+(main?" main":"")+'"><input type="checkbox" data-rp="'+f[0]+'"'+((f[4]||main)?" checked":"")+(main?" disabled":"")+'><span class="rp-dot" style="--c:'+platCol(f[2])+'"></span><span class="rp-n"><b>'+f[1]+'</b><i>'+f[2]+(main?" · this post":"")+'</i></span>'+
      (f[0]==="shorts"?'<select class="wsel" data-rp-n="shorts" aria-label="How many Shorts">'+[1,2,3,4,5].map(function(n){return '<option'+(n===3?" selected":"")+'>'+n+'</option>'}).join("")+'</select>':'')+
      '<span class="rp-d">'+(f[3]?"Day +"+f[3]:"Same day")+'</span></label>';
  }).join("");
  infoHTML='<div class="dlgbox rp-dlg" role="dialog" aria-modal="true" aria-label="Repurpose"><h2>Repurpose</h2><p class="muted" style="margin:-4px 0 14px;font-size:13.5px">Turn one piece into a planned set. Each one lands on the Calendar on its own day.</p>'+
    '<label class="plab">What is it about<input class="in" id="rptitle" maxlength="100" value="'+esc(title)+'"></label>'+
    '<label class="plab">Main piece goes out on<input class="in" type="date" id="rpdate" value="'+esc(date)+'"></label>'+
    '<div class="rp-list">'+rows+'</div>'+
    '<label class="cp-sw" style="margin-top:12px"><input type="checkbox" id="rptasks" checked><span><b>Add prep tasks</b><small>One task per piece that needs work, due the day before it goes out.</small></span></label>'+
    '<div class="row"><button class="btn" data-act="rp_cancel">Cancel</button><button class="btn pri" data-act="rp_go">Plan the set</button></div></div>';
  renderDialog();
}
function rpGo(){
  var title=($("rptitle").value||"").trim()||RP.title,start=$("rpdate").value||RP.date,tasks=$("rptasks").checked,grp="r"+uid(),n=0,t=0;
  var add=function(d,k){var x=dparse(start);x.setDate(x.getDate()+d);return ymd(x)};
  var nS=+((document.querySelector('[data-rp-n="shorts"]')||{}).value||3);
  if(RP.post){RP.post.rep=grp;RP.post.repTitle=title;if(!RP.post.date)RP.post.date=start}
  RPF.forEach(function(f){
    var on=document.querySelector('[data-rp="'+f[0]+'"]');if(!on||!on.checked||(RP.post&&f[0]==="long"))return;
    var count=f[0]==="shorts"?nS:1;
    for(var i=0;i<count;i++){
      var day=add(f[3]+(f[0]==="shorts"?i*2:0)),lbl=f[1]+(count>1?" "+(i+1):"");
      S.posts.push({id:uid(),sp:S.cur,title:title+" · "+lbl,platform:f[2],date:day,status:"idea",ideaId:RP.idea?RP.idea.id:(RP.post&&RP.post.ideaId||""),rep:grp,repTitle:title,ts:Date.now()});n++;
    }
    if(tasks&&f[5]){S.tasks.push({id:uid(),sp:S.cur,title:f[5]+(count>1?" ("+count+")":"")+": "+title,col:"i",due:add(Math.max(0,f[3]-1)),pri:0,ts:Date.now()});t++}
  });
  if(RP.idea)RP.idea.task=RP.idea.task||tasks;
  infoHTML="";calSel=start;var cd=dparse(start);calMonth=new Date(cd.getFullYear(),cd.getMonth(),1);touch();go("cal");renderDialog();
  toast("Planned "+n+" piece"+(n===1?"":"s")+(t?" and "+t+" prep task"+(t===1?"":"s"):""));
}

/* v14: video insights */
var DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],DAYL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function med(a){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y}),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2}
function isShort(v){return v.duration_s!=null?v.duration_s<=180:/#shorts/i.test(v.title||"")}
function insStats(vids){
  var now=Date.now(),views=vids.map(function(v){return Number(v.views)||0}),m=med(views);
  var byDay=[0,1,2,3,4,5,6].map(function(d){var a=vids.filter(function(v){return new Date(v.published_at).getDay()===d}).map(function(v){return Number(v.views)||0});return {d:d,n:a.length,m:med(a)}});
  var slots=[["Morning",6,12],["Afternoon",12,17],["Evening",17,21],["Night",21,30]].map(function(s){var a=vids.filter(function(v){var h=new Date(v.published_at).getHours();if(h<6)h+=24;return h>=s[1]&&h<s[2]}).map(function(v){return Number(v.views)||0});return {l:s[0],n:a.length,m:med(a)}});
  var eng=med(vids.filter(function(v){return v.views>0}).map(function(v){return ((Number(v.likes)||0)+(Number(v.comments)||0))/v.views*100}));
  var wk8=vids.filter(function(v){return now-new Date(v.published_at).getTime()<56*864e5}).length/8;
  var sh=vids.filter(isShort),lg=vids.filter(function(v){return !isShort(v)});
  return {m:m,byDay:byDay,slots:slots,eng:eng,wk:wk8,sh:sh,lg:lg,shM:med(sh.map(function(v){return +v.views||0})),lgM:med(lg.map(function(v){return +v.views||0}))};
}
function insHTML(){
  var chs=W.conns.filter(function(c){return (W.vids[c.id]||[]).length});
  if(!chs.length)return emptyCard("chart","No videos yet","Connect a YouTube channel and refresh to see which videos work best.","");
  var c=chs.filter(function(x){return x.id===W.insCh})[0]||chs.filter(function(x){return x.kind==="own"})[0]||chs[0];
  var all=(W.vids[c.id]||[]).slice(),kind=W.insKind||"all";
  var vids=all.filter(function(v){return kind==="all"||(kind==="short"?isShort(v):!isShort(v))});
  var h='<div class="ins-top"><div class="chips">'+chs.map(function(x){return '<button class="chip" data-act="ins_ch" data-id="'+x.id+'" aria-pressed="'+(x.id===c.id)+'">'+esc(x.title||x.handle||"Channel")+(x.kind==="watch"?' · following':'')+'</button>'}).join("")+'</div>'+
    '<div class="hd-seg" role="group" aria-label="Video type">'+[["all","All"],["long","Long"],["short","Shorts"]].map(function(k){return '<button data-act="ins_kind" data-id="'+k[0]+'" aria-pressed="'+(kind===k[0])+'">'+k[1]+'</button>'}).join("")+'</div></div>';
  if(vids.length<3)return h+'<div class="empty" style="padding:30px 0">Need at least 3 '+(kind==="short"?"Shorts":kind==="long"?"long videos":"videos")+' to find patterns. This channel has '+vids.length+'.</div>';
  var st=insStats(vids),m=st.m||1,now=Date.now();
  var bestDay=st.byDay.filter(function(d){return d.n}).sort(function(a,b){return b.m-a.m})[0],bestSlot=st.slots.filter(function(s){return s.n}).sort(function(a,b){return b.m-a.m})[0];
  var top=vids.slice().sort(function(a,b){return b.views-a.views});
  var tips=[];
  if(bestDay&&bestDay.m>m*1.15&&bestDay.n>=2)tips.push("Videos posted on <b>"+DAYL[bestDay.d]+"</b> get <b>"+(bestDay.m/m).toFixed(1)+"×</b> your usual views.");
  if(bestSlot&&bestSlot.m>m*1.15&&bestSlot.n>=2)tips.push("<b>"+bestSlot.l+"</b> uploads do best ("+nf(Math.round(bestSlot.m))+" median views).");
  if(kind==="all"&&st.sh.length>=2&&st.lg.length>=2){var r=st.shM/(st.lgM||1);tips.push(r>=1?"Shorts get <b>"+r.toFixed(1)+"×</b> the views of long videos.":"Long videos get <b>"+(1/r).toFixed(1)+"×</b> the views of Shorts.")}
  var brk=top.filter(function(v){return v.views>=m*2});if(brk.length)tips.push("<b>"+brk.length+"</b> breakout video"+(brk.length>1?"s":"")+" doubled your usual views. Worth a follow-up or a part 2.");
  if(st.wk)tips.push("You post about <b>"+(Math.round(st.wk*10)/10)+"</b> videos a week.");
  h+='<div class="ins-tiles">'+
    '<div class="vz-tile"><span class="vt-l">Usual views</span><b>'+nf(Math.round(m))+'</b><small class="muted">median of '+vids.length+' videos</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Best video</span><b>'+nf(top[0].views)+'</b><small class="muted">'+(top[0].views/m).toFixed(1)+'× usual</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Engagement</span><b>'+st.eng.toFixed(1)+'%</b><small class="muted">likes + comments per view</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Upload pace</span><b>'+(Math.round(st.wk*10)/10)+'/wk</b><small class="muted">last 8 weeks</small></div></div>';
  if(tips.length)h+='<section class="panel ins-tips"><h3>What stands out</h3><ul>'+tips.map(function(t){return '<li>'+t+'</li>'}).join("")+'</ul></section>';
  var dmax=Math.max.apply(null,st.byDay.map(function(d){return d.m}).concat([1]));
  h+='<div class="ins-cols"><section class="panel"><h3>Best day to post</h3><div class="ins-bars">'+[1,2,3,4,5,6,0].map(function(i){var d=st.byDay[i];return '<div class="ib'+(bestDay&&bestDay.d===i?" best":"")+'"><span class="ib-v">'+(d.n?nf(Math.round(d.m)):"–")+'</span><span class="ib-b"><i style="height:'+Math.max(2,Math.round(d.m/dmax*100))+'%"></i></span><span class="ib-l">'+DAYS[i]+'</span><span class="ib-n">'+d.n+'</span></div>'}).join("")+'</div><p class="muted ins-note">Median views by upload day, with the number of videos under each.</p></section>';
  var smax=Math.max.apply(null,st.slots.map(function(s){return s.m}).concat([1]));
  h+='<section class="panel"><h3>Best time of day</h3>'+st.slots.map(function(s){return '<div class="is-row'+(bestSlot&&bestSlot.l===s.l?" best":"")+'"><span>'+s.l+'</span><span class="is-bar"><i style="width:'+Math.max(2,Math.round(s.m/smax*100))+'%"></i></span><b>'+(s.n?nf(Math.round(s.m)):"–")+'</b></div>'}).join("")+
    (kind==="all"&&st.sh.length&&st.lg.length?'<h3 style="margin-top:18px">Shorts vs long</h3><div class="is-row"><span>Shorts ('+st.sh.length+')</span><span class="is-bar"><i style="width:'+Math.round(st.shM/Math.max(st.shM,st.lgM,1)*100)+'%"></i></span><b>'+nf(Math.round(st.shM))+'</b></div><div class="is-row"><span>Long ('+st.lg.length+')</span><span class="is-bar"><i style="width:'+Math.round(st.lgM/Math.max(st.shM,st.lgM,1)*100)+'%"></i></span><b>'+nf(Math.round(st.lgM))+'</b></div>':'')+'</section></div>';
  h+='<section class="panel"><h3>Top videos</h3><div class="ins-list">'+top.slice(0,8).map(function(v,i){var age=Math.max(1,(now-new Date(v.published_at).getTime())/864e5),r=v.views/m;
    return '<a class="ins-v" href="https://www.youtube.com/watch?v='+esc(v.video_id)+'" target="_blank" rel="noopener noreferrer"><span class="ins-i">'+(i+1)+'</span>'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ins-ph">'+(isShort(v)?"Short":"Video")+'</span>')+
      '<span class="ins-t"><b>'+esc(v.title||"")+'</b><small>'+esc(fmtDue(ymd(new Date(v.published_at))))+' · '+nf(Math.round(v.views/age))+' views/day · '+(v.views?(((+v.likes||0)+(+v.comments||0))/v.views*100).toFixed(1):"0")+'% engagement</small></span>'+
      '<span class="ins-n"><b>'+nf(v.views)+'</b>'+(r>=2?'<em class="ins-bk">Breakout '+r.toFixed(1)+'×</em>':'<small class="muted">'+r.toFixed(1)+'× usual</small>')+'</span></a>'}).join("")+'</div></section>';
  var rec=vids.slice().sort(function(a,b){return new Date(b.published_at)-new Date(a.published_at)}).slice(0,6);
  h+='<section class="panel"><h3>Latest uploads vs your usual</h3>'+rec.map(function(v){var r=v.views/m;return '<div class="is-row"><span class="is-t">'+esc(v.title||"")+'</span><span class="is-bar'+(r>=1?" up":" down")+'"><i style="width:'+Math.min(100,Math.round(r*50))+'%"></i></span><b class="'+(r>=1?"up":"down")+'">'+r.toFixed(1)+'×</b></div>'}).join("")+'<p class="muted ins-note">The bar crosses the middle when a video beats your usual views.</p></section>';
  var others=W.conns.filter(function(x){return x.id!==c.id&&(W.vids[x.id]||[]).length>=3});
  if(others.length){h+='<section class="panel"><h3>Compare channels</h3><div class="ins-cmp"><div class="ic-h"><span>Channel</span><span>Usual views</span><span>Engagement</span><span>Per week</span></div>'+[c].concat(others).map(function(x){var s2=insStats(W.vids[x.id]);return '<div class="ic-r'+(x.id===c.id?" me":"")+'"><span>'+esc(x.title||x.handle||"")+(x.kind==="watch"?' <small class="muted">following</small>':'')+'</span><span>'+nf(Math.round(s2.m))+'</span><span>'+s2.eng.toFixed(1)+'%</span><span>'+(Math.round(s2.wk*10)/10)+'</span></div>'}).join("")+'</div></section>'}
  return h;
}

/* v14: import center */
var IMP={step:"drop",name:"",rows:[],head:[],target:"",map:{},guess:"",msg:"",conn:"",plat:"instagram",busy:false,notes:null};
ICONS.upload='<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
var IMPT={
  tasks:{n:"Tasks",d:"Progress board and Calendar",f:[["title","Title",1],["due","Due date"],["stage","Status or list"]]},
  ideas:{n:"Ideas",d:"Your ideas list",f:[["text","Idea",1],["tags","Tags"]]},
  notes:{n:"Notes",d:"One note per row",f:[["title","Title",1],["body","Text"]]},
  posts:{n:"Calendar posts",d:"Planned or published posts",f:[["title","Title",1],["date","Date",1],["platform","Platform"],["status","Status"],["caption","Caption"]]},
  income:{n:"Income",d:"Business, Income tab",f:[["date","Date",1],["amount","Amount",1],["source","From"],["cat","Category"]]},
  deals:{n:"Sponsor deals",d:"Business, Sponsors tab",f:[["brand","Brand",1],["amount","Amount"],["status","Stage"],["due","Deliver by"]]},
  videos:{n:"Video stats",d:"Video insights in Audience",f:[["title","Title",1],["date","Published",1],["views","Views",1],["likes","Likes"],["comments","Comments"],["vid","Video ID"],["dur","Duration"]]},
  audience:{n:"Follower history",d:"Growth charts in Audience",f:[["date","Date",1],["followers","Followers",1],["views","Views"]]}
};
var IMPK={title:["title","name","card name","task","task name","video title","subject","heading"],due:["due","due date","deadline","date","end date"],stage:["status","list","list name","stage","section","section/column","column","state"],
  text:["idea","ideas","title","name","text","content"],tags:["tags","labels","tag","category"],body:["body","description","notes","content","text","card description","details"],
  date:["date","published","publish date","video publish time","day","posted","created","transaction date","txn date","value date"],platform:["platform","channel","network","where"],status:["status","stage","state"],caption:["caption","copy","text","description"],
  amount:["amount","credit","deposit","credit amount","amount (inr)","net","total","gross","fee","rate","value"],source:["source","description","narration","particulars","from","payer","client","brand","customer","details","remarks"],cat:["category","type"],
  brand:["brand","company","sponsor","client","name"],views:["views","view count","plays","video views"],likes:["likes","like count"],comments:["comments","comment count"],vid:["content","video id","video","id"],dur:["duration","length","duration (sec)"],
  followers:["followers","subscribers","follower count","total followers","fans"]};
function impNorm(h){return String(h||"").trim().toLowerCase().replace(/\s+/g," ")}
function impCSV(txt){
  txt=String(txt).replace(/^﻿/,"");var first=txt.split(/\r?\n/)[0]||"",sep=(first.split("\t").length>first.split(",").length)?"\t":((first.split(";").length>first.split(",").length)?";":",");
  var rows=[],row=[],cur="",q=false;
  for(var i=0;i<txt.length;i++){var ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;
    else if(ch===sep){row.push(cur);cur=""}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&txt[i+1]==="\n")i++;row.push(cur);cur="";if(row.some(function(c){return c.trim()}))rows.push(row);row=[]}
    else cur+=ch}
  row.push(cur);if(row.some(function(c){return c.trim()}))rows.push(row);
  return rows;
}
function impGuess(head){
  var H=head.map(impNorm),has=function(){for(var i=0;i<arguments.length;i++)if(H.indexOf(arguments[i])>-1)return true;return false};
  if(has("video title")&&has("views"))return ["videos","YouTube Studio export"];
  if(has("content")&&has("views")&&has("video publish time"))return ["videos","YouTube Studio export"];
  if(has("card name"))return ["tasks","Trello board"];
  if(has("section/column")||(has("name")&&has("section")&&has("assignee")))return ["tasks","Asana project"];
  if(has("followers","subscribers")&&has("date"))return ["audience","Follower history"];
  if(has("brand","sponsor")&&has("amount","rate","fee"))return ["deals","Sponsor list"];
  if((has("credit","deposit","narration","particulars","transaction date","txn date"))||(has("amount")&&has("date")&&!has("title","name")))return ["income","Bank or payments export"];
  if(has("platform")&&has("date")&&has("title","name"))return ["posts","Content calendar"];
  if(has("name")&&has("status")&&(has("due","date","due date")))return ["tasks","Notion or task list"];
  if(has("idea","ideas"))return ["ideas","Ideas list"];
  if(has("title","name")&&has("body","content","notes","description")&&!has("status","due"))return ["notes","Notes"];
  if(H.length===1)return ["ideas","A single list"];
  return ["tasks","Spreadsheet"];
}
function impAutoMap(t){
  var m={},used={},H=IMP.head.map(impNorm);
  IMPT[t].f.forEach(function(f){var c=IMPK[f[0]]||[];for(var i=0;i<c.length;i++){var ix=H.indexOf(c[i]);if(ix>-1&&!used[ix]){m[f[0]]=ix;used[ix]=1;return}}
    for(var j=0;j<H.length;j++){if(used[j])continue;for(var k=0;k<c.length;k++){if(H[j].indexOf(c[k])>-1){m[f[0]]=j;used[j]=1;return}}}
    m[f[0]]=-1});
  if(m[IMPT[t].f[0][0]]===-1){for(var x=0;x<H.length;x++)if(!used[x]){m[IMPT[t].f[0][0]]=x;break}}
  return m;
}
var IMPMON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function impDate(v){
  v=String(v||"").trim();if(!v)return "";var m;
  if(m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))return m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0");
  if(m=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/)){var a=+m[1],b=+m[2],y=+m[3];if(y<100)y+=2000;var d=a,mo=b;if(b>12){d=b;mo=a}return y+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
  if(m=v.match(/^(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})/i)){var mo2=IMPMON[m[2].slice(0,4).toLowerCase()]||IMPMON[m[2].slice(0,3).toLowerCase()];if(mo2)return m[3]+"-"+String(mo2).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0")}
  if(m=v.match(/^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i)){var mo3=IMPMON[m[1].slice(0,4).toLowerCase()]||IMPMON[m[1].slice(0,3).toLowerCase()];if(mo3)return m[3]+"-"+String(mo3).padStart(2,"0")+"-"+String(m[2]).padStart(2,"0")}
  var t=Date.parse(v);return isNaN(t)?"":ymd(new Date(t));
}
function impNum(v){v=String(v==null?"":v).trim();if(!v)return null;var neg=/^\(.*\)$/.test(v)||/^-/.test(v)||/\bdr\b/i.test(v);var n=parseFloat(v.replace(/[^0-9.]/g,""));if(isNaN(n))return null;var mult=/k$/i.test(v.replace(/[\s)]/g,""))?1e3:(/m$/i.test(v.replace(/[\s)]/g,""))?1e6:1);return (neg?-1:1)*n*mult}
function impDur(v){v=String(v||"").trim();if(!v)return null;if(/^\d+$/.test(v))return +v;var p=v.split(":").map(Number);if(p.every(function(x){return !isNaN(x)}))return p.reduce(function(a,b){return a*60+b},0);return null}
function impStage(v){v=impNorm(v);if(!v)return "i";if(/done|complete|shipped|published|finished|closed/.test(v))return "s";if(/review|qa|approval/.test(v))return "r";if(/doing|progress|making|editing|filming|active|working|started/.test(v))return "m";return "i"}
function impPostStatus(v){v=impNorm(v);if(/publish|posted|live|done/.test(v))return "published";if(/schedul/.test(v))return "scheduled";if(/edit/.test(v))return "editing";if(/film|shoot|record/.test(v))return "filming";if(/script|writ/.test(v))return "script";return "idea"}
function impPlat(v){v=impNorm(v);var hit=PLAT.filter(function(p){return v.indexOf(p[0].toLowerCase())>-1})[0];if(hit)return hit[0];if(/yt|youtube/.test(v))return "YouTube";if(/insta|ig|reel/.test(v))return "Instagram";if(/tweet|twitter/.test(v))return "X";return "YouTube"}
function impDealStage(v){v=impNorm(v);if(/paid/.test(v))return "paid";if(/deliver|done|live/.test(v))return "delivered";if(/sign|agree|confirm|won/.test(v))return "signed";if(/talk|negoti|discuss|proposal/.test(v))return "talking";return "lead"}
function impCell(r,k){var i=IMP.map[k];return i==null||i<0?"":String(r[i]==null?"":r[i]).trim()}
function impBuild(){
  var t=IMP.target,out=[],skip=0;
  IMP.rows.forEach(function(r){var o=null,g=function(k){return impCell(r,k)};
    if(t==="tasks"){var ti=g("title");if(ti)o={title:ti.slice(0,200),due:impDate(g("due")),col:impStage(g("stage"))}}
    else if(t==="ideas"){var tx=g("text");if(tx){var tg=g("tags").split(/[,;|]/).map(function(x){return x.trim().replace(/^#/,"").toLowerCase()}).filter(Boolean);o={text:tx.slice(0,240),tags:tg}}}
    else if(t==="notes"){var nt=g("title"),nb=g("body");if(nt||nb)o={title:(nt||nb.split("\n")[0]).slice(0,120),body:nb}}
    else if(t==="posts"){var pt=g("title"),pd=impDate(g("date"));if(pt&&pd)o={title:pt.slice(0,100),date:pd,platform:impPlat(g("platform")),status:impPostStatus(g("status")),caption:g("caption")}}
    else if(t==="income"){var am=impNum(g("amount")),dd=impDate(g("date"));if(am&&am>0&&dd)o={date:dd,amount:Math.round(am*100)/100,source:(g("source")||"Imported").slice(0,60),cat:g("cat")||"Other"}}
    else if(t==="deals"){var br=g("brand");if(br)o={brand:br.slice(0,60),amount:impNum(g("amount"))||0,status:impDealStage(g("status")),due:impDate(g("due"))}}
    else if(t==="videos"){var vt=g("title"),vd=impDate(g("date")),vv=impNum(g("views"));if(vt&&vv!=null&&vd&&!/^total/i.test(vt))o={title:vt.slice(0,200),published_at:vd+"T12:00:00Z",views:Math.round(vv),likes:Math.round(impNum(g("likes"))||0),comments:Math.round(impNum(g("comments"))||0),video_id:(g("vid")&&/^[\w-]{6,}$/.test(g("vid"))?g("vid"):"imp-"+vt.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)+"-"+vd),duration_s:impDur(g("dur"))}}
    else if(t==="audience"){var ad=impDate(g("date")),af=impNum(g("followers"));if(ad&&af!=null)o={date:ad,followers:Math.round(af),views:g("views")?Math.round(impNum(g("views"))||0):null}}
    if(o)out.push(o);else skip++});
  return {items:out,skip:skip};
}
function impParse(txt,name){
  var rows=impCSV(txt);if(!rows.length){IMP.msg="That file looks empty.";render();return}
  var head=rows[0],looksHead=head.some(function(h){return /[a-z]/i.test(h)})&&!head.every(function(h){return impDate(h)||impNum(h)!=null});
  if(!looksHead||head.length===1&&rows.length>1&&!/idea|title|name/i.test(head[0])){head=head.map(function(_,i){return "Column "+(i+1)});}else rows=rows.slice(1);
  IMP.name=name||"Pasted data";IMP.head=head;IMP.rows=rows.slice(0,5000);var g=impGuess(head);IMP.target=g[0];IMP.guess=g[1];IMP.map=impAutoMap(g[0]);IMP.step="map";IMP.msg="";
  if(g[0]==="videos"||g[0]==="audience"){var own=(typeof W!=="undefined"&&W.conns||[]).filter(function(c){return c.kind==="own"&&(g[0]==="audience"||c.platform==="youtube")});IMP.conn=own.length?own[0].id:"new";IMP.plat=g[0]==="videos"?"youtube":"instagram"}
  render();
}
function impNotesFiles(files){
  var list=[].slice.call(files),out=[],n=0;
  list.forEach(function(f){var r=new FileReader();r.onload=function(){var t=String(r.result||""),m=t.match(/^#\s+(.+)$/m);out.push({title:(m?m[1]:f.name.replace(/\.(md|txt)$/i,"")).slice(0,120),body:m?t.replace(m[0],"").trim():t});if(++n===list.length){IMP.notes=out;IMP.step="notes";IMP.name=list.length+" files";render()}};r.readAsText(f)});
}
function impHTML(){
  var h=hero("imp","Import","Bring your data in from other apps. Nothing is overwritten, and you can undo any import.","");
  if(IMP.step==="map")return h+impMapHTML();
  if(IMP.step==="notes")return h+'<section class="panel"><h3>'+IMP.notes.length+' notes ready</h3>'+IMP.notes.slice(0,8).map(function(n){return '<div class="im-pv"><b>'+esc(n.title)+'</b><span class="muted">'+esc(n.body.slice(0,90))+'</span></div>'}).join("")+'<div class="row im-go"><button class="btn" data-act="imp_reset">Cancel</button><button class="btn pri" data-act="imp_notes">Import '+IMP.notes.length+' notes</button></div></section>';
  h+='<label class="fdrop im-drop"><input type="file" id="impfile" accept=".csv,.tsv,.txt,.md,text/csv,text/plain" multiple><span class="ec-i">'+I("upload")+'</span><span><b>Drop a CSV file here, or click to choose</b><small>Export as CSV from Google Sheets, Excel, Notion, Trello, Asana, YouTube Studio, your bank or payment app. Markdown and text files become notes.</small></span></label>';
  h+='<section class="panel im-paste"><h3>Or paste from a spreadsheet</h3><textarea class="in" id="imppaste" aria-label="Pasted rows" rows="4" placeholder="Copy cells in Google Sheets or Excel (with the header row) and paste here"></textarea><div class="row"><button class="btn" data-act="imp_paste">Continue</button></div></section>';
  if(IMP.msg)h+='<p class="cp-note">'+esc(IMP.msg)+'</p>';
  h+='<section class="panel"><h3>Works well with</h3><div class="im-src">'+[
    ["YouTube Studio","Advanced mode → Content → Export → CSV. Becomes video stats for Video insights."],
    ["Instagram / TikTok","Any sheet with Date and Followers. Becomes growth history in Audience."],
    ["Trello, Asana, Notion","Export the board or database as CSV. Becomes tasks with dates and stages."],
    ["Bank or UPI statement","Credits become income with date, amount and who paid."],
    ["Sponsor tracker","Brand, amount, stage and deadline become deals in Business."],
    ["Google Sheets","Paste any list: ideas, posts, notes or tasks."]].map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join("")+'</div></section>';
  var log=(S.imports||[]).slice().reverse().slice(0,8);
  if(log.length)h+='<section class="panel"><h3>Recent imports</h3>'+log.map(function(l){return '<div class="setrow"><span><b style="color:var(--fg)">'+esc(l.file)+'</b> · '+l.n+' '+esc((IMPT[l.t]||{n:l.t}).n.toLowerCase())+' · '+ago(l.ts)+'</span>'+(l.undone?'<span class="muted">Undone</span>':'<button class="btn sm" data-act="imp_undo" data-id="'+l.id+'">Undo</button>')+'</div>'}).join("")+'</section>';
  return h;
}
function impMapHTML(){
  var t=IMP.target,T=IMPT[t],b=impBuild();
  var h='<section class="panel"><div class="im-h"><div><h3 style="margin:0">'+esc(IMP.name)+'</h3><span class="muted">'+IMP.rows.length+' rows · looks like: '+esc(IMP.guess)+'</span></div><button class="btn sm" data-act="imp_reset">Choose another file</button></div>';
  h+='<div class="plab" style="margin-top:14px">Import as<div class="im-targets">'+Object.keys(IMPT).map(function(k){return '<button class="im-t" data-act="imp_target" data-id="'+k+'" aria-pressed="'+(k===t)+'"><b>'+IMPT[k].n+'</b><small>'+IMPT[k].d+'</small></button>'}).join("")+'</div></div>';
  h+='<div class="im-map">'+T.f.map(function(f){return '<label class="plab"><span>'+f[1]+(f[2]?' <i class="req">required</i>':'')+'</span><select class="in" data-imp="'+f[0]+'"><option value="-1">Not in this file</option>'+IMP.head.map(function(hd,i){return '<option value="'+i+'"'+(IMP.map[f[0]]===i?" selected":"")+'>'+esc(hd||("Column "+(i+1)))+'</option>'}).join("")+'</select></label>'}).join("")+'</div>';
  if(t==="videos"||t==="audience"){var own=(W.conns||[]).filter(function(c){return c.kind==="own"&&(t==="audience"||c.platform==="youtube")});
    h+='<label class="plab">Add to channel<select class="in" data-imp-conn="1">'+own.map(function(c){return '<option value="'+c.id+'"'+(IMP.conn===c.id?" selected":"")+'>'+esc((c.title||c.handle||"Channel")+" · "+c.platform)+'</option>'}).join("")+'<option value="new"'+(IMP.conn==="new"?" selected":"")+'>A new channel…</option></select></label>';
    if(IMP.conn==="new")h+='<div class="cp-two"><label class="plab">Platform<select class="in" data-imp-plat="1">'+(t==="videos"?[["youtube","YouTube"]]:PLATS.map(function(p){return [p[0],p[1]]})).map(function(p){return '<option value="'+p[0]+'"'+(IMP.plat===p[0]?" selected":"")+'>'+p[1]+'</option>'}).join("")+'</select></label><label class="plab">Name<input class="in" id="impcname" maxlength="60" placeholder="Your channel or page name"></label></div>'}
  h+='<h3 style="margin:16px 0 8px">Preview</h3>';
  if(!b.items.length)h+='<p class="empty">No rows can be imported with these choices. Check the column matches above.</p>';
  else h+='<div class="im-prev"><table><thead><tr>'+T.f.map(function(f){return '<th>'+f[1]+'</th>'}).join("")+'</tr></thead><tbody>'+b.items.slice(0,6).map(function(o){return '<tr>'+T.f.map(function(f){return '<td>'+esc(impShow(t,f[0],o))+'</td>'}).join("")+'</tr>'}).join("")+'</tbody></table></div>';
  h+='<div class="row im-go"><span class="muted">'+b.items.length+' ready'+(b.skip?' · '+b.skip+' skipped (missing required values)':'')+'</span><button class="btn pri" data-act="imp_go"'+(b.items.length&&!IMP.busy?"":" disabled")+'>'+(IMP.busy?"Importing…":"Import "+b.items.length)+'</button></div></section>';
  return h;
}
function impShow(t,k,o){
  var map={title:o.title,due:o.due?fmtDue(o.due):"",stage:{i:"Idea",m:"Making",r:"Review",s:"Shipped"}[o.col],text:o.text,tags:(o.tags||[]).map(function(x){return "#"+x}).join(" "),body:(o.body||"").slice(0,60),
    date:t==="videos"?fmtDue(o.published_at.slice(0,10)):(o.date?fmtDue(o.date):""),platform:o.platform,status:o.status,caption:(o.caption||"").slice(0,40),amount:o.amount!=null?money(o.amount):"",source:o.source,cat:o.cat,brand:o.brand,
    views:o.views!=null?nf(o.views):"",likes:o.likes?nf(o.likes):"",comments:o.comments?nf(o.comments):"",vid:o.video_id,dur:o.duration_s?Math.round(o.duration_s)+"s":"",followers:o.followers!=null?nf(o.followers):""};
  if(t==="deals"&&k==="due")return o.due?fmtDue(o.due):"";if(t==="deals"&&k==="status")return o.status;
  return map[k]==null?"":String(map[k]);
}
async function impGo(){
  var t=IMP.target,b=impBuild(),id="imp"+uid(),n=0,cname=(($("impcname")||{}).value||"").trim();if(!b.items.length)return;
  IMP.busy=true;render();
  try{
    if(t==="videos"||t==="audience"){
      var cid=IMP.conn;
      if(cid==="new"||!cid){var nm=cname||"Imported "+(t==="videos"?"YouTube":IMP.plat);
        var cr=await WSB.from("connections").upsert({platform:t==="videos"?"youtube":IMP.plat,kind:"own",handle:nm,external_id:"imp-"+nm.toLowerCase().replace(/[^a-z0-9]+/g,"-"),title:nm,source:"manual",status:"ok",last_synced:new Date().toISOString()},{onConflict:"user_id,platform,external_id"}).select("*").single();
        if(cr.error)throw cr.error;cid=cr.data.id}
      if(t==="videos"){var rows=b.items.map(function(o){return Object.assign({},o,{connection_id:cid,user_id:window.__UID,updated_at:new Date().toISOString()})});
        for(var i=0;i<rows.length;i+=200){var r=await WSB.from("videos").upsert(rows.slice(i,i+200),{onConflict:"connection_id,video_id"});if(r.error)throw r.error}
        n=rows.length;impLog({id:id,t:t,n:n,file:IMP.name,conn:cid,vids:rows.map(function(x){return x.video_id})})}
      else{var srows=b.items.sort(function(a,c){return a.date<c.date?-1:1}).map(function(o){return {connection_id:cid,user_id:window.__UID,ts:o.date+"T12:00:00Z",followers:o.followers,views:o.views,extra:{imported:true}}});
        var ids=[];for(var j=0;j<srows.length;j+=200){var r2=await WSB.from("snapshots").insert(srows.slice(j,j+200)).select("id");if(r2.error)throw r2.error;(r2.data||[]).forEach(function(x){ids.push(x.id)})}
        n=srows.length;impLog({id:id,t:t,n:n,file:IMP.name,conn:cid,snaps:ids})}
      await audFresh();
    }else{
      var key={tasks:"tasks",ideas:"ideas",notes:"notes",posts:"posts",income:"income",deals:"deals"}[t],exist={};
      S[key].filter(function(x){return x.sp===S.cur}).forEach(function(x){exist[(x.title||x.text||x.brand||x.source||"")+"|"+(x.due||x.date||"")+"|"+(x.amount||"")]=1});
      b.items.forEach(function(o){var k=(o.title||o.text||o.brand||o.source||"")+"|"+(o.due||o.date||"")+"|"+(o.amount||"");if(exist[k])return;exist[k]=1;
        var it=Object.assign({id:uid(),sp:S.cur,imp:id,ts:Date.now()},o);
        if(t==="tasks")it.pri=0;if(t==="ideas"){it.star=false;it.task=false}if(t==="notes")it.pin=false;if(t==="posts")it.ideaId="";
        S[key].push(it);n++});
      impLog({id:id,t:t,n:n,file:IMP.name,key:key});touch();
    }
    var dest={tasks:"board",ideas:"ideas",notes:"notes",posts:"cal",income:"biz",deals:"biz",videos:"aud",audience:"aud"}[t];
    IMP.step="drop";IMP.busy=false;IMP.msg="";if(t==="income")bizTab="income";
    if(t==="videos")W.audTab="ins";if(t==="audience")W.audTab="ch";
    toast("Imported "+n+" "+IMPT[t].n.toLowerCase()+(b.items.length>n?" ("+(b.items.length-n)+" were already here)":""));go(dest);
  }catch(e){IMP.busy=false;IMP.msg="Import failed: "+((e&&e.message)||"try again");render()}
}
function impLog(o){o.ts=Date.now();o.sp=S.cur;if(!Array.isArray(S.imports))S.imports=[];S.imports.push(o);if(S.imports.length>30)S.imports.shift();touch()}
async function impUndo(id){
  var l=(S.imports||[]).filter(function(x){return x.id===id})[0];if(!l||l.undone)return;
  if(l.key){var before=S[l.key].length;S[l.key]=S[l.key].filter(function(x){return x.imp!==id});l.undone=true;touch();render();toast("Removed "+(before-S[l.key].length)+" items");return}
  try{if(l.vids)for(var i=0;i<l.vids.length;i+=100)await WSB.from("videos").delete().eq("connection_id",l.conn).in("video_id",l.vids.slice(i,i+100));
    if(l.snaps)for(var j=0;j<l.snaps.length;j+=100)await WSB.from("snapshots").delete().in("id",l.snaps.slice(j,j+100));
    l.undone=true;touch();await audFresh();render();toast("Import undone")}catch(e){toast("Couldn't undo that")}
}
document.addEventListener("change",function(e){
  var t=e.target;if(!t)return;
  if(t.id==="impfile"&&t.files&&t.files.length){var fs=[].slice.call(t.files);t.value="";
    if(fs.every(function(f){return /\.(md|txt)$/i.test(f.name)})&&!(fs.length===1&&/\t|,/.test(""))){impNotesFiles(fs);return}
    var f=fs[0];if(f.size>15*1048576){IMP.msg="That file is over 15 MB. Split it or export fewer rows.";render();return}
    if(/\.xlsx?$/i.test(f.name)){IMP.msg="Excel files can't be read here yet. In Excel or Google Sheets choose File → Download → CSV, then drop that file.";render();return}
    var r=new FileReader();r.onload=function(){impParse(String(r.result||""),f.name)};r.readAsText(f)}
  else if(t.dataset&&t.dataset.imp){IMP.map[t.dataset.imp]=+t.value;render()}
  else if(t.dataset&&t.dataset.impConn){IMP.conn=t.value;render()}
  else if(t.dataset&&t.dataset.impPlat){IMP.plat=t.value}
});

async function audFresh(){for(var i=0;i<50&&W.loading;i++)await new Promise(function(r){setTimeout(r,100)});W.loaded=false;W.painted=0;await audLoad(true)}

/* v15: open-plane shell. On desktop there is no top bar: New, search, notifications and a running timer sit at the top of the sidebar. */
var CHROME_AT=null;
function placeChrome(){
  var desk=window.matchMedia("(min-width: 821px)").matches;if(CHROME_AT===desk)return;
  var side=document.querySelector(".side"),top=document.querySelector(".top"),topr=document.querySelector(".topr");if(!side||!top||!topr)return;
  var st=$("sidetools");
  if(!st){st=document.createElement("div");st.id="sidetools";st.className="sidetools";var br=side.querySelector(".brand");side.insertBefore(st,br?br.nextSibling:side.firstChild)}
  var search=document.querySelector(".search"),bell=document.querySelector(".bellwrap"),newb=document.querySelector('[data-act="qtoggle"]'),ft=$("ftimer");newb=newb&&newb.parentNode;
  if(desk){[newb,search,bell,ft].forEach(function(n){if(n)st.appendChild(n)})}
  else{if(search)top.insertBefore(search,topr);[ft,bell,newb].forEach(function(n){if(n)topr.insertBefore(n,topr.firstChild)});if(newb)topr.appendChild(newb)}
  CHROME_AT=desk;
}
window.addEventListener("resize",function(){placeChrome()});
