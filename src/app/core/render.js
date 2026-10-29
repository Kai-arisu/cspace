/* ---------- whiteboard background ---------- */
function wbBgMode(){try{return localStorage.getItem(LS+"-wbbg")||"auto"}catch(e){return"auto"}}
function wbDark(){var m=wbBgMode();return m==="dark"||(m==="auto"&&isDark())}
function wbBgApply(){var w=$("wbwrap");if(w)w.classList.toggle("dk",wbDark())}
function wbBgCycle(){var m=wbBgMode(),n=m==="auto"?"light":(m==="light"?"dark":"auto");try{localStorage.setItem(LS+"-wbbg",n)}catch(e){}wbBgApply();wbToolbar();toast("Canvas: "+n)}

/* ---------- render ---------- */
var RERR=0;
function render(){
  try{render0();RERR=0}catch(e){RERR++;renderFail(e)}
}
function render0(){
  closeMenus();
  renderChrome();
  if(S.view==="plan")S.view="cal";if(S.view==="ai")S.view="home";
  var v=S.view,html="";
  if(v==="home")html=vHome();else if(v==="notes")html=vNotes();else if(v==="ideas")html=vIdeas();
  else if(v==="board")html=vBoard();else if(v==="plan")html=vPlan();else if(v==="cal")html=vCal();else if(v==="biz")html=vBiz();else if(v==="clips")html=vClips();else if(v==="ai")html=vAi();else if(v==="wb")html=vWb();else if(v==="viz")html=vViz();else if(v==="mood")html=vMood();else html=vClips();
  var wv=webView(v);if(wv!==null)html=wv;
  $("wrap").innerHTML=html;
  webMount(v);
  if(v==="notes"&&$("nlist")){$("nlist").innerHTML=noteListHTML("");$("neditor").innerHTML=noteEditorHTML()}
  if(v==="wb"){wbMount();wbBgApply()}
  if(v==="mood"&&$("mcv"))mcvMount();
  renderDialog();
}

