/* ---------- actions ---------- */
function findIn(arr,id){return arr.filter(function(x){return x.id===id})[0]}
function moveTask(id,col){var t=findIn(S.tasks,id);if(t&&t.col!==col){if(col==="s")t.done=Date.now();else if(t.col==="s")t.done=0;t.col=col;touch();render()}}

var UNDO_ACTS=/^(bdel|cdel|clipdel|delfile|delidea|delmood|delnote|delspace|deltask|mkwdel)$/,undoPrev="",undoT=0;
function showUndo(prev){
  undoPrev=prev;var u=$("utoast");if(!u)return;u.hidden=false;clearTimeout(undoT);undoT=setTimeout(function(){u.hidden=true;undoPrev=""},8000);
}
function doUndo(){
  if(!undoPrev)return;try{S=JSON.parse(undoPrev)}catch(e){return}fix();touch();undoPrev="";var u=$("utoast");if(u)u.hidden=true;render();toast("Restored");
}
function act(a,b){
  if(UNDO_ACTS.test(a)&&!readOnly){var before=JSON.stringify(S);act0(a,b);if(JSON.stringify(S)!==before)showUndo(before);return}
  act0(a,b);
}
function act0(a,b){
  var id=b.dataset.id;
  if(readOnly&&!/^(ed|ve)_/.test(a)&&["space","view","opennote","nback","nmode","ifilter","mform","mcancel","copycolor","qtoggle","theme","gores","spacecancel","wbtool","wbcolor","wbundo","wbredo","wbdel","wbclear","wbzoom","wbfill","profile","profclose","undoall","datadlg","d_export","rerr_retry","rerr_home","bell","shortcuts","pmode","pacc","pbg","wbhi","wbfilter","wbtl","wbstart","vizrange","vizscope","mlayout","mcopy","sharehelp","dlgclose","comment","cmonth","cday","biztab","kitdl","kitcopy","vdl","clipf","aihelper","aistop","aicopy","pfilter","pmonth","pday","ptoday","pgroup","nsec","palopen","palrun","ftoggle","ftmode","ftreset"].indexOf(a)<0)return;
  if(profAct(a,b)||dataAct(a,b)||rerrAct(a,b)||webAct(a,b))return;
  if(v10act(a,b))return;
  if(ideaAct(a,b,id)||noteAct(a,b,id))return;
  switch(a){
    case "view":go(id);break;
    case "space":S.cur=id;touch();render();break;
    case "spaceadd":addingSpace=true;renderDialog();break;
    case "spacecancel":addingSpace=false;renderDialog();break;
    case "spaceok":{
      var v=($("newspace").value||"").trim();addingSpace=false;
      if(v){var sp={id:"s"+uid(),name:v};S.spaces.push(sp);S.cur=sp.id;S.palette[sp.id]=["#E0388A","#12163A","#F3F4FB"];touch()}
      render();break}
    case "renamespace":{
      var cur=S.spaces.filter(function(x){return x.id===S.cur})[0];
      var el=document.querySelector(".hero h1");
      el.outerHTML='<input class="in" id="rename" value="'+esc(cur.name)+'" maxlength="40" aria-label="Space name" style="font-family:var(--f-display);font-size:26px;font-weight:800">';
      var r=$("rename");r.focus();r.select();
      var done=function(){var nv=r.value.trim();if(nv&&nv!==cur.name){cur.name=nv;touch()}render()};
      r.addEventListener("blur",done);r.addEventListener("keydown",function(e){if(e.key==="Enter"){r.blur()}});
      break}
    case "delspace":arm(b,function(){
      if(S.spaces.length<2)return;
      var sid=S.cur;
      ["notes","ideas","tasks","mood","files","posts","clips","deals","income","invoices"].forEach(function(k){S[k]=S[k].filter(function(x){return x.sp!==sid})});
      delete S.palette[sid];S.spaces=S.spaces.filter(function(x){return x.id!==sid});S.cur=S.spaces[0].id;
      try{localStorage.removeItem(wbKey(sid))}catch(e){}
      if(db){db.doc("boards/"+sid).delete().catch(function(){})}
      touch();render()});break;
    /* top bar */
    case "qtoggle":{var q=$("qmenu");var open=q.hidden;closeMenus();q.hidden=!open;
      if(open){$("qi1").innerHTML=I("notes");$("qi2").innerHTML=I("bulb");$("qi3").innerHTML=I("board")}break}
    case "qnote":newNote();break;
    case "qidea":go("ideas");{var ii=$("ideain");if(ii)ii.focus()}break;
    case "qtask":go("board");{var tt=document.querySelector("[data-addtask]");if(tt)tt.focus()}break;
    case "theme":toggleTheme();break;
    case "pfilter":planFilter=id;render();break;
    case "pmonth":planMonth=new Date(planMonth.getFullYear(),planMonth.getMonth()+(+b.dataset.d),1);render();break;
    case "pday":planSel=id;{var pd=dparse(id);planMonth=new Date(pd.getFullYear(),pd.getMonth(),1)}planOpen.sel=true;if(planFilter==="unplanned")planFilter="all";render();break;
    case "ptoday":planSel=ymd(new Date());{var tdd=new Date();planMonth=new Date(tdd.getFullYear(),tdd.getMonth(),1)}render();break;
    case "pgroup":planOpen[id]=!planOpen[id];render();break;
    case "ptoggle":{var pt=findIn(S.tasks,id);if(pt){if(pt.col==="s"){pt.col=pt.prevCol||"i";pt.done=0}else{pt.prevCol=pt.col;pt.col="s";pt.done=Date.now()}pt.ts=Date.now();touch();render()}break}
    case "tpri":{var tk=findIn(S.tasks,id);if(tk){tk.pri=((tk.pri||0)+1)%4;touch();render()}break}
    case "palopen":palOpen();break;
    case "palrun":palRun(+b.dataset.i);break;
    case "ftoggle":ftToggle();break;
    case "ftmode":ftSwitch();break;
    case "ftreset":ftReset();break;
    case "gores":{var rr=$("sres")._r[+b.dataset.i];if(rr&&rr.iso&&typeof webAct==="function"){webAct("sh_openiso",{dataset:{id:rr.sp}});break}if(rr){S.cur=rr.sp;S.view=rr.v;if(rr.v==="notes")selNote=rr.id;$("gsearch").value="";touch();render()}break}
    /* whiteboard */
    case "wbhelp":showInfo("Whiteboard help",'<ul style="margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li><b>Move around:</b> drag empty space, and scroll to zoom.</li><li><b>Pen, sticky note, text:</b> pick a tool, then click or drag on the board.</li><li><b>Edit text:</b> double-click a note, text or frame title.</li><li><b>Frame:</b> open Shapes, pick Frame and drag a box. Dragging a frame carries what is inside it.</li><li><b>Connect:</b> pick Connect, then click two items.</li><li><b>Delete:</b> select something, then press Delete or use the bin.</li><li><b>Undo:</b> Ctrl+Z, redo with Ctrl+Shift+Z.</li></ul>');break;
    case "wbhint":try{localStorage.setItem("cs-wbhint","1")}catch(e){}wbPaint();break;
    case "wbfirst":WB.tool="sticky";WB.menu="";wbToolbar();toast("Click anywhere on the board to place a sticky note");break;
    case "wbmenu":WB.menu=WB.menu===id?"":id;wbToolbar();break;
    case "wbtool":WB.menu="";WB.tool=id;WB.connFrom=null;wbCommitEdit();wbToolbar();if(id==="conn")toast("Click one item, then another, to link them");break;
    case "wbhi":{var hi=findIn(WB.items,WB.sel);if(hi){wbSnap();hi.hi=!hi.hi;wbTouch();wbPaint()}break}
    case "wbfilter":WB.filter=id;wbPaint();break;
    case "wbtl":{var tl=findIn(WB.items,id);if(tl){WB.sel=id;wbCenter(tl);wbPaint()}break}
    case "wbstart":wbStarter();break;
    case "wbcolor":WB.color=id;{var wi=findIn(WB.items,WB.sel);if(wi&&wi.t!=="sticky"||wi&&wi.t==="sticky"){wbSnap();wi.c=id;wbTouch()}}wbToolbar();break;
    case "wbfill":WB.fill=!WB.fill;{var wf=findIn(WB.items,WB.sel);if(wf&&(wf.t==="rect"||wf.t==="ell")){wbSnap();wf.fill=WB.fill;wbTouch()}}wbToolbar();break;
    case "wbundo":wbUndo();break;
    case "wbredo":wbRedo();break;
    case "wbdel":wbDelete();break;
    case "wbclear":arm(b,function(){if(WB.items.length){wbSnap();WB.items=[];WB.sel=null;wbTouch();wbPaint()}});break;
    case "wbzoom":{var sv=$("wbsvg").getBoundingClientRect();
      if(id==="fit")wbFit();else wbZoomTo(WB.z*(id==="in"?1.25:0.8),sv.width/2,sv.height/2);break}
    case "vizrange":vizRange=+id;render();break;
    case "vizscope":vizAll=(id==="all");render();break;
    /* tasks */
    case "tleft":case "tright":{
      var t2=findIn(S.tasks,id);if(!t2)break;
      var ix=STAGES.map(function(s){return s.id}).indexOf(t2.col)+(a==="tright"?1:-1);
      if(ix>=0&&ix<STAGES.length)moveTask(id,STAGES[ix].id);break}
    case "deltask":S.tasks=S.tasks.filter(function(x){return x.id!==id});touch();render();break;
    /* mood */
    case "mform":moodForm=id;moodSec=b.dataset.sec||null;render();break;
    case "mlayout":bm().layout=id;if(!readOnly)touch();render();break;
    case "medit":moodEdit=!moodEdit;render();break;
    case "mmove":mMove(id,+b.dataset.d);break;
    case "mextract":mExtract(id);break;
    case "mcopy":mCopyText();break;
    case "mstarter":mStarter();break;
    case "mkwdel":{var kw=bm().keywords;kw.splice(+b.dataset.i,1);touch();render();break}
    case "mimport":{var have=palColors(),add=0;(S.palette[S.cur]||[]).forEach(function(c){if(have.indexOf(hx(c))<0){S.mood.push({id:uid(),sp:S.cur,kind:"color",sec:"palette",value:hx(c).toUpperCase(),label:""});add++}});touch();render();toast(add?"Added "+add+" colours from Library":"Library colours are already here");break}
    case "msync":{var seen={},arr=[];palColors().forEach(function(c){c=c.toUpperCase();if(!seen[c]){seen[c]=1;arr.push(c)}});S.palette[S.cur]=arr;touch();toast("Library palette updated");break}
    case "mcancel":moodForm=null;render();break;
    case "msave":saveMood();break;
    case "delmood":S.mood=S.mood.filter(function(x){return x.id!==id});touch();render();break;
    /* library */
    case "copycolor":copy(id);break;
    case "addcolor":{var c=$("pcolor").value.toUpperCase();var p=S.palette[S.cur]||(S.palette[S.cur]=[]);if(p.indexOf(c)<0&&p.length<16){p.push(c);touch()}render();break}
    case "popcolor":{var p2=S.palette[S.cur]||[];p2.pop();touch();render();break}
    case "upfile":uploadFile(b);break;
    case "delfile":arm(b,function(){
      var f=findIn(S.files,id);S.files=S.files.filter(function(x){return x.id!==id});
      S.mood=S.mood.filter(function(m){return !(f&&m.assetId===f.assetId)});
      touch();render();
      if(f&&assets)setTimeout(function(){if(!S.files.some(function(x){return x.assetId===f.assetId}))assets.delete(f.assetId).catch(function(){})},9000)});break;
  }
}
function uploadFile(btn){
  var fi=$("ffile");if(!fi||!fi.files[0])return toast("Choose a file first");
  var file=fi.files[0];btn.disabled=true;toast("Uploading…");
  assets.upload(file).then(function(r){
    S.files.push({id:uid(),sp:S.cur,name:file.name,assetId:r.id,type:r.contentType,size:r.sizeBytes});touch();render();toast("Uploaded");
  }).catch(function(e){btn.disabled=false;toast(upErr(e))});
}
function upErr(e){
  var c=e&&e.code;
  if(c==="too_large")return"That file is too large (20 MB limit).";
  if(c==="unsupported_type")return"That file type isn't supported.";
  if(c==="quota_or_state")return"Storage is full. Delete some files first.";
  if(c==="rate_limited")return"Too many uploads. Wait a moment.";
  return"Upload failed. Try again.";
}

