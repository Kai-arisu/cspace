/* ---------- focus timer ---------- */
var FT={mode:"f",left:1500,run:false,end:0,tick:null},FTLEN={f:1500,b:300};
function fmtT(n){return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
function ftPaint(){
  var tf=$("tdfocus");if(tf){tf.dataset.run=FT.run;tf.innerHTML=tdFocusInner()}
  var e=$("ftimer");if(!e)return;
  e.dataset.run=FT.run;e.dataset.mode=FT.mode;
  e.innerHTML='<button class="ftb" data-act="ftoggle" aria-label="'+(FT.run?"Pause":"Start")+' timer">'+I(FT.run?"pause":"play")+'</button><span class="ftt" id="ftt" aria-live="off">'+fmtT(FT.left)+'</span><button class="ftm" data-act="ftmode" title="Switch between focus and break">'+(FT.mode==="f"?"Focus":"Break")+'</button>'+((FT.run||FT.left!==FTLEN[FT.mode])?'<button class="ico" data-act="ftreset" aria-label="Reset timer">'+I("undo")+'</button>':"");
}
function tdFocusInner(){var fm=S.focus[ymd(new Date())]||0;return '<div class="tf-row"><b class="tf-t" id="ftt2">'+fmtT(FT.left)+'</b><span class="tf-b"><button class="ico" data-act="ftoggle" aria-label="'+(FT.run?"Pause":"Start")+' focus timer">'+I(FT.run?"pause":"play")+'</button><button class="ico" data-act="ftreset" aria-label="Reset timer">'+I("undo")+'</button></span></div><span>'+(FT.mode==="f"?"Focus":"Break")+' · '+fm+' min today · <button class="tf-sw" data-act="ftmode">'+(FT.mode==="f"?"Take a break":"Back to focus")+'</button></span>'}
function ftTick(){
  FT.left=Math.max(0,Math.round((FT.end-Date.now())/1000));
  if(FT.left<=0){ftDone();return}
  var t=$("ftt");if(t)t.textContent=fmtT(FT.left);var t2=$("ftt2");if(t2)t2.textContent=fmtT(FT.left);
  document.title=fmtT(FT.left)+" · Creator Space";
}
function ftDone(){
  clearInterval(FT.tick);FT.run=false;document.title="Creator Space";
  if(FT.mode==="f"){var k=ymd(new Date());S.focus[k]=(S.focus[k]||0)+25;if(!readOnly)touch();toast("Focus session done. Take a 5 minute break.");FT.mode="b"}
  else{toast("Break over. Ready for another round?");FT.mode="f"}
  FT.left=FTLEN[FT.mode];ftPaint();if(S.view==="home")render();
}
function ftToggle(){
  if(FT.run){clearInterval(FT.tick);FT.run=false;document.title="Creator Space"}
  else{FT.end=Date.now()+FT.left*1000;FT.run=true;FT.tick=setInterval(ftTick,500)}
  ftPaint();
}
function ftReset(){clearInterval(FT.tick);FT.run=false;FT.left=FTLEN[FT.mode];document.title="Creator Space";ftPaint()}
function ftSwitch(){clearInterval(FT.tick);FT.run=false;FT.mode=FT.mode==="f"?"b":"f";FT.left=FTLEN[FT.mode];document.title="Creator Space";ftPaint()}

