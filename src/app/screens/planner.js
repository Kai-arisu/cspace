/* ---------- planner ---------- */
var planSel=ymd(new Date()), planMonth=(function(){var d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d})(), planFilter="all", planOpen={sel:true,unplanned:true,scheduled:true,done:false}, PLK=null;
function ordinal(n){var s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
function dayLong(d){return d.toLocaleDateString("en-IN",{weekday:"short"})+", "+ordinal(d.getDate())+" "+d.toLocaleDateString("en-IN",{month:"long"})}
function dparse(s){return new Date(s+"T00:00")}
function planClock(){
  var h=$("clk-h");if(!h){clearInterval(PLK);PLK=null;return}
  var d=new Date(),sec=d.getSeconds(),min=d.getMinutes()+sec/60,hr=(d.getHours()%12)+min/60;
  h.setAttribute("transform","rotate("+hr*30+" 100 100)");
  $("clk-m").setAttribute("transform","rotate("+min*6+" 100 100)");
  $("clk-s").setAttribute("transform","rotate("+sec*6+" 100 100)");
  var t=$("clk-t");if(t)t.textContent=d.toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit",hour12:true}).replace(/\s/g,"").toLowerCase();
  var dd=$("clk-d");if(dd)dd.textContent=dayLong(d);
}
function clockSVG(){
  var t="";for(var i=0;i<60;i++){var a=i*6,big=i%5===0;t+='<line x1="100" y1="'+(big?12:15)+'" x2="100" y2="'+(big?22:19)+'" transform="rotate('+a+' 100 100)" style="stroke:var(--muted);stroke-width:'+(big?2.2:1)+';opacity:'+(big?.9:.45)+'"/>'}
  return '<svg class="clk" viewBox="0 0 200 200" role="img" aria-label="Analog clock">'+t+
    '<line id="clk-h" x1="100" y1="100" x2="100" y2="54" style="stroke:var(--fg);stroke-width:4;stroke-linecap:round"/>'+
    '<line id="clk-m" x1="100" y1="100" x2="100" y2="32" style="stroke:var(--fg);stroke-width:3;stroke-linecap:round"/>'+
    '<line id="clk-s" x1="100" y1="112" x2="100" y2="28" style="stroke:var(--c-lib);stroke-width:1.2"/><circle cx="100" cy="100" r="5" style="fill:var(--fg)"/></svg>';
}
function planCal(){
  var tasks=mine("tasks").filter(function(t){return t.col!=="s"&&t.due}),cnt={};
  tasks.forEach(function(t){cnt[t.due]=(cnt[t.due]||0)+1});
  var y=planMonth.getFullYear(),m=planMonth.getMonth(),first=new Date(y,m,1),lead=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),today=ymd(new Date());
  var h='<div class="cal-h"><span>'+planMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"})+'</span><span><button class="ico" data-act="pmonth" data-d="-1" aria-label="Previous month">'+I("left")+'</button><button class="ico" data-act="pmonth" data-d="1" aria-label="Next month">'+I("right")+'</button></span></div><div class="cal">';
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(function(w){h+='<span class="cw">'+w+'</span>'});
  for(var i=0;i<lead;i++)h+='<span></span>';
  for(var d=1;d<=days;d++){
    var k=y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0"),n=cnt[k]||0;
    h+='<button class="cd'+(k===today?" today":"")+(k===planSel?" sel":"")+'" data-act="pday" data-id="'+k+'" aria-label="'+esc(dayLong(dparse(k)))+(n?", "+pl(n,"task")+" due":"")+'" aria-pressed="'+(k===planSel)+'">'+d+(n?'<i class="dot'+(n>1?" two":"")+'"></i>':"")+'</button>';
  }
  return h+'</div>';
}
function prow(t){
  var done=t.col==="s",late=!done&&t.due&&t.due<ymd(new Date());
  return '<div class="prow'+(done?" done":"")+'"><button class="pchk" data-act="ptoggle" data-id="'+t.id+'" aria-label="'+(done?"Mark as not done":"Mark as done")+'"'+(readOnly?" disabled":"")+'>'+(done?I("check"):"")+'</button>'+
    '<input class="ghost" data-f="task" data-id="'+t.id+'" value="'+esc(t.title)+'" aria-label="Task title"'+(readOnly?" readonly":"")+'>'+
    '<span class="pst">'+esc((STAGES.filter(function(s){return s.id===t.col})[0]||{name:""}).name)+'</span>'+
    dchip('data-f="due" data-id="'+t.id+'"',t.due,done)+
    '<button class="ico danger" data-act="deltask" data-id="'+t.id+'" aria-label="Delete task"'+(readOnly?" disabled":"")+'>'+I("x")+'</button></div>';
}
function pgroup(id,label,items,extra){
  var open=planOpen[id];
  return '<div class="pg"><button class="pgh" data-act="pgroup" data-id="'+id+'" aria-expanded="'+open+'">'+I(open?"chevu":"chevd")+'<span>'+label+'</span><span class="pcount">'+items.length+'</span></button>'+
    (open?(items.length?items.map(prow).join(""):'<div class="empty" style="padding:6px 0 10px 30px">'+(extra||"Nothing here")+'</div>'):"")+'</div>';
}
function vPlan(){
  var t=mine("tasks"),open=t.filter(function(x){return x.col!=="s"}),
    un=open.filter(function(x){return !x.due}),pld=open.filter(function(x){return x.due}),dn=t.filter(function(x){return x.col==="s"});
  var byDue=function(a,b){return a.due<b.due?-1:(a.due>b.due?1:0)};
  var onDay=pld.filter(function(x){return x.due===planSel}),others=pld.filter(function(x){return x.due!==planSel}).sort(byDue);
  var h=hero("plan","Planner","Put dates on the work. Everything here is the same list as your Progress board.","");
  var fr=function(id,label,ic,n){return '<button class="plf" data-act="pfilter" data-id="'+id+'" aria-pressed="'+(planFilter===id)+'"><span class="plfi">'+I(ic)+'</span><span class="nm">'+label+'</span><span class="pcount">'+n+'</span></button>'};
  h+='<div class="plan"><section class="panel plan-l"><h2>Planner</h2><div class="plfs">'+fr("unplanned","Unplanned","folder",un.length)+fr("planned","Planned","check",pld.length)+fr("all","All","board",open.length)+'</div>'+
    planCal()+'<button class="btn sm" data-act="ptoday" style="margin-top:12px">Jump to today</button></section>';
  var title=planFilter==="unplanned"?"Unplanned":(planFilter==="planned"?"Planned":"All open");
  h+='<section class="panel plan-r"><h2>To-do\'s</h2><div class="psub">'+I("board")+'<span>ToDo <b>'+title+'</b></span></div>'+
    '<div class="padd">'+I("plus")+'<input id="planin" placeholder="Add todo, press Enter to save" maxlength="120" aria-label="Add todo"'+(readOnly?" disabled":"")+'><kbd>Enter</kbd></div>'+
    '<div class="phint">'+(planFilter==="planned"?"New todos go on "+esc(dayLong(dparse(planSel)))+".":"New todos start unplanned. Pick a date on a todo to schedule it.")+'</div>';
  if(planFilter!=="planned")h+=pgroup("unplanned","Unplanned",un);
  if(planFilter!=="unplanned"){
    h+=pgroup("sel",esc(dayLong(dparse(planSel))),onDay,"Nothing due on this day");
    h+=pgroup("scheduled","Scheduled",others,"No other dates yet");
  }
  h+=pgroup("done","Done",dn)+'</section></div>';
  return h;
}
function planAdd(v){
  var due=S.view==="cal"?calSel:(planFilter==="planned"?planSel:"");
  S.tasks.push({id:uid(),sp:S.cur,title:v,col:"i",due:due,pri:0,ts:Date.now()});touch();render();
  var n=$("planin");if(n)n.focus();
}
function planMountClock(){planClock();if(!PLK)PLK=setInterval(planClock,1000)}
document.addEventListener("keydown",function(e){
  var t=e.target;
  if(e.key==="Enter"&&t.id==="planin"&&!readOnly){e.preventDefault();var v=t.value.trim();if(v)planAdd(v)}
});

