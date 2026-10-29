/* ---------- overview bento ---------- */
function bnSeries(){
  var days=[],i;for(i=13;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days.push(ymd(d))}
  var chg=days.map(function(){return 0}),shp=chg.slice();
  function add(arr,ts){if(!ts)return;var k=days.indexOf(ymd(new Date(ts)));if(k>-1)arr[k]++}
  ["notes","ideas","tasks"].forEach(function(k){mine(k).forEach(function(x){add(chg,x.ts)})});
  mine("tasks").forEach(function(x){if(x.col==="s")add(shp,x.done||x.ts)});
  return {chg:chg,shp:shp};
}
function bnLine(vals,w,h,mx){
  if(vals.length<2)return"";
  var pts=vals.map(function(v,i){return [w*i/(vals.length-1),h-4-(h-8)*(v/(mx||1))]});
  var d="M"+r1(pts[0][0])+" "+r1(pts[0][1]);
  for(var i=1;i<pts.length;i++){var m=(pts[i-1][0]+pts[i][0])/2;d+="C"+r1(m)+" "+r1(pts[i-1][1])+" "+r1(m)+" "+r1(pts[i][1])+" "+r1(pts[i][0])+" "+r1(pts[i][1])}
  return d;
}
function bnSchedule(t,fmin){
  var today=ymd(new Date()),rows="",any=false,posts=mine("posts").filter(function(p){return p.status!=="published"&&p.date});
  for(var i=0;i<6;i++){
    var d=new Date();d.setDate(d.getDate()+i);var key=ymd(d),items=[];
    t.forEach(function(x){if(x.col!=="s"&&x.due&&(x.due===key||(i===0&&x.due<today)))items.push({k:"task",title:x.title,late:x.due<today,view:"board"})});
    posts.forEach(function(p){if(p.date===key)items.push({k:"post",title:p.title,late:false,view:"cal"})});
    if(items.length)any=true;
    rows+='<div class="bn-day"><span class="bn-dl">'+(i===0?"Today":d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"}))+'</span><div class="bn-track">'+
      items.slice(0,3).map(function(it,j){return '<button class="bn-pill'+(it.k==="post"?" post":"")+'" style="margin-left:'+(j===0?i*3:6)+'%" data-act="view" data-id="'+it.view+'" title="'+esc(it.title)+'">'+(it.late?'<i class="bn-late"></i>':"")+esc(it.title)+'</button>'}).join("")+
      (items.length>3?'<span class="muted" style="font-size:12px;margin-left:8px">+'+(items.length-3)+'</span>':"")+'</div></div>';
  }
  return '<section class="panel bn-sch"><h2>This week<span class="bn-chip">'+I("timer")+fmin+' min focused today</span></h2>'+
    (any?'<div class="bn-days">'+rows+'</div>':'<div class="bn-days">'+rows+'</div><div class="empty" style="margin-top:8px">Nothing scheduled yet. Give a task a due date or schedule a post.</div>')+
    '<div class="bn-leg"><span><i class="k"></i>Task</span><span><i class="k post"></i>Post</span><span><i class="k late"></i>Overdue</span></div></section>';
}
function bnProgress(t,pct,r){
  var s=bnSeries(),mx=Math.max.apply(null,s.chg.concat(s.shp).concat([1])),total=t.length,rv=total?Math.round(r/total*100):0;
  var ideas=mine("ideas"),conv=ideas.length?Math.round(ideas.filter(function(x){return x.task}).length/ideas.length*100):0;
  function row(c,n,v){return '<div class="bn-row"><span class="bn-dot" style="--c:'+c+'"></span><span class="nm">'+n+'</span><b>'+v+'%</b></div>'}
  return '<section class="panel bn-prog"><h2>Progress</h2><div class="bn-big">'+pct+'<small>%</small></div><div class="muted" style="font-size:13px">Tasks shipped</div>'+
    '<svg class="bn-chart" viewBox="0 0 240 84" role="img" aria-label="Activity over the last 14 days"><path d="'+bnLine(s.chg,240,84,mx)+'" fill="none" stroke="var(--fg)" stroke-width="2.2" stroke-linecap="round"/><path d="'+bnLine(s.shp,240,84,mx)+'" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"/></svg>'+
    row("var(--st-s)","Shipped",pct)+row("var(--st-r)","In review",rv)+row("var(--c-ideas)","Ideas turned into tasks",conv)+'</section>';
}
function bnPreview(){
  var imgs=mine("mood").filter(function(m){return m.kind==="image"&&m.assetId}),m=imgs[imgs.length-1],f=m?S.files.filter(function(x){return x.assetId===m.assetId})[0]:null;
  var vis=m?'<img class="bn-img" src="/_blob/'+esc(m.assetId)+'" alt="'+esc(m.label||"Latest moodboard image")+'">':'<div class="bn-orbwrap"><div class="bn-orb"></div></div>';
  var nm=m?(m.label||(f&&f.name)||"Moodboard image"):"Add an image to your moodboard";
  return '<section class="panel ink bn-prev"><h2>Latest frame<button class="btn sm" data-act="view" data-id="mood">Open</button></h2>'+vis+
    '<div class="bn-cap"><b>'+esc(nm)+'</b><span>'+(f&&f.size?fmtSize(f.size):"Moodboard")+'</span></div><div class="bn-who"><span class="av sm">'+avHTML()+'</span><span>'+esc((S.profile&&S.profile.name)||"You")+'<i>'+esc(spaceName())+'</i></span></div></section>';
}
function bnFiles(){
  var files=mine("files").slice().reverse().slice(0,4).map(function(f){return {n:f.name,a:"view",id:"clips"}});
  var notes=mine("notes").slice().sort(function(a,b){return b.ts-a.ts}).slice(0,4-files.length).map(function(n){return {n:(n.title||"Untitled")+".note",a:"opennote",id:n.id}});
  var all=files.concat(notes);
  return '<section class="panel bn-files"><h2>All files<button class="bn-plus" data-act="view" data-id="clips" aria-label="Open clips and files">'+I("plus")+'</button></h2>'+
    (all.length?all.map(function(x){return '<button class="bn-file" data-act="'+x.a+'" data-id="'+x.id+'"><span class="fi">'+I("notes")+'</span><span class="nm">'+esc(x.n)+'</span></button>'}).join(""):'<div class="empty">Upload a file or write a note and it shows up here.</div>')+'</section>';
}
function bnTeam(t){
  var wk=Date.now()-7*86400000,total=t.length,prog=t.filter(function(x){return x.col==="m"||x.col==="r"}).length,done=t.filter(function(x){return x.col==="s"}).length;
  var newW=t.filter(function(x){return x.ts>wk}).length,doneW=t.filter(function(x){return x.col==="s"&&(x.done||x.ts)>wk}).length,s=bnSeries(),mx=Math.max.apply(null,s.chg.concat([1]));
  function st(l,n,d,p){return '<div class="bn-st"><span>'+l+'</span><b>'+n+'</b><div class="bn-bar"><i style="width:'+Math.max(4,Math.round(p))+'%"></i></div><em>'+d+'</em></div>'}
  return '<section class="panel bn-team"><span class="av">'+avHTML()+'</span><div class="bn-tl"><b>'+esc(spaceName())+'</b><span class="muted">Overview</span></div>'+
    st("Total tasks",total,"+"+newW+" this week",100)+st("In progress",prog,prog+" active",total?prog/total*100:0)+st("Shipped",done,"+"+doneW+" this week",total?done/total*100:0)+
    '<svg class="bn-wave" viewBox="0 0 120 40" aria-hidden="true"><path d="'+bnLine(s.chg,120,40,mx)+'" fill="none" stroke="var(--fg)" stroke-width="1.8" stroke-linecap="round"/></svg></section>';
}
function bnStages(t){
  var ideas=mine("ideas"),posts=mine("posts"),notes=mine("notes"),total=t.length;
  var conv=ideas.length?Math.round(ideas.filter(function(x){return x.task}).length/ideas.length*100):0;
  var making=total?Math.round(t.filter(function(x){return x.col!=="i"}).length/total*100):0;
  var pub=posts.filter(function(p){return p.status==="published"}).length,ship=posts.length?Math.round(pub/posts.length*100):(total?Math.round(t.filter(function(x){return x.col==="s"}).length/total*100):0);
  function col(title,sub,p,a,al,b,bl){
    return '<div class="bn-col"><h3>'+title+'</h3><p>'+sub+'</p><div class="bn-pr"><span>Progression</span><b>'+p+'%</b></div><div class="bn-pbar"><i style="width:'+p+'%"></i></div>'+
      '<div class="bn-cn"><span title="'+al+'">'+I("check")+a+'</span><span title="'+bl+'">'+I("star")+b+'</span></div></div>';
  }
  return '<section class="panel ink bn-stg">'+
    col("Ideas","Capture and sort",conv,ideas.length,"Ideas",ideas.filter(function(x){return x.star}).length,"Starred")+
    col("Making","Plan and build",making,t.filter(function(x){return x.col!=="s"}).length,"Open tasks",notes.length,"Notes")+
    col("Publishing","Ship and share",ship,pub,"Published posts",posts.length-pub,"Scheduled")+'</section>';
}
function dlabel(d,done){
  if(!d)return {t:"Add date",c:"none"};var td=ymd(new Date()),tm=ymd(new Date(Date.now()+86400000));
  var nice;try{nice=new Date(d+"T00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}catch(e){nice=d}
  if(done)return {t:nice,c:""};if(d<td)return {t:"Overdue · "+nice,c:"late"};if(d===td)return {t:"Today",c:"today"};if(d===tm)return {t:"Tomorrow",c:""};return {t:nice,c:""};
}
function dchip(attrs,val,done){var l=dlabel(val,done);return '<label class="dchip '+l.c+'">'+I("calendar")+'<span>'+esc(l.t)+'</span><input type="date" '+attrs+' value="'+esc(val||"")+'" aria-label="Due date"'+(readOnly?" disabled":"")+'></label>'}
document.addEventListener("keydown",function(e){var t=e.target;if(e.key==="Enter"&&t&&t.tagName==="TEXTAREA"&&t.classList.contains("ct")){e.preventDefault();t.blur()}});
document.addEventListener("click",function(e){var t=e.target;if(t&&t.tagName==="INPUT"&&t.type==="date"&&t.closest(".dchip")&&t.showPicker){try{t.showPicker()}catch(x){}}});
function vHome(){
  var t=mine("tasks"),today=ymd(new Date()),open=t.filter(function(x){return x.col!=="s"});
  var items=bellItems(),over=items.filter(function(x){return x.k===0}).length,dueT=items.filter(function(x){return x.k===1}).length;
  var wkEnd=ymd(new Date(Date.now()+6*86400000)),posts=mine("posts").filter(function(p){return p.status!=="published"&&p.date&&p.date>=today&&p.date<=wkEnd});
  var postsToday=posts.filter(function(p){return p.date===today});
  var hr=new Date().getHours(),greet=hr<5?"Still up":(hr<12?"Good morning":(hr<17?"Good afternoon":"Good evening"));
  var nm=((S.profile&&S.profile.name)||"").trim().split(/\s+/)[0];
  /* the one fact for today, in plain words */
  var fact=postsToday.length?"“"+postsToday[0].title+"” goes out today"+(over?", and "+pl(over,"thing")+" "+(over>1?"are":"is")+" overdue.":"."):
    (over?pl(over,"thing")+" "+(over>1?"are":"is")+" overdue. Start with “"+items[0].l+"”.":
    (dueT?pl(dueT,"thing")+" due today.":(open.length?"Nothing urgent. "+pl(open.length,"task")+" in progress.":"You're all clear.")));
  var h='<header class="td-head"><p class="td-date">'+esc(new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}))+' · '+esc(spaceName())+'</p><h1>'+greet+(nm?", "+esc(nm):"")+'</h1><p class="td-fact">'+esc(fact)+'</p></header>';
  if(!readOnly)h+='<div class="td-cap"><input class="in" id="qcin" placeholder="Capture anything… an idea, a task, a note" maxlength="240" aria-label="Quick capture"><button type="button" class="btn" data-act="qcap" data-id="idea">'+I("bulb")+'Idea</button><button type="button" class="btn" data-act="qcap" data-id="task">'+I("check")+'Task</button><button type="button" class="btn" data-act="qcap" data-id="note">'+I("notes")+'Note</button></div>';
  var obh=typeof obHTML==="function"?obHTML():"",fresh=typeof obFresh==="function"&&obFresh();
  if(obh&&fresh)return h+obh+(typeof todayAud==="function"?todayAud():"");
  function stat(n,l,cap,v,c){return '<button class="td-stat'+(c?" "+c:"")+'" data-act="view" data-id="'+v+'"><span class="tl">'+l+'</span><b>'+n+'</b><span class="tc">'+cap+'</span></button>'}
  var nextP=posts.slice().sort(function(a,b){return a.date<b.date?-1:1})[0];
  h+='<div class="td-grid td-stats">'+
    stat(over,"Overdue",over?"Clear these first":"Everything on time","board",over?"warn":"")+
    stat(dueT,"Due today",dueT?"On the board":"Nothing due","board","")+
    stat(posts.length,"Posts this week",nextP?"Next: "+esc(dlabel(nextP.date).t):"None planned","cal","")+
    '<div class="td-stat td-ft" id="tdfocus">'+tdFocusInner()+'</div></div>';
  /* 9 + 3: what needs you, and the road to the next milestone */
  var shown=items.slice(0,5);
  h+='<div class="td-grid td-cols"><section class="panel s9"><h2>Needs attention <span class="cnt">'+items.length+'</span>'+(items.length>5?'<button class="lnk" data-act="bell">View all</button>':"")+'</h2>'+
    (shown.length?'<div class="td-rows">'+shown.map(function(x){return '<button class="td-row'+(x.k===0?" late":"")+'" data-act="view" data-id="'+x.v+'"><span class="bt"><b>'+esc(x.l)+'</b><i>'+esc(x.s)+'</i></span>'+I("right")+'</button>'}).join("")+'</div>':'<div class="empty">Nothing overdue or due soon.</div>')+'</section>'+
    tdRoad()+'</div>';
  /* 6 + 6: the week ahead, and ideas waiting */
  var rows="",nr=0;
  for(var i=0;i<7;i++){
    var d=new Date();d.setDate(d.getDate()+i);var key=ymd(d),its=[];
    open.forEach(function(x){if(x.due===key)its.push({n:x.title,k:"task",v:"board"})});
    posts.forEach(function(p){if(p.date===key)its.push({n:p.title,k:"post",v:"cal"})});
    nr+=its.length;
    if(its.length)rows+='<div class="td-day"><span class="td-dl">'+(i===0?"Today":(i===1?"Tomorrow":d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"})))+'</span><div>'+its.map(function(x){return '<button class="td-ev '+x.k+'" data-act="view" data-id="'+x.v+'"><i></i>'+esc(x.n)+'<em>'+(x.k==="post"?"Post":"Task")+'</em></button>'}).join("")+'</div></div>';
  }
  var ideas=mine("ideas").slice().sort(function(a,b){return b.ts-a.ts}).filter(function(i){return !i.task}),pins=mine("notes").filter(function(n){return n.pin}).slice(0,3);
  h+='<div class="td-grid"><section class="panel s6"><h2>Next 7 days <span class="cnt">'+nr+'</span><button class="lnk" data-act="view" data-id="cal">Calendar</button></h2>'+(rows||'<div class="empty">Nothing scheduled. Give a task a date or plan a post.</div>')+'</section>'+
    '<section class="panel s6"><h2>Ideas to act on <span class="cnt">'+ideas.length+'</span><button class="lnk" data-act="view" data-id="ideas">View all</button></h2>'+
    (ideas.length?'<div class="td-rows">'+ideas.slice(0,4).map(function(x){return '<div class="item td-row"><span class="t">'+esc(x.text)+'</span>'+(readOnly?"":'<span class="td-ia"><button class="btn sm" data-act="idea2task" data-id="'+x.id+'">Make task</button><button class="btn sm" data-act="idea2post" data-id="'+x.id+'">Plan post</button></span>')+'</div>'}).join("")+'</div>':'<div class="empty">No loose ideas. Capture one above.</div>')+
    (pins.length?'<div class="td-pins">'+pins.map(function(n){return '<button class="chip" data-act="opennote" data-id="'+n.id+'">'+I("notes")+esc(n.title||"Untitled")+'</button>'}).join("")+'</div>':"")+'</section></div>';
  h+=obh;
  /* 12: the pipeline as one line */
  var cnt={};STAGES.forEach(function(s){cnt[s.id]=t.filter(function(x){return x.col===s.id}).length});
  h+='<div class="td-grid"><section class="panel s12"><h2>Pipeline <span class="cnt">'+t.length+'</span><button class="lnk" data-act="view" data-id="board">Open board</button></h2><div class="td-pipe">'+STAGES.map(function(s){return '<button data-act="view" data-id="board"><span>'+esc(s.name||s.label||s.id)+'</span><b>'+cnt[s.id]+'</b></button>'}).join("")+'</div></section></div>';
  if(typeof todayAud==="function")h+=todayAud(1);
  if(!readOnly)h+='<div class="td-foot"><span class="muted">Space settings</span><button class="btn sm" data-act="renamespace">Rename</button><button class="btn sm" data-act="delspace"'+(S.spaces.length<2?" disabled":"")+'>Delete</button></div>';
  return h;
}
/* signature: the road to the next follower milestone, from real numbers */
function tdRoad(){
  var c=null,arr=[],cur=null;
  try{if(typeof W!=="undefined"&&W.loaded){var own=W.conns.filter(function(x){return x.kind==="own"});
    own.forEach(function(x){var a=W.snaps[x.id]||[],l=a.length?a[a.length-1]:null,f=l&&l.followers!=null?Number(l.followers):null;if(f!=null&&(cur==null||f>cur)){cur=f;c=x;arr=a}})}}catch(e){}
  if(!c)return '<section class="panel s3 td-road"><h2>Road to your next milestone</h2><p class="muted">Connect a channel and this tracks the climb to your next follower goal, from your real numbers.</p><button class="btn sm" data-act="view" data-id="aud">Connect a channel</button></section>';
  var steps=[100,1000,10000,100000,1000000,10000000],goal=c.goal&&c.goal>cur?c.goal:steps.filter(function(s){return s>cur})[0]||cur*2;
  var prev=steps.filter(function(s){return s<=cur}).pop()||0;if(c.goal&&c.goal>cur)prev=0;
  var pc=Math.max(0,Math.min(100,Math.round((cur-prev)/(goal-prev)*100)));
  var d30=deltaOf(arr,"followers",30*864e5),left=goal-cur,eta="";
  if(d30>0){var days=Math.ceil(left/(d30/30));eta=days<=3650?"About "+(days<60?pl(days,"day"):(days<730?pl(Math.round(days/30),"month"):pl(Math.round(days/365),"year")))+" at this month's pace":""}
  function k(n){return n>=1e6?(n/1e6).toFixed(n%1e6?1:0)+"M":(n>=1000?(n/1000).toFixed(n%1000&&n<1e4?1:0)+"K":String(n))}
  return '<section class="panel s3 td-road"><h2>Road to '+k(goal)+'</h2><button class="td-roadc" data-act="view" data-id="aud"><span class="tl">'+esc(c.title||c.handle||platName(c.platform))+'</span><b>'+Number(cur).toLocaleString("en-IN")+'</b>'+
    '<span class="td-track" role="img" aria-label="'+pc+'% of the way from '+k(prev)+' to '+k(goal)+'"><i style="width:'+pc+'%"></i></span><span class="td-ends"><span>'+k(prev)+'</span><span>'+k(goal)+'</span></span>'+
    '<span class="tc">'+Number(left).toLocaleString("en-IN")+' to go'+(d30?" · "+(d30>0?"+":"−")+nf(Math.abs(d30))+" in 30 days":"")+'</span>'+(eta?'<span class="tc">'+eta+'</span>':"")+'</button></section>';
}

function vNotes(){
  var list=mine("notes");
  if(!list.some(function(n){return n.id===selNote}))selNote=list.length?list[0].id:null;
  var h=hero("notes","Notes",null,'<button class="btn pri" data-act="newnote"'+(readOnly?" disabled":"")+'>'+I("plus")+'New note</button>');
  if(!list.length)return h+emptyCard("notes","Write your first note","Scripts, outlines, briefs and pitches live here. Start from a template so you're never facing a blank page.",readOnly?"":NTPL.map(function(t){return '<button class="btn sm" data-act="ntpl" data-id="'+t[0]+'">'+t[1]+'</button>'}).join(""));
  if(!readOnly)h+='<div class="ntpl"><span>Start from</span>'+NTPL.map(function(t){return '<button class="chip" data-act="ntpl" data-id="'+t[0]+'">'+t[1]+'</button>'}).join("")+'</div>';
  h+='<div class="notes'+(noteOpen?" nopen":"")+'"><div><input class="in" id="nsearch" placeholder="Filter notes" aria-label="Filter notes" style="margin-bottom:10px"><div class="nlist" id="nlist"></div></div><div id="neditor"></div></div>';
  return h;
}
function noteListHTML(q){
  q=(q||"").toLowerCase();
  var list=mine("notes").slice().sort(function(a,b){return (b.pin-a.pin)||(b.ts-a.ts)}).filter(function(n){return !q||(n.title+" "+n.body).toLowerCase().indexOf(q)>-1});
  if(!list.length)return '<div class="empty">'+(q?"No notes match.":"No notes yet.")+'</div>';
  return list.map(function(n){
    return '<button class="ncard" data-act="opennote" data-id="'+n.id+'" aria-current="'+(n.id===selNote)+'"><b>'+esc(n.title||"Untitled")+(n.pin?'<i class="npin" aria-label="Pinned">'+I("pin")+'</i>':"")+'</b><span>'+esc((n.body||"").replace(/[#*\[\]]+/g,"").replace(/\s+/g," ").trim().slice(0,90)||"Empty note")+'</span><small>'+ago(n.ts)+'</small></button>';
  }).join("");
}
function noteEditorHTML(){
  var n=S.notes.filter(function(x){return x.id===selNote})[0];
  if(!n)return '<div class="panel empty">Create a note to start writing.</div>';
  var ro=readOnly?" readonly":"",outl=nOutline(n.body),rd=noteMode==="read"||readOnly;
  return '<div class="panel npaper'+(rd?" nread":"")+'"><div class="nbar"><button class="btn sm nback" data-act="nback">'+I("left")+'All notes</button>'+
    '<div class="nmode" role="group" aria-label="Note mode"><button data-act="nmode" data-id="write" aria-pressed="'+!rd+'"'+(readOnly?" disabled":"")+'>Write</button><button data-act="nmode" data-id="read" aria-pressed="'+rd+'">Read</button></div>'+(rd?"":nToolbar())+'<span class="nacts"><button class="btn sm" data-act="tp_open">'+I("play")+'Teleprompter</button>'+cbtn("#neditor .panel")+
    '<button class="ico" data-act="pinnote" aria-label="'+(n.pin?"Unpin note":"Pin note")+'" title="'+(n.pin?"Unpin":"Pin")+'" aria-pressed="'+!!n.pin+'">'+I("pin")+'</button>'+
    '<button class="ico" data-act="delnote" aria-label="Delete note" title="Delete"'+(readOnly?" disabled":"")+'>'+I("trash")+'</button></span></div>'+
    '<div class="nout" id="nout"'+(/nsec/.test(outl)?"":" hidden")+'>'+outl+'</div>'+
    '<input class="ghost ntitle" id="ntitle" value="'+esc(n.title)+'" placeholder="Untitled" aria-label="Note title"'+ro+'>'+
    (rd?'<div class="ndoc" id="ndoc">'+nRender(n.body)+'</div>':'<textarea class="nbody" id="nbody" placeholder="Start writing… use ## for headings, - [ ] for checklists" aria-label="Note body"'+ro+'>'+esc(n.body)+'</textarea>')+
    '<div class="nmeta"><span id="nwc">'+words(n.body)+' words · edited '+ago(n.ts)+'</span></div></div>';
}

function vIdeas(){
  var all=mine("ideas"),tags={};
  all.forEach(function(i){(i.tags||[]).forEach(function(t){tags[t]=(tags[t]||0)+1})});
  var h=hero("ideas","Ideas","Catch ideas before they disappear. Any idea becomes a task or a planned post in one click.","");
  h+='<div class="capture"><input class="in" id="ideain" placeholder="A video about…  add #tags to sort it later" maxlength="240" aria-label="New idea" autocomplete="off"'+(readOnly?" disabled":"")+'><button class="btn pri" data-act="addidea"'+(readOnly?" disabled":"")+'>Add idea</button></div>';
  if(!all.length)return h+emptyCard("bulb","Catch your first idea","Type it above and press Add idea. Use #tags like #vlog to sort them. Any idea becomes a task or a planned post in one click.","");
  var shown=all.filter(function(i){return ideaFilter==="all"||(ideaFilter==="star"?i.star:(i.tags||[]).indexOf(ideaFilter)>-1)}).sort(function(a,b){return b.ts-a.ts});
  var starred=all.filter(function(i){return i.star}).length,onBoard=all.filter(function(i){return i.task}).length,planned=all.filter(function(i){return S.posts.some(function(p){return p.ideaId===i.id})}).length;
  var loose=all.filter(function(i){return !i.task&&!S.posts.some(function(p){return p.ideaId===i.id})}).length;
  var tk=Object.keys(tags).sort(function(a,b){return tags[b]-tags[a]||(a<b?-1:1)});
  h+='<div class="id-bar"><div class="id-chips" role="group" aria-label="Show ideas">'+
    '<button class="chip" data-act="ifilter" data-id="all" aria-pressed="'+(ideaFilter==="all")+'">All <b>'+all.length+'</b></button>'+
    '<button class="chip" data-act="ifilter" data-id="star" aria-pressed="'+(ideaFilter==="star")+'">'+I("star")+'Starred <b>'+starred+'</b></button>'+
    tk.map(function(t){return '<button class="chip" data-act="ifilter" data-id="'+esc(t)+'" aria-pressed="'+(ideaFilter===t)+'">#'+esc(t)+' <b>'+tags[t]+'</b></button>'}).join("")+'</div>'+
    '<p class="id-sum2"><span><b>'+loose+'</b> still loose</span><span><b>'+onBoard+'</b> on the board</span><span><b>'+planned+'</b> planned as posts</span></p></div>';
  if(!shown.length)return h+'<div class="empty id-none">No ideas match this filter. <button class="lnk" data-act="ifilter" data-id="all">Show all</button></div>';
  h+='<div class="id-wall">'+shown.map(function(i){
    var txt=String(i.text||"").replace(/\s*#[\w-]+/g,"").trim()||i.text;
    var planned1=S.posts.some(function(p){return p.ideaId===i.id});
    var st=i.task?"On the board":(planned1?"Planned":"Loose");
    return '<article class="icard'+(i.star?" starred":"")+'"><header><span class="ic-st'+(st==="Loose"?"":" on")+'">'+st+'</span><span class="ic-when">'+ago(i.ts)+'</span>'+
      '<button class="ico star" data-act="staridea" data-id="'+i.id+'" aria-pressed="'+!!i.star+'" aria-label="'+(i.star?"Unstar":"Star")+' idea">'+I("star")+'</button></header>'+
      '<h3 class="ic-t">'+esc(txt)+'</h3>'+
      ((i.tags||[]).length?'<div class="ic-tags">'+(i.tags||[]).map(function(t){return '<button class="tag" data-act="ifilter" data-id="'+esc(t)+'">#'+esc(t)+'</button>'}).join("")+'</div>':'')+
      '<footer class="acts">'+(i.task?"":'<button class="btn sm" data-act="idea2task" data-id="'+i.id+'"'+(readOnly?" disabled":"")+'>'+I("board")+'Make task</button>')+(planned1?"":'<button class="btn sm" data-act="idea2post" data-id="'+i.id+'"'+(readOnly?" disabled":"")+'>'+I("calendar")+'Plan post</button>')+(readOnly?'':'<button class="btn sm" data-act="rp_open" data-id="idea:'+i.id+'">Repurpose</button>')+
      '<button class="ico" data-act="delidea" data-id="'+i.id+'" aria-label="Delete idea" title="Delete"'+(readOnly?" disabled":"")+'>'+I("trash")+'</button></footer></article>';
  }).join("")+'</div>';
  return h;
}

function vBoard(){
  var t=mine("tasks"),today=ymd(new Date());
  var h=hero("board","Progress",null,'');
  if(!t.length)h+=emptyCard("board","Nothing on your board yet","Work moves left to right, from Idea to Shipped. Add a task in any column below, or turn one of your ideas into a task.",'<button class="btn sm" data-act="view" data-id="ideas">Go to Ideas</button>');
  h+='<div class="board">'+STAGES.map(function(s,si){
    var cards=t.filter(function(x){return x.col===s.id}).sort(function(a,b){return (b.pri||0)-(a.pri||0)});
    return '<section class="col" data-col="'+s.id+'" aria-label="'+s.name+'" style="--sc:'+STCOL[s.id]+'"><h3><span>'+s.name+'</span><span class="cn">'+cards.length+'</span></h3>'+
      cards.map(function(x){
        var late=x.due&&x.due<today&&x.col!=="s";
        return '<div class="card'+(late?" late":"")+'" data-pri="'+(x.pri||0)+'" draggable="'+!readOnly+'" data-id="'+x.id+'"><textarea class="ghost ct" rows="1" data-f="task" data-id="'+x.id+'" aria-label="Task title"'+(readOnly?" readonly":"")+'>'+esc(x.title)+'</textarea>'+
          '<div class="foot"><span class="fl">'+dchip('data-f="due" data-id="'+x.id+'"',x.due,x.col==="s")+(x.who?'<span class="who" title="Assigned to '+esc(x.who)+'">'+esc(x.who.split(" ")[0])+'</span>':'')+'</span><span class="cacts">'+(!readOnly&&!x.tw&&typeof tkMembers==="function"&&tkMembers().length?'<button class="ico" data-act="tk_assign" data-id="'+x.id+'" aria-label="Assign to a teammate" title="Assign to a teammate">'+I("users")+'</button>':'')+
          '<button class="ico pflag" data-act="tpri" data-id="'+x.id+'" data-p="'+(x.pri||0)+'" title="Priority: '+["none","low","medium","high"][x.pri||0]+' (click to change)" aria-label="Priority: '+["none","low","medium","high"][x.pri||0]+'"'+(readOnly?" disabled":"")+'>'+I("flag")+'</button>'+
          '<button class="ico" data-act="tleft" data-id="'+x.id+'" aria-label="Move back"'+(si===0?" disabled":"")+'>'+I("left")+'</button>'+
          '<button class="ico" data-act="tright" data-id="'+x.id+'" aria-label="Move forward"'+(si===3?" disabled":"")+'>'+I("right")+'</button>'+
          '<button class="ico danger" data-act="deltask" data-id="'+x.id+'" aria-label="Delete task">'+I("x")+'</button></span></div></div>';
      }).join("")+
      '<div class="addtask"><input class="in" data-addtask="'+s.id+'" placeholder="+ Add task" aria-label="Add task to '+s.name+'" maxlength="120"'+(readOnly?" disabled":"")+'></div></section>';
  }).join("")+'</div>';
  return h;
}

