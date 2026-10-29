/* ---- motion: count numbers up when a page opens ---- */
(function(){
  var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  window.__csCount=function(root){
    if(RM||!root)return;
    root.querySelectorAll(".stat b,.kpi b,.vz-big,.pp-num").forEach(function(el){
      if(el.children.length)return;
      var t=el.textContent,m=t.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
      if(!m)return;
      var pre=m[1],raw=m[2],suf=m[3],dec=(raw.split(".")[1]||"").length,end=parseFloat(raw.replace(/,/g,""));
      if(!isFinite(end)||end<=0||end>1e12)return;
      var t0=performance.now(),dur=750;
      (function step(now){
        var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3),v=end*e;
        el.textContent=k>=1?t:pre+(dec?v.toFixed(dec):Math.round(v).toLocaleString("en-US"))+suf;
        if(k<1)requestAnimationFrame(step)
      })(t0)
    })
  };
  /* first load: play the page entrance once */
  var n=0,iv=setInterval(function(){
    var w=document.getElementById("wrap");
    if(w&&w.children.length){clearInterval(iv);w.classList.add("enter");window.__csCount(w);setTimeout(function(){w.classList.remove("enter")},900)}
    else if(++n>40)clearInterval(iv)
  },120);
})();


/* ---- calendar sync: a private link that Google, Apple or Outlook calendar can subscribe to ---- */
var CAL={url:""};
async function calSync(fresh){
  if(window.__WS){toast("Open your own workspace to sync your calendar");return}
  try{
    var uid=window.__UID,r=await WSB.from("cal_tokens").select("token").eq("user_id",uid).maybeSingle();
    if(fresh&&r.data){await WSB.from("cal_tokens").delete().eq("user_id",uid);r={data:null}}
    if(!r.data){r=await WSB.from("cal_tokens").insert({user_id:uid}).select("token").single()}
    if(r.error||!r.data){toast("Couldn't make a calendar link. Try again.");return}
    CAL.url=location.origin+"/cal/"+r.data.token+".ics";
    var web=CAL.url.replace(/^https?:/,"webcal:");
    showInfo("Sync to your calendar",
      '<p style="margin:0 0 10px">Your scheduled posts and task due dates show up in Google Calendar, Apple Calendar or Outlook. It updates on its own, usually within a few hours.</p>'+
      '<input class="in" readonly value="'+esc(CAL.url)+'" aria-label="Calendar link" onfocus="this.select()" style="margin-bottom:10px">'+
      '<div class="drow" style="flex-wrap:wrap"><button class="btn pri" data-act="calcopy">Copy link</button>'+
      '<a class="btn" target="_blank" rel="noopener noreferrer" href="https://calendar.google.com/calendar/r?cid='+encodeURIComponent(web)+'">Add to Google Calendar</a>'+
      '<a class="btn" href="'+esc(web)+'">Apple / Outlook</a></div>'+
      '<p class="muted" style="margin:12px 0 0;font-size:13px">Anyone with this link can see the titles and dates, so keep it private. <button class="btn sm" data-act="calnew" style="margin-left:4px">Make a new link</button> stops the old one working.</p>');
  }catch(e){toast("Couldn't make a calendar link. Try again.")}
}


/* ---- phone and desktop alerts (web push) ---- */
var PUSH={ready:false,on:false,perm:"default",busy:false,msg:"",key:"BMGAVIDOgVBd8tRFH6K3h3UudIPMT-S8N3MPZXbhree40-_YO98Pv1kv7ilnMUjJe4BZnKBlrnvmPGa22_Pqvx0"};
function pushOK(){return "serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window}
function pushB64(b){var p="=".repeat((4-b.length%4)%4),r=(b+p).replace(/-/g,"+").replace(/_/g,"/"),w=atob(r),o=new Uint8Array(w.length);for(var i=0;i<w.length;i++)o[i]=w.charCodeAt(i);return o}
function pushBuf(b){var a=new Uint8Array(b),s="";for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function pushRefresh(){
  PUSH.ready=true;
  try{PUSH.perm=Notification.permission;var reg=await navigator.serviceWorker.getRegistration();var sub=reg&&await reg.pushManager.getSubscription();PUSH.on=!!sub&&PUSH.perm==="granted"}catch(e){}
  if(S.view==="cp")render();
}
function pushPanel(){
  var h='<div class="plab" style="margin:0 0 12px">Alerts<p class="muted" style="margin:2px 0 8px;font-size:13px">A morning summary of tasks and posts due today, plus a message when you reach an audience goal or a channel dips.</p>';
  if(!pushOK())return h+'<p class="muted" style="margin:0;font-size:13px">This browser can\'t show alerts. On iPhone, add Creator Space to your Home Screen first, then open it from there.</p></div>';
  if(!PUSH.ready){pushRefresh();return h+'<p class="muted" style="margin:0">Checking…</p></div>'}
  if(PUSH.perm==="denied")return h+'<p class="muted" style="margin:0;font-size:13px">Alerts are blocked for this site. Allow notifications in your browser settings, then come back.</p></div>';
  h+='<div class="drow">'+(PUSH.on?'<button class="btn" data-act="push_test"'+(PUSH.busy?" disabled":"")+'>Send a test</button><button class="btn" data-act="push_off"'+(PUSH.busy?" disabled":"")+'>Turn off here</button>':'<button class="btn pri" data-act="push_on"'+(PUSH.busy?" disabled":"")+'>Turn on alerts</button>')+'</div>';
  return h+'<p id="pushmsg" class="aud-msg" role="status">'+esc(PUSH.msg)+'</p></div>';
}
function pushMsg(t){PUSH.msg=t||"";var e=$("pushmsg");if(e)e.textContent=PUSH.msg}
async function pushOn(){
  if(PUSH.busy)return;PUSH.busy=true;pushMsg("");
  try{
    var perm=await Notification.requestPermission();PUSH.perm=perm;
    if(perm!=="granted"){PUSH.busy=false;pushMsg(perm==="denied"?"Alerts were blocked.":"Alerts weren't turned on.");render();return}
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushB64(PUSH.key)});
    var j=sub.toJSON(),k=j.keys||{};
    var tz="Asia/Kolkata";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz}catch(e){}
    var r=await WSB.from("push_subs").upsert({user_id:window.__UID,endpoint:sub.endpoint,p256dh:k.p256dh,auth:k.auth,tz:tz},{onConflict:"endpoint"});
    if(r.error)throw r.error;
    PUSH.on=true;PUSH.msg="Alerts are on for this device.";
  }catch(e){PUSH.msg="Couldn't turn on alerts. "+((e&&e.message)||"")}
  PUSH.busy=false;render();
}
async function pushOff(){
  if(PUSH.busy)return;PUSH.busy=true;
  try{
    var reg=await navigator.serviceWorker.getRegistration(),sub=reg&&await reg.pushManager.getSubscription();
    if(sub){var ep=sub.endpoint;await sub.unsubscribe();await WSB.from("push_subs").delete().eq("endpoint",ep)}
    PUSH.on=false;PUSH.msg="Alerts are off on this device.";
  }catch(e){PUSH.msg="Couldn't turn off alerts."}
  PUSH.busy=false;render();
}
async function pushTest(){
  if(PUSH.busy)return;PUSH.busy=true;pushMsg("Sending…");
  try{
    var r=await WSB.functions.invoke("push",{body:{test:true}});
    if(r.error)throw r.error;
    var d=r.data||{},ok=(d.codes||[]).filter(function(c){return c===201}).length;
    PUSH.msg=ok?"Sent. It should appear in a few seconds.":"The test didn't go through. Try turning alerts off and on again.";
  }catch(e){PUSH.msg="Couldn't send the test. Turn alerts on first."}
  PUSH.busy=false;pushMsg(PUSH.msg);
  var b=document.querySelector('[data-act="push_test"]');if(b)b.disabled=false;
}


/* ---- private spaces: move one space into its own locked area so it can be shared on its own ---- */
function shAdd(em,role,space){
  var row={owner_id:window.__UID,invitee_email:em,role:role,space_id:space||null,space_name:space?shSpaceName(space):null};
  WSB.from("shares").upsert(row,{onConflict:"owner_id,invitee_email,space_key"}).then(function(r){
    if(r.error){shMsg("Couldn't invite. "+r.error.message);return}
    SH.email="";SH.loaded=false;shMsg('Added. Press "Email invite" next to their name to send them the details.');shLoad();
  });
}
async function isolateSpace(id){
  try{
    var sp=S.spaces.filter(function(x){return x.id===id})[0];
    if(!sp||S.spaces.length<2||shIsIso(id)||!window.__mkdb||window.__WS)return false;
    var arr=["notes","ideas","tasks","mood","files","posts","clips","deals","income","invoices"],pre="sp/"+id+"/",pdb=window.__mkdb(pre);
    var N={spaces:[clone(sp)],palette:{},bmeta:{},kit:{},cfg:clone(S.cfg||{}),profile:clone(S.profile||{}),focus:{},edit:{}};
    arr.forEach(function(k){N[k]=S[k].filter(function(x){return x.sp===id}).map(clone)});
    ["palette","bmeta","kit"].forEach(function(k){if(S[k]&&S[k][id])N[k][id]=clone(S[k][id])});
    var sh=shards(N),keys={};
    for(var k in sh){
      keys[k]={n:sh[k].p.length,h:sh[k].h};
      for(var i=0;i<sh[k].p.length;i++)await pdb.doc("store/k_"+k+"_"+i).set({s:sh[k].p[i],i:i});
    }
    await pdb.doc("store/meta").set({ts:Date.now(),dev:TAB,keys:keys,v:2});
    var oldBd=[],rm=await db.doc("bd/"+id+"_m").get();
    if(rm.exists){
      var md=rm.data();
      for(var j=0;j<md.n;j++){var d=await db.doc("bd/"+id+"_"+j).get();if(!d.exists)throw new Error("board");await pdb.doc("bd/"+id+"_"+j).set(d.data());oldBd.push("bd/"+id+"_"+j)}
      await pdb.doc("bd/"+id+"_m").set(md);oldBd.push("bd/"+id+"_m");
    }
    var chk=await pdb.doc("store/meta").get();
    if(!chk.exists)throw new Error("verify");
    for(var q in keys){var c0=await pdb.doc("store/k_"+q+"_0").get();if(!c0.exists)throw new Error("verify")}
    /* the copy is safe: now take it out of the main workspace */
    arr.forEach(function(k){S[k]=S[k].filter(function(x){return x.sp!==id})});
    ["palette","bmeta","kit"].forEach(function(k){if(S[k])delete S[k][id]});
    S.spaces=S.spaces.filter(function(x){return x.id!==id});
    if(!Array.isArray(S.iso))S.iso=[];S.iso.push({id:id,name:sp.name});
    if(S.cur===id)S.cur=S.spaces[0].id;
    try{localStorage.removeItem(wbKey(id))}catch(e){}
    touch();render();
    oldBd.forEach(function(pth){db.doc(pth).delete().catch(function(){})});
    return true;
  }catch(e){return false}
}


