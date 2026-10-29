/* ---------- views ---------- */
/* ---------- profile and preferences ---------- */
var profOpen=false;
var ACCS=[["default","Indigo","#4F46E5"],["rose","Rose","#E8478B"],["green","Green","#10B981"],["amber","Amber","#F59E0B"],["sky","Sky","#0EA5E9"],["ink","Mono","#52525B"]];
var BGS=[["stone","Stone"],["aurora","Aurora"],["plain","Plain"]];
function getPref(){try{var p=JSON.parse(localStorage.getItem(LS+"-pref")||"{}");return p&&typeof p==="object"?p:{}}catch(e){return{}}}
function setPref(k,v){var p=getPref();p[k]=v;try{localStorage.setItem(LS+"-pref",JSON.stringify(p))}catch(e){}applyPrefs()}
function applyPrefs(){
  var p=getPref(),h=document.documentElement;
  if(p.acc&&p.acc!=="default")h.setAttribute("data-acc",p.acc);else h.removeAttribute("data-acc");
  if(p.bg&&p.bg!=="stone")h.setAttribute("data-bg",p.bg);else h.removeAttribute("data-bg");
}
function themeMode(){try{var t=localStorage.getItem(LS+"-theme");return t==="light"||t==="dark"?t:"auto"}catch(e){return"auto"}}
function setMode(m){
  var h=document.documentElement;
  if(m==="auto"){h.removeAttribute("data-theme");try{localStorage.removeItem(LS+"-theme")}catch(e){}}
  else{h.setAttribute("data-theme",m);try{localStorage.setItem(LS+"-theme",m)}catch(e){}}
  paintTheme();
}
function initials(n){var w=String(n||"").trim().split(/\s+/).filter(Boolean);return w.length?(w[0][0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase():"?"}
function avHTML(){var p=S.profile||{},src=p.avatar?"/_blob/"+p.avatar:((typeof W!=="undefined"&&W.p&&W.p.avatar_url)||"");return src?'<img src="'+esc(src)+'" alt="">':'<span>'+esc(initials(p.name))+'</span>'}
function paintProfile(){
  var p=S.profile||{},c=$("pcard"),b=$("pavbtn");
  if(c)c.innerHTML='<span class="av">'+avHTML()+'</span><span class="pt"><b>'+esc(p.name||"Your name")+'</b><i>'+esc(p.role||"Add your role")+'</i></span><span class="pc">'+I("chevd")+'</span>';
  if(b)b.innerHTML='<span class="av sm">'+avHTML()+'</span>';
}
function profHTML(){
  var p=S.profile||{},pf=getPref(),mode=themeMode(),acc=pf.acc||"default",bg=pf.bg||"stone",dis=readOnly?" disabled":"";
  function seg(act,list,cur){return list.map(function(o){return '<button class="chip" data-act="'+act+'" data-id="'+o[0]+'" aria-pressed="'+(cur===o[0])+'">'+o[1]+'</button>'}).join("")}
  return '<div class="dlgbox pdlg" role="dialog" aria-modal="true" aria-label="Your handles"><h2>Profile</h2>'+
    '<div class="prow"><span class="av lg">'+avHTML()+'</span><div class="pbtns"><button class="btn sm" data-act="pupload"'+dis+'>Upload photo</button><button class="btn sm" data-act="pavrm"'+(p.avatar&&!readOnly?"":" disabled")+'>Remove</button></div></div>'+
    '<label class="plab">Name<input class="in" id="pname" maxlength="40" value="'+esc(p.name||"")+'" placeholder="Your name"'+dis+'></label>'+
    '<label class="plab">Role<input class="in" id="prole" maxlength="40" value="'+esc(p.role||"")+'" placeholder="Creator, editor, student…"'+dis+'></label>'+
    '<h2 style="margin-top:18px">Appearance</h2>'+
    '<div class="plab">Mode<div class="pseg">'+seg("pmode",[["auto","Auto"],["light","Light"],["dark","Dark"]],mode)+'</div></div>'+
    '<div class="plab">Accent<div class="pacc">'+ACCS.map(function(a){return '<button class="cs" data-act="pacc" data-id="'+a[0]+'" style="--c:'+a[2]+'" aria-pressed="'+(acc===a[0])+'" aria-label="'+a[1]+'" title="'+a[1]+'"></button>'}).join("")+'</div></div>'+
    '<div class="plab">Background<div class="pseg">'+seg("pbg",BGS,bg)+'</div></div>'+
    '<div class="plab">Account<div class="pseg"><span class="muted" style="font-size:13px;align-self:center">'+esc(window.__EMAIL||"")+'</span><button class="btn sm" data-act="signout">Sign out</button></div></div>'+
    '<p class="muted" style="font-size:12px;margin-top:10px">Appearance is saved on this device. Name, role and photo are part of the space.</p>'+
    '<div class="row"><button class="btn pri" data-act="profclose">Done</button></div></div><input type="file" id="pfile" accept="image/*" hidden>';
}
function profOpenDlg(open){profOpen=open;renderDialog()}
function profAct(a,b){
  var id=b.dataset.id;
  switch(a){
    case "profile":if(window.__WS){toast("Switch back to your own workspace to open your handles");return true}S.view="cp";if(typeof W!=="undefined")W.cpTab="profile";render();return true;
    case "profclose":profOpenDlg(false);return true;
    case "pmode":setMode(id);renderDialog();return true;
    case "pacc":setPref("acc",id);renderDialog();return true;
    case "pbg":setPref("bg",id);renderDialog();return true;
    case "pupload":{var f=$("pfile");if(f)f.click();return true}
    case "pavrm":S.profile.avatar="";touch();paintProfile();renderDialog();return true;
  }
  return false;
}
document.addEventListener("input",function(e){
  var t=e.target;if(readOnly||(t.id!=="pname"&&t.id!=="prole"))return;
  if(!S.profile)S.profile={};
  S.profile[t.id==="pname"?"name":"role"]=t.value;touch();paintProfile();
});
document.addEventListener("change",function(e){
  var t=e.target;if(t.id!=="pfile")return;
  var f=t.files&&t.files[0];t.value="";if(!f||readOnly)return;
  if(!assets){toast("Photo upload isn't available here.");return}
  toast("Uploading…");
  assets.upload(f).then(function(r){S.profile.avatar=r.id;touch();paintProfile();renderDialog();render()}).catch(function(x){toast(upErr(x))});
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&profOpen)profOpenDlg(false)});
document.addEventListener("click",function(e){if(profOpen&&e.target.id==="dlg")profOpenDlg(false)});

/* ---------- canvas helpers ---------- */
function edLoadImg(src){return new Promise(function(res,rej){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){rej(new Error("img"))};im.src=src})}
function edRound(ctx,x,y,w,h,r){r=Math.max(0,Math.min(r||0,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* ---------- reminders and shortcuts ---------- */
function bellSrc(k){var a=(S[k]||[]).slice();if(typeof isoAll==="function")a=a.concat(isoAll(k));return a}
function bellSpName(sp){var n=spLabel(sp);if(!n&&typeof isoName==="function")n=isoName(sp);return n}
function bellItems(all){
  var today=ymd(new Date()),tm=ymd(new Date(Date.now()+86400000)),out=[];
  function add(x,id,k,l,sub,v,ic){if(!all&&x.sp!==S.cur)return;out.push({id:id,k:k,l:l,s:sub+(x.sp!==S.cur?" · "+bellSpName(x.sp):""),v:v,ic:ic,sp:x.sp,iso:!!x._iso})}
  bellSrc("tasks").forEach(function(t){if(t.col==="s"||!t.due)return;
    if(t.due<today)add(t,"t:"+t.id+":o",0,t.title,"Task overdue · "+fmtDue(t.due),"board","check");
    else if(t.due===today)add(t,"t:"+t.id+":d",1,t.title,"Task due today","board","check");
    else if(t.due===tm)add(t,"t:"+t.id+":m",2,t.title,"Task due tomorrow","board","check")});
  bellSrc("posts").forEach(function(p){if(p.status==="published"||!p.date)return;
    if(p.date<today)add(p,"p:"+p.id+":o",0,p.title,"Post overdue · "+fmtDue(p.date),"cal","calendar");
    else if(p.date===today)add(p,"p:"+p.id+":d",1,p.title,"Post goes out today","cal","calendar");
    else if(p.date===tm)add(p,"p:"+p.id+":m",2,p.title,"Post goes out tomorrow","cal","calendar")});
  bellSrc("invoices").forEach(function(v){if(v.paid||!v.due)return;var nm=(v.no||"Invoice")+(v.client?" · "+v.client:"");
    if(v.due<today)add(v,"i:"+v.id+":o",0,nm,"Invoice overdue · "+fmtDue(v.due),"biz","wallet");
    else if(v.due<=tm)add(v,"i:"+v.id+":d",1,nm,"Invoice due "+(v.due===today?"today":"tomorrow"),"biz","wallet")});
  bellSrc("deals").forEach(function(d){if(!d.due||["delivered","paid"].indexOf(d.status)>-1)return;var nm=(d.brand||"Sponsor")+" deliverable";
    if(d.due<today)add(d,"d:"+d.id+":o",0,nm,"Sponsor deliverable overdue · "+fmtDue(d.due),"biz","wallet");
    else if(d.due===today)add(d,"d:"+d.id+":d",1,nm,"Sponsor deliverable due today","biz","wallet");
    else if(d.due===tm)add(d,"d:"+d.id+":m",2,nm,"Sponsor deliverable due tomorrow","biz","wallet")});
  try{if(typeof T!=="undefined"&&T.loaded&&T.work){T.work.forEach(function(w){if(w.status==="done"||!w.due||w.due>=today)return;var m=T.members.filter(function(x){return x.id===w.member_id})[0];out.push({id:"w:"+w.id+":o",k:0,l:w.title,s:(m?m.name+" · ":"")+"Team work late · "+fmtDue(w.due),v:"team",ic:"users",sp:S.cur})})}}catch(e){}
  return out.sort(function(a,b){return a.k-b.k});
}
function bellUnread(){var r=S.nread||{};return bellItems(true).filter(function(x){return !r[x.id]})}
function paintBell(){
  var b=$("bellbtn");if(!b)return;var n=bellUnread().length;
  b.setAttribute("aria-label",n?n+" unread notifications":"Notifications");
  b.innerHTML=I("bell")+(n?'<span class="bdg">'+(n>9?"9+":n)+'</span>':"");
}
function bellMark(ids){
  if(!S.nread||typeof S.nread!=="object")S.nread={};
  var live={};bellItems(true).forEach(function(x){live[x.id]=1});
  Object.keys(S.nread).forEach(function(k){if(!live[k])delete S.nread[k]});
  ids.forEach(function(i){S.nread[i]=1});touch();
}
function bellHTML(){
  var it=bellItems(true),r=S.nread||{},un=it.filter(function(x){return !r[x.id]}).length;
  var h='<div class="bhd"><span>Notifications</span>'+(un?'<button class="btn sm" data-act="bellall">Mark all read</button>':"")+'</div>';
  if(!it.length)return h+'<div class="bempty"><b>All caught up</b><span>Overdue tasks, posts, invoices and late team work show up here.</span></div>';
  var groups=[[0,"Needs attention"],[1,"Today"],[2,"Coming up"]];
  groups.forEach(function(g){
    var l=it.filter(function(x){return x.k===g[0]});if(!l.length)return;
    h+='<div class="bgrp">'+g[1]+'</div>'+l.slice(0,6).map(function(x){
      return '<button class="bit'+(r[x.id]?" read":"")+'" data-act="bellgo" data-id="'+esc(x.id)+'" data-v="'+x.v+'" data-sp="'+esc(x.sp||"")+'" data-iso="'+(x.iso?1:"")+'"><span class="bic k'+x.k+'">'+I(x.ic)+'</span><span class="bt"><b>'+esc(x.l)+'</b><i>'+esc(x.s)+'</i></span>'+(r[x.id]?"":'<span class="bun"></span>')+'</button>'}).join("");
  });
  return h+'<div class="bft"><button class="btn sm" data-act="view" data-id="cp">Phone alerts and settings</button></div>';
}
function bellToggle(){
  var m=$("bellm");if(!m)return;var open=m.hidden;closeMenus();if(!open)return;
  m.innerHTML=bellHTML();m.hidden=false;
}
var SHORTCUTS=[["Ctrl K","Search and commands"],["?","Show this list"],["G then H","Go to Today"],["G then N","Notes"],["G then I","Ideas"],["G then M","Moodboard"],["G then W","Whiteboard"],["G then P","Planner"],["G then B","Progress board"],["Ctrl Z","Undo in the Whiteboard"],["Space","Play or pause in the Video editor"],["I and O","Set trim start and end in the Video editor"],["Delete","Remove the selected item on a canvas"]];
function showShortcuts(){
  showInfo("Keyboard shortcuts",'<div class="shk">'+SHORTCUTS.map(function(s){return '<div><kbd>'+esc(s[0])+'</kbd><span>'+esc(s[1])+'</span></div>'}).join("")+'</div>');
}
document.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.id==="qcin"){e.preventDefault();v10act("qcap",{dataset:{id:"idea"}})}});
var gPend=0;
document.addEventListener("keydown",function(e){
  var t=e.target;if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="?"){e.preventDefault();showShortcuts();return}
  if(gPend&&Date.now()-gPend<1200){
    var map={h:"home",n:"notes",i:"ideas",m:"mood",w:"wb",p:"cal",b:"board",c:"cal",l:"clips"},v=map[e.key.toLowerCase()];gPend=0;
    if(v){e.preventDefault();go(v)}return;
  }
  if(e.key==="g"||e.key==="G"){gPend=Date.now()}
});
/* paste or drop images into the moodboard and library */
function addPicture(file){
  if(!file||!/^image\//.test(file.type)||readOnly)return;
  if(!assets){toast("Image upload isn't available here.");return}
  toast("Uploading…");
  assets.upload(file).then(function(r){
    var nm=file.name||"Pasted image";
    S.files.push({id:uid(),sp:S.cur,name:nm,assetId:r.id,type:r.contentType,size:r.sizeBytes});
    if(S.view==="mood")S.mood.push({id:uid(),sp:S.cur,kind:"image",assetId:r.id,label:"",value:""});
    touch();render();toast("Added");
  }).catch(function(x){toast(upErr(x))});
}
document.addEventListener("paste",function(e){
  if((S.view!=="mood"&&S.view!=="clips")||/^(INPUT|TEXTAREA)$/.test((e.target||{}).tagName))return;
  var items=e.clipboardData&&e.clipboardData.items;if(!items)return;
  for(var i=0;i<items.length;i++){if(items[i].type.indexOf("image/")===0){var f=items[i].getAsFile();if(f){e.preventDefault();addPicture(f)}break}}
});
document.addEventListener("dragover",function(e){if((S.view==="mood"||S.view==="clips")&&e.dataTransfer&&e.dataTransfer.types&&[].indexOf.call(e.dataTransfer.types,"Files")>-1)e.preventDefault()});
document.addEventListener("drop",function(e){
  if(S.view!=="mood"&&S.view!=="clips")return;var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(f&&/^image\//.test(f.type)){e.preventDefault();addPicture(f)}
});

