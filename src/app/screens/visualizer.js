/* ---------- visualizer ---------- */
var vizRange=14, vizAll=false;
var VCOLS=["--c-ideas","--c-notes","--c-board","--c-mood","--c-lib","--c-wb","--c-home","--c-viz"];
function pl(n,w){return n+" "+w+(n===1?"":"s")}
function monShort(d){return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
function vizSet(){
  var sp=vizAll?null:S.cur,f=function(a){return a.filter(function(x){return !sp||x.sp===sp})};
  return {tasks:f(S.tasks),ideas:f(S.ideas),notes:f(S.notes)};
}
function vizDays(D){
  var base=new Date();base.setHours(0,0,0,0);
  var days=[],idx={},i,d;
  for(i=vizRange-1;i>=0;i--){d=new Date(base);d.setDate(base.getDate()-i);idx[ymd(d)]=days.length;days.push({d:d,n:0,i:0,t:0,s:0})}
  var bump=function(arr,key){arr.forEach(function(x){var j=idx[ymd(new Date(x.ts))];if(j!=null)days[j][key]++})};
  bump(D.notes,"n");bump(D.ideas,"i");bump(D.tasks,"t");
  D.tasks.forEach(function(x){var ds=x.done||(x.col==="s"?x.ts:0);if(!ds)return;var j=idx[ymd(new Date(ds))];if(j!=null)days[j].s++});
  return days;
}
function countIn(D,from,to){
  var n=0;
  [D.notes,D.ideas,D.tasks].forEach(function(a){a.forEach(function(x){if(x.ts>=from&&x.ts<to)n++})});
  return n;
}
function spark(series){
  var n=series.length,mx=Math.max.apply(null,series.concat([1])),w=100,h=28;
  var pts=series.map(function(v,i){return [n>1?i/(n-1)*w:w/2,h-3-(v/mx)*(h-8)]});
  var line="M"+pts.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1)}).join("L");
  return '<svg class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><path d="'+line+"L"+w+" "+h+"L0 "+h+'Z" style="fill:var(--c);fill-opacity:.18"/><path d="'+line+'" style="fill:none;stroke:var(--c);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke"/></svg>';
}
function vizDonut(cnt,total,pct){
  var R=46,C=2*Math.PI*R,off=0,segs="";
  STAGES.forEach(function(s){
    var v=cnt[s.id];if(!v)return;
    var len=v/total*C,vis=Math.max(len-(total>1?2.5:0),.5);
    segs+='<circle cx="60" cy="60" r="'+R+'" fill="none" stroke-width="16" style="stroke:'+STCOL[s.id]+'" stroke-dasharray="'+vis.toFixed(2)+" "+(C-vis).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 60 60)"/>';
    off+=len;
  });
  return '<svg class="vdonut" viewBox="0 0 120 120" role="img" aria-label="'+pct+' percent of tasks shipped"><circle cx="60" cy="60" r="'+R+'" fill="none" stroke-width="16" style="stroke:var(--surface2)"/>'+segs+'<text x="60" y="64" text-anchor="middle" class="dn">'+pct+'%</text><text x="60" y="80" text-anchor="middle" class="dl">shipped</text></svg>';
}
function vizActivityHTML(days){
  var tot=days.map(function(x){return x.n+x.i+x.t+x.s}),mx=Math.max.apply(null,tot);
  if(!mx)return '<div class="empty">Nothing was added or edited in this period yet.</div>';
  var ymax=Math.max(4,Math.ceil(mx/4)*4),step=days.length<=7?1:(days.length<=14?2:5);
  var y=[4,3,2,1,0].map(function(k){return '<span>'+(ymax/4*k)+'</span>'}).join("");
  var seg=function(v,c){return v?'<div class="vseg" style="--c:var('+c+');height:'+(v/ymax*100)+'%"></div>':""};
  var cols=days.map(function(x){
    return '<div class="vcol" title="'+esc(monShort(x.d)+": "+pl(x.n,"note")+" edited, "+pl(x.i,"idea")+", "+pl(x.t,"task")+" added, "+pl(x.s,"task")+" shipped")+'">'+seg(x.s,"--st-s")+seg(x.t,"--c-board")+seg(x.i,"--c-ideas")+seg(x.n,"--c-notes")+'</div>';
  }).join("");
  var labels=days.map(function(x,j){return '<span>'+(((days.length-1-j)%step===0)?'<b>'+esc(monShort(x.d))+'</b>':"")+'</span>'}).join("");
  return '<div class="vplot"><div class="vy" aria-hidden="true">'+y+'</div><div class="vmain"><div class="vcols" role="img" aria-label="Activity per day">'+cols+'</div><div class="vlabels" aria-hidden="true">'+labels+'</div></div></div>'+
    '<div class="vlegend"><span><i style="background:var(--c-notes)"></i>Notes edited</span><span><i style="background:var(--c-ideas)"></i>Ideas captured</span><span><i style="background:var(--c-board)"></i>Tasks added</span><span><i style="background:var(--st-s)"></i>Tasks shipped</span></div>';
}
function vizDueHTML(D){
  var base=new Date();base.setHours(0,0,0,0);
  var todayStr=ymd(base),cols=[{l:"Late",n:0,late:true}],idx={},i,d;
  for(i=0;i<14;i++){d=new Date(base);d.setDate(base.getDate()+i);idx[ymd(d)]=cols.length;cols.push({l:String(d.getDate()),n:0,late:false})}
  D.tasks.forEach(function(t){
    if(t.col==="s"||!t.due)return;
    if(t.due<todayStr)cols[0].n++;else{var j=idx[t.due];if(j!=null)cols[j].n++}
  });
  var mx=Math.max.apply(null,cols.map(function(c){return c.n}));
  if(!mx)return '<div class="empty">No open task is due in the next two weeks.</div>';
  var bars=cols.map(function(c){
    return '<div class="vcol" title="'+esc((c.late?"Overdue":"Due "+c.l)+": "+pl(c.n,"task"))+'"><div class="vnum">'+(c.n||"")+'</div>'+(c.n?'<div class="vseg" style="--c:'+(c.late?"var(--warn)":"var(--c-board)")+';height:'+Math.round(c.n/mx*100)+'px"></div>':"")+'</div>';
  }).join("");
  var labels=cols.map(function(c,j){return '<span>'+((c.late||(j>=2&&j%2===0))?'<b'+(c.late?' style="color:var(--warn)"':"")+'>'+c.l+'</b>':"")+'</span>'}).join("");
  return '<div class="vcols due" role="img" aria-label="Open tasks by due day">'+bars+'</div><div class="vlabels" aria-hidden="true">'+labels+'</div>';
}
function vizHeat(D){
  var base=new Date();base.setHours(0,0,0,0);
  var W=20,dow=(base.getDay()+6)%7,start=new Date(base);start.setDate(base.getDate()-dow-(W-1)*7);
  var counts={};
  [D.notes,D.ideas,D.tasks].forEach(function(a){a.forEach(function(x){var k=ymd(new Date(x.ts));counts[k]=(counts[k]||0)+1})});
  var cells=[],mx=0,active=0,best=null,i,d,n,fut;
  for(i=0;i<W*7;i++){
    d=new Date(start);d.setDate(start.getDate()+i);fut=d>base;n=fut?0:(counts[ymd(d)]||0);
    if(n){active++;if(!best||n>best.n)best={n:n,d:d}}
    mx=Math.max(mx,n);cells.push({d:d,n:n,fut:fut});
  }
  var streak=0;
  for(i=0;i<400;i++){d=new Date(base);d.setDate(base.getDate()-i);if(counts[ymd(d)])streak++;else if(i>0)break}
  var lvl=function(v){if(!v)return 0;var r=v/mx;return r>.75?4:(r>.5?3:(r>.25?2:1))};
  var months="";
  for(var c=0;c<W;c++){
    var cd=cells[c*7].d,pd=c?cells[(c-1)*7].d:null;
    months+='<span>'+((!pd||cd.getMonth()!==pd.getMonth())?cd.toLocaleDateString("en-IN",{month:"short"}):"")+'</span>';
  }
  var grid=cells.map(function(x){return '<i class="hc '+(x.fut?"f":"l"+lvl(x.n))+'" title="'+esc(monShort(x.d)+": "+pl(x.n,"change"))+'"></i>'}).join("");
  return '<div class="vheatrow"><div class="vstats"><div><b>'+streak+'</b><span>day streak</span></div><div><b>'+active+'</b><span>active days of '+(W*7)+'</span></div><div><b>'+(best?best.n:0)+'</b><span>'+(best?"most in one day, "+esc(monShort(best.d)):"most in one day")+'</span></div></div>'+
    '<div class="vheatscroll"><div class="vmonths" aria-hidden="true">'+months+'</div><div class="vhgrid" role="img" aria-label="Activity per day over the last '+W+' weeks">'+grid+'</div>'+
    '<div class="vlegend" style="margin-top:10px"><span>Less</span><i class="hc l0"></i><i class="hc l1"></i><i class="hc l2"></i><i class="hc l3"></i><i class="hc l4"></i><span>More</span></div></div></div>';
}
function vizInsights(D,days){
  var out=[],today=ymd(new Date());
  var open=D.tasks.filter(function(t){return t.col!=="s"}),done=D.tasks.length-open.length;
  if(D.tasks.length)out.push(done+" of "+pl(D.tasks.length,"task")+" shipped ("+Math.round(done/D.tasks.length*100)+"%).");
  var late=open.filter(function(t){return t.due&&t.due<today}).sort(function(a,b){return a.due<b.due?-1:1});
  if(late.length)out.push(pl(late.length,"task")+" overdue. The oldest is “"+esc(late[0].title)+"”, due "+fmtDue(late[0].due)+".");
  var rev=open.filter(function(t){return t.col==="r"}).length;
  if(rev)out.push(pl(rev,"task")+" waiting in Review.");
  var loose=D.ideas.filter(function(i){return !i.task}),starred=loose.filter(function(i){return i.star}).length;
  if(loose.length)out.push(pl(loose.length,"idea")+" not yet turned into tasks"+(starred?", "+starred+" starred":"")+".");
  var best=null;days.forEach(function(x){var n=x.n+x.i+x.t+x.s;if(n&&(!best||n>best.n))best={n:n,d:x.d}});
  if(best)out.push("Busiest day in this period: "+monShort(best.d)+", with "+pl(best.n,"change")+".");
  if(!out.length)out.push("Add tasks, ideas or notes and this page fills in.");
  return out;
}
function vViz(){
  var D=vizSet(),today=ymd(new Date()),days=vizDays(D),from=days[0].d.getTime();
  var open=D.tasks.filter(function(t){return t.col!=="s"}),done=D.tasks.length-open.length;
  var late=open.filter(function(t){return t.due&&t.due<today}).length;
  var pct=D.tasks.length?Math.round(done/D.tasks.length*100):0;
  var wordsN=D.notes.reduce(function(s,n){return s+words(n.body)},0);
  var newIdeas=D.ideas.filter(function(i){return i.ts>=from}).length,editedNotes=D.notes.filter(function(n){return n.ts>=from}).length;
  var cnt={};STAGES.forEach(function(s){cnt[s.id]=D.tasks.filter(function(x){return x.col===s.id}).length});
  var total=countIn(D,from,Infinity),prev=countIn(D,from-vizRange*864e5,from),delta=total-prev;

  var acts='<div class="chips" style="margin:0" role="group" aria-label="Time range">'+[7,14,30].map(function(n){return '<button class="chip" data-act="vizrange" data-id="'+n+'" aria-pressed="'+(vizRange===n)+'">'+n+' days</button>'}).join("")+'</div>'+
    '<div class="chips" style="margin:0" role="group" aria-label="Scope"><button class="chip" data-act="vizscope" data-id="one" aria-pressed="'+(!vizAll)+'">This space</button><button class="chip" data-act="vizscope" data-id="all" aria-pressed="'+vizAll+'">All spaces</button></div>';
  var h=hero("viz","Visualizer",vizAll?"All spaces together, last "+vizRange+" days.":spaceName()+", last "+vizRange+" days.",acts);

  h+='<div class="vz-top"><section class="panel"><h2>What stands out</h2><ul class="vz-ins">'+vizInsights(D,days).map(function(t){return '<li><span>'+t+'</span></li>'}).join("")+'</ul></section>'+
    '<section class="panel ink"><h2>Tasks by stage</h2>'+(D.tasks.length?'<div class="vz-donut">'+vizDonut(cnt,D.tasks.length,pct)+'<div class="vz-leg">'+STAGES.map(function(s){return '<div><i style="background:'+STCOL[s.id]+'"></i>'+s.name+'<b>'+cnt[s.id]+'</b></div>'}).join("")+'</div></div>':'<div class="empty">No tasks yet. Add some on the Progress board.</div>')+'</section></div>';

  var tiles=[
    {l:"Shipped",v:pct+"%",c:"--c-board",sub:done+" of "+pl(D.tasks.length,"task"),bar:pct,ic:"board"},
    {l:"Open tasks",v:open.length,c:"--c-home",sub:cnt.m+" in Making",ic:"pin"},
    {l:"Overdue",v:late,c:late?"--warn":"--c-board",sub:late?"Needs attention":"All on time",ic:"pin"},
    {l:"Ideas added",v:newIdeas,c:"--c-ideas",sub:"last "+vizRange+" days",sp:days.map(function(x){return x.i}),ic:"bulb"},
    {l:"Notes edited",v:editedNotes,c:"--c-notes",sub:"last "+vizRange+" days",sp:days.map(function(x){return x.n}),ic:"notes"},
    {l:"Words written",v:wordsN.toLocaleString("en-IN"),c:"--c-mood",sub:"across "+pl(D.notes.length,"note"),ic:"text"}
  ];
  h+='<div class="vz-tiles">'+tiles.map(function(t){
    return '<div class="vz-tile" style="--c:var('+t.c+')"><span class="vt-ic">'+I(t.ic)+'</span><span class="vt-l">'+t.l+'</span><b>'+t.v+'</b><span class="vt-s">'+t.sub+'</span>'+
      (t.bar!=null?'<span class="vt-bar"><i style="width:'+t.bar+'%"></i></span>':"")+(t.sp?spark(t.sp):"")+'</div>';
  }).join("")+'</div>';

  h+='<div class="vz-grid">';
  var pill='<span class="vpill" style="--c:var('+(delta>0?"--c-board":(delta<0?"--warn":"--muted"))+')">'+(delta>0?"+":"")+delta+' vs previous '+vizRange+' days</span>';
  h+='<section class="panel wide"><h2>Activity per day</h2><div class="vsum"><b>'+total+'</b><span>changes in the last '+vizRange+' days</span>'+pill+'</div>'+vizActivityHTML(days)+'</section>';
  h+='<section class="panel wide"><h2>Consistency</h2>'+vizHeat(D)+'</section>';
  h+='<section class="panel"><h2>Due in the next 14 days</h2>'+vizDueHTML(D)+'</section>';

  var tags={},untagged=0;
  D.ideas.forEach(function(i){if(i.tags&&i.tags.length)i.tags.forEach(function(t){tags[t]=(tags[t]||0)+1});else untagged++});
  var tl=Object.keys(tags).map(function(k){return [k,tags[k]]}).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
  if(untagged)tl.push(["",untagged]);
  var tmax=tl.length?Math.max.apply(null,tl.map(function(x){return x[1]})):1;
  h+='<section class="panel"><h2>Ideas by tag</h2>'+(tl.length?'<div class="vtags">'+tl.map(function(x,i){
    return '<span class="vtag" style="--c:var('+VCOLS[i%VCOLS.length]+');font-size:'+(13+Math.round(x[1]/tmax*4))+'px"><i></i>'+(x[0]?"#"+esc(x[0]):"No tag")+'<b>'+x[1]+'</b></span>';
  }).join("")+'</div>':'<div class="empty">No ideas yet.</div>')+'</section>';

  var smax=1,sp=S.spaces.map(function(s){
    var t=S.tasks.filter(function(x){return x.sp===s.id}),dn=t.filter(function(x){return x.col==="s"}).length;
    smax=Math.max(smax,t.length);return {s:s,total:t.length,done:dn};
  });
  h+='<section class="panel"><h2>Across spaces</h2>'+sp.map(function(x){
    var col=spColor(x.s.id),w=x.total/smax*100,dw=x.total?x.done/x.total*100:0;
    return '<div class="vrow"><span class="nm" title="'+esc(x.s.name)+'"'+(x.s.id===S.cur?' style="font-weight:700"':"")+'><i class="vdot" style="background:'+col+'"></i>'+esc(x.s.name)+'</span>'+
      '<span class="vtrack"><span class="vfill" style="--c:color-mix(in srgb,'+col+' 38%,var(--surface2));width:'+w+'%"><span class="vfill" style="--c:var(--st-s);width:'+dw+'%"></span></span></span><b>'+x.done+"/"+x.total+'</b></div>';
  }).join("")+'<div class="vlegend"><span><i style="background:var(--st-s)"></i>Shipped</span><span><i style="background:var(--surface2);border:1px solid var(--line)"></i>Still open</span></div></section>';
  h+='</div>';
  return h;
}

