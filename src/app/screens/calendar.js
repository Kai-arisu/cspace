/* ---------- content calendar ---------- */
var PLAT=[["YouTube","#C4302B"],["Shorts","#D9506F"],["Instagram","#B8336A"],["TikTok","#0F7F7A"],["X","#4B4B48"],["LinkedIn","#0A66C2"],["Podcast","#A86B12"],["Blog","#2E7D32"],["Newsletter","#8A5A12"]];
var PST=[["idea","Idea","#8C8C88"],["script","Scripting","#63635F"],["filming","Filming","#A86B12"],["editing","Editing","#8A5A12"],["scheduled","Scheduled","#1B6E66"],["published","Published","#2E7D32"]];
var calMonth=firstOf(new Date()), calSel=ymd(new Date());
function platCol(n){var p=PLAT.filter(function(x){return x[0]===n})[0];return p?p[1]:"#8C8C88"}
function pstOf(id){return PST.filter(function(x){return x[0]===id})[0]||PST[0]}
function vCal(){
  var posts=mine("posts"),tasks=mine("tasks"),td=ymd(new Date());
  var h=hero("cal","Calendar","Tasks and posts, by day. Pick a day to plan it.",'<button class="btn" data-act="calsync">Sync to calendar</button>');
  var y=calMonth.getFullYear(),m=calMonth.getMonth(),lead=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  var g='<div class="cc-h"><b>'+calMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"})+'</b><span><button class="btn sm" data-act="cday" data-id="'+td+'">Today</button><button class="ico" data-act="cmonth" data-d="-1" aria-label="Previous month">'+I("left")+'</button><button class="ico" data-act="cmonth" data-d="1" aria-label="Next month">'+I("right")+'</button></span></div><div class="cc-g">';
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(function(w){g+='<span class="cw">'+w+'</span>'});
  for(var i=0;i<lead;i++)g+='<span></span>';
  for(var d=1;d<=days;d++){
    var k=y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    var ps=posts.filter(function(p){return p.date===k}),ts=tasks.filter(function(t){return t.due===k&&t.col!=="s"});
    var ev=ps.map(function(p){return '<span class="ccp'+(p.rep?" rep":"")+'" style="--c:'+platCol(p.platform)+'"><i></i><span class="cx">'+esc(p.title)+'</span></span>'}).concat(ts.map(function(t){return '<span class="cct'+(k<td?" late":"")+'"><i></i><span class="cx">'+esc(t.title)+'</span></span>'}));
    g+='<button class="ccd'+(k===td?" today":"")+(k===calSel?" sel":"")+'" data-act="cday" data-id="'+k+'" aria-pressed="'+(k===calSel)+'" aria-label="'+esc(dayLong(dparse(k)))+(ev.length?", "+ev.length+" items":"")+'"><span class="n">'+d+'</span>'+ev.slice(0,2).join("")+(ev.length>2?'<span class="ccm">+'+(ev.length-2)+' more</span>':"")+'</button>';
  }
  g+='</div><div class="bn-leg" style="margin-top:12px"><span><i class="k"></i>Task</span><span><i class="k post"></i>Post</span></div>';
  var dayP=posts.filter(function(p){return p.date===calSel}),dayT=tasks.filter(function(t){return t.due===calSel});
  var free=mine("ideas").filter(function(i){return !posts.some(function(p){return p.ideaId===i.id})});
  var side='<h2>'+esc(dayLong(dparse(calSel)))+'</h2>';
  side+='<div class="cal-sec">Tasks</div>'+(dayT.length?dayT.map(prow).join(""):'<div class="empty">No tasks due this day.</div>');
  if(!readOnly)side+='<div class="cal-add"><input class="in" id="planin" placeholder="Add a task for this day" maxlength="120" aria-label="Add a task for this day"><button class="btn" data-act="caltask">Add</button></div>';
  side+='<div class="cal-sec">Posts</div>';
  side+=dayP.length?dayP.map(function(p){var st=pstOf(p.status);return '<div class="cpost"><input class="ghost" data-pf="'+p.id+'|title" value="'+esc(p.title)+'" aria-label="Post title"'+(readOnly?" readonly":"")+'><div class="cpr"><select class="wsel" data-pf="'+p.id+'|platform" aria-label="Platform"'+(readOnly?" disabled":"")+'>'+opts(PLAT.map(function(x){return x[0]}),p.platform)+'</select><select class="wsel" data-pf="'+p.id+'|status" aria-label="Status"'+(readOnly?" disabled":"")+'>'+PST.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===p.status?" selected":"")+'>'+x[1]+'</option>'}).join("")+'</select><button class="ico danger" data-act="cdel" data-id="'+p.id+'" aria-label="Delete post"'+(readOnly?" disabled":"")+'>'+I("x")+'</button></div>'+
    (p.rep?'<div class="cp-rep">'+I("undo")+'Part of a set: '+esc(p.repTitle||"")+' · '+S.posts.filter(function(z){return z.rep===p.rep}).length+' pieces</div>':(readOnly?'':'<button class="btn sm cp-rpb" data-act="rp_open" data-id="post:'+p.id+'">Repurpose into more posts</button>'))+
    '<textarea class="in cp-cap" aria-label="Caption" data-pf="'+p.id+'|caption" rows="2" maxlength="2200" placeholder="Caption"'+(readOnly?" readonly":"")+'>'+esc(p.caption||"")+'</textarea>'+
    ((!readOnly&&(S.bank||[]).length)?'<div class="cp-bank"><span class="muted">From bank</span>'+(S.bank||[]).slice().sort(function(a,b){return (b.uses||0)-(a.uses||0)}).slice(0,6).map(function(x){return '<button class="chip" data-act="bk_use" data-id="'+x.id+'" data-post="'+p.id+'">'+esc(x.title||x.text.slice(0,20))+'</button>'}).join("")+'</div>':'')+
    '</div>'}).join(""):'<div class="empty">No posts this day.</div>';
  if(!readOnly)side+='<div class="cpadd"><input class="in" id="cptitle" placeholder="Post title" maxlength="100" aria-label="Post title"><div class="cpr"><select class="wsel" id="cpplat" aria-label="Platform">'+opts(PLAT.map(function(x){return x[0]}),"YouTube")+'</select><select class="wsel" id="cpidea" aria-label="Use an idea"><option value="">or pick an idea…</option>'+free.map(function(i){return '<option value="'+i.id+'">'+esc(i.text.slice(0,60))+'</option>'}).join("")+'</select></div><button class="btn" data-act="cadd">Add post</button></div>';
  var un=tasks.filter(function(t){return t.col!=="s"&&!t.due}),late=tasks.filter(function(t){return t.col!=="s"&&t.due&&t.due<td});
  var below='';
  if(late.length)below+='<section class="panel"><h2>Overdue <span class="ct hot">'+late.length+'</span></h2>'+late.map(prow).join("")+'</section>';
  below+='<section class="panel"><h2>No date yet<span class="muted" style="font-weight:400;font-size:12.5px">Give one a date to put it on the calendar</span></h2>'+(un.length?un.map(prow).join(""):'<div class="empty">Every open task has a date.</div>')+'</section>';
  return h+'<div class="cc"><section class="panel">'+g+'</section><section class="panel cc-side">'+side+'</section></div><div class="cal-below">'+below+'</div>';
}
function calAdd(){
  var t=($("cptitle").value||"").trim(),idea=$("cpidea").value,plat=$("cpplat").value;
  if(idea){var i=findIn(S.ideas,idea);if(i&&!t)t=i.text.replace(/\s*#[\w-]+/g,"").trim()}
  if(!t)return toast("Give the post a title or pick an idea");
  S.posts.push({id:uid(),sp:S.cur,title:t,platform:plat,date:calSel,status:"idea",ideaId:idea||"",ts:Date.now()});touch();render();
}

