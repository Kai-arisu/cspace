/* ---------- errors never blank the app ---------- */
var errAt=0;
function oops(){var n=Date.now();if(n-errAt<10000)return;errAt=n;toast("Something went wrong. Your data is safe.")}
window.addEventListener("error",function(e){if(e&&e.target&&e.target!==window)return;oops()});
window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason;if(r&&(r.code==="declined"||r.name==="AbortError"))return;oops()});
function renderFail(e){
  try{console.error(e)}catch(x){}
  var w=$("wrap");if(!w)return;
  w.innerHTML='<div class="panel rerr"><h2>This view hit a problem</h2><p>Your data is safe. You can try again, go back to Today, or restore a backup.</p><div class="drow"><button class="btn pri" data-act="rerr_retry">Try again</button><button class="btn" data-act="rerr_home">Go to Today</button><button class="btn" data-act="datadlg">Data and backup</button></div></div>';
}

function mine(k){return S[k].filter(function(x){return x.sp===S.cur})}
function spaceName(){var s=S.spaces.filter(function(x){return x.id===S.cur})[0];return s?s.name:""}
function spColor(id){var i=S.spaces.map(function(s){return s.id}).indexOf(id);return SPCOL[(i<0?0:i)%SPCOL.length]}

/* ---------- helpers ---------- */
function toast(t){var e=$("toast");e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){e.hidden=true},2200)}
function copy(t){
  try{navigator.clipboard.writeText(t).then(function(){toast("Copied "+t)},function(){toast(t+" (select and copy)")})}
  catch(e){toast(t+" (select and copy)")}
}
function arm(btn,fn){
  if(btn.dataset.armed){fn();return}
  btn.dataset.armed="1";var old=btn.innerHTML;btn.textContent="Confirm";btn.classList.add("danger");
  setTimeout(function(){if(btn.isConnected){delete btn.dataset.armed;btn.innerHTML=old;btn.classList.remove("danger")}},3000);
}
function emptyCard(ic,t,d,acts){return '<div class="ecard"><span class="ec-i">'+I(ic)+'</span><b>'+t+'</b><p>'+d+'</p>'+(acts?'<div class="ec-a">'+acts+'</div>':"")+'</div>'}
function hero(v,title,sub,actions){
  var m=vmeta(v);
  return '<header class="hero"><span class="tile">'+I(m.ic)+'</span><div class="txt"><h1>'+esc(title)+'</h1><p>'+esc(sub||m.desc)+'</p></div><div class="acts">'+(actions||"")+'</div></header>';
}
function go(v){if(v==="plan")v="cal";if(v==="ai")v="home";var ch=S.view!==v;S.view=v;render();if(ch){var w=$("wrap");if(w){w.classList.remove("enter");void w.offsetWidth;w.classList.add("enter");if(window.__csCount)window.__csCount(w);setTimeout(function(){w.classList.remove("enter")},900)}}}
function closeMenus(){var q=$("qmenu");if(q)q.hidden=true;var r=$("sres");if(r)r.hidden=true;var bm2=$("bellm");if(bm2)bm2.hidden=true}

/* ---------- theme ---------- */
function isDark(){
  var t=document.documentElement.getAttribute("data-theme");
  if(t)return t==="dark";
  return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function paintTheme(){$("themebtn").innerHTML=I(isDark()?"sun":"moon")}
function toggleTheme(){
  var t=isDark()?"light":"dark";document.documentElement.setAttribute("data-theme",t);
  try{localStorage.setItem(LS+"-theme",t)}catch(e){}
  paintTheme();
}

/* ---------- chrome ---------- */
function renderChrome(){
  $("today").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
  $("colmain").setAttribute("data-v",S.view);
  $("spaces").innerHTML=S.spaces.map(function(sp){
    var n=S.tasks.filter(function(t){return t.sp===sp.id&&t.col!=="s"}).length;
    return '<button class="si-row" data-act="space" data-id="'+sp.id+'" aria-current="'+(sp.id===S.cur)+'" style="--c:'+spColor(sp.id)+'"><span class="dot"></span><span class="nm">'+esc(sp.name)+'</span><span class="ct" title="Open tasks">'+n+'</span></button>';
  }).join("");
  $("addspace").innerHTML='<button class="sbtn" data-act="spaceadd"'+(readOnly||(window.__WS&&window.__WS.space)?" disabled":"")+'>+ New space</button>';
  $("spsel").innerHTML=S.spaces.map(function(sp){return '<option value="'+sp.id+'"'+(sp.id===S.cur?" selected":"")+'>'+esc(sp.name)+'</option>'}).join("")+(window.__WS&&window.__WS.space?'':'<option value="__new">+ New space…</option>');
  var c={};bellItems().forEach(function(x){if(x.k<=1)c[x.v]=(c[x.v]||0)+1});
  var lastG="";$("nav").innerHTML=VIEWS.map(function(v){
    var gh="";if(v.g&&v.g!==lastG){lastG=v.g;gh='<div class="slbl g">'+v.g+'</div>'}
    return gh+'<button class="si-row" data-act="view" data-id="'+v.id+'" aria-current="'+(S.view===v.id)+'" style="--c:'+v.c+'"><span class="tile">'+I(v.ic)+'</span><span class="nm">'+v.name+'</span>'+(c[v.id]?'<span class="ct hot">'+c[v.id]+'</span>':"")+'</button>';
  }).join("");
  $("soon").parentNode.hidden=!SOON.length;$("soon").innerHTML=SOON.map(function(s){return '<div class="si-row soon"><span class="tile" style="--c:#8187BD">'+I(s.ic)+'</span><span class="nm">'+s.n+'</span><span class="ct">'+s.t+'</span></div>'}).join("");
  $("tabbar").innerHTML=webTabs();
  paintTheme();ftPaint();paintProfile();paintBell();webCrumb();
}
function renderDialog(){
  var d=$("dlg");
  if(profOpen){d.hidden=false;d.innerHTML=profHTML();return}
  if(infoHTML){d.hidden=false;d.innerHTML=infoHTML;return}
  if(!addingSpace){d.hidden=true;d.innerHTML="";return}
  d.hidden=false;
  d.innerHTML='<div class="dlgbox" role="dialog" aria-modal="true" aria-label="New space"><h2>New space</h2><input class="in" id="newspace" placeholder="Channel or project name" maxlength="40" aria-label="Space name"><div class="row"><button class="btn" data-act="spacecancel">Cancel</button><button class="btn pri" data-act="spaceok">Create space</button></div></div>';
  $("newspace").focus();
}

