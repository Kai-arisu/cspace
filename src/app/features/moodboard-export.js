/* ---------- moodboard export ---------- */
function loadScript(src){return new Promise(function(res,rej){if(window.htmlToImage)return res();var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("load"))};document.head.appendChild(s)})}
function patSVG(m,k){var c=patCSS(m),i=c.indexOf("data:image/svg+xml,"),j=c.indexOf("&quot;)",i),v=decodeURIComponent(c.slice(i+19,j));k=k||1;return v.replace(/width="(\d+)" height="(\d+)"/,function(_,w,h){return 'width="'+w*k+'" height="'+h*k+'"'})}
function icoURL(n,col){return "data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="'+col+'" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||ICONS.star)+'</svg>')}
/* the download mirrors the on-screen sheet: name in its heading font beside the palette band, then the board */
function mExport(){
  if(exportBusy)return;exportBusy=true;toast("Preparing image…");
  var m0=bm(),all=mine("mood"),cols0=all.filter(function(x){return x.kind==="color"}),items=all.filter(function(x){return x.kind!=="color"||cols0.length>6});
  var dark=isDark(),bg=dark?"#000000":"#FFFFFF",card=dark?"#111111":"#F7F7F6",line=dark?"#262626":"#EAEAEA",fg=dark?"#F5F5F4":"#1F201D",mu=dark?"#B4B4B4":"#636361";
  var W=2000,pad=80,gap=28,cols=3,cw=(W-pad*2-gap*(cols-1))/cols,title=(m0.title||spaceName()||"Moodboard");
  var FH=fam(m0.head),FB=fam(m0.body),HW=fontInfo(m0.head)[3];
  var loads=items.map(function(m){
    if(m.kind==="image"&&m.assetId)return edLoadImg("/_blob/"+m.assetId).catch(function(){return null});
    if(m.kind==="pattern")return edLoadImg("data:image/svg+xml,"+encodeURIComponent(patSVG(m,2))).catch(function(){return null});
    if(m.kind==="icon")return edLoadImg(icoURL(m.value,fg)).catch(function(){return null});
    return Promise.resolve(null)});
  var fonts=document.fonts&&document.fonts.load?Promise.all([document.fonts.load(HW+' 120px '+FH),document.fonts.load('400 30px '+FB),document.fonts.load('500 28px "Instrument Sans"')]).catch(function(){}):Promise.resolve();
  Promise.all([Promise.all(loads),fonts]).then(function(r){
    var imgs=r[0],cv=document.createElement("canvas"),lay=[],ys=[0,0,0],i;
    function hOf(m,im){var k=m.kind;if(k==="image"&&im)return Math.max(200,Math.min(cw*1.4,cw*im.naturalHeight/im.naturalWidth));if(k==="color")return 300;if(k==="quote")return 340;if(k==="note")return 300;if(k==="pattern")return cw*.75;if(k==="icon")return 240;return 200}
    for(i=0;i<items.length;i++){var c=ys.indexOf(Math.min.apply(null,ys)),h=hOf(items[i],imgs[i]);lay.push({x:pad+c*(cw+gap),y:ys[c],w:cw,h:h,m:items[i],im:imgs[i]});ys[c]+=h+gap}
    var headH=640,top=headH+pad,H=top+(items.length?Math.max.apply(null,ys)-gap:0)+pad;cv.width=W;cv.height=Math.max(H,headH+pad);var ctx=cv.getContext("2d");
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,cv.height);ctx.textBaseline="alphabetic";
    function wrap(t,x,y,mw,lh,max){var words=String(t).split(/\s+/),line="",n=0;words.forEach(function(w){var tt=line?line+" "+w:w;if(ctx.measureText(tt).width>mw&&line){if(n<max)ctx.fillText(line,x,y+n*lh);n++;line=w}else line=tt});if(n<max)ctx.fillText(line,x,y+n*lh);return Math.min(n+1,max)}
    /* cover */
    var bandW=cols0.length?Math.round(W*.4):0,tx=pad,tw=W-bandW-pad*2;
    if(cols0.length){var bw=bandW/Math.min(cols0.length,6);cols0.slice(0,6).forEach(function(c,k){var v=hx(c.value),x=W-bandW+k*bw;ctx.fillStyle=v;ctx.fillRect(x,0,Math.ceil(bw),headH);ctx.fillStyle=inkOn(v);ctx.font='500 22px "Instrument Sans",Helvetica,Arial,sans-serif';
      if(c.label){ctx.globalAlpha=.85;ctx.fillText(c.label.length>14?c.label.slice(0,13)+"…":c.label,x+20,headH-62);ctx.globalAlpha=1}ctx.fillText(v.toUpperCase(),x+20,headH-30)})}
    var y=headH-pad;
    ctx.font='400 30px '+FB;var kwLine=m0.keywords.join("   ·   ");
    if(kwLine){ctx.fillStyle=mu;ctx.fillText(kwLine,tx,y);y-=58}
    if(m0.tagline){ctx.fillStyle=mu;ctx.font='400 34px '+FB;ctx.fillText(m0.tagline,tx,y);y-=70}
    var ts=132;ctx.font=HW+' '+ts+'px '+FH;while(ctx.measureText(title).width>tw&&ts>64){ts-=6;ctx.font=HW+' '+ts+'px '+FH}
    ctx.fillStyle=fg;ctx.fillText(title,tx,y);y-=ts+20;
    ctx.fillStyle=mu;ctx.font='500 26px "Instrument Sans",Helvetica,Arial,sans-serif';ctx.fillText(m0.kicker||"Brand board",tx,y);
    ctx.fillStyle=line;ctx.fillRect(0,headH,W,2);
    /* board */
    lay.forEach(function(L){
      var m=L.m,x=L.x,y=top+L.y,w=L.w,h=L.h,k=m.kind;ctx.save();edRound(ctx,x,y,w,h,24);ctx.clip();
      if(k==="image"&&L.im){var s2=Math.max(w/L.im.naturalWidth,h/L.im.naturalHeight);ctx.drawImage(L.im,x+(w-L.im.naturalWidth*s2)/2,y+(h-L.im.naturalHeight*s2)/2,L.im.naturalWidth*s2,L.im.naturalHeight*s2)}
      else if(k==="color"){var cc=hx(m.value);ctx.fillStyle=cc;ctx.fillRect(x,y,w,h-96);ctx.fillStyle=card;ctx.fillRect(x,y+h-96,w,96);ctx.fillStyle=fg;ctx.font='500 28px '+FB;ctx.fillText(m.label||cc.toUpperCase(),x+24,y+h-52);ctx.fillStyle=mu;ctx.font='400 24px "Instrument Sans",sans-serif';ctx.fillText(cc.toUpperCase(),x+24,y+h-20)}
      else if(k==="pattern"){if(L.im){var pt=ctx.createPattern(L.im,"repeat");if(m.value==="mesh")ctx.drawImage(L.im,x,y,w,h);else{ctx.save();ctx.translate(x,y);ctx.fillStyle=pt;ctx.fillRect(0,0,w,h);ctx.restore()}}else{ctx.fillStyle=hx(m.c2);ctx.fillRect(x,y,w,h)}}
      else{ctx.fillStyle=card;ctx.fillRect(x,y,w,h);ctx.fillStyle=fg;
        if(k==="quote"){ctx.fillStyle=mu;ctx.font='400 90px '+FH;ctx.fillText("“",x+34,y+96);ctx.fillStyle=fg;ctx.font=HW+' 40px '+FH;wrap(m.value,x+36,y+136,w-72,50,3);if(m.label){ctx.fillStyle=mu;ctx.font='500 24px "Instrument Sans",sans-serif';ctx.fillText(m.label,x+36,y+h-34)}}
        else if(k==="note"){ctx.font='400 30px '+FB;wrap(m.value,x+36,y+70,w-72,44,5)}
        else if(k==="icon"){if(L.im)ctx.drawImage(L.im,x+w/2-48,y+h/2-70,96,96);ctx.fillStyle=mu;ctx.font='500 26px "Instrument Sans",sans-serif';ctx.textAlign="center";ctx.fillText(m.label||m.value,x+w/2,y+h/2+70);ctx.textAlign="left"}
        else if(k==="link"){var dm="";try{dm=new URL(m.value).hostname}catch(e){}ctx.font='500 32px '+FB;wrap(m.label||dm||m.value,x+36,y+74,w-72,42,2);ctx.fillStyle=mu;ctx.font='400 24px "Instrument Sans",sans-serif';ctx.fillText(dm,x+36,y+h-36)}
      }
      ctx.restore();
      if(k==="color"||k==="pattern"||k==="image"){ctx.save();edRound(ctx,x,y,w,h,24);ctx.lineWidth=2;ctx.strokeStyle=line;ctx.stroke();ctx.restore()}
    });
    return new Promise(function(res){cv.toBlob(res,"image/png")});
  }).then(function(blob){exportBusy=false;if(!blob)throw new Error("empty");return saveFile(title.replace(/[^\w-]+/g,"-")+"-moodboard.png",blob)})
  .catch(function(){exportBusy=false;toast("Couldn't create the image. Try again, or use Copy as text.")});
}

