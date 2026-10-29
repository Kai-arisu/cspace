/* ---------- v10 acts and handlers ---------- */
function rerrAct(a,b){
  if(a==="rerr_retry"){render();return true}
  if(a==="rerr_home"){S.view="home";render();return true}
  return false;
}
function v10act(a,b){
  var id=b.dataset.id;
  switch(a){
    case "dlgclose":infoHTML="";renderDialog();return true;
    case "undoall":doUndo();return true;
    case "bell":bellToggle();return true;
    case "qcap":{var qi=$("qcin"),qt=qi?qi.value.trim():"";if(!qt){toast("Type something first");if(qi)qi.focus();return true}
      if(id==="idea")addIdeaText(qt,true);
      else if(id==="task"){S.tasks.push({id:uid(),sp:S.cur,title:qt,col:"i",due:"",ts:Date.now()});touch();render();toast("Added to Progress")}
      else{var qn={id:uid(),sp:S.cur,title:qt.slice(0,60),body:qt.length>60?qt:"",pin:false,ts:Date.now()};S.notes.push(qn);selNote=qn.id;touch();go("notes")}
      return true}
    case "caltask":{var ci=$("planin"),cv=ci?ci.value.trim():"";if(!cv){toast("Type the task first");if(ci)ci.focus();return true}planAdd(cv);return true}
    case "bellall":bellMark(bellItems(true).map(function(x){return x.id}));paintBell();var bm=$("bellm");if(bm)bm.innerHTML=bellHTML();return true;
    case "bellgo":{bellMark([b.dataset.id]);closeMenus();var bsp=b.dataset.sp;
      if(b.dataset.iso&&typeof webAct==="function"){webAct("sh_openiso",{dataset:{id:bsp}});return true}
      if(bsp&&bsp!==S.cur&&S.spaces.some(function(x){return x.id===bsp})){S.cur=bsp;touch()}go(b.dataset.v);return true}
    case "shortcuts":showShortcuts();return true;
    case "sharehelp":showShare();return true;
    case "comment":commentOn(b.dataset.sel);return true;
    case "cmonth":calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+(+b.dataset.d),1);render();return true;
    case "cday":calSel=id;{var cd=dparse(id);calMonth=new Date(cd.getFullYear(),cd.getMonth(),1)}if(S.view!=="cal")S.view="cal";render();return true;
    case "cadd":calAdd();return true;
    case "cdel":S.posts=S.posts.filter(function(x){return x.id!==id});touch();render();return true;
    case "biztab":bizTab=id;render();return true;
    case "dadd":{var br=($("dbrand").value||"").trim();if(!br){toast("Add the brand name");return true}S.deals.push({id:uid(),sp:S.cur,brand:br,amount:+$("damt").value||0,status:$("dst").value,due:$("ddue").value,ts:Date.now()});touch();render();return true}
    case "dlog":{var dl=findIn(S.deals,id);if(dl){S.income.push({id:uid(),sp:S.cur,date:ymd(new Date()),source:dl.brand,amount:dl.amount,cat:"Sponsorship"});dl.status="paid";touch();render();toast("Added "+money(dl.amount)+" to income")}return true}
    case "iadd":{var src=($("isrc").value||"").trim(),am=+$("iamt").value;if(!src||!am){toast("Add a source and an amount");return true}S.income.push({id:uid(),sp:S.cur,date:$("idate").value||ymd(new Date()),source:src,amount:am,cat:$("icat").value});touch();render();return true}
    case "vadd":{
      var cl=($("vclient").value||"").trim(),items=[];
      for(var i=0;i<4;i++){var d=($("vd"+i).value||"").trim();if(d)items.push({d:d,q:+$("vq"+i).value||1,r:+$("vr"+i).value||0})}
      if(!cl||!items.length){toast("Add a client and at least one line");return true}
      S.invoices.push({id:uid(),sp:S.cur,no:"INV-"+String(mine("invoices").length+1).padStart(3,"0"),client:cl,date:$("vdate").value,due:$("vdue").value,items:items,notes:($("vnote").value||"").trim(),paid:false,ts:Date.now()});touch();render();return true}
    case "vpaid":{var iv=findIn(S.invoices,id);if(iv){iv.paid=!iv.paid;touch();render()}return true}
    case "vdl":{var iv2=findIn(S.invoices,id);if(iv2)saveFile(iv2.no+".html",new Blob([invoiceHTML(iv2)],{type:"text/html"}));return true}
    case "bdel":{var kk=b.dataset.k;arm(b,function(){S[kk]=S[kk].filter(function(x){return x.id!==id});touch();render()});return true}
    case "kitdl":saveFile("media-kit.html",new Blob([kitHTML()],{type:"text/html"}));return true;
    case "kitcopy":copy(kitText());return true;
    case "clipadd":clipAdd();return true;
    case "clipf":clipTag=id;render();return true;
    case "clipstar":{var c1=findIn(S.clips,id);if(c1){c1.star=!c1.star;touch();render()}return true}
    case "clipdel":{arm(b,function(){S.clips=S.clips.filter(function(x){return x.id!==id});touch();render()});return true}
    case "clipmood":{var c2=findIn(S.clips,id);if(c2){S.mood.push({id:uid(),sp:S.cur,kind:"link",sec:"links",value:c2.url,label:c2.title||clipHost(c2.url)});touch();toast("Added to the moodboard")}return true}
    case "clipidea":{var c3=findIn(S.clips,id);if(c3){aiSaveIdea((c3.title||clipHost(c3.url))+(c3.note?": "+c3.note:"")+" "+(c3.tags||[]).map(function(t){return "#"+t}).join(" "));touch();toast("Saved as an idea")}return true}
    case "aihelper":aiH=id;aiRes=null;aiErr="";render();return true;
    case "airun":aiRun();return true;
    case "aistop":if(aiCtl)aiCtl.abort();return true;
    case "aicopy":{var tx=b.dataset.i==="all"?aiRes:(Array.isArray(aiRes)?aiRes[+b.dataset.i]:"");if(tx)copy(tx);return true}
    case "aisaveidea":{if(Array.isArray(aiRes)){aiSaveIdea(aiRes[+b.dataset.i]);touch();toast("Saved as an idea")}return true}
    case "aisaveall":{if(Array.isArray(aiRes)){aiRes.forEach(aiSaveIdea);touch();toast("Saved "+aiRes.length+" ideas");go("ideas")}return true}
    case "aisavenote":{if(typeof aiRes==="string"){var nn={id:uid(),sp:S.cur,title:(aiTopic.trim().slice(0,50)||aiHelper().name),body:aiRes,pin:false,ts:Date.now()};S.notes.push(nn);selNote=nn.id;touch();go("notes")}return true}
    case "mexport":mExport();return true;
    case "wbbg":wbBgCycle();return true;
  }
  return false;
}
document.addEventListener("input",function(e){
  var t=e.target,d=t.dataset||{};
  if(d.pf&&!readOnly){var p=d.pf.split("|"),po=findIn(S.posts,p[0]);if(po&&(p[1]==="title"||p[1]==="caption")){po[p[1]]=t.value;touch()}}
  if(d.bz&&!readOnly&&t.tagName!=="SELECT"){var z=d.bz.split("|"),o=findIn(S[z[0]],z[1]);if(o){o[z[2]]=(z[2]==="amount")?(+t.value||0):t.value;touch()}}
  if(d.kit&&!readOnly){var k=kit(),f=d.kit,mm;if(mm=f.match(/^([sr])(\d)([kv])$/)){var arr=mm[1]==="s"?k.stats:k.rates;arr[+mm[2]][mm[3]==="k"?0:1]=t.value}else k[f]=t.value;touch();var kp=$("kitprev");if(kp)kp.innerHTML=kitCard(k)}
  if(d.ai){if(d.ai==="topic")aiTopic=t.value}
  if(d.clipq){clipQ=t.value;var cl=$("cliplist");if(cl)cl.innerHTML=clipListHTML()}
});
document.addEventListener("change",function(e){
  var t=e.target,d=t.dataset||{};
  if(d.pf&&!readOnly){var p=d.pf.split("|"),po=findIn(S.posts,p[0]);if(po&&p[1]!=="title"&&p[1]!=="caption"){po[p[1]]=t.value;touch();render()}}
  if(d.bz&&!readOnly&&(t.tagName==="SELECT"||t.type==="date")){var z=d.bz.split("|"),o=findIn(S[z[0]],z[1]);if(o){o[z[2]]=t.value;touch();render()}}
  if(d.cfg&&!readOnly){if(!S.cfg)S.cfg={};S.cfg[d.cfg]=t.value;touch();render()}
  if(d.ai==="tone")aiTone=t.value;
  if(d.ai==="plat")aiPlat=t.value;
  if(d.ai==="src"&&t.value){var ty=t.value.slice(0,1),sid=t.value.slice(2),it=ty==="n"?findIn(S.notes,sid):findIn(S.ideas,sid);if(it){aiTopic=ty==="n"?((it.title?it.title+"\n":"")+(it.body||"").slice(0,600)):it.text.replace(/\s*#[\w-]+/g,"");render()}}
});

