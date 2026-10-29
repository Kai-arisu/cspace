/* ---------- notes: sections ---------- */
var NTPL=[
  ["blank","Blank","",""],
  ["video","Video script","Video script","## Hook (0:00 to 0:15)\nShow the finished result first.\n\n## Problem\nWhy the old way wastes time.\n\n## Main points\n- Point one\n- Point two\n- Point three\n\n## Call to action\nWhat should they do next?\n\n## Checklist\n- [ ] Film A-roll\n- [ ] Record voiceover\n- [ ] Edit and colour grade\n- [ ] Thumbnail and title\n"],
  ["brief","Content brief","Content brief","## Goal\n\n## Audience\n\n## Key message\n\n## Format and length\n\n## References\n\n## Deadline\n"],
  ["collab","Collab pitch","Collab pitch","## Brand or person\n\n## What they want\n\n## What I offer\n\n## Rates and terms\n\n## Next steps\n- [ ] Reply\n- [ ] Send media kit\n"],
  ["check","Checklist","Checklist","## Checklist\n- [ ] \n- [ ] \n- [ ] \n"],
  ["meet","Meeting notes","Meeting notes","## Agenda\n\n## Notes\n\n## Decisions\n\n## Action items\n- [ ] \n"]
];
function nRender(body){
  var h="",inList=false,lines=String(body||"").split("\n");
  function close(){if(inList){h+="</ul>";inList=false}}
  lines.forEach(function(l,i){var m;
    if((m=l.match(/^\s*-\s\[( |x|X)\]\s?(.*)$/))){if(!inList){h+='<ul class="nd-l">';inList=true}var on=m[1]!==" ";
      h+='<li class="nd-c'+(on?" done":"")+'"><label><input type="checkbox" data-act="nchk" data-line="'+i+'"'+(on?" checked":"")+(readOnly?" disabled":"")+'><span>'+esc(m[2])+'</span></label></li>';return}
    if((m=l.match(/^\s*[-*]\s+(.*)$/))){if(!inList){h+='<ul class="nd-l">';inList=true}h+='<li>'+esc(m[1])+'</li>';return}
    close();
    if((m=l.match(/^(#{1,3})\s+(.+)$/))){h+='<h'+(m[1].length+1)+' class="nd-h">'+esc(m[2])+'</h'+(m[1].length+1)+'>';return}
    if(/^-{3,}\s*$/.test(l)){h+='<hr class="nd-hr">';return}
    if(!l.trim()){h+='<div class="nd-sp"></div>';return}
    h+='<p>'+esc(l)+'</p>'});
  close();
  return h||'<p class="muted">This note is empty. Switch to Write to start.</p>';
}
function nOutline(body){
  var out=[],lines=String(body||"").split("\n"),pos=0;
  lines.forEach(function(l,i){var m=l.match(/^(#{1,3})\s+(.+)$/);if(m)out.push({i:i,pos:pos,lvl:m[1].length,t:m[2]});pos+=l.length+1});
  if(!out.length)return '<span class="muted" style="font-size:13px">Add headings with ## to get a section outline.</span>';
  return out.map(function(o){return '<button class="nsec l'+o.lvl+'" data-act="nsec" data-pos="'+o.pos+'" data-line="'+o.i+'">'+esc(o.t)+'</button>'}).join("");
}
function nToolbar(){
  if(readOnly)return "";
  return '<div class="ntool" role="toolbar" aria-label="Insert"><button class="btn sm" data-act="ninsert" data-t="## ">Heading</button><button class="btn sm" data-act="ninsert" data-t="- ">Bullet</button><button class="btn sm" data-act="ninsert" data-t="- [ ] ">Checklist</button><button class="btn sm" data-act="ninsert" data-t="---">Divider</button><button class="btn sm" data-act="n2tasks" title="Turn unchecked checklist lines into tasks">Checklist to tasks</button></div>';
}
function nInsert(pre){
  var ta=$("nbody"),n=findIn(S.notes,selNote);if(!ta||!n||readOnly)return;
  var v=ta.value,s=ta.selectionStart,ls=v.lastIndexOf("\n",s-1)+1;
  var line=v.slice(ls,v.indexOf("\n",s)<0?v.length:v.indexOf("\n",s));
  var ins=(line.trim()===""?"":"\n")+pre;
  var at=line.trim()===""?ls:ls+line.length;
  ta.value=v.slice(0,at)+ins+v.slice(at);
  var c=at+ins.length;ta.focus();ta.setSelectionRange(c,c);
  n.body=ta.value;n.ts=Date.now();touch();
  var o=$("nout");if(o){o.innerHTML=nOutline(n.body);o.hidden=!/nsec/.test(o.innerHTML)}
}
function nToTasks(){
  var n=findIn(S.notes,selNote);if(!n||readOnly)return;
  var cnt=0;
  n.body=n.body.replace(/^(\s*[-*]\s*)\[ \]\s*(.+)$/gm,function(all,pre,t){t=t.trim();if(!t)return all;S.tasks.push({id:uid(),sp:S.cur,title:t,col:"i",due:"",pri:0,ts:Date.now(),from:n.id});cnt++;return pre+"[→] "+t});
  if(!cnt)return toast("No unchecked lines like “- [ ] task” found");
  n.ts=Date.now();touch();render();toast(cnt+(cnt===1?" task":" tasks")+" added to Progress");
}
function nFromTpl(key){
  var t=NTPL.filter(function(x){return x[0]===key})[0];if(!t||readOnly)return;
  var n={id:uid(),sp:S.cur,title:t[2],body:t[3],pin:false,ts:Date.now()};
  S.notes.push(n);selNote=n.id;noteOpen=true;noteMode="write";S.view="notes";touch();render();var b=$("nbody");if(b){b.focus();b.setSelectionRange(0,0)}
}
document.addEventListener("input",function(e){
  if(e.target.id==="nbody"){var o=$("nout");if(o){o.innerHTML=nOutline(e.target.value);o.hidden=!/nsec/.test(o.innerHTML)}}
});

