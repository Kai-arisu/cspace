/* ---------- actions ---------- */
function webAct(a,b){
  var id=b.dataset.id;
  switch(a){
    case "spaceadd":case "delspace":case "renamespace":if(window.__WS&&window.__WS.space){toast("This space is managed from the owner's workspace");return true}return false;
    case "push_on":pushOn();return true;
    case "push_off":pushOff();return true;
    case "push_test":pushTest();return true;
    case "tm_tab":T.tab=id;T.tabSet=true;render();return true;
    case "tm_add":T.form=!T.form;render();return true;
    case "tm_create":tmCreate();return true;
    case "tm_det":T.detOpen=T.detOpen||{};T.detOpen[id]=!T.detOpen[id];render();return true;
    case "tm_open":T.sel=T.sel===id?null:id;render();return true;
    case "tm_del":arm(b,function(){tmDelete(id)});return true;
    case "tm_end":{var em1=tmM(id);if(em1)tmPatch(id,{status:em1.status==="ended"?"active":"ended"},true);return true}
    case "tm_mail":tmMail(id);return true;
    case "tm_wadd":tmWorkAdd(id);return true;
    case "tm_wdel":tmWorkDel(id);return true;
    case "tk_assign":tkAssignDlg(id);return true;
    case "tk_assignto":tkAssign(b.dataset.task,id);return true;
    case "tm_padd":tmPayAdd(id,false);return true;
    case "tm_salary":tmPayAdd(id,true);return true;
    case "tm_pdel":tmPayDel(id);return true;
    case "tm_ppaid":tmPayToggle(id);return true;
    case "tm_kind":T.f.kind=id;render();return true;
    case "calsync":calSync(false);return true;
    case "calnew":calSync(true);return true;
    case "calcopy":copy(CAL.url);return true;
    case "sharehelp":if(window.__WS){toast("Switch back to your own workspace to share your page");return true}S.view="cp";render();return true;
    case "more":sound("tick");moreOpen();return true;
    case "rail":railSet(!document.querySelector(".app").classList.contains("rail"));return true;
    case "snd":sndSet(id==="on");if(id==="on")sound("on");if($("msheet")&&!$("msheet").hidden)moreOpen();else render();return true;
    case "view":sound("tick");moreClose();return false;
    case "datadlg":moreClose();return false;
    case "ms_theme":setMode(id);if($("msheet")&&!$("msheet").hidden)moreOpen();else render();return true;
    case "aud_gedit":W.goalEd=id||null;audPaint();return true;
    case "aud_gsave":{var gi=$("ag-in"),gv=numOrNull(gi&&gi.value);if(gv!==null&&(isNaN(gv)||gv<1)){toast("Enter a whole number above zero");return true}
      WSB.from("connections").update({goal:gv}).eq("id",id).then(function(r){if(r.error){toast("Couldn't save the goal")}else{var c=W.conns.filter(function(x){return x.id===id})[0];if(c)c.goal=gv;W.goalEd=null;audPaint();toast(gv?"Goal saved":"Goal cleared")}});return true}
    case "aud_plat":W.plat=id;W.showAdd=true;W.typeIt=false;render();return true;
    case "aud_kind":W.kind=id;W.showAdd=true;render();return true;
    case "ob_hide":S.cfg.obDone=true;touch();render();return true;
    case "ob_sample":obSample();return true;
    case "ob_focus":{var q=$("qcin");if(q){q.focus();q.placeholder="Your first idea… then press Idea"}return true}
    case "ob_name":{var on=$("obname"),nv=on?on.value.trim():"";if(!nv){toast("Type a name first");return true}var sp=S.spaces.filter(function(x){return x.id===S.cur})[0];if(sp)sp.name=nv.slice(0,40);S.cfg.spNamed=true;touch();render();toast("Space renamed");return true}
    case "aud_toggleadd":W.showAdd=!W.showAdd;render();return true;
    case "soc_start":socStart(id);return true;
    case "soc_guide":socGuide(id);return true;
    case "soc_type":W.typeIt=true;render();return true;
    case "soc_copyr":copy(socRedirect(id));return true;
    case "soc_disc":arm(b,function(){socDisconnect(id)});return true;
    case "aud_add":audAdd();return true;
    case "aud_addm":audAddManual();return true;
    case "aud_refresh":audRefresh(true);return true;
    case "aud_reload":audLoad();return true;
    case "aud_man":W.manual=id;audPaint();return true;
    case "aud_mcancel":W.manual=null;audPaint();return true;
    case "aud_msave":audSaveManual(id);return true;
    case "aud_pub":{var pub=!!b.checked;WSB.from("connections").update({show_public:pub}).eq("id",id).then(function(r){if(r.error){toast("Couldn't change that");audLoad()}else{var c=W.conns.filter(function(x){return x.id===id})[0];if(c)c.show_public=pub;toast(pub?"Shown on your public page":"Hidden from your public page")}});return true}
    case "aud_del":arm(b,function(){WSB.from("connections").delete().eq("id",id).then(function(r){if(r.error)toast("Couldn't remove it");else{W.conns=W.conns.filter(function(c){return c.id!==id});audPaint();toast("Removed")}})});return true;
    case "cp_save":cpSave();return true;
    case "sh_invite":{
      var em=String(SH.email||"").trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(em)){shMsg("Enter a valid email address.");return true}
      if(em===String(window.__EMAIL||"").toLowerCase()){shMsg("That is your own email.");return true}
      if(SH.space&&!shIsIso(SH.space)){
        var sn=shSpaceName(SH.space);
        if(S.spaces.length<2){shMsg("You need at least one other space to keep for yourself. Add another space first.");return true}
        showInfo("Share only "+sn+"?",'<p style="margin:0 0 10px">To keep <b>'+esc(sn)+'</b> apart from your other spaces, it moves into its own private area. After that:</p><ul style="margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li>You open it from <b>Your private spaces</b> on this page.</li><li>It no longer shows in your main Overview, search or reminders.</li><li>Nothing is lost. Your notes, tasks, ideas and whiteboard come with it.</li></ul><div class="row"><button class="btn" data-act="dlgclose">Cancel</button><button class="btn pri" data-act="sh_isogo">Move and invite</button></div>');
        return true}
      shAdd(em,SH.role,SH.space);return true}
    case "sh_isogo":{var gsp=SH.space,gem=String(SH.email||"").trim().toLowerCase(),grole=SH.role;infoHTML="";renderDialog();shMsg("Moving the space…");
      isolateSpace(gsp).then(function(ok){if(ok)shAdd(gem,grole,gsp);else shMsg("Couldn't move the space. Nothing was changed.")});return true}
    case "sh_openiso":{var ix=(S.iso||[]).filter(function(x){return x.id===id})[0];
      try{localStorage.setItem(shWsKey(),JSON.stringify({owner:window.__UID,space:id,label:ix?ix.name:""}))}catch(e){}location.reload();return true}
    case "sh_mail":{var mx=SH.list[+id];if(!mx)return true;
      if(!b.dataset.fallback){sendInvite(mx.invitee_email,function(){webAct("sh_mail",{dataset:{id:id,fallback:"1"}})},function(m){shMsg(m)});return true}
      var who=(S.profile&&S.profile.name)||String(window.__EMAIL||"").split("@")[0],role=mx.role==="editor"?"edit":"view";
      var body="Hi,\n\n"+who+" invited you to "+role+" their Creator Space.\n\n1. Open "+location.origin+"\n2. Sign in (or create an account) with this email: "+mx.invitee_email+"\n3. Open the Handles page and choose "+who+"'s workspace under \"Shared with you\".\n\nSee you there.";
      var href="mailto:"+encodeURIComponent(mx.invitee_email)+"?subject="+encodeURIComponent(who+" invited you to Creator Space")+"&body="+encodeURIComponent(body);
      var lk=document.createElement("a");lk.href=href;document.body.appendChild(lk);lk.click();lk.remove();
      try{navigator.clipboard&&navigator.clipboard.writeText(body).catch(function(){})}catch(e){}
      shMsg("Your email app opened with the invite. The text is also copied in case it didn't.");return true}
    case "sh_del":WSB.from("shares").delete().eq("id",id).then(function(r){if(r.error)shMsg("Couldn't remove.");else{SH.loaded=false;shLoad()}});return true;
    case "sh_open":{var ow=SH.ws[+id];if(!ow)return true;try{localStorage.setItem(shWsKey(),JSON.stringify({owner:ow.owner_id,space:ow.space_id||"",label:ow.space_id?"":""}))}catch(e){}location.reload();return true}
    case "sh_home":try{localStorage.removeItem(shWsKey())}catch(e){}location.reload();return true;
    case "sh_leave":{var lw=SH.ws[+id];if(!lw)return true;var lq=WSB.from("shares").delete().eq("owner_id",lw.owner_id).eq("invitee_email",String(window.__EMAIL||"").toLowerCase());lq=lw.space_id?lq.eq("space_id",lw.space_id):lq.is("space_id",null);lq.then(function(r){if(r.error)shMsg("Couldn't leave.");else{SH.loaded=false;shLoad()}});return true}
    case "kit_on":W.p.kit.on=!!b.checked;return true;
    case "kit_add":{var kk=W.p.kit;if(id==="b")kk.brands.push({name:"",note:""});else kk[id==="r"?"rates":"stats"].push(["",""]);render();return true}
    case "kit_del":{var kd=id.split("."),kq=W.p.kit;(kd[0]==="b"?kq.brands:(kd[0]==="r"?kq.rates:kq.stats)).splice(+kd[1],1);render();return true}
    case "kit_import":{var bk=(S.kit&&S.kit[S.cur])||null;if(!bk){toast("Nothing in the Business tab yet");return true}
      var kz=W.p.kit,add=function(dst,src,n){(src||[]).forEach(function(x){if(x&&x[1]&&dst.length<n&&!dst.some(function(y){return y[0]===x[0]}))dst.push([String(x[0]),String(x[1])])})};
      add(kz.stats,bk.stats,6);add(kz.rates,bk.rates,8);if(!kz.email&&bk.email)kz.email=bk.email;if(!kz.intro&&bk.bio)kz.intro=bk.bio;render();toast("Imported. Press Save to publish.");return true}
    case "kit_copy":navigator.clipboard&&navigator.clipboard.writeText(location.origin+"/u/"+W.p.handle+"/kit").then(function(){toast("Media kit link copied")});return true;
    case "cp_acc":W.p.accent=id;render();return true;
    case "cp_look":W.p.look=id;render();return true;
    case "cp_shareimg":cpShareImage();return true;
    case "cp_ladd":W.p.links.push({label:"",url:""});render();return true;
    case "cp_ldel":W.p.links.splice(+id,1);render();return true;
    case "cp_pub":W.p.is_public=!!b.checked;return true;
    case "cp_avatar":{var f=$("cpfile");if(f)f.click();return true}
    case "tp_open":tpOpen();return true;
    case "tp_close":tpClose();return true;
    case "tp_play":tpToggle();return true;
    case "tp_speed":tpSpeed(+b.dataset.d);return true;
    case "tp_size":tpSize(+b.dataset.d);return true;
    case "tp_mirror":TP.mirror=!TP.mirror;tpPaint();return true;
    case "tp_restart":TP.y=0;tpApply();return true;
    case "bk_kind":BK.kind=id;render();return true;
    case "bk_filter":BK.f=id;render();return true;
    case "bk_save":bkSave();return true;
    case "bk_copy":bkCopy(id);return true;
    case "bk_edit":BK.edit=id;render();var bx=$("bktext");if(bx)bx.focus();return true;
    case "bk_cancel":BK.edit=null;render();return true;
    case "bk_del":arm(b,function(){S.bank=S.bank.filter(function(x){return x.id!==id});touch();render()});return true;
    case "bk_starter":bkStarter();return true;
    case "bk_use":{var pid=b.dataset.post,it=S.bank.filter(function(x){return x.id===id})[0],po=S.posts.filter(function(x){return x.id===pid})[0];if(it&&po){po.caption=((po.caption||"").trim()?po.caption.trim()+"\n\n":"")+it.text;it.uses=(it.uses||0)+1;touch();render();toast("Added to the post")}return true}
    case "rp_open":rpOpen(id);return true;
    case "rp_go":rpGo();return true;
    case "rp_cancel":infoHTML="";renderDialog();return true;
    case "aud_tab":W.audTab=id;render();return true;
    case "ins_ch":W.insCh=id;render();return true;
    case "ins_kind":W.insKind=id;render();return true;
    case "imp_paste":{var pt=($("imppaste")||{}).value||"";if(!pt.trim()){toast("Paste some cells first");return true}impParse(pt,"Pasted data");return true}
    case "imp_reset":IMP.step="drop";IMP.msg="";render();return true;
    case "imp_target":IMP.target=id;IMP.map=impAutoMap(id);if((id==="videos"||id==="audience")&&!IMP.conn){var oc=(W.conns||[]).filter(function(c){return c.kind==="own"});IMP.conn=oc.length?oc[0].id:"new"}render();return true;
    case "imp_go":impGo();return true;
    case "imp_undo":impUndo(id);return true;
    case "imp_open":go("imp");return true;
    case "imp_notes":{var nid="imp"+uid(),nn=0;IMP.notes.forEach(function(n){S.notes.push({id:uid(),sp:S.cur,title:n.title,body:n.body,pin:false,ts:Date.now(),imp:nid});nn++});impLog({id:nid,t:"notes",n:nn,file:IMP.name,key:"notes"});IMP.step="drop";IMP.notes=null;toast("Imported "+nn+" notes");go("notes");return true}
    case "cp_tab":W.cpTab=id;W.pMsg="";render();return true;
    case "cp_avrm":W.p.avatar_url="";if(S.profile){S.profile.avatar="";touch()}if(typeof paintProfile==="function")paintProfile();if(W.p.exists)WSB.from("profiles").update({avatar_url:null}).eq("user_id",window.__UID).then(function(){});render();return true;
    case "cp_copy":copy(cpLink());return true;
    case "cp_open":window.open(cpLink(),"_blank","noopener");return true;
    case "cp_pw":WSB.auth.resetPasswordForEmail(window.__EMAIL||"",{redirectTo:location.origin}).then(function(r){toast(r.error?"Couldn't send the email":"Reset link sent to your email")});return true;
    case "signout":arm(b,function(){
      if(typeof SY!=="undefined"&&SY.pending&&navigator.onLine!==false){toast("Finishing your last save. Try again in a moment.");syFlush&&syFlush();return}
      try{if(typeof SY==="undefined"||!SY.pending){["","-meta","-snap","-pref","-theme"].forEach(function(x){localStorage.removeItem(LS+x)})}}catch(e){}
      window.__signOut();
    });return true;
  }
  return false;
}
document.addEventListener("input",function(e){
  var t=e.target,w=t&&t.dataset&&t.dataset.w;if(!w)return;
  if(w.indexOf("h.")===0&&W.p){hdSet(HANDLES[+w.slice(2)],t.value);cpPreviewPaint()}
  else if(w==="sh.email"){SH.email=t.value}
  else if(w==="sh.role"){SH.role=t.value}
  else if(w==="sh.space"){SH.space=t.value}
  else if(w.indexOf("sh.r.")===0){var sx=SH.list[+w.slice(5)];if(sx){var nr=t.value;WSB.from("shares").update({role:nr}).eq("id",sx.id).then(function(r){if(r.error)shMsg("Couldn't change the role.");else{sx.role=nr;shMsg("Role updated.")}})}}
  else if(w.indexOf("k.")===0&&W.p){var kp=w.split("."),kk=W.p.kit;
    if(kp.length===2)kk[kp[1]]=t.value;
    else if(kp[1]==="b"){if(kk.brands[+kp[2]])kk.brands[+kp[2]][kp[3]]=t.value}
    else{var ka=kp[1]==="r"?kk.rates:kk.stats;if(ka[+kp[2]])ka[+kp[2]][+kp[3]]=t.value}}
  else if(w==="s.role"){S.profile=S.profile||{};S.profile.role=t.value;touch();if(typeof paintProfile==="function")paintProfile()}
  else if(w.indexOf("p.")===0&&W.p){W.p[w.slice(2)]=t.value;if(w==="p.display_name"){S.profile=S.profile||{};S.profile.name=t.value;touch();if(typeof paintProfile==="function")paintProfile()}cpPreviewPaint()}
  else if(w.indexOf("l.")===0&&W.p){var m=w.split(".");var l=W.p.links[+m[1]];if(l){l[m[2]]=t.value;cpPreviewPaint()}}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t&&t.id==="cpfile"){
    var f=t.files&&t.files[0];t.value="";if(!f||!W.p)return;
    if(!/^image\//.test(f.type)){toast("Choose an image");return}
    if(f.size>5*1048576){toast("Choose a photo under 5 MB");return}
    if(!assets){toast("Uploads aren't ready yet");return}
    toast("Uploading…");
    assets.upload(f).then(function(r){W.p.avatar_url=r.url;if(S.profile){S.profile.avatar=r.id;touch()}if(typeof paintProfile==="function")paintProfile();
      if(W.p.exists)WSB.from("profiles").update({avatar_url:r.url}).eq("user_id",window.__UID).then(function(){});
      render();toast("Photo updated")}).catch(function(){toast("Upload failed. Try again.")});
  }
});

ICONS.grid='<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>';
var DOCK=["home","notes","ideas","cal"];
function webTabs(){
  return DOCK.map(function(id){var v=vmeta(id);return '<button data-act="view" data-id="'+id+'" aria-current="'+(S.view===id)+'">'+I(v.ic)+'<span>'+v.name+'</span></button>'}).join("")+
    '<button data-act="more" aria-haspopup="dialog" aria-current="'+(DOCK.indexOf(S.view)<0)+'">'+I("grid")+'<span>More</span></button>';
}
function moreInner(){
  var last="",out='<div class="msheet-box" role="dialog" aria-modal="true" aria-label="All tools"><div class="ms-grid">',open=true,mode=themeMode();
  VIEWS.forEach(function(v){
    if(v.g&&v.g!==last){last=v.g;out+='</div><p class="ms-g">'+esc(v.g)+'</p><div class="ms-grid">'}
    out+='<button data-act="view" data-id="'+v.id+'" aria-current="'+(S.view===v.id)+'">'+I(v.ic)+'<span>'+esc(v.name)+'</span></button>';
  });
  out+='</div><p class="ms-g">Sounds</p><div class="hd-seg" role="group" aria-label="Sounds">'+[["on","On"],["off","Off"]].map(function(o){return '<button data-act="snd" data-id="'+o[0]+'" aria-pressed="'+((o[0]==="on")===sndOn())+'">'+o[1]+'</button>'}).join("")+'</div><p class="ms-g">Appearance</p><div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div>'+
    '<div class="ms-row"><button data-act="datadlg">Data and backup</button></div></div>';
  return out;
}
function moreOpen(){var el=$("msheet");if(!el){el=document.createElement("div");el.id="msheet";el.className="msheet";document.body.appendChild(el);el.addEventListener("click",function(e){if(e.target===el)moreClose()})}el.innerHTML=moreInner();el.hidden=false}
function moreClose(){var el=$("msheet");if(el)el.hidden=true}
document.addEventListener("keydown",function(e){if(e.key==="Escape")moreClose()});
function webView(v){
  if(v==="aud"){if(!W.loaded&&!W.loading)audLoad();if(!SOC.loaded&&!SOC.loading){SOC.loading=1;socLoad()}return audHTML()}
  if(v==="cp")return cpHTML();
  if(v==="bank")return bankHTML();
  if(v==="imp"){if(!W.loaded&&!W.loading)audLoad(true);return impHTML()}
  if(v==="team"){if(!T.loaded&&!T.loading)tmLoad();return tmHTML()}
  return null;
}
function webMount(v){
  clearInterval(W.timer);W.timer=null;
  if(v==="aud"){
    ["a.in","a.h","a.fo","a.vw","a.po"].forEach(function(){});
    if(Date.now()-W.lastRefresh>60000)audRefresh(false);
    W.timer=setInterval(function(){
      if(S.view!=="aud"||document.visibilityState==="hidden"||W.busy)return;
      W.tick++;if(W.tick%5===0)audRefresh(false);else audLoad(true);
    },60000);
  }
}


