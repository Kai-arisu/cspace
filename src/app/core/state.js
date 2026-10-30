
(function(){
"use strict";
var LS="creator-space-v1";
var STAGES=[{id:"i",name:"Idea"},{id:"m",name:"Making"},{id:"r",name:"Review"},{id:"s",name:"Shipped"}];
var VIEWS=[
  {id:"home",name:"Today",ic:"home",c:"var(--c-home)",desc:"What needs you today, across this space."},
  {id:"notes",g:"Create",name:"Notes",ic:"notes",c:"var(--c-notes)",desc:"Write scripts, outlines and loose thoughts."},
  {id:"ideas",name:"Ideas",ic:"bulb",c:"var(--c-ideas)",desc:"Catch ideas before they disappear."},
  {id:"mood",name:"Moodboard",ic:"image",c:"var(--c-mood)",desc:"Collect the look and feel of a project."},
  {id:"wb",name:"Whiteboard",ic:"board2",c:"var(--c-wb)",desc:"Sketch, map out ideas and plan visually."},
  {id:"clips",name:"Clips",ic:"link",c:"var(--c-mood)",desc:"Save links and references."},
  {id:"cal",g:"Plan",name:"Calendar",ic:"calendar",c:"var(--c-ideas)",desc:"Tasks and posts, by day."},
  {id:"board",name:"Progress",ic:"board",c:"var(--c-board)",desc:"Move work from idea to shipped."},
  {id:"viz",g:"Grow",name:"Visualizer",ic:"chart",c:"var(--c-viz)",desc:"See how the work is going, built from what is already in this space."},
  {id:"biz",g:"Run",name:"Business",ic:"wallet",c:"var(--c-notes)",desc:"Sponsors, income, invoices and media kit."}
];
var SOON=[];
var SPCOL=["#1B6E66","#B8336A","#A86B12","#0A66C2","#4B4B48","#2E7D32"];
var STCOL={i:"var(--st-i)",m:"var(--st-m)",r:"var(--st-r)",s:"var(--st-s)"};
var ICONS={
  home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  notes:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  board:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  board2:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20l4-4 4 4"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  left:'<path d="M15 6l-6 6 6 6"/>',
  right:'<path d="M9 6l6 6-6 6"/>',
  pin:'<path d="M12 17v5M8 3h8l-1 6 3 3H6l3-3z"/>',
  logo:'<path d="M17.2 8.4a6 6 0 1 0 0 7.2"/>',
  cursor:'<path d="M5 3l14 8-6 2-2 6z"/>',
  pen:'<path d="M4 20l4-1L19 8l-3-3L5 16z"/>',
  square:'<rect x="4" y="5" width="16" height="14" rx="2"/>',
  circle:'<circle cx="12" cy="12" r="8"/>',
  arrow:'<path d="M5 19L19 5M10 5h9v9"/>',
  sticky:'<path d="M5 4h14v10l-5 6H5z"/><path d="M14 20v-6h5"/>',
  text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  minus:'<path d="M5 12h14"/>',
  chev:'<path d="M7 6l5 5 5-5M7 13l5 5 5-5"/>',
  shapes:'<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><circle cx="17" cy="7" r="3.5"/><path d="M7 14l3.5 6.5h-7zM14 14h7M17.5 14l3.5 3.5-3.5 3.5"/>',
  frame:'<path d="M8 3v18M16 3v18M3 8h18M3 16h18"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 .3c0 1.7-2.5 2-2.5 3.7M12 17h.01"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  play:'<path d="M7 4l13 8-13 8z"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 3h6"/>',
  cmd:'<path d="M5 12l5-5M5 12l5 5M12 19h7"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  check:'<path d="M5 12l4 4 10-10"/>',
  chevd:'<path d="M6 9l6 6 6-6"/>',
  chevu:'<path d="M6 15l6-6 6 6"/>',
  send:'<path d="M4 12l16-8-6 16-3-7z"/>',
  wallet:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5M16 5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.5 2.2 3.5 5"/>',
  pill:'<rect x="2.5" y="8" width="19" height="8" rx="4"/><circle cx="7" cy="12" r="1.6"/>',
  crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/>',
  film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
  eraser:'<path d="M4 15l8-9 8 8-5 5H8zM9 20h11"/>'
};
function I(n){return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+ICONS[n]+'</svg>'}

var S=null, db=null, ref=null, assets=null, saving=false, dirty=false, timer=null, lastJson="";
var selNote=null, noteOpen=false, noteMode="write", ideaFilter="all", moodForm=null, addingSpace=false, readOnly=false;

function uid(){return Math.random().toString(36).slice(2,10)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function $(id){return document.getElementById(id)}
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function fmtDue(s){try{return new Date(s+"T00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}catch(e){return s}}
function ago(ts){var s=(Date.now()-ts)/1000;if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+"m ago";if(s<86400)return Math.floor(s/3600)+"h ago";return Math.floor(s/86400)+"d ago"}
function words(t){var m=String(t).trim().match(/\S+/g);return m?m.length:0}
function fmtSize(b){return b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB"}
function vmeta(id){return VIEWS.filter(function(v){return v.id===id})[0]}

function defaults(){
  var sp="s"+uid(), now=Date.now(), d=function(n){return ymd(new Date(now+n*864e5))};
  return {cur:sp,view:"home",
    spaces:[{id:sp,name:"My channel"}],
    notes:[],ideas:[],tasks:[],mood:[],
    files:[],
    palette:(function(){var o={};o[sp]=["#111111","#8A8A8A","#F2F2F2"];return o})()
  };
}
function sanitize(){
  var arr=["notes","ideas","tasks","mood","files","posts","clips","deals","income","invoices","units","launches"];
  if(!Array.isArray(S.spaces))S.spaces=[];
  S.spaces=S.spaces.filter(function(x){return x&&typeof x==="object"});
  var sid={};S.spaces.forEach(function(x){if(typeof x.id!=="string"||!x.id||sid[x.id])x.id="s"+uid();sid[x.id]=1;if(typeof x.name!=="string"||!x.name)x.name="Untitled"});
  var first=S.spaces.length?S.spaces[0].id:null;
  arr.forEach(function(k){
    if(!Array.isArray(S[k])){S[k]=[];return}
    var seen={};
    S[k]=S[k].filter(function(x){return x&&typeof x==="object"&&!Array.isArray(x)});
    S[k].forEach(function(x){
      if(typeof x.id!=="string"||!x.id||seen[x.id])x.id=uid();seen[x.id]=1;
      if(first&&!sid[x.sp])x.sp=first;
      if(k==="notes"){if(typeof x.title!=="string")x.title="";if(typeof x.body!=="string")x.body=""}
      if(k==="tasks"){if(typeof x.title!=="string")x.title="";if(typeof x.col!=="string")x.col="i"}
      if(k==="ideas"){if(typeof x.text!=="string")x.text="";if(!Array.isArray(x.tags))x.tags=[]}
    });
  });
}
function fix(){
  var d=defaults();
  if(!S||typeof S!=="object"||Array.isArray(S))S=d;
  sanitize();
  ["spaces","notes","ideas","tasks","mood","files","posts","clips","deals","income","invoices","units","launches"].forEach(function(k){if(!Array.isArray(S[k]))S[k]=[]});
  if(!S.cfg||typeof S.cfg!=="object")S.cfg={};if(!S.kit||typeof S.kit!=="object")S.kit={};
  if(!S.palette||typeof S.palette!=="object")S.palette={};
  if(!S.focus||typeof S.focus!=="object")S.focus={};
  if(!Array.isArray(S.iso))S.iso=[];if(!S.nread||typeof S.nread!=="object")S.nread={};if(!Array.isArray(S.bank))S.bank=[];if(!Array.isArray(S.imports))S.imports=[];
  if(!S.bmeta||typeof S.bmeta!=="object")S.bmeta={};
  if(!S.spaces.length)S.spaces=d.spaces;
  if(!S.profile||typeof S.profile!=="object")S.profile={};
  if(!S.edit||typeof S.edit!=="object")S.edit={};
  if(S.profile.name===undefined)S.profile.name=(function(){var e=String(window.__EMAIL||"").split("@")[0].replace(/[._-]+/g," ").replace(/\d+$/,"").trim();return e?e.replace(/\b\w/g,function(c){return c.toUpperCase()}):""})();if(S.profile.role===undefined)S.profile.role="Creator";if(S.profile.avatar===undefined)S.profile.avatar="";
  if(!S.spaces.some(function(x){return x.id===S.cur}))S.cur=S.spaces[0].id;
  if(S.view==="library")S.view="clips";if(!vmeta(S.view))S.view="home";
}

