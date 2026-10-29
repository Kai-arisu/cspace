/* ---------- whiteboard ---------- */
var WB={items:[],sel:null,filter:"all",connFrom:null,ik:"",ck:"",tl:"",mini:null,miniDrag:false,pendImg:null,menu:"",tool:"select",color:"#111111",width:3,fill:false,px:40,py:40,z:1,hist:[],redo:[],loadedFor:null,dirty:false,saving:false,timer:null,drag:null,draft:null,edit:null,raf:0};
var WBCOL=["#111111","#6B6B6B","#E5484D","#F5A524","#30A46C","#0091FF","#8E4EC6"];
function wbKey(sp){return LS+"-wb-"+sp}
function r1(n){return Math.round(n*10)/10}
function clone(o){return JSON.parse(JSON.stringify(o))}

var WBM={};
async function wbPush(sp,json){
  var p=splitStr(json),h=hsh(json),old=(WBM[sp]&&WBM[sp].n)||0;
  for(var i=0;i<p.length;i++)await db.doc("bd/"+sp+"_"+i).set({s:p[i],i:i});
  await db.doc("bd/"+sp+"_m").set({n:p.length,h:h,ts:Date.now(),dev:TAB});
  for(var j=p.length;j<old;j++)await db.doc("bd/"+sp+"_"+j).delete();
  WBM[sp]={n:p.length,h:h};
}
async function wbPullRemote(sp){
  var m=await db.doc("bd/"+sp+"_m").get();
  if(m.exists&&m.data()){
    var md=m.data(),s="";
    for(var i=0;i<md.n;i++){var d=await db.doc("bd/"+sp+"_"+i).get();if(!d.exists)throw {code:"partial"};s+=d.data().s}
    if(hsh(s)!==md.h)throw {code:"partial"};
    WBM[sp]={n:md.n,h:md.h};
    var a=JSON.parse(s);return Array.isArray(a)?a:null;
  }
  var lg=await db.doc("boards/"+sp).get();
  if(lg.exists&&lg.data()&&Array.isArray(lg.data().items))return lg.data().items;
  return null;
}
function wbPendKey(sp){return LS+"-wbp-"+sp}
function wbLoad(sp){
  if(WB.dirty&&WB.loadedFor&&WB.loadedFor!==sp&&db&&!readOnly){var oldSp=WB.loadedFor,oldJ=JSON.stringify(WB.items);wbPush(oldSp,oldJ).then(function(){try{localStorage.removeItem(wbPendKey(oldSp))}catch(e){}}).catch(function(){})}
  WB.loadedFor=sp;WB.items=[];WB.sel=null;WB.hist=[];WB.redo=[];WB.dirty=false;WB.px=40;WB.py=40;WB.z=1;
  try{var raw=localStorage.getItem(wbKey(sp));if(raw){var a=JSON.parse(raw);if(Array.isArray(a))WB.items=a}}catch(e){}
  if(db){
    wbPullRemote(sp).then(function(remote){
      if(WB.loadedFor!==sp||!remote)return;
      var pend=false;try{pend=!!localStorage.getItem(wbPendKey(sp))}catch(e){}
      var rj=JSON.stringify(remote);
      if(rj===JSON.stringify(WB.items))return;
      if(WB.dirty||pend){
        var before=JSON.stringify(WB.items);
        WB.items=mergeVal(WB.items,clone(remote));
        if(JSON.stringify(WB.items)!==before){wbTouch()}
      }else{WB.items=clone(remote);try{localStorage.setItem(wbKey(sp),JSON.stringify(WB.items))}catch(e){}}
      if(S.view==="wb")wbPaint();
    }).catch(function(){});
  }
}
function wbTouch(){
  WB.dirty=true;
  try{localStorage.setItem(wbKey(WB.loadedFor),JSON.stringify(WB.items));localStorage.setItem(wbPendKey(WB.loadedFor),"1")}catch(e){}
  clearTimeout(WB.timer);WB.timer=setTimeout(wbFlush,900);
}
function wbFlush(){
  clearTimeout(WB.timer);
  if(!WB.dirty)return;
  if(!db||readOnly)return;
  if(WB.saving){WB.timer=setTimeout(wbFlush,400);return}
  var sp=WB.loadedFor,json=JSON.stringify(WB.items);
  WB.saving=true;
  wbPush(sp,json).then(function(){
    WB.saving=false;WB.retry=0;
    if(sp===WB.loadedFor){
      if(JSON.stringify(WB.items)===json){WB.dirty=false;try{localStorage.removeItem(wbPendKey(sp))}catch(e){}}
      else WB.timer=setTimeout(wbFlush,300);
    }else{try{localStorage.removeItem(wbPendKey(sp))}catch(e){}}
  }).catch(function(e){
    WB.saving=false;
    var c=(e&&e.code)||"unavailable";
    if(c==="quota_exceeded"){toast("Cloud storage is full. This board is saved on this device only.");return}
    if(c==="invalid_argument"||c==="revoked"||c==="not_granted"||c==="capability_disabled"||c==="capability_removed"){return}
    WB.retry=(WB.retry||0)+1;
    WB.timer=setTimeout(wbFlush,Math.min(60000,2000*Math.pow(2,WB.retry)));
  });
}
window.addEventListener("online",function(){WB.retry=0;wbFlush()});

function wbSnap(){WB.hist.push(JSON.stringify(WB.items));if(WB.hist.length>60)WB.hist.shift();WB.redo=[]}
function wbUndo(){
  if(!WB.hist.length)return;
  wbCommitEdit();WB.redo.push(JSON.stringify(WB.items));WB.items=JSON.parse(WB.hist.pop());WB.sel=null;wbTouch();wbPaint();
}
function wbRedo(){
  if(!WB.redo.length)return;
  wbCommitEdit();WB.hist.push(JSON.stringify(WB.items));WB.items=JSON.parse(WB.redo.pop());WB.sel=null;wbTouch();wbPaint();
}
function wbDelete(){
  if(!WB.sel)return;
  wbCommitEdit();wbSnap();wbRemove(WB.sel);WB.sel=null;wbTouch();wbPaint();
}

function wbPt(e){var r=$("wbsvg").getBoundingClientRect();return {x:(e.clientX-r.left-WB.px)/WB.z,y:(e.clientY-r.top-WB.py)/WB.z}}
function wbBox(it){
  if(it.t==="conn"){var cp=wbConnPts(it);if(!cp)return{x:0,y:0,w:0,h:0};return{x:Math.min(cp.x1,cp.x2),y:Math.min(cp.y1,cp.y2),w:Math.abs(cp.x2-cp.x1),h:Math.abs(cp.y2-cp.y1)}}
  if(it.t==="pen"){
    var xs=it.pts.map(function(p){return p[0]}),ys=it.pts.map(function(p){return p[1]});
    var x0=Math.min.apply(null,xs),y0=Math.min.apply(null,ys);
    return {x:x0,y:y0,w:Math.max.apply(null,xs)-x0,h:Math.max.apply(null,ys)-y0};
  }
  if(it.t==="line"){
    var lx=Math.min(it.x1,it.x2),ly=Math.min(it.y1,it.y2);
    return {x:lx,y:ly,w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1)};
  }
  if(it.t==="text"){
    var lines=String(it.text||"").split("\n");
    var mx=Math.max.apply(null,lines.map(function(l){return l.length}));
    return {x:it.x,y:it.y,w:Math.max(60,mx*it.size*0.62+8),h:lines.length*it.size*1.35};
  }
  return {x:it.x,y:it.y,w:it.w,h:it.h};
}
function wbTint(c){return "color-mix(in srgb,"+c+" 30%,#FFFFFF)"}
function wbItemSVG0(it){
  var s=' data-id="'+it.id+'"',c=esc(it.c||"#12163A"),sw=it.sw||3;
  if(it.t==="pen"){
    var d="M"+it.pts.map(function(p){return p[0]+" "+p[1]}).join("L");
    if(it.pts.length===1)d+="l0.1 0";
    return '<g'+s+'><path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="transparent" stroke-width="'+Math.max(14,sw)+'" stroke-linecap="round" pointer-events="stroke"/></g>';
  }
  if(it.t==="rect")return '<g'+s+'><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="6" fill="'+(it.fill?"transparent":"transparent")+'" style="fill:'+(it.fill?wbTint(c):"transparent")+'" stroke="'+c+'" stroke-width="'+sw+'" pointer-events="all"/></g>';
  if(it.t==="frame"){
    var fb=Math.min(it.w,Math.max(120,(it.text||"Frame").length*11+40));
    return '<g'+s+'><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="14" style="fill:rgba(128,128,128,.07)" stroke="'+c+'" stroke-opacity=".55" stroke-width="2" pointer-events="stroke"/><rect x="'+it.x+'" y="'+it.y+'" width="'+fb+'" height="38" rx="14" fill="transparent" pointer-events="all"/><text x="'+(it.x+16)+'" y="'+(it.y+25)+'" class="wbft" fill="'+c+'">'+esc(it.text||"Frame")+'</text></g>';
  }
  if(it.t==="ell")return '<g'+s+'><ellipse cx="'+(it.x+it.w/2)+'" cy="'+(it.y+it.h/2)+'" rx="'+(it.w/2)+'" ry="'+(it.h/2)+'" style="fill:'+(it.fill?wbTint(c):"transparent")+'" stroke="'+c+'" stroke-width="'+sw+'" pointer-events="all"/></g>';
  if(it.t==="line"){
    var a=Math.atan2(it.y2-it.y1,it.x2-it.x1),L=8+sw*2.2;
    var h1x=it.x2-L*Math.cos(a-0.45),h1y=it.y2-L*Math.sin(a-0.45),h2x=it.x2-L*Math.cos(a+0.45),h2y=it.y2-L*Math.sin(a+0.45);
    var dl="M"+it.x1+" "+it.y1+"L"+it.x2+" "+it.y2;
    var da=dl+"M"+r1(h1x)+" "+r1(h1y)+"L"+it.x2+" "+it.y2+"L"+r1(h2x)+" "+r1(h2y);
    return '<g'+s+'><path d="'+da+'" fill="none" stroke="'+c+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round"/><path d="'+dl+'" fill="none" stroke="transparent" stroke-width="14" pointer-events="stroke"/></g>';
  }
  if(it.t==="sticky")return '<g'+s+'><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="8" style="fill:'+wbTint(c)+'" stroke="'+c+'" stroke-width="1.5"/><foreignObject x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'"><div class="wbnote">'+esc(it.text||"")+'</div></foreignObject></g>';
  if(it.t==="text"){
    var b=wbBox(it);
    return '<g'+s+'><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="transparent" pointer-events="all"/><foreignObject x="'+b.x+'" y="'+b.y+'" width="'+(b.w+40)+'" height="'+b.h+'"><div class="wbtext" style="font-size:'+it.size+'px;color:'+c+'">'+esc(it.text||"")+'</div></foreignObject></g>';
  }
  return "";
}
/* ---------- node canvas additions ---------- */
function wbAccent(){return spColor(S.cur)}
function wbGroup(it){var t=it.t;return t==="node"?"nodes":t==="stat"?"cards":t==="img"?"images":(t==="sticky"||t==="text")?"notes":t==="conn"?"conn":"draw"}
function wbShown(it){
  if(WB.filter==="all")return true;
  if(it.t==="conn"){var a=findIn(WB.items,it.a),b=findIn(WB.items,it.b);return !!a&&!!b&&wbGroup(a)===WB.filter&&wbGroup(b)===WB.filter}
  return wbGroup(it)===WB.filter;
}
function wbEditable(it){return it.t==="frame"||it.t==="sticky"||it.t==="text"||it.t==="node"||it.t==="stat"||it.t==="img"}
function wbRemove(id){WB.items=WB.items.filter(function(x){return x.id!==id&&!(x.t==="conn"&&(x.a===id||x.b===id))})}
function wbDateShort(d){var p=String(d).split("-");if(p.length!==3)return"";var m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+p[1]-1];return m?(+p[2])+" "+m:""}
function wbConnPts(c){
  var a=findIn(WB.items,c.a),b=findIn(WB.items,c.b);if(!a||!b)return null;
  var A=wbBox(a),B=wbBox(b),ac={x:A.x+A.w/2,y:A.y+A.h/2},bc={x:B.x+B.w/2,y:B.y+B.h/2},dx=bc.x-ac.x,dy=bc.y-ac.y,x1,y1,x2,y2,d;
  if(Math.abs(dx)>=Math.abs(dy)){
    var s=dx>=0?1:-1;x1=s>0?A.x+A.w:A.x;y1=ac.y;x2=s>0?B.x:B.x+B.w;y2=bc.y;var k=Math.max(40,Math.abs(x2-x1)/2);
    d="M"+r1(x1)+" "+r1(y1)+"C"+r1(x1+s*k)+" "+r1(y1)+" "+r1(x2-s*k)+" "+r1(y2)+" "+r1(x2)+" "+r1(y2);
  }else{
    var t=dy>=0?1:-1;x1=ac.x;y1=t>0?A.y+A.h:A.y;x2=bc.x;y2=t>0?B.y:B.y+B.h;var k2=Math.max(40,Math.abs(y2-y1)/2);
    d="M"+r1(x1)+" "+r1(y1)+"C"+r1(x1)+" "+r1(y1+t*k2)+" "+r1(x2)+" "+r1(y2-t*k2)+" "+r1(x2)+" "+r1(y2);
  }
  return {x1:x1,y1:y1,x2:x2,y2:y2,d:d};
}
function wbSpark(vals,x0,x1,y0,y1){
  if(vals.length<2)return"";
  var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rg=(mx-mn)||1;
  var pts=vals.map(function(v,i){return [x0+(x1-x0)*i/(vals.length-1),y1-(y1-y0)*((v-mn)/rg)]});
  var d="M"+r1(pts[0][0])+" "+r1(pts[0][1]);
  for(var i=1;i<pts.length;i++){var mxp=(pts[i-1][0]+pts[i][0])/2;d+="C"+r1(mxp)+" "+r1(pts[i-1][1])+" "+r1(mxp)+" "+r1(pts[i][1])+" "+r1(pts[i][0])+" "+r1(pts[i][1])}
  return {d:d,end:pts[pts.length-1]};
}
function wbNodeSVG(it){
  var ac=wbAccent(),hi=!!it.hi,h=it.h,r=h/2,lines=String(it.text||"").split("\n"),sub=lines.slice(1).join(" ");
  if(it.date)sub=(sub?sub+" · ":"")+wbDateShort(it.date);
  return '<g data-id="'+it.id+'"><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+h+'" rx="'+r+'" fill="#FFFFFF" stroke="'+(hi?ac:"#DADCEA")+'" stroke-width="'+(hi?2:1.2)+'"/>'+
    '<circle cx="'+(it.x+r)+'" cy="'+(it.y+r)+'" r="'+(r-8)+'" fill="'+(hi?ac:"#ECEEF5")+'"/><circle cx="'+(it.x+r)+'" cy="'+(it.y+r)+'" r="3.5" fill="'+(hi?"#FFFFFF":"#8A90A8")+'"/>'+
    '<foreignObject x="'+(it.x+h)+'" y="'+it.y+'" width="'+Math.max(20,it.w-h-12)+'" height="'+h+'"><div class="wbn"><b class="wbn-t">'+esc(lines[0]||"Untitled")+'</b>'+(sub?'<span class="wbn-s">'+esc(sub)+'</span>':'')+'</div></foreignObject></g>';
}
function wbStatSVG(it){
  var ac=wbAccent(),hi=!!it.hi,fg=hi?"#FFFFFF":"#12163A",mu=hi?"rgba(255,255,255,.8)":"#6B7190",lines=String(it.text||"").split("\n");
  var vals=(lines[2]||"").split(/[\s,;]+/).map(parseFloat).filter(function(n){return isFinite(n)});
  var sp=it.h>=110?wbSpark(vals,it.x+18,it.x+it.w-18,it.y+78,it.y+it.h-18):"";
  return '<g data-id="'+it.id+'"><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="24" fill="'+(hi?ac:"#FFFFFF")+'" stroke="'+(hi?ac:"#DADCEA")+'" stroke-width="1.2"/>'+
    '<foreignObject x="'+(it.x+18)+'" y="'+(it.y+12)+'" width="'+Math.max(20,it.w-36)+'" height="68"><div class="wbs"><div style="font:600 13px/1.2 var(--f-body);color:'+mu+'">'+esc(lines[0]||"Metric")+'</div><div style="font:800 28px/1.1 var(--f-display);color:'+fg+';margin-top:4px">'+esc(lines[1]||"")+'</div></div></foreignObject>'+
    (sp?'<path d="'+sp.d+'" fill="none" stroke="'+(hi?"#FFFFFF":ac)+'" stroke-width="2.4" stroke-linecap="round"/><circle cx="'+r1(sp.end[0])+'" cy="'+r1(sp.end[1])+'" r="4" fill="'+(hi?"#FFFFFF":ac)+'"/>':'')+'</g>';
}
function wbImgSVG(it){
  var cid="wbc"+it.id,cap=String(it.text||"").split("\n")[0];
  return '<g data-id="'+it.id+'"><clipPath id="'+cid+'"><rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="22"/></clipPath>'+
    '<rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="22" fill="#E9EBF2"/>'+
    '<image class="wbimg" href="/_blob/'+esc(it.assetId)+'" x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#'+cid+')"/>'+
    '<rect x="'+it.x+'" y="'+it.y+'" width="'+it.w+'" height="'+it.h+'" rx="22" fill="none" stroke="#DADCEA" stroke-width="1.2"/>'+
    (cap?'<rect x="'+(it.x+10)+'" y="'+(it.y+it.h-40)+'" width="'+(it.w-20)+'" height="30" rx="15" fill="rgba(255,255,255,.92)"/><foreignObject x="'+(it.x+10)+'" y="'+(it.y+it.h-40)+'" width="'+(it.w-20)+'" height="30"><div class="wbn" style="padding:0 12px"><b class="wbn-t" style="font-size:12.5px">'+esc(cap)+'</b></div></foreignObject>':'')+'</g>';
}
function wbConnSVG(it){
  var cp=wbConnPts(it);if(!cp)return"";var ac=wbAccent();
  return '<g data-id="'+it.id+'"><path d="'+cp.d+'" fill="none" stroke="'+ac+'" stroke-width="2" stroke-linecap="round"/><path d="'+cp.d+'" fill="none" stroke="transparent" stroke-width="16" pointer-events="stroke"/>'+
    '<circle cx="'+r1(cp.x1)+'" cy="'+r1(cp.y1)+'" r="4.5" fill="#FFFFFF" stroke="'+ac+'" stroke-width="2"/><circle cx="'+r1(cp.x2)+'" cy="'+r1(cp.y2)+'" r="4.5" fill="#FFFFFF" stroke="'+ac+'" stroke-width="2"/></g>';
}
function wbItemSVG(it){
  var out;
  if(it.t==="node")out=wbNodeSVG(it);else if(it.t==="stat")out=wbStatSVG(it);else if(it.t==="img")out=wbImgSVG(it);else if(it.t==="conn")out=wbConnSVG(it);else out=wbItemSVG0(it);
  if(out&&it.id!=="draft"&&!wbShown(it))out=out.replace('<g data-id','<g style="opacity:.14" data-id');
  return out;
}
function wbInspKey(){var it=findIn(WB.items,WB.sel);return it?it.id+":"+(it.hi?1:0):""}
function wbInspHTML(){
  var it=findIn(WB.items,WB.sel),h='';
  if(it&&(it.t==="node"||it.t==="stat"))h+='<button class="tb" data-act="wbhi" aria-pressed="'+!!it.hi+'" title="Fill with this space\'s accent colour">Accent</button>';
  if(it&&(it.t==="node"||it.t==="stat"||it.t==="img"))h+='<input type="date" class="wsel" id="wbdate" value="'+esc(it.date||"")+'" aria-label="Date, shows in the timeline strip" title="Date, shows in the timeline strip">';
  return h;
}
function wbInspChange(e){
  var t=e.target;if(t.id!=="wbdate")return;
  var it=findIn(WB.items,WB.sel);if(!it)return;wbSnap();it.date=t.value;wbTouch();wbPaint();
}
function wbCenter(it){var sv=$("wbsvg").getBoundingClientRect(),b=wbBox(it);WB.px=sv.width/2-(b.x+b.w/2)*WB.z;WB.py=sv.height/2-(b.y+b.h/2)*WB.z}
function wbConnClick(ci){
  if(!ci||ci.t==="conn"){WB.connFrom=null;wbPaint();return}
  if(!WB.connFrom){WB.connFrom=ci.id;toast("Now click the item to link to");wbPaint();return}
  if(WB.connFrom===ci.id){WB.connFrom=null;wbPaint();return}
  var a=WB.connFrom,b=ci.id,dup=WB.items.some(function(c){return c.t==="conn"&&((c.a===a&&c.b===b)||(c.a===b&&c.b===a))});
  WB.connFrom=null;
  if(!dup){wbSnap();var n={id:uid(),t:"conn",a:a,b:b};WB.items.push(n);WB.sel=n.id;wbTouch()}
  WB.tool="select";wbToolbar();
}
function wbImgPicked(){
  var fi=$("wbfile"),f=fi&&fi.files&&fi.files[0];if(fi)fi.value="";
  if(!f||!WB.pendImg)return;
  if(!assets){toast("Image upload isn't available here.");return}
  var pos=WB.pendImg;WB.pendImg=null;toast("Uploading…");
  assets.upload(f).then(function(r){
    wbSnap();var n={id:uid(),t:"img",x:r1(pos.x-110),y:r1(pos.y-80),w:220,h:160,assetId:r.id,text:""};
    WB.items.push(n);WB.sel=n.id;WB.tool="select";wbTouch();wbToolbar();
  }).catch(function(e){toast(upErr(e))});
}
function wbStarter(){
  wbCommitEdit();var sv=$("wbsvg").getBoundingClientRect(),cx=(sv.width/2-WB.px)/WB.z,cy=(sv.height/2-WB.py)/WB.z,day=86400000;
  function d(n){return new Date(Date.now()+n*day).toISOString().slice(0,10)}
  function mk(x,y,t,hi,n){return {id:uid(),t:"node",x:r1(cx+x),y:r1(cy+y),w:210,h:56,text:t,hi:hi,date:d(n)}}
  var a=mk(-470,-28,"Idea\nPick the topic",false,0),b=mk(-210,-110,"Script\nHook and outline",false,2),c=mk(-210,54,"Shoot\nB-roll and voice",false,4),e=mk(60,-28,"Edit\nCut and colour",true,7);
  function cn(p,q){return {id:uid(),t:"conn",a:p.id,b:q.id}}
  wbSnap();WB.items=WB.items.concat([a,b,c,e,cn(a,b),cn(a,c),cn(b,e),cn(c,e)]);
  wbTouch();wbFit();wbToolbar();
}
function wbChipsHTML(){
  return [["all","All"],["nodes","Nodes"],["cards","Cards"],["images","Images"],["notes","Notes"],["draw","Drawings"]].map(function(c){
    return '<button class="wbchip" data-act="wbfilter" data-id="'+c[0]+'" aria-pressed="'+(WB.filter===c[0])+'">'+c[1]+'</button>';
  }).join("");
}
function wbOverlays(){
  var ch=$("wbchips");if(ch&&WB.ck!==WB.filter){WB.ck=WB.filter;ch.innerHTML=wbChipsHTML()}
  var tl=$("wbtl");
  if(tl){
    var dated=WB.items.filter(function(x){return x.date&&(x.t==="node"||x.t==="stat"||x.t==="img")}).sort(function(p,q){return p.date<q.date?-1:p.date>q.date?1:0});
    var h='<span class="wbtl-l">Timeline</span>'+(dated.length?dated.map(function(x){
      var t=String(x.text||"").split("\n")[0]||"Untitled";if(t.length>20)t=t.slice(0,19)+"…";
      return '<button class="wbtlb" data-act="wbtl" data-id="'+x.id+'" aria-pressed="'+(WB.sel===x.id)+'"><i>'+wbDateShort(x.date)+'</i>'+esc(t)+'</button>';
    }).join(""):'<span class="wbtl-h">Select a node or card and pick a date to see it here</span>');
    if(h!==WB.tl){WB.tl=h;tl.innerHTML=h}
  }
  wbMiniPaint();
}
function wbMiniPaint(){
  var m=$("wbmini"),sv=$("wbsvg");if(!m||!sv)return;
  var r=sv.getBoundingClientRect(),z=WB.z,vx=-WB.px/z,vy=-WB.py/z,vw=r.width/z,vh=r.height/z;
  if(!WB.miniDrag||!WB.mini){
    var x0=vx,y0=vy,x1=vx+vw,y1=vy+vh;
    WB.items.forEach(function(it){if(it.t==="conn")return;var b=wbBox(it);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h)});
    var pad=30;x0-=pad;y0-=pad;x1+=pad;y1+=pad;
    var w=Math.max(10,x1-x0),h=Math.max(10,y1-y0),s=Math.min(168/w,108/h);
    WB.mini={x0:x0,y0:y0,s:s,ox:(168-w*s)/2,oy:(108-h*s)/2};
  }
  var mi=WB.mini,ac=wbAccent(),out="";
  WB.items.forEach(function(it){
    if(it.t==="conn")return;var b=wbBox(it),big=it.t==="node"||it.t==="stat"||it.t==="img";
    out+='<rect x="'+r1((b.x-mi.x0)*mi.s+mi.ox)+'" y="'+r1((b.y-mi.y0)*mi.s+mi.oy)+'" width="'+r1(Math.max(2.5,b.w*mi.s))+'" height="'+r1(Math.max(2.5,b.h*mi.s))+'" rx="2" fill="'+(big?ac:"currentColor")+'" opacity="'+(big?".85":".35")+'"/>';
  });
  out+='<rect x="'+r1((vx-mi.x0)*mi.s+mi.ox)+'" y="'+r1((vy-mi.y0)*mi.s+mi.oy)+'" width="'+r1(vw*mi.s)+'" height="'+r1(vh*mi.s)+'" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  m.innerHTML=out;
}
function wbMiniAt(e){
  var m=$("wbmini"),mi=WB.mini;if(!m||!mi)return;var r=m.getBoundingClientRect();
  var wx=((e.clientX-r.left)/r.width*168-mi.ox)/mi.s+mi.x0,wy=((e.clientY-r.top)/r.height*108-mi.oy)/mi.s+mi.y0,sv=$("wbsvg").getBoundingClientRect();
  WB.px=sv.width/2-wx*WB.z;WB.py=sv.height/2-wy*WB.z;wbPaint();
}
function wbMiniDown(e){WB.miniDrag=true;try{$("wbmini").setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();wbMiniAt(e)}
function wbMiniMove(e){if(WB.miniDrag)wbMiniAt(e)}
function wbMiniUp(){WB.miniDrag=false}

function wbSelSVG(){
  var it=findIn(WB.items,WB.sel);if(!it)return"";
  if(it.t==="conn"){var cq=wbConnPts(it);return cq?'<path d="'+cq.d+'" fill="none" stroke="'+wbAccent()+'" stroke-width="'+(7/WB.z)+'" stroke-linecap="round" opacity=".28" pointer-events="none"/>':""}
  var b=wbBox(it),z=WB.z,pad=4/z;
  var out='<rect x="'+(b.x-pad)+'" y="'+(b.y-pad)+'" width="'+(b.w+pad*2)+'" height="'+(b.h+pad*2)+'" fill="none" stroke="#1B6E66" stroke-width="'+(1.5/z)+'" stroke-dasharray="'+(5/z)+'" pointer-events="none"/>';
  if(it.t==="rect"||it.t==="ell"||it.t==="frame"||it.t==="sticky"||it.t==="node"||it.t==="stat"||it.t==="img"){
    var hs=11/z;
    out+='<rect data-handle="1" x="'+(b.x+b.w-hs/2)+'" y="'+(b.y+b.h-hs/2)+'" width="'+hs+'" height="'+hs+'" rx="'+(2/z)+'" fill="#1B6E66" stroke="#FFFFFF" stroke-width="'+(1.5/z)+'" style="cursor:nwse-resize"/>';
  }
  return out;
}
function wbPaint(){
  var g=$("wbitems");if(!g)return;
  var ik=wbInspKey();if(ik!==WB.ik){WB.ik=ik;var tb=$("wbtools");if(tb)tb.innerHTML=wbToolsHTML()}
  var ring="";if(WB.connFrom){var cf=findIn(WB.items,WB.connFrom);if(cf){var cb=wbBox(cf),cz=WB.z;ring='<rect x="'+(cb.x-6/cz)+'" y="'+(cb.y-6/cz)+'" width="'+(cb.w+12/cz)+'" height="'+(cb.h+12/cz)+'" rx="'+(18/cz)+'" fill="none" stroke="'+wbAccent()+'" stroke-width="'+(2/cz)+'" stroke-dasharray="'+(5/cz)+'" pointer-events="none"/>'}}
  g.innerHTML=WB.items.filter(function(x){return x.t==="conn"}).map(wbItemSVG).join("")+WB.items.filter(function(x){return x.t==="frame"}).map(wbItemSVG).join("")+WB.items.filter(function(x){return x.t!=="conn"&&x.t!=="frame"}).map(wbItemSVG).join("")+(WB.draft?wbItemSVG(WB.draft):"")+wbSelSVG()+ring;
  var tr="translate("+WB.px+" "+WB.py+") scale("+WB.z+")";
  $("wbworld").setAttribute("transform",tr);
  $("wbdots").setAttribute("patternTransform",tr);
  var ww=$("wbwrap");if(ww)ww.classList.toggle("empty",!WB.items.length);var em=$("wbempty");if(em){var hid=false;try{hid=localStorage.getItem("cs-wbhint")==="1"}catch(e){}em.hidden=hid||WB.items.length>0}
  var u=$("wbundo"),r=$("wbredo"),d=$("wbdelbtn"),zz=$("wbzoom");
  if(u)u.disabled=!WB.hist.length;if(r)r.disabled=!WB.redo.length;if(d)d.disabled=!WB.sel;
  if(zz)zz.textContent=Math.round(WB.z*100)+"%";
  wbOverlays();
  $("wbsvg").style.cursor=WB.tool==="select"?"default":(WB.tool==="erase"?"cell":"crosshair");
}
function wbErase(e){var d=WB.drag;if(!d)return;var el=document.elementFromPoint(e.clientX,e.clientY),g=el&&el.closest?el.closest("[data-id]"):null;if(g&&findIn(WB.items,g.dataset.id)){if(!d.snapped){wbSnap();d.snapped=true}var gid=g.dataset.id;wbRemove(gid);wbTouch();wbPaint()}}
function wbSched(){if(WB.raf)return;WB.raf=requestAnimationFrame(function(){WB.raf=0;wbPaint()})}

function wbToolsHTML(){
  var SH=["frame","rect","ell","line","conn"],MORE=["node","stat","img","erase"];
  var T={frame:["frame","Frame: a titled box that groups things"],select:["cursor","Select and move"],pen:["pen","Pen"],sticky:["sticky","Sticky note"],text:["text","Text"],rect:["square","Rectangle"],ell:["circle","Ellipse"],line:["arrow","Arrow"],conn:["link","Connect two items with a line"],node:["pill","Node card: a title and a detail"],stat:["chart","Stat card with a chart"],img:["image","Image card"],erase:["eraser","Eraser: click or drag over items"]};
  function tb(id){return '<button class="tb" data-act="wbtool" data-id="'+id+'" aria-pressed="'+(WB.tool===id)+'" aria-label="'+T[id][1]+'" title="'+T[id][1]+'">'+I(T[id][0])+'</button>'}
  var shapeOn=SH.indexOf(WB.tool)>-1,moreOn=MORE.indexOf(WB.tool)>-1;
  var shapeIc=shapeOn?T[WB.tool][0]:"shapes";
  var h='<div class="wbrail"><div class="wbcard wbmain" role="group" aria-label="Drawing tools">'+tb("select")+tb("pen")+tb("sticky")+tb("text")+
    '<button class="tb" data-act="wbmenu" data-id="shapes" aria-pressed="'+(shapeOn||WB.menu==="shapes")+'" aria-label="Shapes and lines" title="Shapes and lines">'+I(shapeIc)+'</button>'+
    '<button class="tb tbmore" data-act="wbmenu" data-id="more" aria-pressed="'+(moreOn||WB.menu==="more")+'" aria-label="More tools" title="More tools">'+I("chev")+'</button></div>'+
    '<div class="wbcard wbhist"><button class="tb" id="wbundo" data-act="wbundo" aria-label="Undo" title="Undo">'+I("undo")+'</button><button class="tb" id="wbredo" data-act="wbredo" aria-label="Redo" title="Redo">'+I("redo")+'</button><button class="tb" id="wbdelbtn" data-act="wbdel" aria-label="Delete selected" title="Delete selected">'+I("trash")+'</button></div></div>';
  if(WB.menu==="shapes")h+='<div class="wbcard wbfly" style="--ty:0">'+SH.map(tb).join("")+'</div>';
  if(WB.menu==="more")h+='<div class="wbcard wbfly wbfly2">'+MORE.map(tb).join("")+'<span class="sep"></span><button class="tb wide" data-act="wbstart" title="Add an example flow">Starter flow</button><button class="tb wide" data-act="wbbg" title="Canvas colour: auto, light or dark">'+I(wbDark()?"moon":"sun")+' Canvas</button><button class="tb wide" data-act="wbclear">Clear board</button></div>';
  var styled=["pen","rect","ell","line","frame","sticky","text","node","stat"].indexOf(WB.tool)>-1||WB.sel;
  var insp=wbInspHTML();
  if(styled){
    var cols=WBCOL.concat((S.palette[S.cur]||[]).map(function(c){return c.toUpperCase()}).filter(function(c){return WBCOL.indexOf(c)<0})).slice(0,10);
    h+='<div class="wbcard wbstyle" role="group" aria-label="Style"><div class="wbcols">'+cols.map(function(c){
      return '<button class="cs" data-act="wbcolor" data-id="'+c+'" style="--c:'+c+'" aria-pressed="'+(WB.color.toLowerCase()===c.toLowerCase())+'" aria-label="Colour '+c+'" title="'+c+'"></button>';
    }).join("")+'</div><div class="wbrow"><select class="wsel" id="wbw" aria-label="Line thickness">'+[[2,"Thin"],[3,"Medium"],[6,"Thick"],[10,"Heavy"]].map(function(o){return '<option value="'+o[0]+'"'+(WB.width===o[0]?" selected":"")+'>'+o[1]+'</option>'}).join("")+'</select>'+
      '<button class="tb" data-act="wbfill" aria-pressed="'+WB.fill+'" title="Fill shapes with colour">Fill</button></div>'+(insp?'<div class="wbrow">'+insp+'</div>':'')+'</div>';
  }
  h+='<div class="wbzoomc wbcard"><button class="tb" data-act="wbzoom" data-id="out" aria-label="Zoom out">'+I("minus")+'</button><span class="wbz" id="wbzoom">100%</span><button class="tb" data-act="wbzoom" data-id="in" aria-label="Zoom in">'+I("plus")+'</button><button class="tb" data-act="wbzoom" data-id="fit" aria-label="Fit everything" title="Fit everything">'+I("fit")+'</button><button class="tb" data-act="wbhelp" aria-label="Whiteboard help" title="Help">'+I("help")+'</button></div>';
  return h;
}
function wbToolbar(){var t=$("wbtools");if(t){t.innerHTML=wbToolsHTML();wbPaint()}}
function vWb(){
  var h='<div class="wbwrap" id="wbwrap"><div class="wbname"><h1>Whiteboard</h1><span>'+esc(spaceName())+'</span></div><div class="wbui" id="wbtools">'+wbToolsHTML()+'</div><svg id="wbsvg" class="wbsvg" role="img" aria-label="Whiteboard canvas"><defs><pattern id="wbdots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1.1" class="wbdot"/></pattern></defs><rect width="100%" height="100%" fill="url(#wbdots)"/><g id="wbworld"><g id="wbitems"></g></g></svg><div class="wbempty" id="wbempty"><button class="wbempty-x" data-act="wbhint" aria-label="Dismiss">'+I("x")+'</button><button class="wbempty-b" data-act="wbfirst"><svg viewBox="0 0 96 96" width="88" height="88" aria-hidden="true"><rect x="52" y="10" width="22" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><rect x="72" y="36" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><rect x="14" y="40" width="46" height="46" rx="3" fill="var(--surface)" stroke="currentColor" stroke-width="3"/><path d="M37 52v22M26 63h22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg><span>Add your first object</span></button></div><div class="wbchips" id="wbchips"></div><svg id="wbmini" class="wbmini" viewBox="0 0 168 108" role="img" aria-label="Minimap. Click to move the view."></svg><div class="wbtl" id="wbtl"></div></div><input type="file" id="wbfile" accept="image/*" hidden>';
  return h;
}
function wbMount(){
  if(WB.loadedFor!==S.cur){wbFlush();wbLoad(S.cur)}
  var svg=$("wbsvg");
  svg.addEventListener("pointerdown",wbDown);svg.addEventListener("pointermove",wbMove);
  svg.addEventListener("pointerup",wbUp);svg.addEventListener("pointercancel",wbUp);
  svg.addEventListener("wheel",wbWheel,{passive:false});svg.addEventListener("dblclick",wbDbl);
  var mm=$("wbmini");mm.addEventListener("pointerdown",wbMiniDown);mm.addEventListener("pointermove",wbMiniMove);mm.addEventListener("pointerup",wbMiniUp);mm.addEventListener("pointercancel",wbMiniUp);
  $("wbfile").addEventListener("change",wbImgPicked);$("wbtools").addEventListener("change",wbInspChange);
  WB.ik="";WB.ck="";WB.tl="";WB.connFrom=null;
  wbPaint();
}

function wbZoomTo(nz,cx,cy){
  nz=Math.min(4,Math.max(0.25,nz));
  WB.px=cx-(cx-WB.px)*(nz/WB.z);WB.py=cy-(cy-WB.py)*(nz/WB.z);WB.z=nz;wbPaint();
}
function wbFit(){
  var sv=$("wbsvg").getBoundingClientRect();
  if(!WB.items.length){WB.z=1;WB.px=40;WB.py=40;wbPaint();return}
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  WB.items.forEach(function(it){if(it.t==="conn")return;var b=wbBox(it);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h)});
  var w=Math.max(40,x1-x0),h=Math.max(40,y1-y0),pad=48;
  var z=Math.min(2,Math.max(0.25,Math.min((sv.width-pad*2)/w,(sv.height-pad*2)/h)));
  WB.z=z;WB.px=(sv.width-w*z)/2-x0*z;WB.py=(sv.height-h*z)/2-y0*z;wbPaint();
}
function wbWheel(e){
  e.preventDefault();wbCommitEdit();
  var r=$("wbsvg").getBoundingClientRect();
  wbZoomTo(WB.z*(e.deltaY<0?1.1:1/1.1),e.clientX-r.left,e.clientY-r.top);
}

function wbEditStart(id){
  var it=findIn(WB.items,id);if(!it||!wbEditable(it))return;
  wbCommitEdit();
  if(it.t==="node"&&!WB.hn){WB.hn=1;toast("Line 1 is the title, line 2 the detail")}
  if(it.t==="stat"&&!WB.hs){WB.hs=1;toast("Line 1 title, line 2 value, line 3 numbers like 3,5,4 for the chart")}
  setTimeout(function(){
    var wrap=$("wbwrap");if(!wrap||!findIn(WB.items,id))return;
    var b=wbBox(it),fs=it.t==="text"?it.size:15,ta=document.createElement("textarea");
    ta.className="wbedit";
    ta.style.left=(WB.px+b.x*WB.z)+"px";ta.style.top=(WB.py+b.y*WB.z)+"px";
    ta.style.width=(it.t==="frame"?Math.min(b.w*WB.z,320):Math.max(140,b.w*WB.z+(it.t==="text"?60:0)))+"px";
    ta.style.height=(it.t==="frame"?40*WB.z:Math.max(it.t==="text"?fs*1.6*WB.z+12:b.h*WB.z,44))+"px";
    ta.style.fontSize=(fs*WB.z)+"px";
    ta.value=it.text||"";ta.setAttribute("aria-label","Edit text");
    wrap.appendChild(ta);WB.edit={id:id,el:ta,orig:it.text||""};
    ta.focus();ta.select();
    ta.addEventListener("blur",wbCommitEdit);
    ta.addEventListener("keydown",function(ev){if(ev.key==="Escape"){ev.stopPropagation();ta.value=WB.edit?WB.edit.orig:"";ta.blur()}});
  },0);
}
function wbCommitEdit(){
  var ed=WB.edit;if(!ed)return;WB.edit=null;
  var v=ed.el.value;
  if(ed.el.parentNode)ed.el.parentNode.removeChild(ed.el);
  var it=findIn(WB.items,ed.id);if(!it)return;
  if(it.t==="text"&&!v.trim()){wbSnap();WB.items=WB.items.filter(function(x){return x.id!==ed.id});if(WB.sel===ed.id)WB.sel=null;wbTouch();wbPaint();return}
  if(v!==(it.text||"")){wbSnap();it.text=v;wbTouch()}
  wbPaint();
}

function wbDown(e){
  if(WB.edit)wbCommitEdit();
  if(e.button!==undefined&&e.button>1)return;
  var svg=$("wbsvg"),p=wbPt(e),t=e.target;
  var gi=t.closest?t.closest("[data-id]"):null,handle=t.closest?t.closest("[data-handle]"):null;
  if(WB.tool==="erase"){WB.sel=null;WB.drag={k:"erase",snapped:false};svg.setPointerCapture(e.pointerId);e.preventDefault();wbErase(e);return}
  if(WB.tool==="conn"){var cgi=gi?findIn(WB.items,gi.dataset.id):null;e.preventDefault();wbConnClick(cgi);return}
  if(WB.tool==="select"){
    if(handle&&WB.sel){
      var hi=findIn(WB.items,WB.sel);
      WB.drag={k:"resize",id:hi.id,start:p,orig:clone(hi),snap:false};svg.setPointerCapture(e.pointerId);e.preventDefault();return;
    }
    if(gi){
      WB.sel=gi.dataset.id;var mi=findIn(WB.items,WB.sel);
      if(mi.t==="conn"){wbPaint();return}
      var mem=[];
      if(mi.t==="frame")WB.items.forEach(function(x){if(x.id===mi.id||x.t==="frame"||x.t==="conn")return;var bb=wbBox(x),cx=bb.x+bb.w/2,cy=bb.y+bb.h/2;if(cx>=mi.x&&cx<=mi.x+mi.w&&cy>=mi.y&&cy<=mi.y+mi.h)mem.push({id:x.id,orig:clone(x)})});
      WB.drag={k:"move",id:WB.sel,start:p,orig:clone(mi),snap:false,mem:mem};svg.setPointerCapture(e.pointerId);wbPaint();return;
    }
    WB.sel=null;WB.drag={k:"pan",sx:e.clientX,sy:e.clientY,px:WB.px,py:WB.py};svg.setPointerCapture(e.pointerId);wbPaint();return;
  }
  e.preventDefault();
  if(WB.tool==="pen"){
    WB.sel=null;WB.draft={id:"draft",t:"pen",pts:[[r1(p.x),r1(p.y)]],c:WB.color,sw:WB.width};
    WB.drag={k:"draw"};svg.setPointerCapture(e.pointerId);wbPaint();return;
  }
  if(WB.tool==="rect"||WB.tool==="ell"||WB.tool==="line"||WB.tool==="frame"){
    WB.sel=null;
    WB.draft={id:"draft",t:WB.tool,x:p.x,y:p.y,w:0,h:0,x1:p.x,y1:p.y,x2:p.x,y2:p.y,c:WB.color,sw:WB.width,fill:WB.fill};
    WB.drag={k:"draw",start:p};svg.setPointerCapture(e.pointerId);wbPaint();return;
  }
  if(WB.tool==="img"){WB.pendImg=p;WB.tool="select";wbToolbar();var wf=$("wbfile");if(wf)wf.click();return}
  if(WB.tool==="node"||WB.tool==="stat"){
    wbSnap();
    var nn=WB.tool==="node"?{id:uid(),t:"node",x:r1(p.x-105),y:r1(p.y-28),w:210,h:56,text:"New step\nDetail",hi:false,date:""}:{id:uid(),t:"stat",x:r1(p.x-115),y:r1(p.y-72),w:230,h:144,text:"Metric\n42\n3,5,4,6,5,8",hi:false,date:""};
    WB.items.push(nn);WB.sel=nn.id;WB.tool="select";wbTouch();wbToolbar();wbEditStart(nn.id);return;
  }
  if(WB.tool==="sticky"||WB.tool==="text"){
    wbSnap();
    var n=WB.tool==="sticky"?{id:uid(),t:"sticky",x:r1(p.x-85),y:r1(p.y-60),w:170,h:130,c:WB.color,text:""}:{id:uid(),t:"text",x:r1(p.x),y:r1(p.y),size:22,c:WB.color,text:""};
    WB.items.push(n);WB.sel=n.id;WB.tool="select";wbTouch();wbToolbar();wbEditStart(n.id);
  }
}
function wbMove(e){
  var d=WB.drag;if(!d)return;
  if(d.k==="erase"){wbErase(e);return}
  if(d.k==="pan"){WB.px=d.px+(e.clientX-d.sx);WB.py=d.py+(e.clientY-d.sy);wbSched();return}
  var p=wbPt(e);
  if(d.k==="draw"){
    var dr=WB.draft;if(!dr)return;
    if(dr.t==="pen"){var last=dr.pts[dr.pts.length-1];if(Math.hypot(p.x-last[0],p.y-last[1])>2)dr.pts.push([r1(p.x),r1(p.y)])}
    else if(dr.t==="line"){dr.x2=p.x;dr.y2=p.y}
    else{dr.x=Math.min(d.start.x,p.x);dr.y=Math.min(d.start.y,p.y);dr.w=Math.abs(p.x-d.start.x);dr.h=Math.abs(p.y-d.start.y)}
    wbSched();return;
  }
  var dx=p.x-d.start.x,dy=p.y-d.start.y,it=findIn(WB.items,d.id),o=d.orig;
  if(!it)return;
  if(!d.snap){
    if(Math.hypot(dx,dy)<2/WB.z)return;
    d.snap=true;
    var cur=JSON.stringify(WB.items);WB.items=WB.items.map(function(x){return x.id===d.id?o:x});wbSnap();WB.items=JSON.parse(cur);it=findIn(WB.items,d.id);
  }
  if(d.k==="move"){
    var shift=function(t,q){
      if(q.t==="pen")t.pts=q.pts.map(function(z){return [r1(z[0]+dx),r1(z[1]+dy)]});
      else if(q.t==="line"){t.x1=r1(q.x1+dx);t.y1=r1(q.y1+dy);t.x2=r1(q.x2+dx);t.y2=r1(q.y2+dy)}
      else{t.x=r1(q.x+dx);t.y=r1(q.y+dy)}
    };
    shift(it,o);
    (d.mem||[]).forEach(function(m){var mt=findIn(WB.items,m.id);if(mt)shift(mt,m.orig)});
  }else if(d.k==="resize"){
    it.w=r1(Math.max(o.t==="node"?110:24,o.w+dx));it.h=r1(Math.max(o.t==="node"?44:24,o.h+dy));
  }
  wbSched();
}
function wbUp(e){
  var d=WB.drag;WB.drag=null;if(!d)return;
  try{$("wbsvg").releasePointerCapture(e.pointerId)}catch(x){}
  if(d.k==="draw"){
    var it=WB.draft;WB.draft=null;if(!it)return;
    var ok=it.t==="pen"?it.pts.length>0:(it.t==="line"?Math.hypot(it.x2-it.x1,it.y2-it.y1)>6:(it.w>6&&it.h>6));
    if(ok){
      wbSnap();it.id=uid();
      if(it.t==="line"){it.x1=r1(it.x1);it.y1=r1(it.y1);it.x2=r1(it.x2);it.y2=r1(it.y2)}
      else if(it.t!=="pen"){it.x=r1(it.x);it.y=r1(it.y);it.w=r1(it.w);it.h=r1(it.h);delete it.x1;delete it.y1;delete it.x2;delete it.y2}
      if(it.t==="rect"||it.t==="ell"||it.t==="frame"){delete it.x1}
      if(it.t==="frame"){it.text="Frame";it.fill=false}
      WB.items.push(it);
      if(it.t!=="pen"){WB.sel=it.id;WB.tool="select";wbToolbar()}
      wbTouch();
      if(it.t==="frame"){wbPaint();wbEditStart(it.id);return}
    }
    wbPaint();return;
  }
  if((d.k==="move"||d.k==="resize")&&d.snap)wbTouch();
  wbPaint();
}
function wbDbl(e){
  if(WB.tool!=="select")return;
  var p=wbPt(e);
  for(var i=WB.items.length-1;i>=0;i--){
    var it=WB.items[i];
    if(!wbEditable(it))continue;
    var b=wbBox(it);
    if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){WB.sel=it.id;wbPaint();wbEditStart(it.id);return}
  }
}

