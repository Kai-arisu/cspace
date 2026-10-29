/* ---------- search ---------- */
function spLabel(id){var s=S.spaces.filter(function(x){return x.id===id})[0];return s?s.name:((typeof isoName==="function"&&isoName(id))||"")}
function searchResults(q){
  q=q.toLowerCase();var r=[];
  function has(t){return String(t||"").toLowerCase().indexOf(q)>-1}
  function add(o,t,exact){o.rank=(String(t||"").toLowerCase().indexOf(q)===0?0:1)+(o.sp===S.cur?0:.5);r.push(o)}
  S.notes.forEach(function(n){if(has(n.title)||has(n.body))add({k:"Note",c:"var(--c-notes)",l:n.title||"Untitled",sp:n.sp,v:"notes",id:n.id},n.title)});
  S.ideas.forEach(function(i){if(has(i.text))add({k:"Idea",c:"var(--c-ideas)",l:i.text,sp:i.sp,v:"ideas",id:i.id},i.text)});
  S.tasks.forEach(function(t){if(has(t.title))add({k:"Task",c:"var(--c-board)",l:t.title,sp:t.sp,v:"board",id:t.id},t.title)});
  (S.posts||[]).forEach(function(x){if(has(x.title))add({k:"Post",c:"var(--c-viz)",l:x.title,sp:x.sp,v:"cal",id:x.id},x.title)});
  (S.files||[]).forEach(function(x){if(has(x.name))add({k:"File",c:"var(--c-lib)",l:x.name,sp:x.sp,v:"clips",id:x.id},x.name)});
  (S.mood||[]).forEach(function(x){if(has(x.label)||has(x.value)&&x.kind!=="image")add({k:"Mood",c:"var(--c-mood)",l:x.label||x.value,sp:x.sp,v:"mood",id:x.id},x.label)});
  (S.deals||[]).forEach(function(x){var t=x.brand||x.title||x.name;if(has(t))add({k:"Deal",c:"var(--c-notes)",l:t,sp:x.sp,v:"biz",id:x.id},t)});
  S.spaces.forEach(function(x){if(has(x.name))add({k:"Space",c:"var(--c-home)",l:x.name,sp:x.id,v:"home",id:x.id},x.name)});
  if(typeof isoAll==="function"){
    isoAll("notes").forEach(function(n){if(has(n.title)||has(n.body))add({k:"Note",c:"var(--c-notes)",l:n.title||"Untitled",sp:n.sp,v:"notes",id:n.id,iso:1},n.title)});
    isoAll("ideas").forEach(function(i){if(has(i.text))add({k:"Idea",c:"var(--c-ideas)",l:i.text,sp:i.sp,v:"ideas",id:i.id,iso:1},i.text)});
    isoAll("tasks").forEach(function(t){if(has(t.title))add({k:"Task",c:"var(--c-board)",l:t.title,sp:t.sp,v:"board",id:t.id,iso:1},t.title)});
    isoAll("posts").forEach(function(x){if(has(x.title))add({k:"Post",c:"var(--c-viz)",l:x.title,sp:x.sp,v:"cal",id:x.id,iso:1},x.title)});
    (S.iso||[]).forEach(function(x){if(has(x.name))add({k:"Space",c:"var(--c-home)",l:x.name+" (private)",sp:x.id,v:"home",id:x.id,iso:1},x.name)});
  }
  r.sort(function(a,b){return a.rank-b.rank});
  return r.slice(0,14);
}
function showSearch(q){
  var box=$("sres");
  if(!q.trim()){box.hidden=true;return}
  var r=searchResults(q.trim()),multi=S.spaces.length>1;
  box.innerHTML=r.length?r.map(function(x,i){return '<button data-act="gores" data-i="'+i+'" style="--c:'+x.c+'"><span class="k">'+x.k+'</span><span class="l">'+esc(x.l)+'</span>'+(multi&&x.k!=="Space"?'<span class="sp">'+esc(spLabel(x.sp))+'</span>':'')+'</button>'}).join(""):'<div class="none">No matches in any space.</div>';
  box._r=r;box.hidden=false;
}

