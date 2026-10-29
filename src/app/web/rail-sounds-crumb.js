/* ---------- website only: audience numbers, creator page, account ---------- */
ICONS.globe='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>';
ICONS.team='<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.6.2 4.5 2.3 4.5 4.8"/>';
ICONS.trend='<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>';
(function(){
  var i=VIEWS.map(function(v){return v.id}).indexOf("viz");
  VIEWS.splice(i+1,0,{id:"aud",name:"Audience",ic:"trend",c:"var(--c-viz)",desc:"Real numbers from your channels and pages."});
  var ci=VIEWS.map(function(v){return v.id}).indexOf("clips");
  VIEWS.splice(ci+1,0,{id:"bank",name:"Caption bank",ic:"text",c:"var(--c-ideas)",desc:"Captions, hashtag sets and hooks you reuse. Tap one to copy it."});
  var bi=VIEWS.map(function(v){return v.id}).indexOf("biz");
  VIEWS.splice(bi+1,0,{id:"team",name:"Team",ic:"team",c:"var(--c-board)",desc:"The people who work with you: their work, progress and pay."});
  VIEWS.push({id:"imp",g:"You",name:"Import",ic:"upload",c:"var(--c-home)",desc:"Bring your data in from other apps."});
  VIEWS.push({id:"cp",name:"Profile & settings",ic:"globe",c:"var(--c-home)",desc:"Your public page, handles, alerts and account."});
  if(window.__WS)VIEWS=VIEWS.filter(function(v){return v.id!=="aud"&&v.id!=="cp"&&v.id!=="team"});
})();

/* ---------- sidebar rail, sounds, breadcrumb (website only) ---------- */
var SND={ctx:null,last:0};
function sndOn(){try{return localStorage.getItem("cs-sound")!=="off"}catch(e){return true}}
function sndSet(on){try{localStorage.setItem("cs-sound",on?"on":"off")}catch(e){}}
function sndCtx(){
  if(!SND.ctx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{SND.ctx=new C()}catch(e){return null}}
  if(SND.ctx.state==="suspended")SND.ctx.resume();return SND.ctx;
}
function sndNote(c,out,f0,f1,t,dur,vol){
  var o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+0.02);
}
function sound(kind){
  if(!sndOn()||document.visibilityState==="hidden")return;
  var c=sndCtx();if(!c)return;
  var now=c.currentTime;if(kind==="tick"&&now-SND.last<0.06)return;SND.last=now;
  var lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;
  var m=c.createGain();m.gain.value=0.9;lp.connect(m);m.connect(c.destination);
  if(kind==="collapse"){sndNote(c,lp,640,430,now,0.16,0.09);sndNote(c,lp,430,290,now+0.07,0.22,0.07)}
  else if(kind==="expand"){sndNote(c,lp,290,430,now,0.16,0.07);sndNote(c,lp,430,660,now+0.07,0.22,0.09)}
  else if(kind==="on"){sndNote(c,lp,520,780,now,0.14,0.08)}
  else{sndNote(c,lp,1500,900,now,0.045,0.035)}
}
function railGet(){try{return localStorage.getItem("cs-rail")==="1"}catch(e){return false}}
function railSet(on,quiet){
  var a=document.querySelector(".app");if(!a)return;
  a.classList.toggle("rail",on);
  try{localStorage.setItem("cs-rail",on?"1":"0")}catch(e){}
  var b=$("railbtn");if(b){b.setAttribute("aria-expanded",String(!on));b.setAttribute("aria-label",on?"Expand sidebar":"Collapse sidebar")}
  var lg=$("logo");if(lg&&!quiet){lg.classList.remove("pop");void lg.offsetWidth;lg.classList.add("pop")}
  if(!quiet)sound(on?"collapse":"expand");
}
function wsBar(){
  if(!window.__WS)return;
  var d=$("wsbar")||document.createElement("div"),fresh=!d.parentNode;d.id="wsbar";d.className="wsbar";
  var W0=window.__WS,sn=W0.space&&S.spaces[0]?S.spaces[0].name:"",who=W0.self?"Working in <b>"+esc(sn||W0.label||"a private space")+"</b>":"Viewing <b>"+esc(sn?sn+" · "+String(W0.label||"").split(" · ")[0]:(W0.label||"a shared workspace"))+"</b> as "+(W0.role==="editor"?"editor":"viewer");
  d.innerHTML='<span>'+who+'</span><button data-act="sh_home">'+(W0.self?"Back to my workspace":"Back to mine")+'</button>';
  if(fresh)document.body.appendChild(d);
}
function webCrumb(){wsBar();var sb=document.getElementById("sharebtn");if(sb){sb.title="Share your public page";sb.setAttribute("aria-label","Share your public page")}
  var v=vmeta(S.view),el=$("crumb");if(!v)return;
  var g="";for(var i=0;i<VIEWS.length;i++){if(VIEWS[i].g)g=VIEWS[i].g;if(VIEWS[i].id===v.id)break}
  if(!el){var tb=document.querySelector(".top");if(!tb)return;el=document.createElement("div");el.id="crumb";el.className="crumb";var mb=tb.querySelector(".mbrand");tb.insertBefore(el,mb?mb.nextSibling:tb.firstChild)}
  placeChrome();
  el.innerHTML=(g?'<span>'+esc(g)+'</span><i>/</i>':'')+'<b>'+esc(v.name)+'</b>';
  document.querySelectorAll("#nav .si-row,#spaces .si-row").forEach(function(r){var n=r.querySelector(".nm");if(n)r.setAttribute("title",n.textContent)});
}
document.addEventListener("keydown",function(e){
  if(e.key!=="["||e.metaKey||e.ctrlKey||e.altKey)return;
  var t=e.target,tag=t&&t.tagName;if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||(t&&t.isContentEditable))return;
  railSet(!document.querySelector(".app").classList.contains("rail"));
});
railSet(railGet(),true);

var WSB=window.__SB;
var PLATS=[["youtube","YouTube","#DC2626"],["instagram","Instagram","#C026D3"],["tiktok","TikTok","#0F766E"],["x","X","#374151"],["facebook","Facebook","#2563EB"]];
var W={conns:[],snaps:{},vids:{},loaded:false,loading:false,err:"",cfg:true,plat:"youtube",kind:"own",busy:false,msg:"",manual:null,timer:null,tick:0,lastRefresh:0,
  p:null,pLoaded:false,pErr:"",pSaving:false,pMsg:"",pLoadedAt:0};

function platName(id){var p=PLATS.filter(function(x){return x[0]===id})[0];return p?p[1]:id}
function audCol(id){var p=PLATS.filter(function(x){return x[0]===id})[0];return p?p[2]:"#6B7280"}
function nf(n){if(n==null)return "Hidden";n=Number(n);if(!isFinite(n))return "-";return new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:n<10000?1:0}).format(n)}
function nfull(n){return n==null?"":Number(n).toLocaleString("en-IN")}
function sinceStr(ts){if(!ts)return "never";var s=(Date.now()-new Date(ts).getTime())/1000;if(s<60)return "just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" h ago";return Math.floor(s/86400)+" d ago"}
function numOrNull(v){v=String(v==null?"":v).replace(/[,\s]/g,"");if(v==="")return null;var n=Number(v);return isFinite(n)&&n>=0?Math.round(n):NaN}

/* delta between the newest snapshot and the oldest one inside a time window */
function deltaOf(arr,field,ms){
  if(!arr||arr.length<2)return null;
  var last=arr[arr.length-1],lv=last[field];if(lv==null)return null;
  var cut=new Date(last.ts).getTime()-ms,base=null;
  for(var i=0;i<arr.length-1;i++){if(new Date(arr[i].ts).getTime()>=cut){base=arr[i];break}}
  if(!base||base[field]==null)return null;
  if(new Date(last.ts).getTime()-new Date(base.ts).getTime()<20*60*1000)return null;
  return lv-base[field];
}
function deltaHTML(d,label){
  if(d==null)return '<em class="dl">Tracking started</em>';
  if(d===0)return '<em class="dl">No change '+label+'</em>';
  return '<em class="dl '+(d>0?"up":"down")+'">'+(d>0?"+":"-")+nf(Math.abs(d))+' '+label+'</em>';
}

