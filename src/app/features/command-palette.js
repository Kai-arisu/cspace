/* ---------- command palette ---------- */
var PAL={open:false,q:"",sel:0,items:[]};
function palBuild(){
  var q=PAL.q.trim(),ql=q.toLowerCase(),out=[];
  var add=function(g,l,ic,c,fn){out.push({g:g,l:l,ic:ic,c:c,fn:fn})};
  VIEWS.forEach(function(v){add("Go to","Open "+v.name,v.ic,v.c,function(){go(v.id)})});
  S.spaces.forEach(function(sp){if(sp.id!==S.cur)add("Spaces","Switch to "+sp.name,"home",spColor(sp.id),function(){S.cur=sp.id;touch();render()})});
  if(!readOnly){
    add("Create","New note","notes","var(--c-notes)",function(){newNote()});
    if(q){
      add("Create","Add idea: "+q,"bulb","var(--c-ideas)",function(){addIdeaText(q,false)});
      add("Create","Add task: "+q,"board","var(--c-board)",function(){S.tasks.push({id:uid(),sp:S.cur,title:q,col:"i",due:"",pri:0,ts:Date.now()});touch();S.view="board";render()});
    }
  }
  add("Actions",FT.run?"Pause focus timer":"Start focus timer","timer","var(--c-wb)",ftToggle);
  add("Actions","How to share this space","users","var(--c-home)",showShare);
  add("Actions","Switch light or dark theme","moon","var(--c-home)",toggleTheme);
  add("Actions","Keyboard shortcuts","cmd","var(--c-home)",showShortcuts);
  add("Actions","Data and backup","folder","var(--c-home)",dataOpen);
  add("Actions","Your handles","users","var(--c-home)",function(){profOpenDlg(true)});
  out=out.filter(function(i){return !ql||i.l.toLowerCase().indexOf(ql)>-1});
  if(ql.length>1){
    var hit=function(txt){return String(txt||"").toLowerCase().indexOf(ql)>-1},found=[];
    S.notes.forEach(function(n){if(hit(n.title+" "+n.body))found.push({g:"Found",l:n.title||"Untitled note",ic:"notes",c:"var(--c-notes)",fn:function(){S.cur=n.sp;S.view="notes";selNote=n.id;touch();render()}})});
    S.ideas.forEach(function(i){if(hit(i.text))found.push({g:"Found",l:i.text,ic:"bulb",c:"var(--c-ideas)",fn:function(){S.cur=i.sp;S.view="ideas";touch();render()}})});
    S.tasks.forEach(function(t){if(hit(t.title))found.push({g:"Found",l:t.title,ic:"board",c:"var(--c-board)",fn:function(){S.cur=t.sp;S.view="board";touch();render()}})});
    out=out.concat(found.slice(0,6));
  }
  PAL.items=out.slice(0,14);
  if(PAL.sel>=PAL.items.length)PAL.sel=Math.max(0,PAL.items.length-1);
}
function palList(){
  palBuild();
  var l=$("pallist");if(!l)return;
  var last="",h="";
  PAL.items.forEach(function(it,i){
    if(it.g!==last){h+='<div class="palg">'+it.g+'</div>';last=it.g}
    h+='<button class="palit" role="option" aria-selected="'+(i===PAL.sel)+'" data-act="palrun" data-i="'+i+'" style="--c:'+it.c+'"><span class="tile">'+I(it.ic)+'</span><span class="l">'+esc(it.l)+'</span></button>';
  });
  l.innerHTML=h||'<div class="empty" style="padding:14px">Nothing matches. Keep typing to add it as an idea or task.</div>';
  var s=l.querySelector('[aria-selected="true"]');if(s&&s.scrollIntoView)s.scrollIntoView({block:"nearest"});
}
function palOpen(){
  PAL.open=true;PAL.q="";PAL.sel=0;
  var d=$("pal");d.hidden=false;
  d.innerHTML='<div class="palbox" role="dialog" aria-modal="true" aria-label="Command palette"><input class="palin" id="palq" placeholder="Type a command, or search your work…" autocomplete="off" aria-label="Command palette"><div class="pallist" id="pallist" role="listbox"></div><div class="palfoot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> run</span><span><kbd>Esc</kbd> close</span></div></div>';
  palList();$("palq").focus();
}
function palClose(){PAL.open=false;var d=$("pal");d.hidden=true;d.innerHTML=""}
function palRun(i){var it=PAL.items[i];if(!it)return;palClose();it.fn()}
$("pal").addEventListener("mousedown",function(e){if(e.target===this)palClose()});
document.addEventListener("keydown",function(e){
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(PAL.open)palClose();else palOpen();return}
  if(!PAL.open)return;
  if(e.key==="Escape"){e.preventDefault();palClose()}
  else if(e.key==="ArrowDown"){e.preventDefault();PAL.sel=Math.min(PAL.items.length-1,PAL.sel+1);palList()}
  else if(e.key==="ArrowUp"){e.preventDefault();PAL.sel=Math.max(0,PAL.sel-1);palList()}
  else if(e.key==="Enter"){e.preventDefault();palRun(PAL.sel)}
},true);
document.addEventListener("input",function(e){if(e.target.id==="palq"){PAL.q=e.target.value;PAL.sel=0;palList()}});
try{if(/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent))$("kbdlabel").textContent="⌘ K"}catch(e){}

