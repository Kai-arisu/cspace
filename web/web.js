/* ---------- website only: audience numbers, creator page, account ---------- */
ICONS.globe='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>';
ICONS.trend='<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>';
(function(){
  var i=VIEWS.map(function(v){return v.id}).indexOf("viz");
  VIEWS.splice(i+1,0,{id:"aud",name:"Audience",ic:"trend",c:"var(--c-viz)",desc:"Real numbers from your channels and pages."});
  VIEWS.push({id:"cp",g:"You",name:"Handles",ic:"globe",c:"var(--c-home)",desc:"Where people find you."});
})();

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
async function cpLoad(){
  try{
    var r=await WSB.from("profiles").select("*").maybeSingle();
    if(r.error)throw r.error;
    var d=r.data;
    W.p=d?{handle:d.handle||"",display_name:d.display_name||"",tagline:d.tagline||"",bio:d.bio||"",accent:d.accent||"#12163A",is_public:!!d.is_public,avatar_url:d.avatar_url||"",links:Array.isArray(d.links)?d.links:[],exists:true}
      :{handle:suggestHandle(),display_name:(S.profile&&S.profile.name)||"",tagline:"",bio:"",accent:"#12163A",is_public:false,avatar_url:"",links:[],exists:false};
    W.pLoaded=true;W.pErr="";
  }catch(e){W.pErr="Couldn't load your profile. "+((e&&e.message)||"");W.pLoaded=true;if(!W.p)W.p={handle:"",display_name:"",tagline:"",bio:"",accent:"#12163A",is_public:false,avatar_url:"",links:[]}}
  if(S.view==="cp")render();
}
function cpLink(){return location.origin+"/u/"+(W.p&&W.p.handle||"")}
function cpPreviewHTML(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#12163A";
  return '<div class="cp-pv" style="--pa:'+ac+'">'+(p.avatar_url?'<img class="cp-av" src="'+esc(p.avatar_url)+'" alt="">':'<span class="cp-av cp-ini">'+esc((p.display_name||p.handle||"?").slice(0,1).toUpperCase())+'</span>')+
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
    '<label class="cp-pub"><input type="checkbox" data-act="cp_pub"'+(p.is_public?" checked":"")+'> Make this page public</label>'+
    '<p id="cpmsg" class="aud-msg" role="status">'+esc(W.pMsg)+'</p></section></div>'+
    '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+
    '<div class="panel"><h3>Your link</h3>'+(p.exists&&p.is_public?'<p class="cp-url">'+esc(cpLink())+'</p><div class="drow"><button class="btn pri" data-act="cp_copy">Copy link</button><button class="btn" data-act="cp_open">Open page</button></div>':'<p class="muted" style="margin:0">'+(p.exists?'Your page is private. Turn on "Make this page public" and save to get a link.':'Save to get a link.')+'</p>')+
    '<p class="muted" style="font-size:13px;margin:12px 0 0">Channels you switch on in Audience show here with their latest numbers.</p></div>'+
    '<div class="panel"><h3>Account</h3><p style="margin:0 0 12px;font-size:14px">'+esc(window.__EMAIL||"")+'</p>'+
    '<div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>'+
    '<div class="drow"><button class="btn" data-act="cp_pw">Email me a password reset</button><button class="btn" data-act="signout">Sign out</button></div></div></aside></div>'+
    '<input type="file" id="cpfile" accept="image/*" hidden>';
  return h;
}
function cpMsg(t){W.pMsg=t||"";var e=$("cpmsg");if(e)e.textContent=W.pMsg}
function cpPreviewPaint(){var e=$("cppv");if(e)e.innerHTML=cpPreviewHTML();var a=$("cpavprev");if(a&&W.p){a.innerHTML=W.p.avatar_url?'<img src="'+esc(W.p.avatar_url)+'" alt="">':esc((W.p.display_name||"?").slice(0,1).toUpperCase())}}
async function cpSave(){
  var p=W.p;
  p.handle=(p.handle||"").trim().toLowerCase();
  if(!/^[a-z0-9_]{3,24}$/.test(p.handle)){cpMsg("Handles use 3 to 24 letters, numbers or underscores.");return}
  var links=p.links.map(function(l){return {label:(l.label||"").trim().slice(0,30),url:(l.url||"").trim()}}).filter(function(l){return l.url||l.label});
  for(var i=0;i<links.length;i++){if(!/^https?:\/\/\S+\.\S+/i.test(links[i].url)){cpMsg("Link "+(i+1)+" needs a full address starting with https://");return}}
  W.pSaving=true;cpMsg("Saving…");
  var row={user_id:window.__UID,handle:p.handle,display_name:(p.display_name||"").trim()||null,tagline:(p.tagline||"").trim()||null,bio:(p.bio||"").trim()||null,avatar_url:p.avatar_url||null,accent:p.accent,links:links,is_public:!!p.is_public,updated_at:new Date().toISOString()};
  var r=await WSB.from("profiles").upsert(row,{onConflict:"user_id"});
  W.pSaving=false;
  if(r.error){cpMsg(r.error.code==="23505"?"That handle is taken. Try another.":"Couldn't save. "+r.error.message);return}
  p.links=links;p.exists=true;W.pMsg="Saved.";render();toast("Creator page saved");
}

/* ---------- actions ---------- */
function webAct(a,b){
  var id=b.dataset.id;
  switch(a){
    case "more":moreOpen();return true;
    case "view":case "datadlg":moreClose();return false;
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
    case "cp_acc":W.p.accent=id;render();return true;
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
  out+='</div><p class="ms-g">Appearance</p><div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>'+
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
