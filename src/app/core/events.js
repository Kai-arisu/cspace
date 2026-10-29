/* ---------- events ---------- */
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");
  if(b){act(b.dataset.act,b);return}
  if(!e.target.closest(".qwrap")&&!e.target.closest(".search"))closeMenus();
});
document.addEventListener("keydown",function(e){
  var t=e.target;
  if(e.key==="Escape"){closeMenus();if(addingSpace){addingSpace=false;renderDialog()}}
  if(S.view==="wb"&&!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)){
    if((e.key==="Delete"||e.key==="Backspace")&&WB.sel){e.preventDefault();wbDelete()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();if(e.shiftKey)wbRedo();else wbUndo()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();wbRedo()}
  }
  if(e.key==="Enter"&&t.id==="ideain"){e.preventDefault();addIdea()}
  if(e.key==="Enter"&&t.id==="newspace"){e.preventDefault();act("spaceok",t)}
  if(e.key==="Enter"&&t.dataset&&t.dataset.addtask){
    e.preventDefault();var v=t.value.trim();if(!v)return;
    S.tasks.push({id:uid(),sp:S.cur,title:v,col:t.dataset.addtask,due:"",ts:Date.now()});touch();render();
    var again=document.querySelector('[data-addtask="'+t.dataset.addtask+'"]');if(again)again.focus();
  }
});
document.addEventListener("input",function(e){
  var t=e.target;
  if(t.id==="gsearch")showSearch(t.value);
  if(t.id==="ntitle"||t.id==="nbody"){
    var n=findIn(S.notes,selNote);if(!n)return;
    if(t.id==="ntitle")n.title=t.value;else n.body=t.value;
    n.ts=Date.now();touch();
    var q=$("nsearch");$("nlist").innerHTML=noteListHTML(q?q.value:"");
    var w=$("nwc");if(w)w.textContent=words(n.body)+" words · edited just now";
  }
  if(t.id==="nsearch")$("nlist").innerHTML=noteListHTML(t.value);
  if(t.dataset&&t.dataset.f==="task"){if(t.tagName==="TEXTAREA"&&/\n/.test(t.value))t.value=t.value.replace(/\n+/g," ");var k=findIn(S.tasks,t.dataset.id);if(k){k.title=t.value;touch()}}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.id==="spsel"){
    if(t.value==="__new"){t.value=S.cur;if(!readOnly&&!(window.__WS&&window.__WS.space)){addingSpace=true;renderDialog()}}
    else{S.cur=t.value;touch();render()}
  }
  if(t.dataset&&t.dataset.f==="due"){var k=findIn(S.tasks,t.dataset.id);if(k){k.due=t.value;touch();render()}}
  if(t.id==="wbw"){
    WB.width=+t.value;var wi=findIn(WB.items,WB.sel);
    if(wi&&wi.sw){wbSnap();wi.sw=WB.width;wbTouch();wbPaint()}
  }
});
document.addEventListener("focusin",function(e){if(e.target.id==="gsearch"&&e.target.value)showSearch(e.target.value)});
/* drag and drop for the board */
document.addEventListener("dragstart",function(e){
  var c=e.target.closest&&e.target.closest(".card");if(!c)return;
  e.dataTransfer.setData("text/plain",c.dataset.id);e.dataTransfer.effectAllowed="move";
});
document.addEventListener("dragover",function(e){
  var col=e.target.closest&&e.target.closest(".col");if(!col)return;
  e.preventDefault();col.classList.add("over");
});
document.addEventListener("dragleave",function(e){
  var col=e.target.closest&&e.target.closest(".col");if(col&&!col.contains(e.relatedTarget))col.classList.remove("over");
});
document.addEventListener("drop",function(e){
  var col=e.target.closest&&e.target.closest(".col");if(!col)return;
  e.preventDefault();col.classList.remove("over");
  var id=e.dataTransfer.getData("text/plain");if(id)moveTask(id,col.dataset.col);
});

