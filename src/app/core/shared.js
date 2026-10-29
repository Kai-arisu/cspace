/* ---------- shared helpers (v10) ---------- */
var downloadsApi=null, sampleApi=null, commentsApi=null, roomApi=null, userApi=null, peers=[], infoHTML="", exportBusy=false;
function cur(){return (S.cfg&&S.cfg.cur)||"₹"}
function money(n){n=Number(n)||0;return cur()+n.toLocaleString("en-IN",{maximumFractionDigits:2})}
function sumBy(a,f){return a.reduce(function(s,x){return s+(Number(typeof f==="function"?f(x):x[f])||0)},0)}
function today0(){var d=new Date();d.setHours(0,0,0,0);return d}
function firstOf(d){return new Date(d.getFullYear(),d.getMonth(),1)}
function opts(list,sel){return list.map(function(o){var v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<option value="'+esc(v)+'"'+(v===sel?" selected":"")+'>'+esc(l)+'</option>'}).join("")}
function saveFile(name,data){
  if(!downloadsApi){
    try{var bl=data instanceof Blob?data:new Blob([data]),u=URL.createObjectURL(bl),an=document.createElement("a");an.href=u;an.download=name;document.body.appendChild(an);an.click();an.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);toast("Saved "+name);return Promise.resolve()}catch(e){toast("Saving files isn't available in this view");return Promise.resolve()}
  }
  return downloadsApi.save({filename:name,data:data}).then(function(){toast("Saved "+name)}).catch(function(e){if(!e||e.code!=="declined")toast("Couldn't save the file")});
}
function showInfo(title,body){infoHTML='<div class="dlgbox" role="dialog" aria-modal="true" aria-label="'+esc(title)+'" style="width:min(520px,100%)"><h2>'+esc(title)+'</h2>'+body+'<div class="row"><button class="btn pri" data-act="dlgclose">Got it</button></div></div>';renderDialog()}
function showShare(){S.view="cp";render()}
function commentOn(sel){
  var el=document.querySelector(sel);if(!el||!commentsApi)return toast("Comments aren't available in this view");
  commentsApi.openComposer({element:el}).then(function(r){if(r&&r.opened===false)toast("Click on the page first, then try again")}).catch(function(){toast("Comments aren't available in this view")});
}
function cbtn(sel){return commentsApi?'<button class="btn sm" data-act="comment" data-sel="'+sel+'">Comment</button>':""}
function paintPeers(){
  var e=$("peers");if(!e)return;
  var n=peers.length;
  if(n>1){e.hidden=false;e.textContent=n+" here now";e.title=peers.map(function(p){return (p.by||"Guest")}).join(", ")}else e.hidden=true;
}

