/* ---------- persistence ---------- */
function setStatus(t){var e=$("status");if(e)e.textContent=t}
function touch(){
  SY.localTs=Date.now();SY.pending=true;dirty=true;
  var json=null;
  try{json=JSON.stringify(S);localStorage.setItem(LS,json);SY.lsFail=false}catch(e){if(!SY.lsFail){SY.lsFail=true;toast("This device is out of storage. Changes will only sync online.")}}
  sySave();if(json)maybeSnap(json);
  syStatus();
  clearTimeout(timer);timer=setTimeout(syFlush,800);
}
/* ---------- persistence and sync engine ---------- */
var TAB="t"+uid(), CH=50000, LOCAL_ONLY={view:1,cur:1};
var SY={meta:null,base:{},localTs:0,syncedTs:0,pending:false,ready:false,busy:false,pulling:false,queued:null,again:false,
  err:"",code:"",retry:0,rtimer:null,full:false,lsFail:false,legacyChecked:false,cloud:[],cloudLoaded:false,lastSnap:0,role:"",wasOff:false};
var DATA={open:false,imp:null,msg:""};

function hsh(s){var h=5381,i=s.length;while(i)h=(h*33)^s.charCodeAt(--i);return (h>>>0).toString(36)+"."+s.length.toString(36)}
function syLoad(){try{var rawm=localStorage.getItem(LS+"-meta"),m=JSON.parse(rawm||"{}");SY.base=m.base||{};SY.localTs=m.localTs||0;SY.syncedTs=m.syncedTs||0;SY.pending=!!m.pending;if(!rawm&&localStorage.getItem(LS)){SY.localTs=1}}catch(e){}}
function sySave(){try{localStorage.setItem(LS+"-meta",JSON.stringify({base:SY.base,localTs:SY.localTs,syncedTs:SY.syncedTs,pending:SY.pending}))}catch(e){}}
function syncPart(st){var o={};Object.keys(st).forEach(function(k){if(!LOCAL_ONLY[k]&&k.charAt(0)!=="_"&&/^[A-Za-z0-9_-]+$/.test(k))o[k]=st[k]});return o}
function splitStr(s){
  var p=[],i=0;
  while(i<s.length){var e=Math.min(s.length,i+CH);if(e<s.length){var c=s.charCodeAt(e-1);if(c>=0xD800&&c<=0xDBFF)e--}p.push(s.slice(i,e));i=e}
  if(!p.length)p.push("");return p;
}
function shards(st){var o={};Object.keys(st).forEach(function(k){var s=JSON.stringify(st[k]);if(s===undefined)s="null";o[k]={h:hsh(s),p:splitStr(s)}});return o}

/* merge two values after a conflict: keep both sides' additions */
function mergeVal(l,r,depth){
  depth=depth||0;
  if(Array.isArray(l)&&Array.isArray(r)){
    var obj=function(a){return a.every(function(x){return x&&typeof x==="object"&&!Array.isArray(x)&&x.id})};
    if(obj(l)&&obj(r)){
      var lm={};l.forEach(function(x){lm[x.id]=x});var seen={},out=[];
      r.forEach(function(x){seen[x.id]=1;var y=lm[x.id];out.push(y&&(y.ts||0)>=(x.ts||0)?y:x)});
      l.forEach(function(x){if(!seen[x.id])out.push(x)});
      return out;
    }
    var out2=r.slice(),keys2=out2.map(function(y){return JSON.stringify(y)});l.forEach(function(x){var kx=JSON.stringify(x);if(keys2.indexOf(kx)<0){out2.push(x);keys2.push(kx)}});
    return out2;
  }
  if(l&&r&&typeof l==="object"&&typeof r==="object"&&!Array.isArray(l)&&!Array.isArray(r)&&depth<3){
    var o={};Object.keys(r).forEach(function(k){o[k]=r[k]});
    Object.keys(l).forEach(function(k){o[k]=(k in r)?mergeVal(l[k],r[k],depth+1):l[k]});
    return o;
  }
  return l;
}

/* apply a remote snapshot (values by key, hashes by key) onto local state */
function syApply(vals,hs){
  var loc=shards(syncPart(S)),changed=false,conflict=false,fresh=!SY.localTs;
  var needSnap=Object.keys(hs).some(function(k){return loc[k]&&loc[k].h!==hs[k]&&!fresh});
  if(needSnap)snapLocal("Before sync",true);
  Object.keys(hs).forEach(function(k){
    if(loc[k]&&loc[k].h===hs[k])return;
    var rv=vals[k];if(rv===undefined)return;
    var bh=SY.base[k],lh=loc[k]&&loc[k].h;
    var remoteChanged=hs[k]!==bh,localChanged=!!lh&&lh!==bh;
    if(fresh||!localChanged){S[k]=rv;changed=true}
    else if(!remoteChanged){SY.pending=true}
    else{S[k]=mergeVal(S[k],rv);changed=true;SY.pending=true;conflict=true}
  });
  Object.keys(hs).forEach(function(k){SY.base[k]=hs[k]});
  if(changed){fix();try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
  sySave();
  return {changed:changed,conflict:conflict};
}
function syRender(){clearTimeout(SY.renderT);if(syBusyUi()){SY.renderT=setTimeout(syRender,2500);return}render()}
function syBusyUi(){var a=document.activeElement;return WB.drag||WB.edit||(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&a.id!=="nsearch"&&a.id!=="dimp")}

async function syFetchKeys(meta,loc){
  var vals={},hs={};
  var keys=Object.keys(meta.keys||{});
  for(var q=0;q<keys.length;q++){
    var k=keys[q],mk=meta.keys[k];hs[k]=mk.h;
    if(loc[k]&&loc[k].h===mk.h){vals[k]=undefined;continue}
    var s="";
    for(var i=0;i<mk.n;i++){
      var d=await db.doc("store/k_"+k+"_"+i).get();
      if(!d.exists||!d.data()||typeof d.data().s!=="string")throw {code:"partial"};
      s+=d.data().s;
    }
    if(hsh(s)!==mk.h)throw {code:"partial"};
    vals[k]=JSON.parse(s);
  }
  return {vals:vals,hs:hs};
}
async function syPull(meta){
  var loc=shards(syncPart(S));
  var r=await syFetchKeys(meta,loc);
  var res=syApply(r.vals,r.hs);
  SY.meta=meta;SY.remoteTs=meta.ts;
  if(res.changed){syRender();if(res.conflict)toast("Merged changes from another device")}
  return res;
}

async function syOnMeta(snap){
  if(!db)return;
  if(SY.busy||SY.pulling){SY.queued=snap;return}
  if(snap.metadata&&snap.metadata.hasPendingWrites)return;
  var m=snap.exists?snap.data():null;
  if(m&&m.dev===TAB&&SY.meta&&m.ts===SY.meta.ts){SY.ready=true;return}
  if(m&&syBusyUi()){clearTimeout(SY.deferT);SY.deferT=setTimeout(function(){syOnMeta(snap)},2500);return}
  SY.pulling=true;
  try{
    if(m){await syPull(m)}
    else{
      if(!SY.legacyChecked){
        SY.legacyChecked=true;
        var lg=await db.doc("app/main").get();
        if(lg.exists&&lg.data()&&lg.data().state&&typeof lg.data().state==="object"){
          var st=syncPart(lg.data().state),sh=shards(st),vals={},hs={};
          Object.keys(sh).forEach(function(k){vals[k]=st[k];hs[k]=sh[k].h});
          var res=syApply(vals,hs);if(res.changed)syRender();
          SY.base={};SY.pending=true;sySave();
        }
      }
    }
    SY.ready=true;SY.err="";SY.code="";SY.retry=0;
  }catch(e){syFail(e,"pull");return}
  finally{SY.pulling=false}
  if(SY.pending||SY.needsPush)syFlush();else{syStatus();syAfterReady()}
}

async function syFlush(force){
  if(!db||readOnly||!SY.ready){syStatus();return}
  if(SY.busy||SY.pulling){SY.again=true;return}
  SY.busy=true;SY.again=false;clearTimeout(SY.rtimer);
  var stamp=SY.localTs;
  syStatus();
  try{
    var lease=async function(){
      var d=db.doc("store/lock");if(!d||typeof d.acquire!=="function")return true;
      var r=await d.acquire({holder:TAB,ttlMs:6000});return !!(r&&r.acquired);
    };
    if(!(await lease())){
      SY.busy=false;clearTimeout(timer);timer=setTimeout(function(){syFlush(force)},1200+Math.random()*1200);syStatus();return;
    }
    var cur=await db.doc("store/meta").get();
    if(cur.exists&&cur.data()&&(!SY.meta||cur.data().ts!==SY.meta.ts)&&cur.data().dev!==TAB)await syPull(cur.data());
    var sh=shards(syncPart(S)),remote=(SY.meta&&SY.meta.keys)||{},keys={};
    for(var k in sh){
      keys[k]={n:sh[k].p.length,h:sh[k].h};
      if(!force&&remote[k]&&remote[k].h===sh[k].h)continue;
      await lease();
      for(var i=0;i<sh[k].p.length;i++)await db.doc("store/k_"+k+"_"+i).set({s:sh[k].p[i],i:i});
    }
    var ts=Math.max(Date.now(),((SY.meta&&SY.meta.ts)||0)+1),meta={ts:ts,dev:TAB,keys:keys,v:2};
    await db.doc("store/meta").set(meta);
    SY.meta=meta;
    for(var k2 in remote){
      var nn=keys[k2]?keys[k2].n:0;
      for(var j=nn;j<remote[k2].n;j++)await db.doc("store/k_"+k2+"_"+j).delete();
    }
    Object.keys(keys).forEach(function(kk){SY.base[kk]=keys[kk].h});
    SY.syncedTs=ts;SY.err="";SY.code="";SY.retry=0;SY.full=false;SY.needsPush=false;
    if(SY.localTs===stamp)SY.pending=false;else SY.again=true;
    sySave();
  }catch(e){SY.busy=false;syFail(e,"push");return}
  SY.busy=false;
  if(SY.queued){var q=SY.queued;SY.queued=null;syOnMeta(q)}
  if(SY.again||SY.pending){SY.again=false;clearTimeout(timer);timer=setTimeout(function(){syFlush()},400)}
  syStatus();syAfterReady();
}
function flush(){return syFlush()}

function syFail(e,where){
  SY.busy=false;SY.pulling=false;
  var code=(e&&e.code)||"unavailable";SY.code=code;SY.err=(e&&e.message)||code;
  if(code==="invalid_argument"&&where==="push"){readOnly=true;SY.err="";setStatus("View only: you can't save here");render();return}
  if(code==="quota_exceeded"){SY.full=true;syStatus();return}
  if(code==="revoked"||code==="not_granted"||code==="capability_disabled"||code==="capability_removed"){db=null;syStatus();return}
  var d=code==="partial"?1500:Math.min(60000,2000*Math.pow(2,SY.retry));SY.retry++;
  if(code==="partial"&&SY.retry>6){SY.err="Another device is mid-save. Will retry.";}
  clearTimeout(SY.rtimer);SY.rtimer=setTimeout(syRetry,d);syStatus();
}
async function syRetry(){
  if(!db)return;
  if(!SY.ready){
    try{var s=await db.doc("store/meta").get();SY.pulling=false;await syOnMeta(s)}catch(e){syFail(e,"pull")}
    return;
  }
  syFlush();
}

function syStatus(){
  var t,st="ok";
  var off=(typeof navigator!=="undefined"&&navigator.onLine===false);
  if(readOnly){t="View only";st="ro"}
  else if(!db){t="Saved on this device";st="local"}
  else if(SY.full){t="Cloud storage full";st="err"}
  else if(off){t="Offline. Saved on this device";st="err"}
  else if(SY.err&&SY.retry>0){t="Retrying sync…";st="err"}
  else if(!SY.ready){t="Connecting…";st="busy"}
  else if(SY.busy||SY.pending||SY.pulling){t="Saving…";st="busy"}
  else{t="All changes saved"}
  setStatus(t);var el=document.querySelector(".status");if(el)el.setAttribute("data-s",st);
  if(DATA.open)dataRefresh();
}
function syAfterReady(){
  if(SY.afterDone||!db||readOnly||!SY.ready)return;SY.afterDone=true;
  cloudList().then(function(){
    var last=SY.cloud.length?SY.cloud[0].ts:0;
    if(Date.now()-last>12*36e5&&!SY.busy){cloudBackup("Daily backup",true)}
  }).catch(function(){});
}

/* ---------- local restore points ---------- */
function snapsGet(){try{var a=JSON.parse(localStorage.getItem(LS+"-snap")||"[]");return Array.isArray(a)?a:[]}catch(e){return[]}}
function snapLocal(label,force,json){
  try{
    var now=Date.now();if(!force&&now-SY.lastSnap<10*60*1000)return;
    json=json||JSON.stringify(S);if(json.length>900000)return;
    var a=snapsGet();
    if(a.length&&a[0].json===json)return;
    a.unshift({ts:now,label:label||"Auto",json:json});
    while(a.length>4)a.pop();
    for(var tries=0;tries<4;tries++){try{localStorage.setItem(LS+"-snap",JSON.stringify(a));break}catch(e){a.pop();if(!a.length)break}}
    SY.lastSnap=now;
  }catch(e){}
}
function maybeSnap(json){snapLocal("Auto",false,json)}

/* ---------- cloud backups ---------- */
async function cloudList(){
  if(!db){SY.cloud=[];return}
  try{
    var q=await db.collection("bk").where("m","==",1).orderBy("ts","desc").limit(20).get();
    var a=[];q.forEach?q.forEach(function(d){a.push(d.data())}):(q.docs||[]).forEach(function(d){a.push(d.data())});
    SY.cloud=a;SY.cloudLoaded=true;
  }catch(e){SY.cloud=[]}
  if(DATA.open)dataRefresh();
}
async function cloudBackup(label,silent){
  if(!db||readOnly)return false;
  try{
    var id="b"+Date.now().toString(36),json=JSON.stringify(backupObj()),p=splitStr(json);
    for(var i=0;i<p.length;i++)await db.doc("bk/"+id+"_"+i).set({s:p[i],i:i});
    await db.doc("bk/"+id+"_m").set({m:1,id:id,ts:Date.now(),label:label||"Backup",n:p.length,h:hsh(json),size:json.length});
    await cloudList();
    var old=SY.cloud.slice(8);
    for(var q=0;q<old.length;q++){
      for(var j=0;j<old[q].n;j++)await db.doc("bk/"+old[q].id+"_"+j).delete();
      await db.doc("bk/"+old[q].id+"_m").delete();
    }
    if(old.length)await cloudList();
    if(!silent)toast("Backed up to the cloud");return true;
  }catch(e){if(!silent)toast(e&&e.code==="quota_exceeded"?"Cloud storage is full":"Couldn't back up. Try again.");return false}
}
async function cloudRead(id){
  var m=SY.cloud.filter(function(x){return x.id===id})[0];if(!m)throw {code:"gone"};
  var s="";
  for(var i=0;i<m.n;i++){var d=await db.doc("bk/"+id+"_"+i).get();if(!d.exists)throw {code:"gone"};s+=d.data().s}
  if(hsh(s)!==m.h)throw {code:"gone"};
  return JSON.parse(s);
}

/* ---------- validate, import, restore ---------- */
function validState(o){
  if(!o||typeof o!=="object"||Array.isArray(o))return null;
  if(o.state&&typeof o.state==="object"&&o.app==="creator-space")o=o.state;
  if(!Array.isArray(o.spaces)||!o.spaces.length)return null;
  var out={};Object.keys(o).forEach(function(k){if(/^[A-Za-z0-9_-]+$/.test(k))out[k]=o[k]});
  return out;
}
function boardsMap(){var m={};S.spaces.forEach(function(sp){var it=null;if(WB.loadedFor===sp.id)it=WB.items;else{try{var raw=localStorage.getItem(wbKey(sp.id));if(raw)it=JSON.parse(raw)}catch(e){}}if(Array.isArray(it)&&it.length)m[sp.id]=it});return m}
function backupObj(){var o=syncPart(S);o.boards=boardsMap();return o}
function restoreBoards(m){
  if(!m||typeof m!=="object")return;
  Object.keys(m).forEach(function(sp){
    var it=m[sp];if(!Array.isArray(it))return;
    try{localStorage.setItem(wbKey(sp),JSON.stringify(it));localStorage.setItem(LS+"-wbp-"+sp,"1")}catch(e){}
    if(WB.loadedFor===sp){WB.items=clone(it);WB.dirty=true;WB.hist=[];WB.redo=[];if(S.view==="wb")wbPaint();wbFlush()}
    else if(db&&!readOnly){wbPush(sp,JSON.stringify(it)).then(function(){try{localStorage.removeItem(LS+"-wbp-"+sp)}catch(e){}}).catch(function(){})}
  });
}
function replaceAll(st,label){
  snapLocal("Before "+label,true);
  var bds=st.boards;delete st.boards;
  var keep={view:S.view,cur:S.cur};
  S=st;S.view=keep.view;S.cur=keep.cur;fix();
  SY.base={};SY.needsPush=true;touch();render();restoreBoards(bds);
  if(db&&!readOnly)syFlush(true);
}
function mergeAll(st){
  snapLocal("Before import",true);
  var bds=st.boards;delete st.boards;
  if(bds){var cur0=boardsMap();Object.keys(bds).forEach(function(sp){if(cur0[sp])bds[sp]=mergeVal(cur0[sp],bds[sp])})}
  var n=syncPart(st);
  Object.keys(n).forEach(function(k){S[k]=(k in S)?mergeVal(S[k],n[k]):n[k]});
  fix();touch();render();restoreBoards(bds);
}
function summary(st){
  var c=function(k){return Array.isArray(st[k])?st[k].length:0};
  return c("spaces")+" spaces, "+c("notes")+" notes, "+c("ideas")+" ideas, "+c("tasks")+" tasks, "+c("mood")+" mood items";
}
function exportBackup(){
  var st=backupObj();
  var data=JSON.stringify({app:"creator-space",v:2,ts:Date.now(),state:st},null,1);
  saveFile("creator-space-backup-"+ymd(new Date())+".json",new Blob([data],{type:"application/json"}));
}
function onImportFile(f){
  if(!f)return;
  if(f.size>20*1048576){DATA.msg="That file is too large.";dataRefresh();return}
  var r=new FileReader();
  r.onload=function(){
    try{var st=validState(JSON.parse(String(r.result)));if(!st)throw 0;DATA.imp=st;DATA.msg=""}
    catch(e){DATA.imp=null;DATA.msg="That doesn't look like a Creator Space backup."}
    dataRefresh();
  };
  r.onerror=function(){DATA.msg="Couldn't read that file.";dataRefresh()};
  r.readAsText(f);
}

/* ---------- data and backup dialog ---------- */
function roleName(){return SY.role||(readOnly?"Viewer":"")}
async function syRole(){
  if(!userApi)return;
  try{
    if(await userApi.isOwner()){SY.role="Owner"}
    else if(await userApi.canEdit()){SY.role="Editor"}
    var w=null;try{w=await userApi.can("data.write")}catch(e){}
    if(w===false){readOnly=true;if(!SY.role)SY.role="Viewer"}
  }catch(e){}
}
function whenStr(ts){return ts?new Date(ts).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):"never"}
function dataHTML(){
  var off=navigator.onLine===false,ro=readOnly?" disabled":"",nodb=(!db||readOnly)?" disabled":"";
  var line,cls="ok";
  if(!db){line="Not signed in, so everything is saved on this device only. Sign in again to sync it.";cls="warn"}
  else if(readOnly){line="You can view this page, but only editors can change it.";cls="warn"}
  else if(SY.full){line="Cloud storage is full. Your changes are still saved on this device. Delete old backups or files to free space.";cls="err"}
  else if(off){line="You are offline. Changes are saved on this device and will sync when you are back online.";cls="warn"}
  else if(!SY.ready){line="Connecting to your cloud database…";cls="warn"}
  else if(SY.err&&SY.retry>0){line="Last sync failed. Retrying automatically.";cls="err"}
  else if(SY.pending||SY.busy){line="Syncing your latest changes…";cls="warn"}
  else line="Everything is synced to your cloud database. Last sync "+whenStr(SY.syncedTs)+".";
  var h='<div class="dlgbox" role="dialog" aria-modal="true" aria-label="Data and backup" style="width:min(560px,100%);max-height:88vh;overflow:auto"><h2>Data and backup</h2>';
  h+='<div class="dstat '+cls+'"><b>'+(db?(readOnly?"View only":"Cloud sync on"):"Device only")+'</b><span>'+esc(line)+'</span></div>';
  h+='<p class="muted" style="margin:8px 0 0;font-size:13px">Signed in as <b>'+esc(window.__EMAIL||"")+'</b></p>';
  h+='<div class="drow"><button class="btn pri" data-act="d_sync"'+nodb+'>Sync now</button><button class="btn" data-act="d_export">Download backup</button><button class="btn" data-act="d_pick"'+ro+'>Import backup</button><button class="btn" data-act="d_cloud"'+nodb+'>Back up to cloud</button></div>';
  h+='<input type="file" id="dimp" accept=".json,application/json" hidden>';
  if(DATA.msg)h+='<p class="dmsg">'+esc(DATA.msg)+'</p>';
  if(DATA.imp){
    h+='<div class="dimp"><b>Ready to import</b><span>'+esc(summary(DATA.imp))+'</span><div class="drow"><button class="btn pri sm" data-act="d_merge">Merge into current</button><button class="btn sm" data-act="d_replace">Replace everything</button><button class="btn sm" data-act="d_impx">Cancel</button></div><small>Your current data is saved as a restore point first.</small></div>';
  }
  var snaps=snapsGet();
  h+='<h3 class="dh">Restore points on this device</h3>';
  h+=snaps.length?'<div class="dlist">'+snaps.map(function(s,i){return '<div class="drp"><span><b>'+esc(s.label)+'</b><small>'+whenStr(s.ts)+' · '+fmtSize(s.json.length)+'</small></span><button class="btn sm" data-act="d_rsnap" data-id="'+i+'"'+ro+'>Restore</button></div>'}).join("")+'</div>':'<p class="muted" style="font-size:13px;margin:4px 0">None yet. They are made automatically while you work.</p>';
  h+='<h3 class="dh">Cloud backups</h3>';
  if(!db)h+='<p class="muted" style="font-size:13px;margin:4px 0">Sign in to keep cloud backups.</p>';
  else h+=SY.cloud.length?'<div class="dlist">'+SY.cloud.map(function(s){return '<div class="drp"><span><b>'+esc(s.label||"Backup")+'</b><small>'+whenStr(s.ts)+' · '+fmtSize(s.size||0)+'</small></span><button class="btn sm" data-act="d_rcloud" data-id="'+esc(s.id)+'"'+ro+'>Restore</button></div>'}).join("")+'</div>':'<p class="muted" style="font-size:13px;margin:4px 0">'+(SY.cloudLoaded?"None yet. One is made automatically each day you use the app.":"Loading…")+'</p>';
  h+='<h3 class="dh">Who can see this</h3><p class="muted" style="font-size:13px;margin:4px 0 0">Only you can see your notes, boards and files. They are tied to your account. Your public creator page shows only what you choose to publish.</p>';
  h+='<div class="row"><button class="btn pri" data-act="dlgclose">Done</button></div></div>';
  return h;
}
function dataOpen(){DATA.open=true;DATA.imp=null;DATA.msg="";infoHTML=dataHTML();renderDialog();if(db&&!SY.cloudLoaded)cloudList()}
function dataRefresh(){if(!DATA.open||infoHTML.indexOf("Data and backup")<0)return;var bx=document.querySelector("#dlg .dlgbox"),sc=bx?bx.scrollTop:0;infoHTML=dataHTML();renderDialog();bx=document.querySelector("#dlg .dlgbox");if(bx)bx.scrollTop=sc}
function dataAct(a,b){
  var id=b.dataset.id;
  switch(a){
    case "dlgclose":DATA.open=false;DATA.imp=null;return false;
    case "datadlg":dataOpen();return true;
    case "d_sync":if(db&&!readOnly){SY.retry=0;syFlush(true);toast("Syncing…")}return true;
    case "d_export":exportBackup();return true;
    case "d_pick":{var f=$("dimp");if(f)f.click();return true}
    case "d_cloud":cloudBackup("Manual backup").then(dataRefresh);return true;
    case "d_impx":DATA.imp=null;dataRefresh();return true;
    case "d_merge":if(DATA.imp){mergeAll(DATA.imp);DATA.imp=null;DATA.msg="Imported and merged.";dataRefresh()}return true;
    case "d_replace":if(DATA.imp){var st=DATA.imp;DATA.imp=null;replaceAll(st,"import");DATA.msg="Backup restored.";dataRefresh()}return true;
    case "d_rsnap":arm(b,function(){var s=snapsGet()[+id];if(!s)return;try{var st=validState(JSON.parse(s.json));if(!st)throw 0;replaceAll(st,"restore");DATA.msg="Restored "+whenStr(s.ts)+".";dataRefresh()}catch(e){DATA.msg="That restore point is damaged.";dataRefresh()}});return true;
    case "d_rcloud":arm(b,function(){cloudRead(id).then(function(o){var st=validState(o);if(!st)throw 0;replaceAll(st,"restore");DATA.msg="Cloud backup restored.";dataRefresh()}).catch(function(){DATA.msg="Couldn't read that backup.";dataRefresh()})});return true;
  }
  return false;
}
document.addEventListener("change",function(e){var t=e.target;if(t&&t.id==="ffile"&&t.files&&t.files[0]&&!readOnly)uploadFile({});});
document.addEventListener("change",function(e){var t=e.target;if(t&&t.id==="dimp"){var f=t.files&&t.files[0];t.value="";onImportFile(f)}});

/* ---------- connection awareness ---------- */
window.addEventListener("online",function(){SY.retry=0;toast("Back online");syStatus();if(db){if(!SY.ready)syRetry();else if(SY.pending)syFlush()}});
window.addEventListener("offline",function(){syStatus();toast("You are offline. Changes stay on this device.")});
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState==="hidden"){if(SY.pending&&SY.ready){clearTimeout(timer);syFlush()}}
  else if(db&&SY.ready&&!SY.busy){syRetry0()}
});
function syRetry0(){if(SY.pending)syFlush()}
window.addEventListener("pagehide",function(){try{if(S)localStorage.setItem(LS,JSON.stringify(S));sySave()}catch(e){}});
setInterval(function(){if(db&&SY.ready&&SY.pending&&!SY.busy&&!SY.pulling&&!readOnly)syFlush()},30000);

