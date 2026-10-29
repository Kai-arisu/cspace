/* ---------- moodboard v2 ---------- */
var moodSec=null, moodEdit=false;
var SECS=[
  {id:"logo",name:"Logo & mockups",hint:"Marks, packaging and product shots",add:[["image","Image"]]},
  {id:"palette",name:"Colour palette",hint:"Click a swatch to copy its hex",add:[["color","Colour"]]},
  {id:"images",name:"Image style",hint:"Photos that set the mood",add:[["image","Image"]]},
  {id:"texture",name:"Patterns & textures",hint:"Surfaces, fabrics, materials",add:[["pattern","Pattern"],["image","Image"]]},
  {id:"type",name:"Typography",hint:"Font pairing",add:[]},
  {id:"words",name:"Quotes & notes",hint:"Voice, rules, references",add:[["quote","Quote"],["note","Note"]]},
  {id:"elements",name:"Design elements",hint:"Icons and symbols",add:[["icon","Icon"]]},
  {id:"links",name:"References",hint:"Links to inspiration",add:[["link","Link"]]}
];
var DEFSEC={color:"palette",image:"images",pattern:"texture",quote:"words",note:"words",icon:"elements",link:"links"};
function secOf(m){return m.sec||DEFSEC[m.kind]||"images"}
var MFONTS=[
  ["Instrument Serif","Instrument+Serif","serif",400],["Instrument Sans","Instrument+Sans:wght@400;700","sans-serif",600],
  ["Playfair Display","Playfair+Display:wght@400;700","serif",700],["EB Garamond","EB+Garamond:wght@400;700","serif",700],
  ["Cormorant Garamond","Cormorant+Garamond:wght@400;700","serif",700],["DM Serif Display","DM+Serif+Display","serif",400],
  ["Fraunces","Fraunces:wght@400;700","serif",700],["Libre Baskerville","Libre+Baskerville:wght@400;700","serif",700],
  ["Abril Fatface","Abril+Fatface","serif",400],["Lora","Lora:wght@400;700","serif",700],
  ["Space Grotesk","Space+Grotesk:wght@400;700","sans-serif",700],["Bricolage Grotesque","Bricolage+Grotesque:wght@400;700","sans-serif",700],
  ["Syne","Syne:wght@400;700","sans-serif",700],["Poppins","Poppins:wght@400;700","sans-serif",700],
  ["Montserrat","Montserrat:wght@400;700","sans-serif",700],["Oswald","Oswald:wght@400;700","sans-serif",700],
  ["Bebas Neue","Bebas+Neue","sans-serif",400],["Inter","Inter:wght@400;700","sans-serif",700],
  ["DM Sans","DM+Sans:wght@400;700","sans-serif",700],["Work Sans","Work+Sans:wght@400;700","sans-serif",700],
  ["Source Sans 3","Source+Sans+3:wght@400;700","sans-serif",700],["IBM Plex Sans","IBM+Plex+Sans:wght@400;700","sans-serif",700],
  ["Nunito","Nunito:wght@400;700","sans-serif",700]
];
var loadedFonts={};
function fontInfo(n){return MFONTS.filter(function(f){return f[0]===n})[0]}
function loadFont(n){
  var f=fontInfo(n);if(!f||loadedFonts[n])return;loadedFonts[n]=1;
  var l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family="+f[1]+"&display=swap";document.head.appendChild(l);
}
function fam(n){var f=fontInfo(n);return "'"+n+"',"+(f?f[2]:"sans-serif")}
function hx(v){return /^#[0-9a-fA-F]{3,8}$/.test(String(v))?String(v):"#888888"}
function lum(c){c=hx(c).slice(1);if(c.length<6)c=c.replace(/./g,"$&$&");var r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);return (0.299*r+0.587*g+0.114*b)/255}
function toHex(e){return "#"+[e.r,e.g,e.b].map(function(v){return Math.round(v).toString(16).padStart(2,"0")}).join("").toUpperCase()}
function bm(){
  if(!S.bmeta||typeof S.bmeta!=="object")S.bmeta={};
  var m=S.bmeta[S.cur];
  if(!m||typeof m!=="object"){m=S.bmeta[S.cur]={kicker:"Brand board",title:"",tagline:"",about:"",keywords:[],head:"Inter",body:"Inter",layout:"canvas"}}
  if(!Array.isArray(m.keywords))m.keywords=[];
  if(!fontInfo(m.head))m.head="Inter";if(!fontInfo(m.body))m.body="Inter";
  if(m.layout!=="collage"&&m.layout!=="canvas")m.layout="poster";
  return m;
}
/* the text colour (white or near-black) with the higher contrast on a swatch */
function inkOn(c){c=hx(c).slice(1);if(c.length<6)c=c.replace(/./g,"$&$&");var L=[0,2,4].map(function(i){var v=parseInt(c.slice(i,i+2),16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}),l=.2126*L[0]+.7152*L[1]+.0722*L[2];
  return (1.05/(l+.05))>=((l+.05)/.05)?"#fff":"#000"}
function palColors(){return mine("mood").filter(function(m){return m.kind==="color"}).map(function(m){return hx(m.value)})}
var PATS=[["stripes","Stripes"],["dots","Dots"],["grid","Grid"],["checker","Checker"],["rings","Rings"],["lines","Lines"],["mesh","Soft mesh"]];
function patCSS(m){
  /* textures are drawn as small SVG tiles, so they stay crisp and print the same in the download */
  var a=hx(m.c1),b=hx(m.c2),c=hx(m.c3||"#ffffff"),p=m.value,w=20,h=20,body;
  if(p==="dots"){w=h=16;body='<rect width="16" height="16" fill="'+b+'"/><circle cx="8" cy="8" r="2.5" fill="'+a+'"/>'}
  else if(p==="grid"){w=h=18;body='<rect width="18" height="18" fill="'+b+'"/><path d="M0 .5H18M.5 0V18" stroke="'+a+'"/>'}
  else if(p==="checker"){w=h=30;body='<rect width="30" height="30" fill="'+b+'"/><path d="M0 0h15v15H0zM15 15h15v15H15z" fill="'+a+'"/>'}
  else if(p==="rings"){w=h=30;body='<rect width="30" height="30" fill="'+b+'"/><circle cx="15" cy="15" r="9" fill="none" stroke="'+a+'" stroke-width="5"/>'}
  else if(p==="lines"){w=h=12;body='<rect width="12" height="12" fill="'+b+'"/><rect width="12" height="2" fill="'+a+'"/>'}
  else if(p==="mesh"){w=h=200;body='<defs><filter id="f"><feGaussianBlur stdDeviation="34"/></filter></defs><rect width="200" height="200" fill="'+c+'"/><g filter="url(#f)"><circle cx="40" cy="45" r="70" fill="'+a+'"/><circle cx="165" cy="150" r="70" fill="'+b+'"/></g>'}
  else{body='<rect width="20" height="20" fill="'+b+'"/><path d="M-5 5L5-5M0 20L20 0M15 25L25 15" stroke="'+a+'" stroke-width="7.07"/>'}
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>';
  return "url(&quot;data:image/svg+xml,"+encodeURIComponent(svg).replace(/'/g,"%27")+"&quot;) 0 0/"+(p==="mesh"?"cover":w+"px "+h+"px")+" "+b;
}
var MICONS=["star","bulb","pen","notes","image","video","chart","code","folder","pin","timer","flag","sticky","circle","square","text","sun","moon","home","board","search","arrow"];
function rot(id){var h=0;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;return ((h%7)-3)*.9}

function mCtl(m){
  if(readOnly)return "";
  return '<div class="mb-ctl"><button class="ico" data-act="mmove" data-id="'+m.id+'" data-d="-1" aria-label="Move earlier">'+I("left")+'</button><button class="ico" data-act="mmove" data-id="'+m.id+'" data-d="1" aria-label="Move later">'+I("right")+'</button>'+
    (m.kind==="image"?'<button class="ico" data-act="mextract" data-id="'+m.id+'" title="Pull colours from this image" aria-label="Pull colours from this image">'+I("circle")+'</button>':"")+
    '<button class="ico danger" data-act="delmood" data-id="'+m.id+'" aria-label="Remove">'+I("x")+'</button></div>';
}
function mItem(m){
  var k=m.kind,b="";
  if(k==="color"){var c=hx(m.value),dk=lum(c)<.55;b='<button class="mb-sw" data-act="copycolor" data-id="'+c+'" aria-label="Copy '+c.toUpperCase()+'"><span class="pc" style="background:'+c+'"></span><span class="mt"><span class="nm">'+esc(m.label||"Untitled")+'</span><span class="hex">'+c.toUpperCase()+'</span></span></button>'}
  else if(k==="image")b='<div class="mb-img"><img src="/_blob/'+esc(m.assetId)+'" alt="'+esc(m.label||"Board image")+'" loading="lazy"></div>'+(m.label?'<figcaption>'+esc(m.label)+'</figcaption>':"");
  else if(k==="pattern")b='<div class="mb-pat" style="background:'+patCSS(m)+'"></div>'+(m.label?'<figcaption>'+esc(m.label)+'</figcaption>':"");
  else if(k==="quote")b='<blockquote class="mb-quote"><span class="qm" aria-hidden="true">“</span><p>'+esc(m.value)+'</p>'+(m.label?'<cite>'+esc(m.label)+'</cite>':"")+'</blockquote>';
  else if(k==="note")b='<div class="mb-note">'+esc(m.value)+'</div>';
  else if(k==="icon")b='<div class="mb-ico"><span>'+I(ICONS[m.value]?m.value:"star")+'</span>'+(m.label?'<small>'+esc(m.label)+'</small>':"")+'</div>';
  else if(k==="link"){var dom="";try{dom=new URL(m.value).hostname}catch(e){}b='<a class="mb-link" href="'+esc(m.value)+'" target="_blank" rel="noopener noreferrer"><b>'+esc(m.label||dom||m.value)+'</b><small>'+esc(dom)+'</small></a>'}
  return '<figure class="mb-it k-'+k+'" style="--r:'+rot(m.id)+'deg">'+b+mCtl(m)+'</figure>';
}
function mForm(sec){
  var f='<div class="form mb-form">';
  if(moodForm==="color")f+='<label class="fix">Colour<input type="color" id="mcolor" value="#3F5370"></label><label>Name<input class="in" id="mlabel" placeholder="Midnight" maxlength="40"></label>';
  if(moodForm==="note")f+='<label>Note<textarea class="in" id="mtext" placeholder="Tone, rules, things to remember" maxlength="400"></textarea></label>';
  if(moodForm==="quote")f+='<label>Quote<textarea class="in" id="mtext" placeholder="The words that sum up the feel" maxlength="240"></textarea></label><label>Who said it<input class="in" id="mlabel" placeholder="Title (optional)" maxlength="60"></label>';
  if(moodForm==="link")f+='<label>Link<input class="in" id="murl" placeholder="https://" maxlength="300"></label><label>Label<input class="in" id="mlabel" placeholder="Reference video" maxlength="60"></label>';
  if(moodForm==="pattern")f+='<label>Pattern<select class="in" id="mpat">'+PATS.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join("")+'</select></label><label>Name<input class="in" id="mlabel" placeholder="Optional" maxlength="40"></label><p class="note-hint" style="margin:0;flex-basis:100%">Uses the first colours of your palette.</p>';
  if(moodForm==="icon")f+='<label>Icon<select class="in" id="mico">'+MICONS.map(function(n){return '<option value="'+n+'">'+n+'</option>'}).join("")+'</select></label><label>Label<input class="in" id="mlabel" placeholder="Wisdom" maxlength="30"></label>';
  if(moodForm==="image")f+=assets?'<label>Image<input class="in" type="file" id="mfile" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"></label><label>Caption<input class="in" id="mlabel" placeholder="Optional" maxlength="60"></label>':'<p class="note-hint" style="margin:0">Image uploads are available to people who can edit this page.</p>';
  f+='<button class="btn pri" data-act="msave"'+(moodForm==="image"&&!assets?" disabled":"")+'>Add</button><button class="btn" data-act="mcancel">Cancel</button></div>';
  return f;
}
function mTypeHTML(m){
  var hw=fontInfo(m.head)[3],bw=fontInfo(m.body)[3]>400?400:400;
  var opts=function(sel){return MFONTS.map(function(f){return '<option'+(f[0]===sel?" selected":"")+'>'+f[0]+'</option>'}).join("")};
  var h='<div class="mb-type"><div class="mb-tc"><div class="aa" style="font-family:'+fam(m.head)+';font-weight:'+hw+'">Aa</div><b>'+esc(m.head)+'</b><small>Headings</small></div>'+
    '<div class="mb-tc"><div class="aa" style="font-family:'+fam(m.body)+';font-weight:400">Aa</div><b>'+esc(m.body)+'</b><small>Body text</small></div>'+
    '<div class="mb-ts"><div class="h" style="font-family:'+fam(m.head)+';font-weight:'+hw+'">Make it feel considered</div><p style="font-family:'+fam(m.body)+'">Pair one expressive heading font with a calm, readable body font. Test it here before it goes into your videos, thumbnails and posts.</p></div></div>';
  if(!readOnly)h+='<div class="form mb-form" style="margin-top:12px"><label>Heading font<select class="in" data-bf="head">'+opts(m.head)+'</select></label><label>Body font<select class="in" data-bf="body">'+opts(m.body)+'</select></label></div>';
  return h;
}
function vMood(){
  var m=bm(),items=mine("mood"),poster=m.layout==="poster",canvas=m.layout==="canvas";
  loadFont(m.head);loadFont(m.body);
  var acts='<div class="hd-seg" role="group" aria-label="Board layout"><button data-act="mlayout" data-id="poster" aria-pressed="'+poster+'">Poster</button><button data-act="mlayout" data-id="collage" aria-pressed="'+(!poster&&!canvas)+'">Collage</button><button data-act="mlayout" data-id="canvas" aria-pressed="'+canvas+'">Canvas</button></div>'+
    (readOnly?"":'<button class="btn" data-act="medit">'+(moodEdit?"Done":"Edit details")+'</button>')+'<button class="btn" data-act="mcopy">Copy as text</button><button class="btn pri" data-act="mexport">'+I("download")+'Download image</button>'+cbtn(".mb");
  var h=hero("mood","Moodboard","The look and feel of "+spaceName()+", in one place.",acts);
  var title=m.title||spaceName(),cols=items.filter(function(x){return x.kind==="color"});
  if(canvas)return h+mCanvasHTML(m,items);
  h+='<div class="mb mb2 l-'+(poster?"poster":"collage")+'" style="--fh:'+fam(m.head)+';--fb:'+fam(m.body)+';--fhw:'+fontInfo(m.head)[3]+'">';
  /* cover: the name in its own heading font, beside its own colours */
  h+='<header class="mb-head"><div class="mb-ct"><div class="mb-kick">'+esc(m.kicker||"Brand board")+'</div><div class="mb-title">'+esc(title)+'</div>'+(m.tagline?'<div class="mb-tag">'+esc(m.tagline)+'</div>':"")+(m.about?'<p class="mb-about">'+esc(m.about)+'</p>':"");
  h+='<div class="mb-kw">'+m.keywords.map(function(k,i){return '<span class="mb-chip">'+esc(k)+(readOnly?"":'<button data-act="mkwdel" data-i="'+i+'" aria-label="Remove '+esc(k)+'">×</button>')+'</span>'}).join("")+(readOnly?"":'<input id="mkw" class="mb-kwin" placeholder="Add a keyword…" maxlength="24" aria-label="Add keyword" autocomplete="off">')+'</div></div>';
  h+='<div class="mb-band'+(cols.length?"":" none")+'">'+(cols.length?cols.slice(0,6).map(function(c){var v=hx(c.value);return '<button class="mb-bs" data-act="copycolor" data-id="'+v+'" style="background:'+v+';color:'+inkOn(v)+'" aria-label="Copy '+v.toUpperCase()+'"><span>'+esc(c.label||"")+'</span><b>'+v.toUpperCase()+'</b></button>'}).join(""):
    '<span>No colours yet</span>'+(readOnly?"":'<button class="btn sm" data-act="mform" data-id="color" data-sec="palette">Add a colour</button>'))+'</div></header>';
  if(moodEdit&&!readOnly){
    h+='<div class="form mb-form"><label>Small heading<input class="in" data-bm="kicker" value="'+esc(m.kicker)+'" maxlength="40"></label><label>Title<input class="in" data-bm="title" value="'+esc(m.title)+'" placeholder="'+esc(spaceName())+'" maxlength="60"></label><label>Tagline<input class="in" data-bm="tagline" value="'+esc(m.tagline)+'" maxlength="80" placeholder="wisdom · depth · clarity"></label><label style="flex-basis:100%">About<textarea class="in" data-bm="about" maxlength="300" rows="2" placeholder="What the brand stands for, in a sentence or two">'+esc(m.about)+'</textarea></label></div>';
  }
  if(!items.length&&!readOnly)h+='<div class="mb-empty"><div><b>Start with a ready-made set</b><span>Adds a palette, a quote, patterns and icons you can change, so you can see how the board works.</span></div><button class="btn pri" data-act="mstarter">Add starter set</button></div>';
  if(poster){
    var rest=[];
    SECS.forEach(function(s){
      var its=items.filter(function(x){return secOf(x)===s.id});
      var adds=readOnly?"":s.add.map(function(a){return '<button class="btn sm" data-act="mform" data-id="'+a[0]+'" data-sec="'+s.id+'">'+I("plus")+a[1]+'</button>'}).join("");
      var open=moodForm&&moodSec===s.id;
      if(!its.length&&s.id!=="type"&&!open){rest.push({s:s,adds:adds});return}
      h+='<section class="mb-sec s-'+s.id+'"><div class="mb-lbl"><h3>'+s.name+(its.length?' <span class="cnt">'+its.length+'</span>':"")+'</h3><p>'+s.hint+'</p>'+(adds?'<div class="mb-add">'+adds+'</div>':"")+'</div><div class="mb-body">';
      if(open)h+=mForm(s.id);
      if(s.id==="type")h+=mTypeHTML(m);
      else if(its.length)h+='<div class="mb-wrap">'+its.map(mItem).join("")+'</div>';
      h+='</div></section>';
    });
    if(rest.length)h+='<section class="mb-rest"><h3>'+(readOnly?"Not filled in yet":"Still to fill")+'</h3><div class="mb-rl">'+rest.map(function(r){return '<div class="mb-rr"><span><b>'+r.s.name+'</b><i>'+r.s.hint+'</i></span><span class="mb-add">'+r.adds+'</span></div>'}).join("")+'</div></section>';
  }else{
    if(moodForm)h+=mForm();
    var adds2=readOnly?"":'<div class="mb-addrow">'+[["color","Colour"],["image","Image"],["quote","Quote"],["note","Note"],["pattern","Pattern"],["icon","Icon"],["link","Link"]].map(function(a){return '<button class="btn sm" data-act="mform" data-id="'+a[0]+'" data-sec="">'+I("plus")+a[1]+'</button>'}).join("")+'</div>';
    h+=adds2+'<div class="mb-collage">'+'<div class="mb-it k-type" style="--r:0deg">'+mTypeHTML(m).split('<div class="form')[0]+'</div>'+items.map(mItem).join("")+'</div>';
  }
  h+='</div>';
  return h;
}
/* ---- free-form canvas: everything on one open board, placed by hand ---- */
var MCV_W=1200,mcvSel=null;
function mcvPlace(items){
  var placed=items.filter(function(x){return x.cx!=null}),n=0;
  items.forEach(function(x){if(x.cx!=null)return;var c=n%5,r=Math.floor(n/5);n++;
    x.cx=40+c*228+(r%2?30:0);x.cy=50+r*260+((c*37)%50);x.cw=x.kind==="quote"||x.kind==="note"?260:(x.kind==="color"?170:(x.kind==="icon"?120:210));x.cr=+(rot(x.id)).toFixed(1);x.cz=placed.length+n});
}
function mCanvasHTML(m,items){
  mcvPlace(items);
  var hgt=Math.max(900,items.reduce(function(a,x){return Math.max(a,(x.cy||0)+(x.ch||320)+120)},0));
  var tools=readOnly?"":'<div class="mcv-tools" role="toolbar" aria-label="Add to canvas">'+[["image","Image"],["note","Text"],["quote","Quote"],["color","Colour"],["link","Link"],["pattern","Pattern"],["icon","Icon"]].map(function(a){return '<button class="btn sm" data-act="mform" data-id="'+a[0]+'">'+I("plus")+a[1]+'</button>'}).join("")+
    '<span class="mcv-tip">Drop or paste images and links anywhere on the board. Drag to move, pull the corner to resize, the dot to turn.</span></div>';
  var h=tools+(moodForm?mForm():"");
  h+='<div class="mcv" id="mcv" style="--fh:'+fam(m.head)+';--fb:'+fam(m.body)+'" tabindex="0" aria-label="Moodboard canvas"><div class="mcv-sz" id="mcvsz"></div><div class="mcv-in" id="mcvin" style="width:'+MCV_W+'px;height:'+hgt+'px">';
  items.slice().sort(function(a,b){return (a.cz||0)-(b.cz||0)}).forEach(function(x){
    h+='<div class="mcv-it'+(x.id===mcvSel?" sel":"")+'" data-mid="'+x.id+'" style="left:'+x.cx+'px;top:'+x.cy+'px;width:'+x.cw+'px;transform:rotate('+(x.cr||0)+'deg);z-index:'+(x.cz||1)+'">'+mItem(x)+
      (readOnly?"":'<span class="mcv-rs" aria-hidden="true"></span><span class="mcv-rot" aria-hidden="true"></span>')+'</div>';
  });
  if(!items.length)h+='<div class="mcv-empty"><b>An empty board</b><span>Drop images here, paste a link, or use the buttons above. Put things wherever you like.</span>'+(readOnly?"":'<button class="btn pri" data-act="mstarter">Start with a sample set</button>')+'</div>';
  return h+'</div></div>';
}
function mcvFit(){var c=$("mcv"),i=$("mcvin"),z=$("mcvsz");if(!c||!i)return;var k=Math.max(.55,Math.min(1,c.clientWidth/MCV_W));i.style.transform="scale("+k+")";
  z.style.width=(MCV_W*k)+"px";z.style.height=(i.offsetHeight*k)+"px";c.style.height=Math.min(i.offsetHeight*k,c.clientWidth<700?window.innerHeight*.68:1e5)+"px";c.dataset.k=k}
function mcvMount(){
  var c=$("mcv");if(!c)return;mcvFit();
  if(!window.__mcvRO){window.__mcvRO=1;window.addEventListener("resize",function(){mcvFit()})}
  if(readOnly)return;
  function k(){return +c.dataset.k||1}
  function pt(e){var r=$("mcvin").getBoundingClientRect();return {x:(e.clientX-r.left)/k(),y:(e.clientY-r.top)/k()}}
  c.addEventListener("pointerdown",function(e){
    var el=e.target.closest(".mcv-it");
    c.querySelectorAll(".mcv-it.sel").forEach(function(x){if(x!==el)x.classList.remove("sel")});
    if(!el){mcvSel=null;return}
    if(e.target.closest("button,a,input,select,textarea"))return;
    var it=S.mood.filter(function(x){return x.id===el.dataset.mid})[0];if(!it)return;
    mcvSel=it.id;el.classList.add("sel");
    var top=S.mood.reduce(function(a,x){return Math.max(a,x.cz||0)},0);if((it.cz||0)<top){it.cz=top+1;el.style.zIndex=it.cz}
    var mode=e.target.classList.contains("mcv-rs")?"rs":(e.target.classList.contains("mcv-rot")?"rot":"mv"),p0=pt(e),o={x:it.cx,y:it.cy,w:it.cw,r:it.cr||0};
    var cx=o.x+o.w/2,cy=o.y+el.offsetHeight/2,a0=Math.atan2(p0.y-cy,p0.x-cx);
    el.setPointerCapture(e.pointerId);e.preventDefault();el.classList.add("drag");
    function mv(ev){var p=pt(ev);
      if(mode==="mv"){it.cx=Math.round(Math.max(-o.w/2,Math.min(MCV_W-o.w/2,o.x+p.x-p0.x)));it.cy=Math.round(Math.max(0,o.y+p.y-p0.y));el.style.left=it.cx+"px";el.style.top=it.cy+"px"}
      else if(mode==="rs"){it.cw=Math.round(Math.max(120,Math.min(1200,o.w+(p.x-p0.x))));el.style.width=it.cw+"px"}
      else{var a=Math.atan2(p.y-cy,p.x-cx);it.cr=Math.round((o.r+(a-a0)*180/Math.PI)*2)/2;if(Math.abs(it.cr)<2)it.cr=0;el.style.transform="rotate("+it.cr+"deg)"}}
    function up(){el.removeEventListener("pointermove",mv);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);el.classList.remove("drag");it.ch=el.offsetHeight;touch();
      var i=$("mcvin"),need=Math.max(900,it.cy+el.offsetHeight+120);if(need>i.offsetHeight){i.style.height=need+"px";mcvFit()}}
    el.addEventListener("pointermove",mv);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
  });
  c.addEventListener("keydown",function(e){
    if(!mcvSel||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;var it=S.mood.filter(function(x){return x.id===mcvSel})[0];if(!it)return;
    var d=e.shiftKey?40:8,mvd=true;
    if(e.key==="ArrowLeft")it.cx-=d;else if(e.key==="ArrowRight")it.cx+=d;else if(e.key==="ArrowUp")it.cy=Math.max(0,it.cy-d);else if(e.key==="ArrowDown")it.cy+=d;
    else if(e.key==="Delete"||e.key==="Backspace"){S.mood=S.mood.filter(function(x){return x.id!==mcvSel});mcvSel=null;touch();render();return}else mvd=false;
    if(mvd){e.preventDefault();touch();var el=c.querySelector('[data-mid="'+it.id+'"]');if(el){el.style.left=it.cx+"px";el.style.top=it.cy+"px"}}
  });
  function addAt(item,p){item.id=uid();item.sp=S.cur;item.cx=Math.round(p.x);item.cy=Math.round(p.y);item.cw=item.cw||260;item.cr=0;item.cz=S.mood.reduce(function(a,x){return Math.max(a,x.cz||0)},0)+1;S.mood.push(item);mcvSel=item.id;touch();render()}
  function fromText(t,p){t=String(t||"").trim();if(!t)return;
    if(/^#?[0-9a-f]{6}$/i.test(t))return addAt({kind:"color",value:("#"+t.replace("#","")).toUpperCase(),label:"",cw:200},p);
    if(/^https?:\/\/\S+$/i.test(t))return addAt({kind:"link",value:t,label:""},p);
    addAt({kind:"note",value:t.slice(0,400),cw:300},p)}
  function upload(f,p){if(!assets)return toast("Image upload isn't available here");toast("Uploading…");
    assets.upload(f).then(function(r){S.files.push({id:uid(),sp:S.cur,name:f.name,assetId:r.id,type:r.contentType,size:r.sizeBytes});addAt({kind:"image",assetId:r.id,label:"",value:"",cw:300},p)}).catch(function(e){toast(upErr(e))})}
  c.addEventListener("dragover",function(e){e.preventDefault();c.classList.add("over")});
  c.addEventListener("dragleave",function(){c.classList.remove("over")});
  c.addEventListener("drop",function(e){e.preventDefault();c.classList.remove("over");var p=pt(e),fs=[].slice.call(e.dataTransfer.files||[]).filter(function(f){return /^image\//.test(f.type)});
    if(fs.length)fs.forEach(function(f,i){upload(f,{x:p.x+i*24,y:p.y+i*24})});else fromText(e.dataTransfer.getData("text/uri-list")||e.dataTransfer.getData("text/plain"),p)});
  if(!window.__mcvPaste){window.__mcvPaste=1;document.addEventListener("paste",function(e){
    var cv=$("mcv");if(!cv||readOnly||/INPUT|TEXTAREA/.test((e.target||{}).tagName||""))return;
    var r=cv.getBoundingClientRect(),k=+cv.dataset.k||1,p={x:Math.max(40,r.width/2/k-130),y:Math.max(40,(Math.max(0,-r.top)+160)/k)};
    var its=[].slice.call((e.clipboardData||{}).items||[]),img=its.filter(function(i){return /^image\//.test(i.type)})[0];
    if(img){e.preventDefault();var f=img.getAsFile();if(f)upload(f,p);return}
    var t=e.clipboardData&&e.clipboardData.getData("text/plain");if(t){e.preventDefault();fromText(t,p)}})}
}
function saveMood(){
  var item=null,lab=$("mlabel")?$("mlabel").value.trim():"",sec=moodSec||undefined;
  if(moodForm==="color")item={kind:"color",value:$("mcolor").value.toUpperCase(),label:lab};
  if(moodForm==="note"||moodForm==="quote"){var t=$("mtext").value.trim();if(!t)return toast("Write something first");item={kind:moodForm,value:t,label:moodForm==="quote"?lab:""}}
  if(moodForm==="pattern"){var pc=palColors();item={kind:"pattern",value:$("mpat").value,label:lab,c1:pc[0]||"#1E2A44",c2:pc[1]||"#E6E1D6",c3:pc[2]||"#6A7F99"}}
  if(moodForm==="icon")item={kind:"icon",value:$("mico").value,label:lab};
  if(moodForm==="link"){
    var u=$("murl").value.trim();if(u&&!/^https?:\/\//i.test(u))u="https://"+u;
    try{var p=new URL(u);if(!/^https?:$/.test(p.protocol))throw 0}catch(e){return toast("Enter a valid link")}
    item={kind:"link",value:u,label:lab};
  }
  if(moodForm==="image"){
    var fi=$("mfile");if(!fi||!fi.files[0])return toast("Choose an image first");
    var file=fi.files[0];toast("Uploading…");
    assets.upload(file).then(function(r){
      S.mood.push({id:uid(),sp:S.cur,kind:"image",sec:sec,assetId:r.id,label:lab,value:""});
      S.files.push({id:uid(),sp:S.cur,name:file.name,assetId:r.id,type:r.contentType,size:r.sizeBytes});
      moodForm=null;touch();render();
    }).catch(function(e){toast(upErr(e))});
    return;
  }
  item.id=uid();item.sp=S.cur;if(sec)item.sec=sec;if(bm().layout==="canvas"){item.cx=80+Math.round(Math.random()*400);item.cy=60+Math.round(Math.random()*120);item.cw=item.kind==="color"?200:280;item.cr=0;item.cz=S.mood.reduce(function(a,x){return Math.max(a,x.cz||0)},0)+1}S.mood.push(item);moodForm=null;touch();render();
}
function mMove(id,d){
  var m=findIn(S.mood,id);if(!m)return;
  var s=m.kind==="image"?secOf(m):secOf(m),i=S.mood.indexOf(m),j=i;
  do{j+=d}while(j>=0&&j<S.mood.length&&!(S.mood[j].sp===m.sp&&(bm().layout==="collage"||secOf(S.mood[j])===s)));
  if(j<0||j>=S.mood.length)return;
  var t=S.mood[j];S.mood[j]=m;S.mood[i]=t;touch();render();
}
function mExtract(id){
  var m=findIn(S.mood,id);if(!m||m.kind!=="image")return;
  var im=new Image();
  im.onload=function(){
    try{
      var W=48,c=document.createElement("canvas");c.width=W;c.height=W;var x=c.getContext("2d");x.drawImage(im,0,0,W,W);
      var d=x.getImageData(0,0,W,W).data,b={};
      for(var i=0;i<d.length;i+=4){if(d[i+3]<128)continue;var k=(d[i]>>4)+"-"+(d[i+1]>>4)+"-"+(d[i+2]>>4),e=b[k]||(b[k]={n:0,r:0,g:0,b:0});e.n++;e.r+=d[i];e.g+=d[i+1];e.b+=d[i+2]}
      var arr=Object.keys(b).map(function(k){var e=b[k];return {n:e.n,r:e.r/e.n,g:e.g/e.n,b:e.b/e.n}}).sort(function(a,z){return z.n-a.n}),pick=[];
      arr.forEach(function(e){if(pick.length<5&&pick.every(function(p){return Math.hypot(p.r-e.r,p.g-e.g,p.b-e.b)>56}))pick.push(e)});
      if(!pick.length)return toast("Couldn't read colours from that image");
      pick.forEach(function(e){S.mood.push({id:uid(),sp:S.cur,kind:"color",sec:"palette",value:toHex(e),label:""})});
      touch();render();toast("Added "+pick.length+" colours to the palette");
    }catch(err){toast("Couldn't read colours from that image")}
  };
  im.onerror=function(){toast("Couldn't load that image")};
  im.src="/_blob/"+m.assetId;
}
function mCopyText(){
  var m=bm(),its=mine("mood"),L=[];
  L.push((m.title||spaceName()).toUpperCase());if(m.tagline)L.push(m.tagline);if(m.about)L.push("",m.about);
  var cols=its.filter(function(x){return x.kind==="color"});
  if(cols.length){L.push("","Colour palette");cols.forEach(function(c){L.push("  "+hx(c.value).toUpperCase()+(c.label?"  "+c.label:""))})}
  L.push("","Typography","  Headings: "+m.head,"  Body: "+m.body);
  if(m.keywords.length)L.push("","Keywords: "+m.keywords.join(", "));
  var qs=its.filter(function(x){return x.kind==="quote"||x.kind==="note"});
  if(qs.length){L.push("","Quotes & notes");qs.forEach(function(q){L.push("  - "+q.value+(q.label?" ("+q.label+")":""))})}
  try{navigator.clipboard.writeText(L.join("\n")).then(function(){toast("Board copied as text")},function(){toast("Couldn't copy")})}catch(e){toast("Couldn't copy")}
}
function mStarter(){
  var sp=S.cur,m=bm(),add=function(o){o.id=uid();o.sp=sp;S.mood.push(o)};
  [["#1E2A44","Midnight"],["#3F5370","Slate"],["#6A7F99","Dusk"],["#B7B1A6","Stone"],["#E6E1D6","Linen"]].forEach(function(c){add({kind:"color",sec:"palette",value:c[0],label:c[1]})});
  add({kind:"pattern",sec:"texture",value:"stripes",label:"Stripes",c1:"#1E2A44",c2:"#3F5370",c3:"#6A7F99"});
  add({kind:"pattern",sec:"texture",value:"dots",label:"Dots",c1:"#B7B1A6",c2:"#E6E1D6",c3:"#6A7F99"});
  add({kind:"pattern",sec:"texture",value:"mesh",label:"Soft mesh",c1:"#6A7F99",c2:"#B7B1A6",c3:"#E6E1D6"});
  add({kind:"quote",sec:"words",value:"Simple, honest and made with care.",label:"Brand promise"});
  add({kind:"note",sec:"words",value:"Clean frames, lots of negative space, one loud colour per shot."});
  ["pen","bulb","star","video","chart"].forEach(function(n){add({kind:"icon",sec:"elements",value:n,label:n.charAt(0).toUpperCase()+n.slice(1)})});
  if(!m.keywords.length)m.keywords=["Calm","Minimal","Organic"];
  if(!m.tagline)m.tagline="wisdom · depth · clarity";
  touch();render();
}
document.addEventListener("input",function(e){var t=e.target;if(t.dataset&&t.dataset.bm&&!readOnly){bm()[t.dataset.bm]=t.value;touch()}});
document.addEventListener("change",function(e){var t=e.target;if(t.dataset&&t.dataset.bf&&!readOnly){bm()[t.dataset.bf]=t.value;loadFont(t.value);touch();render()}});
document.addEventListener("keydown",function(e){
  var t=e.target;
  if(e.key==="Enter"&&t.id==="mkw"&&!readOnly){e.preventDefault();var v=t.value.trim();if(!v)return;var k=bm().keywords;if(k.indexOf(v)<0&&k.length<12)k.push(v);touch();render();var n=$("mkw");if(n)n.focus()}
});

function vFiles(){
  var files=mine("files");
  var h='<section class="sec" style="margin-top:26px"><h2>Files</h2>';
  if(assets&&!readOnly){
    h+='<label class="fdrop"><input type="file" id="ffile" accept="image/*,video/mp4,video/webm,application/pdf,.woff,.woff2,.ttf,.otf"><span class="ec-i">'+I("plus")+'</span><span><b>Upload a file</b><small>Images, video, PDFs or fonts. Drop it here or click to choose.</small></span></label>';
  }else{
    h+='<p class="note-hint">File uploads are not available right now.</p>';
  }
  if(!files.length)h+='<div class="empty">No files yet. Upload footage, thumbnails or PDFs to keep them with your links.</div>';
  h+='<div class="files">'+files.map(function(f){
    var isImg=/^image\//.test(f.type||"");
    return '<div class="file"><div class="thumb">'+(isImg?'<img src="/_blob/'+esc(f.assetId)+'" alt="" loading="lazy">':esc((f.type||"file").split("/").pop().toUpperCase()))+'</div><div class="meta">'+esc(f.name)+'<div class="muted" style="font-size:12px">'+fmtSize(f.size||0)+'</div></div><div class="foot"><a href="/_blob/'+esc(f.assetId)+'" target="_blank" rel="noopener noreferrer">Open</a><button class="btn sm" data-act="delfile" data-id="'+f.id+'">Delete</button></div></div>';
  }).join("")+'</div></section>';
  return h;
}

