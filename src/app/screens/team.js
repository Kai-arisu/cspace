/* ---------------- Team: people who work with you ---------------- */
var T={loaded:false,loading:false,members:[],work:[],pay:[],my:[],sel:null,tab:"team",form:false,msg:"",f:{name:"",role:"",email:"",kind:"salary",amount:"",start:"",end:"",login:true,seepay:true},wf:{},pf:{}};
function tmM(id){return T.members.filter(function(x){return x.id===id})[0]}
function tmErr(e){T.msg=(e&&e.message)||"Something went wrong. Try again.";render()}
async function tmLoad(){
  T.loading=true;
  try{
    var uid=window.__UID;
    var r=await Promise.all([
      WSB.from("team_members").select("*").eq("owner_id",uid).order("created_at"),
      WSB.from("team_work").select("*").eq("owner_id",uid).order("created_at",{ascending:false}),
      WSB.from("team_pay").select("*").eq("owner_id",uid).order("created_at",{ascending:false}),
      WSB.rpc("my_team")]);
    if(r[0].error)throw r[0].error;
    T.members=r[0].data||[];T.work=r[1].data||[];T.pay=r[2].data||[];T.my=Array.isArray(r[3].data)?r[3].data:[];
    if(!T.members.length&&T.my.length&&!T.tabSet){T.tab="mywork"}
    T.msg="";
  }catch(e){T.msg="Couldn't load your team. "+((e&&e.message)||"")}
  T.loaded=true;T.loading=false;tkSync();if(S.view==="team"||S.view==="home")render();
}
function tmProg(id){
  var w=T.work.filter(function(x){return x.member_id===id}),done=w.filter(function(x){return x.status==="done"}).length,td=ymd(new Date());
  var over=w.filter(function(x){return x.status!=="done"&&x.due&&x.due<td}).length;
  return {total:w.length,done:done,open:w.length-done,over:over,pct:w.length?Math.round(done/w.length*100):0};
}
function tmPayInfo(id){
  var p=T.pay.filter(function(x){return x.member_id===id}),due=0,paid=0;
  p.forEach(function(x){if(x.status==="paid")paid+=Number(x.amount);else due+=Number(x.amount)});
  return {due:due,paid:paid,n:p.length};
}
function tmBar(pct,c){return '<span class="vtrack" style="margin:6px 0"><span class="vfill" style="--c:'+(c||"var(--st-s)")+';width:'+pct+'%"></span></span>'}
function tmKind(m){return m.kind==="temp"?"Temporary":"Salary"}
function tmAmt(m){return m.kind==="temp"?money(m.amount)+" total":money(m.amount)+" / month"}
function tmHTML(){
  var own=T.tab!=="mywork"||!T.my.length;
  var h=hero("team","Team",own?"The people who work with you. Add work for them, see how it is going, and keep track of what you owe and have paid.":"Work other creators have given you, and how it is going.",
    own?'<button class="btn pri" data-act="tm_add">'+(T.form?"Close":"Add member")+'</button>':'');
  if(T.my.length)h+='<div class="hd-seg tm-tabs" role="group" aria-label="Team pages"><button data-act="tm_tab" data-id="team" aria-pressed="'+own+'">My team</button><button data-act="tm_tab" data-id="mywork" aria-pressed="'+!own+'">My work for others</button></div>';
  if(!T.loaded)return h+'<p class="muted">Loading…</p>';
  if(T.msg)h+='<p class="ac-errmsg">'+esc(T.msg)+'</p>';
  if(T.tab==="mywork"&&T.my.length)return h+tmMyHTML();
  var act=T.members.filter(function(m){return m.status==="active"}),openW=0,overW=0,due=0,paidM=0,mon=ymd(new Date()).slice(0,7);
  act.forEach(function(m){var g=tmProg(m.id);openW+=g.open;overW+=g.over});
  T.pay.forEach(function(x){if(x.status==="due")due+=Number(x.amount);else if(x.paid_on&&x.paid_on.slice(0,7)===mon)paidM+=Number(x.amount)});
  if(T.members.length)h+='<div class="stats tm-stats"><div class="stat"><b>'+act.length+'</b><span>Active members</span></div><div class="stat"><b>'+openW+'</b><span>Open work'+(overW?' · '+overW+' late':'')+'</span></div><div class="stat"><b>'+money(due)+'</b><span>To pay</span></div><div class="stat"><b>'+money(paidM)+'</b><span>Paid this month</span></div></div>';
  h+=agendaHTML();
  if(T.form)h+=tmFormHTML();
  if(!T.members.length&&!T.form)h+=emptyCard("users","No team yet","Add someone who works with you, like an editor or a designer. Give them work, track progress and keep a record of what you've paid. You choose whether they can sign in.",'<button class="btn pri sm" data-act="tm_add">Add your first member</button>');
  h+='<div class="tm-list">'+T.members.map(tmCardHTML).join("")+'</div>';
  return h;
}
function tmFormHTML(){
  var f=T.f,temp=f.kind==="temp";
  return '<section class="panel tm-form"><h3>New team member</h3>'+
   '<div class="tm-grid"><label class="plab">Name<input class="in" data-tmf="name" maxlength="80" value="'+esc(f.name)+'" placeholder="Their name"></label>'+
   '<label class="plab">Role<input class="in" data-tmf="role" maxlength="60" value="'+esc(f.role)+'" placeholder="Video editor, designer…"></label>'+
   '<label class="plab">Email (so they can sign in)<input class="in" type="email" data-tmf="email" maxlength="120" value="'+esc(f.email)+'" placeholder="name@email.com" autocapitalize="none" spellcheck="false"></label>'+
   '<div class="plab">How you pay them<div class="hd-seg" role="group"><button data-act="tm_kind" data-id="salary" aria-pressed="'+(!temp)+'">Monthly salary</button><button data-act="tm_kind" data-id="temp" aria-pressed="'+temp+'">Temporary hire</button></div></div>'+
   '<label class="plab">'+(temp?"Total fee":"Salary per month")+'<input class="in" inputmode="decimal" data-tmf="amount" maxlength="12" value="'+esc(f.amount)+'" placeholder="0"></label>'+
   '<label class="plab">Starts<input class="in" type="date" data-tmf="start" value="'+esc(f.start)+'"></label>'+
   (temp?'<label class="plab">Ends<input class="in" type="date" data-tmf="end" value="'+esc(f.end)+'"></label>':'')+'</div>'+
   '<label class="cp-pub"><input type="checkbox" data-tmf="login"'+(f.login?" checked":"")+'> Can sign in and see their own work</label>'+
   '<label class="cp-pub"><input type="checkbox" data-tmf="seepay"'+(f.seepay?" checked":"")+'> Can see their own pay</label>'+
   '<div class="drow"><button class="btn pri" data-act="tm_create">Add to team</button></div></section>';
}
function tmCardHTML(m){
  var g=tmProg(m.id),pi=tmPayInfo(m.id),open=T.sel===m.id,ended=m.status==="ended";
  var h='<article class="panel tm-card'+(ended?" ended":"")+'"><div class="tm-top"><span class="av lg tm-av">'+esc((m.name||"?").slice(0,1).toUpperCase())+'</span><div class="tm-id"><b>'+esc(m.name)+'</b><span class="muted">'+esc(m.role_title||"No role set")+'</span></div>'+
   '<span class="tm-badge '+(m.kind==="temp"?"temp":"sal")+'">'+tmKind(m)+(ended?" · ended":"")+'</span></div>'+
   '<div class="tm-meta"><span>'+tmAmt(m)+'</span><span>'+(m.can_login&&m.email?"Can sign in":"No sign-in")+'</span><span>'+(m.see_pay?"Sees own pay":"Pay hidden from them")+'</span></div>'+
   (g.total?'<div class="tm-prog"><span>'+g.done+' of '+g.total+' done'+(g.over?' · <b class="late">'+g.over+' late</b>':'')+'</span><span>'+g.pct+'%</span></div>'+tmBar(g.pct):'<p class="muted tm-none">No work assigned yet.</p>')+
   '<div class="tm-meta"><span>To pay: <b>'+money(pi.due)+'</b></span><span>Paid: <b>'+money(pi.paid)+'</b></span></div>'+
   '<div class="drow"><button class="btn sm" data-act="tm_open" data-id="'+m.id+'">'+(open?"Close":"Open")+'</button></div>';
  if(open)h+=tmDetailHTML(m);
  return h+'</article>';
}
function tmDetailHTML(m){
  var id=m.id,temp=m.kind==="temp",td=ymd(new Date());
  var det='<div class="tm-grid">'+
   '<label class="plab">Name<input class="in" data-tm="name" data-id="'+id+'" maxlength="80" value="'+esc(m.name)+'"></label>'+
   '<label class="plab">Role<input class="in" data-tm="role_title" data-id="'+id+'" maxlength="60" value="'+esc(m.role_title||"")+'"></label>'+
   '<label class="plab">Email<input class="in" type="email" data-tm="email" data-id="'+id+'" maxlength="120" value="'+esc(m.email||"")+'" autocapitalize="none"></label>'+
   '<label class="plab">'+(temp?"Total fee":"Salary per month")+'<input class="in" inputmode="decimal" data-tm="amount" data-id="'+id+'" maxlength="12" value="'+esc(m.amount)+'"></label>'+
   '<label class="plab">Starts<input class="in" type="date" data-tm="start_date" data-id="'+id+'" value="'+esc(m.start_date||"")+'"></label>'+
   (temp?'<label class="plab">Ends<input class="in" type="date" data-tm="end_date" data-id="'+id+'" value="'+esc(m.end_date||"")+'"></label>':'')+'</div>'+
   '<label class="cp-pub"><input type="checkbox" data-tm="can_login" data-id="'+id+'"'+(m.can_login?" checked":"")+'> Can sign in and see their own work</label>'+
   '<label class="cp-pub"><input type="checkbox" data-tm="see_pay" data-id="'+id+'"'+(m.see_pay?" checked":"")+'> Can see their own pay</label>'+
   '<label class="plab">Private notes (only you see these)<textarea class="in" rows="2" data-tm="notes" data-id="'+id+'" maxlength="2000">'+esc(m.notes||"")+'</textarea></label>'+
   '<div class="drow">'+(m.email?'<button class="btn sm" data-act="tm_mail" data-id="'+id+'">Email sign-in details</button>':'')+'<button class="btn sm" data-act="tm_end" data-id="'+id+'">'+(m.status==="ended"?"Bring back":"Mark as ended")+'</button><button class="btn sm" data-act="tm_del" data-id="'+id+'">Remove</button></div>';
  var h='<div class="tm-det">';
  var w=T.work.filter(function(x){return x.member_id===id});
  h+='<h4>Work</h4><div class="tm-add"><input class="in" data-tmw="title" data-id="'+id+'" maxlength="200" placeholder="Give them a piece of work" value="'+esc((T.wf[id]||{}).title||"")+'"><input class="in" type="date" data-tmw="due" data-id="'+id+'" value="'+esc((T.wf[id]||{}).due||"")+'" aria-label="Due date"><button class="btn pri" data-act="tm_wadd" data-id="'+id+'">Add</button></div>';
  h+=w.length?'<div class="tm-rows">'+w.map(function(x){var late=x.status!=="done"&&x.due&&x.due<td;return '<div class="tm-row"><span class="tm-t'+(x.status==="done"?" done":"")+'">'+esc(x.title)+(x.due?'<small class="'+(late?"late":"")+'"> · '+(late?"late · ":"")+esc(fmtDue(x.due))+'</small>':'')+'</span><select class="wsel" data-tmws="'+x.id+'" aria-label="Status"><option value="todo"'+(x.status==="todo"?" selected":"")+'>To do</option><option value="doing"'+(x.status==="doing"?" selected":"")+'>Doing</option><option value="done"'+(x.status==="done"?" selected":"")+'>Done</option></select><button class="ico" data-act="tm_wdel" data-id="'+x.id+'" aria-label="Delete work">'+I("x")+'</button></div>'}).join("")+'</div>':'<p class="muted tm-none">Nothing assigned.</p>';
  var pr=T.pay.filter(function(x){return x.member_id===id});
  var pf=T.pf[id]||{};
  h+='<h4>Pay</h4><div class="tm-add"><input class="in" data-tmp="label" data-id="'+id+'" maxlength="80" placeholder="What for, e.g. Nov 2026" value="'+esc(pf.label||"")+'"><input class="in" inputmode="decimal" data-tmp="amount" data-id="'+id+'" maxlength="12" placeholder="Amount" value="'+esc(pf.amount||"")+'"><button class="btn pri" data-act="tm_padd" data-id="'+id+'">Add</button></div>'+
   (temp?'':'<div class="drow"><button class="btn sm" data-act="tm_salary" data-id="'+id+'">Add '+esc(tmMonth())+' salary ('+money(m.amount)+')</button></div>');
  h+=pr.length?'<div class="tm-rows">'+pr.map(function(x){return '<div class="tm-row"><span class="tm-t">'+esc(x.label)+'<small> · '+money(x.amount)+(x.status==="paid"&&x.paid_on?' · paid '+esc(fmtDue(x.paid_on)):'')+'</small></span><button class="btn sm'+(x.status==="paid"?"":" pri")+'" data-act="tm_ppaid" data-id="'+x.id+'">'+(x.status==="paid"?"Paid":"Mark paid")+'</button><button class="ico" data-act="tm_pdel" data-id="'+x.id+'" aria-label="Delete pay entry">'+I("x")+'</button></div>'}).join("")+'</div>':'<p class="muted tm-none">No pay records yet.</p>';
  var dop=!!(T.detOpen&&T.detOpen[id]);
  return h+'<div class="tm-more"><button class="tm-mh" data-act="tm_det" data-id="'+id+'" aria-expanded="'+dop+'">'+I(dop?"chevu":"chevd")+'Details and access</button>'+(dop?det:'')+'</div></div>';
}
function tmMonth(){return new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"})}
function tmMyHTML(){
  var td=ymd(new Date());
  return '<div class="tm-list">'+T.my.map(function(m,mi){
    var w=m.work||[],done=w.filter(function(x){return x.status==="done"}).length,pct=w.length?Math.round(done/w.length*100):0;
    var h='<article class="panel tm-card"><div class="tm-top"><span class="av lg tm-av">'+esc((m.owner_email||"?").slice(0,1).toUpperCase())+'</span><div class="tm-id"><b>Working for '+esc(m.owner_email||"")+'</b><span class="muted">'+esc(m.role_title||"Team member")+'</span></div><span class="tm-badge '+(m.kind==="temp"?"temp":"sal")+'">'+tmKind(m)+'</span></div>';
    if(m.see_pay&&m.amount!=null)h+='<div class="tm-meta"><span>'+tmAmt(m)+'</span>'+(m.start_date?'<span>From '+esc(fmtDue(m.start_date))+'</span>':'')+(m.end_date?'<span>Until '+esc(fmtDue(m.end_date))+'</span>':'')+'</div>';
    h+=(w.length?'<div class="tm-prog"><span>'+done+' of '+w.length+' done</span><span>'+pct+'%</span></div>'+tmBar(pct):'<p class="muted tm-none">No work assigned to you yet.</p>');
    h+=w.length?'<h4>Your work</h4><div class="tm-rows">'+w.map(function(x){var late=x.status!=="done"&&x.due&&x.due<td;return '<div class="tm-row"><span class="tm-t'+(x.status==="done"?" done":"")+'">'+esc(x.title)+(x.due?'<small class="'+(late?"late":"")+'"> · '+(late?"late · ":"")+esc(fmtDue(x.due))+'</small>':'')+'</span><select class="wsel" data-tmmy="'+x.id+'" aria-label="Status"><option value="todo"'+(x.status==="todo"?" selected":"")+'>To do</option><option value="doing"'+(x.status==="doing"?" selected":"")+'>Doing</option><option value="done"'+(x.status==="done"?" selected":"")+'>Done</option></select></div>'}).join("")+'</div>':'';
    if(m.see_pay&&Array.isArray(m.pay)){h+='<h4>Your pay</h4>'+(m.pay.length?'<div class="tm-rows">'+m.pay.map(function(x){return '<div class="tm-row"><span class="tm-t">'+esc(x.label)+'<small> · '+money(x.amount)+'</small></span><span class="tm-badge '+(x.status==="paid"?"sal":"temp")+'">'+(x.status==="paid"?"Paid"+(x.paid_on?" "+esc(fmtDue(x.paid_on)):""):"Due")+'</span></div>'}).join("")+'</div>':'<p class="muted tm-none">No pay records yet.</p>')}
    else h+='<p class="muted tm-none" style="margin-top:10px">Pay details are not shared with you here.</p>';
    return h+'</article>'}).join("")+'</div>';
}
async function tmCreate(){
  var f=T.f,name=(f.name||"").trim(),em=(f.email||"").trim().toLowerCase(),amt=Number(String(f.amount||"0").replace(/,/g,""));
  if(!name){T.msg="Add a name first.";render();return}
  if(em&&!/^\S+@\S+\.\S+$/.test(em)){T.msg="That email doesn't look right.";render();return}
  if(em&&em===String(window.__EMAIL||"").toLowerCase()){T.msg="That is your own email.";render();return}
  if(!isFinite(amt)||amt<0){T.msg="Enter the amount as a number.";render();return}
  var row={name:name,role_title:(f.role||"").trim()||null,email:em||null,kind:f.kind,amount:amt,start_date:f.start||null,end_date:f.kind==="temp"?(f.end||null):null,can_login:!!(f.login&&em),see_pay:!!f.seepay};
  var r=await WSB.from("team_members").insert(row).select("*").single();
  if(r.error){T.msg=r.error.code==="23505"?"You already added someone with that email.":"Couldn't add them. "+r.error.message;render();return}
  T.members.push(r.data);T.form=false;T.sel=r.data.id;T.msg="";
  T.f={name:"",role:"",email:"",kind:"salary",amount:"",start:"",end:"",login:true,seepay:true};
  toast(name+" added to your team");render();
}
async function tmPatch(id,patch,rerender){
  var m=tmM(id);if(!m)return;
  var r=await WSB.from("team_members").update(patch).eq("id",id);
  if(r.error){T.msg=r.error.code==="23505"?"Someone with that email is already on your team.":"Couldn't save. "+r.error.message;render();return}
  Object.assign(m,patch);T.msg="";if(rerender)render();
}
async function tmDelete(id){
  var r=await WSB.from("team_members").delete().eq("id",id);
  if(r.error){T.msg="Couldn't remove them.";render();return}
  T.members=T.members.filter(function(x){return x.id!==id});T.work=T.work.filter(function(x){return x.member_id!==id});T.pay=T.pay.filter(function(x){return x.member_id!==id});
  if(T.sel===id)T.sel=null;toast("Removed from your team");render();
}
function tmMail(id,fb){
  var m=tmM(id);if(!m||!m.email)return;
  if(!fb){sendInvite(m.email,function(){tmMail(id,true)},function(t){toast(t)});return}
  var who=(S.profile&&S.profile.name)||String(window.__EMAIL||"").split("@")[0];
  var body="Hi "+m.name+",\n\nI added you to my team on Creator Space.\n\n1. Open "+location.origin+"\n2. Sign in, or create an account, with this email: "+m.email+"\n3. Open Team and choose \"My work for others\" to see your work"+(m.see_pay?", progress and pay":" and progress")+".\n\nThanks,\n"+who;
  var a=document.createElement("a");a.href="mailto:"+encodeURIComponent(m.email)+"?subject="+encodeURIComponent(who+" added you to their team")+"&body="+encodeURIComponent(body);
  document.body.appendChild(a);a.click();a.remove();
  try{navigator.clipboard&&navigator.clipboard.writeText(body).catch(function(){})}catch(e){}
  toast("Your email app opened. The text is also copied.");
}
async function tmWorkAdd(id){
  var f=T.wf[id]||{},t=(f.title||"").trim();if(!t){toast("Type what the work is first");return}
  var r=await WSB.from("team_work").insert({member_id:id,title:t,due:f.due||null}).select("*").single();
  if(r.error){T.msg="Couldn't add the work. "+r.error.message;render();return}
  T.work.unshift(r.data);T.wf[id]={};render();
}
async function tmWorkDel(id){var r=await WSB.from("team_work").delete().eq("id",id);if(!r.error){T.work=T.work.filter(function(x){return x.id!==id});render()}}
async function tmWorkStatus(id,st){
  var w=T.work.filter(function(x){return x.id===id})[0];if(!w)return;
  var patch={status:st,done_at:st==="done"?new Date().toISOString():null};
  var r=await WSB.from("team_work").update(patch).eq("id",id);if(!r.error){Object.assign(w,patch);tkSync();render()}
}
async function tmPayAdd(id,salary){
  var m=tmM(id);if(!m)return;var pf=T.pf[id]||{},label,amt;
  if(salary){label=tmMonth()+" salary";amt=Number(m.amount)}
  else{label=(pf.label||"").trim();amt=Number(String(pf.amount||"").replace(/,/g,""))}
  if(!label){toast("Say what the payment is for");return}
  if(!isFinite(amt)||amt<=0){toast("Enter an amount above zero");return}
  var r=await WSB.from("team_pay").insert({member_id:id,label:label,amount:amt}).select("*").single();
  if(r.error){T.msg="Couldn't add the payment. "+r.error.message;render();return}
  T.pay.unshift(r.data);T.pf[id]={};render();
}
async function tmPayToggle(id){
  var p=T.pay.filter(function(x){return x.id===id})[0];if(!p)return;
  var patch=p.status==="paid"?{status:"due",paid_on:null}:{status:"paid",paid_on:ymd(new Date())};
  var r=await WSB.from("team_pay").update(patch).eq("id",id);if(!r.error){Object.assign(p,patch);render()}
}
async function tmPayDel(id){var r=await WSB.from("team_pay").delete().eq("id",id);if(!r.error){T.pay=T.pay.filter(function(x){return x.id!==id});render()}}
async function tmMyStatus(id,st){
  var r=await WSB.rpc("my_work_update",{p_id:id,p_status:st});
  if(r.error||r.data!==true){toast("Couldn't update that");return}
  T.my.forEach(function(m){(m.work||[]).forEach(function(x){if(x.id===id){x.status=st;x.done_at=st==="done"?new Date().toISOString():null}})});render();
}
document.addEventListener("input",function(e){
  var t=e.target;if(!t||!t.dataset)return;var d=t.dataset;
  if(d.tmf){T.f[d.tmf]=t.type==="checkbox"?t.checked:t.value}
  else if(d.tmw){(T.wf[d.id]=T.wf[d.id]||{})[d.tmw]=t.value}
  else if(d.tmp){(T.pf[d.id]=T.pf[d.id]||{})[d.tmp]=t.value}
});
document.addEventListener("change",function(e){
  var t=e.target;if(!t||!t.dataset)return;var d=t.dataset;
  if(d.tmf&&t.type==="checkbox"){T.f[d.tmf]=t.checked}
  else if(d.tmf==="start"||d.tmf==="end"){T.f[d.tmf]=t.value}
  else if(d.tmws){tmWorkStatus(d.tmws,t.value)}
  else if(d.tmmy){tmMyStatus(d.tmmy,t.value)}
  else if(d.tm){
    var f=d.tm,v=t.type==="checkbox"?t.checked:t.value,patch={};
    if(f==="amount"){v=Number(String(v).replace(/,/g,""));if(!isFinite(v)||v<0){toast("Enter the amount as a number");return}}
    else if(f==="email"){v=String(v).trim().toLowerCase()||null;if(v&&!/^\S+@\S+\.\S+$/.test(v)){toast("That email doesn't look right");return}}
    else if(f==="start_date"||f==="end_date"){v=v||null}
    else if(f==="name"){v=String(v).trim();if(!v){toast("A name is needed");return}}
    else if(f==="role_title"||f==="notes"){v=String(v).trim()||null}
    patch[f]=v;tmPatch(d.id,patch,t.type==="checkbox"||f==="amount"||f==="name"||f==="email");
  }
});
/* v11: load team in the background so late team work reaches the bell and Today */
(function(){var tries=0;function go(){if(window.__WS){return}if(!window.__UID||!WSB){if(++tries<40)setTimeout(go,500);return}
  try{if(!W.loaded&&!W.loading)audLoad(true)}catch(e){}
  try{isoLoad()}catch(e){}
  try{Promise.all([W.pLoaded?0:cpLoad(),PUSH.ready?0:pushRefresh()]).then(function(){if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()})}catch(e){}
  if(T.loaded||T.loading)return;tmLoad().then(function(){try{paintBell();if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()}catch(e){}})}
  setTimeout(go,1200)})();

function todayAud(many){
  try{if(typeof W==="undefined"||!W.loaded)return "";var own=W.conns.filter(function(c){return c.kind==="own"});if(!own.length||(many&&own.length<2))return "";
  return '<section class="panel td-aud"><h2>Audience <span class="cnt">'+own.length+'</span><button class="lnk" data-act="view" data-id="aud">View all</button></h2><div class="td-audl">'+own.slice(0,3).map(function(c){
    var arr=W.snaps[c.id]||[],last=arr.length?arr[arr.length-1]:null,cur=last&&last.followers!=null?Number(last.followers):null,d7=deltaOf(arr,"followers",7*864e5);
    var pc=c.goal&&cur!=null?Math.max(0,Math.min(100,Math.round(cur/c.goal*100))):null;
    return '<button class="td-ac" data-act="view" data-id="aud" style="--c:'+audCol(c.platform)+'"><span class="tn"><i></i>'+esc(c.title||c.handle||platName(c.platform))+'</span><b>'+nf(cur)+'</b>'+(d7?'<em class="dl '+(d7>0?"up":"down")+'">'+(d7>0?"+":"-")+nf(Math.abs(d7))+' this week</em>':'<em class="muted">No change this week</em>')+
      (pc!=null?'<span class="td-gl"><span style="width:'+pc+'%"></span></span><small>'+pc+'% of '+nf(c.goal)+' goal</small>':'')+'</button>'}).join("")+'</div></section>'}catch(e){return ""}
}

/* v11: board task <-> team work */
function tkMembers(){return (typeof T!=="undefined"&&T.loaded&&!window.__WS)?T.members.filter(function(m){return m.status==="active"}):[]}
function tkAssignDlg(taskId){
  var t=S.tasks.filter(function(x){return x.id===taskId})[0];if(!t)return;var ms=tkMembers();
  if(!ms.length){showInfo("Assign to a teammate",'<p style="margin:0 0 12px">Add people on the Team page first, then you can hand them tasks from the board.</p><button class="btn pri" data-act="view" data-id="team">Open Team</button>');return}
  showInfo("Assign “"+t.title+"”",'<p class="muted" style="margin:0 0 10px">They see it under “My work”. When they mark it done, the task moves to Review here.</p><div class="tk-ms">'+ms.map(function(m){
    return '<button class="tk-m" data-act="tk_assignto" data-id="'+m.id+'" data-task="'+t.id+'"><span class="av sm">'+esc((m.name||"?").slice(0,1).toUpperCase())+'</span><span><b>'+esc(m.name)+'</b><i>'+esc(m.role_title||"")+'</i></span></button>'}).join("")+'</div>');
}
async function tkAssign(taskId,mid){
  var t=S.tasks.filter(function(x){return x.id===taskId})[0],m=tmM(mid);if(!t||!m)return;
  var r=await WSB.from("team_work").insert({member_id:mid,title:t.title,due:t.due||null}).select("*").single();
  if(r.error){toast("Couldn't assign. "+r.error.message);return}
  T.work.unshift(r.data);t.tw=r.data.id;t.who=m.name;if(t.col==="i")t.col="m";touch();
  try{infoHTML="";renderDialog()}catch(e){}render();toast("Assigned to "+m.name);
}
function tkSync(){
  try{var ch=false;S.tasks.forEach(function(t){if(!t.tw)return;var w=T.work.filter(function(x){return x.id===t.tw})[0];
    if(!w){delete t.tw;delete t.who;ch=true;return}
    if(w.status==="done"&&(t.col==="i"||t.col==="m")){t.col="r";ch=true;toast((t.who||"A teammate")+" finished “"+t.title+"”")}});
  if(ch){touch();render()}}catch(e){}
}

/* v12: first-run checklist + sample space */
function obSteps(){
  var named=!!(S.cfg&&S.cfg.spNamed)||S.spaces.some(function(x){return x.name!=="My channel"&&!/^Sample/.test(x.name)});
  var ch=typeof W!=="undefined"&&W.loaded&&W.conns.some(function(c){return c.kind==="own"});
  var pg=typeof W!=="undefined"&&W.p&&W.p.exists;
  var al=typeof PUSH!=="undefined"&&PUSH.on;
  return [
    {k:"name",done:named,t:"Name your space",d:"A space holds one channel or project. Call it what you call your channel."},
    {k:"idea",done:S.ideas.length>0,t:"Capture your first idea",d:"Type it in the box above and press Idea. Add #tags to sort later.",a:'<button class="btn sm" data-act="ob_focus">Write an idea</button>'},
    {k:"task",done:S.tasks.some(function(t){return t.due}),t:"Plan a task with a date",d:"Dated tasks show on your Calendar and in the bell when they're due.",a:'<button class="btn sm" data-act="view" data-id="cal">Open Calendar</button>'},
    {k:"chan",done:ch,t:"Connect your channel",d:"Paste your YouTube link to track subscribers and set a goal.",a:'<button class="btn sm" data-act="view" data-id="aud">Connect</button>'},
    {k:"page",done:pg,t:"Publish your creator page",d:"One link with your handles and live numbers, for your bio.",a:'<button class="btn sm" data-act="view" data-id="cp">Set up page</button>'},
    {k:"push",done:al,t:"Turn on phone alerts",d:"A morning summary of what's due, and a ping when you hit a goal.",a:'<button class="btn sm" data-act="view" data-id="cp">Turn on</button>'}
  ].concat(typeof surveySteps==="function"?surveySteps():[]);
}
function obHTML(){
  if(readOnly||window.__WS||(S.cfg&&S.cfg.obDone))return "";
  var st=obSteps(),n=st.filter(function(x){return x.done}).length;if(n===st.length)return "";
  var nextIdx=st.map(function(x){return x.done}).indexOf(false);
  var h='<section class="panel ob"><div class="ob-h"><div><h2 style="margin:0">Get set up</h2><span class="muted">'+n+' of '+st.length+' done</span></div><div class="ob-acts">'+
    (S.spaces.some(function(x){return /^Sample/.test(x.name)})?'':'<button class="btn sm" data-act="ob_sample">Explore with sample data</button>')+'<button class="btn sm" data-act="ob_hide">Hide</button></div></div>'+
    '<div class="ob-bar"><i style="width:'+Math.round(n/st.length*100)+'%"></i></div><ol class="ob-l">';
  st.forEach(function(x,i){
    var open=i===nextIdx;
    h+='<li class="'+(x.done?"done":"")+(open?" open":"")+'"><span class="ob-c">'+(x.done?I("check"):(i+1))+'</span><div class="ob-t"><b>'+x.t+'</b>'+(open?'<p>'+x.d+'</p>'+(x.k==="name"?'<div class="ob-name"><input class="in" id="obname" maxlength="40" value="'+esc(spaceName())+'" aria-label="Space name"><button class="btn pri sm" data-act="ob_name">Save</button></div>':(x.a||"")):'')+'</div></li>';
  });
  return h+'</ol></section>';
}
function obFresh(){return !mine("tasks").length&&!mine("ideas").length&&!mine("notes").length&&!mine("posts").length}
function obSample(){
  var id="s"+uid(),d=function(n){return ymd(new Date(Date.now()+n*864e5))},now=Date.now(),U=function(){return uid()};
  S.spaces.push({id:id,name:"Sample: Travel vlog"});
  var i1=U(),i2=U();
  S.ideas.push({id:i1,sp:id,text:"Street food tour in Jaipur #food #vlog",tags:["food","vlog"],star:true,task:false,ts:now-36e5},{id:i2,sp:id,text:"Budget travel hacks for students #travel",tags:["travel"],star:false,task:false,ts:now-72e5},{id:U(),sp:id,text:"What I packed for 7 days in Ladakh #packing",tags:["packing"],star:false,task:false,ts:now-9e6});
  S.tasks.push({id:U(),sp:id,title:"Design thumbnail",col:"i",due:d(-1),pri:2,ts:now-5e6},{id:U(),sp:id,title:"Edit Ladakh vlog",col:"m",due:d(1),pri:1,ts:now-4e6},{id:U(),sp:id,title:"Write captions for reels",col:"i",due:d(3),pri:0,ts:now-3e6},{id:U(),sp:id,title:"Reply to sponsor email",col:"s",due:d(-2),pri:0,ts:now-2e6,done:now-1e6});
  S.notes.push({id:U(),sp:id,title:"Ladakh vlog script",body:"## Hook\n7 days, one backpack.\n\n## Checklist\n- [ ] Film the sunrise at Pangong\n- [ ] Record voiceover\n\n## Outro\nAsk people to subscribe.",pin:true,ts:now-3e6});
  S.posts.push({id:U(),sp:id,title:"Jaipur street food reel",platform:"Instagram",date:d(0),status:"scheduled",ideaId:"",ts:now},{id:U(),sp:id,title:"Ladakh vlog: 7 days",platform:"YouTube",date:d(2),status:"editing",ideaId:"",ts:now},{id:U(),sp:id,title:"Budget travel tips short",platform:"YouTube",date:d(5),status:"script",ideaId:i2,ts:now});
  S.clips.push({id:U(),sp:id,url:"https://www.youtube.com/@NatGeo",title:"Great travel intro",note:"Study the pacing",tags:["editing"],star:false,ts:now});
  S.deals.push({id:U(),sp:id,brand:"Trail Bags Co.",amount:20000,status:"talking",due:d(10),ts:now});
  S.income.push({id:U(),sp:id,date:d(-6),source:"YouTube AdSense",amount:8200,cat:"Ads"});
  S.cur=id;touch();go("home");toast("Sample space added. Delete it any time from Space settings at the bottom of Today.");
}

/* v12: read private (isolated) spaces so the bell and search can see them */
var ISO={loaded:false,loading:false,d:{}};
async function isoLoad(){
  if(window.__WS||!Array.isArray(S.iso)||!S.iso.length||ISO.loading)return;ISO.loading=true;
  try{
    for(var i=0;i<S.iso.length;i++){
      var sp=S.iso[i],r=await WSB.from("docs").select("path,data").like("path","sp/"+sp.id+"/store/k_%");
      if(r.error)continue;var parts={};
      (r.data||[]).forEach(function(row){var m=row.path.match(/store\/k_(.+)_(\d+)$/);if(!m||!row.data)return;(parts[m[1]]=parts[m[1]]||[])[+m[2]]=row.data.s||""});
      var out={name:sp.name};
      Object.keys(parts).forEach(function(k){try{var v=JSON.parse(parts[k].join(""));if(Array.isArray(v))out[k]=v}catch(e){}});
      ISO.d[sp.id]=out;
    }
    ISO.loaded=true;
  }catch(e){}
  ISO.loading=false;try{paintBell();if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render()}catch(e){}
}
function isoAll(k){
  var out=[];if(!ISO.loaded)return out;
  Object.keys(ISO.d).forEach(function(id){(ISO.d[id][k]||[]).forEach(function(x){var c=Object.assign({},x);c.sp=id;c._iso=1;out.push(c)})});
  return out;
}
function isoName(id){var x=(S.iso||[]).filter(function(i){return i.id===id})[0];return x?x.name:""}

/* v12: real invite emails, falling back to the email app */
async function sendInvite(email,fallback,say){
  say("Sending the invite…");
  try{
    var r=await WSB.functions.invoke("invite",{body:{email:email}});
    if(!r.error){say(r.data&&r.data.kind==="login"?"They already have an account, so we emailed them a sign-in link.":"Invite email sent to "+email+".");return}
    var info=null;try{info=await r.error.context.json()}catch(e){}
    if(info&&(info.error==="already_sent"||info.error==="not_invited"||info.error==="bad_email"||info.error==="self")){say(info.message);return}
  }catch(e){}
  say("Couldn't send it from here, so your email app will open instead.");fallback();
}

/* v14: teleprompter */
var TP={on:false,run:false,y:0,speed:3,size:44,mirror:false,raf:0,last:0,lock:null,count:0};
function tpText(){var n=S.notes.filter(function(x){return x.id===selNote})[0];if(!n)return "";
  return (n.title?n.title+"\n\n":"")+String(n.body||"").replace(/^#{1,6}\s*/gm,"").replace(/^\s*[-*]\s+\[[ xX]\]\s*/gm,"").replace(/^\s*[-*]\s+/gm,"• ").replace(/^---+$/gm,"")}
function tpOpen(){
  var t=tpText();if(!t.trim()){toast("Write something in this note first");return}
  try{var pr=JSON.parse(localStorage.getItem("cs-tp")||"{}");if(pr.speed)TP.speed=pr.speed;if(pr.size)TP.size=pr.size;TP.mirror=!!pr.mirror}catch(e){}
  var el=$("tp");if(!el){el=document.createElement("div");el.id="tp";el.className="tp";document.body.appendChild(el)}
  TP.on=true;TP.run=false;TP.y=0;TP.count=0;
  el.innerHTML='<div class="tp-view" id="tpview"><div class="tp-text" id="tptext"></div></div><div class="tp-line"></div><div class="tp-count" id="tpcount" hidden></div>'+
    '<div class="tp-bar"><button class="tp-b" data-act="tp_close" aria-label="Close">'+I("x")+'</button><button class="tp-b" data-act="tp_restart" aria-label="Back to start">'+I("undo")+'</button>'+
    '<span class="tp-g"><button class="tp-b" data-act="tp_speed" data-d="-1" aria-label="Slower">'+I("minus")+'</button><span id="tpsp" class="tp-v"></span><button class="tp-b" data-act="tp_speed" data-d="1" aria-label="Faster">'+I("plus")+'</button></span>'+
    '<button class="tp-play" data-act="tp_play" id="tpplay" aria-label="Play">'+I("play")+'</button>'+
    '<span class="tp-g"><button class="tp-b" data-act="tp_size" data-d="-4" aria-label="Smaller text">A−</button><button class="tp-b" data-act="tp_size" data-d="4" aria-label="Bigger text">A+</button></span>'+
    '<button class="tp-b" data-act="tp_mirror" id="tpmir" aria-label="Mirror">⇋</button></div>';
  $("tptext").textContent=t;el.hidden=false;document.documentElement.classList.add("tp-open");tpPaint();tpApply();
}
function tpSave(){try{localStorage.setItem("cs-tp",JSON.stringify({speed:TP.speed,size:TP.size,mirror:TP.mirror}))}catch(e){}}
function tpPaint(){var t=$("tptext");if(!t)return;t.style.fontSize=TP.size+"px";$("tpview").classList.toggle("mir",TP.mirror);$("tpmir").setAttribute("aria-pressed",TP.mirror);$("tpsp").textContent="Speed "+TP.speed;$("tpplay").innerHTML=I(TP.run?"pause":"play");$("tpplay").setAttribute("aria-label",TP.run?"Pause":"Play");tpSave()}
function tpApply(){var t=$("tptext");if(t)t.style.transform="translateY("+(-TP.y)+"px)"}
function tpSpeed(d){TP.speed=Math.max(1,Math.min(10,TP.speed+d));tpPaint()}
function tpSize(d){TP.size=Math.max(24,Math.min(96,TP.size+d));tpPaint()}
function tpStep(ts){
  if(!TP.run)return;var dt=TP.last?Math.min(100,ts-TP.last):16;TP.last=ts;
  var t=$("tptext"),v=$("tpview");if(!t||!v){TP.run=false;return}
  TP.y+=TP.speed*TP.size*0.012*dt/16;var max=t.scrollHeight-v.clientHeight*0.3;
  if(TP.y>=max){TP.y=max;TP.run=false;tpPaint()}
  tpApply();if(TP.run)TP.raf=requestAnimationFrame(tpStep);
}
function tpToggle(){
  if(TP.run){TP.run=false;cancelAnimationFrame(TP.raf);tpPaint();return}
  var c=$("tpcount");if(TP.count)return;
  if(TP.y===0&&c){TP.count=3;c.hidden=false;c.textContent="3";var iv=setInterval(function(){TP.count--;if(TP.count>0){c.textContent=String(TP.count)}else{clearInterval(iv);c.hidden=true;tpGo()}},800);return}
  tpGo();
}
function tpGo(){TP.count=0;TP.run=true;TP.last=0;tpPaint();TP.raf=requestAnimationFrame(tpStep);try{if(navigator.wakeLock&&!TP.lock)navigator.wakeLock.request("screen").then(function(l){TP.lock=l}).catch(function(){})}catch(e){}}
function tpClose(){TP.on=false;TP.run=false;cancelAnimationFrame(TP.raf);var el=$("tp");if(el){el.hidden=true;el.innerHTML=""}document.documentElement.classList.remove("tp-open");try{if(TP.lock){TP.lock.release();TP.lock=null}}catch(e){}}
document.addEventListener("keydown",function(e){
  if(!TP.on)return;
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();tpClose()}
  else if(e.key===" "||e.key==="Enter"){e.preventDefault();e.stopPropagation();tpToggle()}
  else if(e.key==="ArrowUp"){e.preventDefault();tpSpeed(1)}
  else if(e.key==="ArrowDown"){e.preventDefault();tpSpeed(-1)}
  else if(e.key==="ArrowLeft"){e.preventDefault();TP.y=Math.max(0,TP.y-TP.size*3);tpApply()}
  else if(e.key==="ArrowRight"){e.preventDefault();TP.y+=TP.size*3;tpApply()}
},true);
document.addEventListener("click",function(e){if(TP.on&&e.target&&e.target.closest&&e.target.closest("#tpview"))tpToggle()});
document.addEventListener("wheel",function(e){if(TP.on&&e.target.closest&&e.target.closest("#tpview")){TP.y=Math.max(0,TP.y+e.deltaY);tpApply()}},{passive:true});

/* v14: caption & hashtag bank */
var BK={kind:"caption",f:"all",q:"",edit:null};
var BKK=[["caption","Caption"],["tags","Hashtags"],["hook","Hook"]];
function bkList(){return Array.isArray(S.bank)?S.bank:(S.bank=[])}
function bkTags(t){return (String(t).match(/#[\wऀ-ॿ]+/g)||[])}
function bankHTML(){
  var L=bkList(),ed=BK.edit?L.filter(function(x){return x.id===BK.edit})[0]:null,kind=ed?ed.kind:BK.kind;
  var h=hero("bank","Caption bank",null,"");
  if(!readOnly)h+='<section class="panel bk-form"><div class="hd-seg" role="group" aria-label="Type">'+BKK.map(function(k){return '<button data-act="bk_kind" data-id="'+k[0]+'" aria-pressed="'+(kind===k[0])+'"'+(ed?" disabled":"")+'>'+k[1]+'</button>'}).join("")+'</div>'+
    '<input class="in" id="bktitle" aria-label="Caption name" maxlength="60" placeholder="Name it, e.g. Travel reel caption" value="'+esc(ed?ed.title||"":"")+'">'+
    '<textarea class="in" id="bktext" aria-label="Caption text" rows="4" maxlength="2200" placeholder="'+(kind==="tags"?"#travel #vlog #india …":kind==="hook"?"The first line that stops the scroll…":"Your caption. Use {topic} where the topic changes.")+'">'+esc(ed?ed.text:"")+'</textarea>'+
    '<div class="bk-fa"><span class="muted" id="bkcount"></span>'+(ed?'<button class="btn sm" data-act="bk_cancel">Cancel</button>':'')+'<button class="btn pri sm" data-act="bk_save">'+(ed?"Save changes":"Save to bank")+'</button></div></section>';
  if(!L.length)return h+emptyCard("text","Build your caption bank","Keep the captions, hashtag sets and opening hooks you use again and again. Copy them with one tap, or drop them into a planned post from the Calendar.",readOnly?"":'<button class="btn sm" data-act="bk_starter">Add a starter set</button>');
  var cnt={all:L.length};BKK.forEach(function(k){cnt[k[0]]=L.filter(function(x){return x.kind===k[0]}).length});
  h+='<div class="bk-bar"><div class="chips" role="group" aria-label="Filter">'+[["all","All"]].concat(BKK.map(function(k){return [k[0],k[1]==="Hook"?"Hooks":k[1]+(k[0]==="caption"?"s":"")]})).map(function(k){return '<button class="chip" data-act="bk_filter" data-id="'+k[0]+'" aria-pressed="'+(BK.f===k[0])+'">'+k[1]+' '+cnt[k[0]]+'</button>'}).join("")+'</div><input class="in" id="bkq" placeholder="Search the bank" value="'+esc(BK.q)+'" aria-label="Search the bank"></div>';
  h+='<div class="bk-grid" id="bkgrid">'+bkCards()+'</div>';
  return h;
}
function bkCards(){
  var q=BK.q.toLowerCase(),L=bkList().filter(function(x){return (BK.f==="all"||x.kind===BK.f)&&(!q||(x.title+" "+x.text).toLowerCase().indexOf(q)>-1)}).sort(function(a,b){return (b.uses||0)-(a.uses||0)||b.ts-a.ts});
  if(!L.length)return '<div class="empty">Nothing matches.</div>';
  return L.map(function(x){
    var tags=x.kind==="tags"?bkTags(x.text):[];
    return '<article class="bk-card k-'+x.kind+'"><div class="bk-h"><span class="bk-k">'+(x.kind==="tags"?"#":x.kind==="hook"?"Hook":"Caption")+'</span><b>'+esc(x.title||x.text.split("\n")[0].slice(0,40))+'</b></div>'+
      (x.kind==="tags"?'<div class="bk-tags">'+tags.slice(0,14).map(function(t){return '<span>'+esc(t)+'</span>'}).join("")+(tags.length>14?'<span>+'+(tags.length-14)+'</span>':'')+'</div>':'<p class="bk-t">'+esc(x.text)+'</p>')+
      '<div class="bk-f"><span class="muted">'+(x.kind==="tags"?tags.length+" tags · ":"")+x.text.length+' chars'+(x.uses?' · used '+x.uses+'×':'')+'</span><span class="bk-a"><button class="btn sm pri" data-act="bk_copy" data-id="'+x.id+'">Copy</button>'+(readOnly?'':'<button class="ico" data-act="bk_edit" data-id="'+x.id+'" aria-label="Edit">'+I("pen")+'</button><button class="ico danger" data-act="bk_del" data-id="'+x.id+'" aria-label="Delete">'+I("x")+'</button>')+'</span></div></article>';
  }).join("");
}
function bkSave(){
  var t=($("bktext").value||"").trim(),ti=($("bktitle").value||"").trim();if(!t){toast("Write something first");return}
  if(BK.edit){var x=bkList().filter(function(z){return z.id===BK.edit})[0];if(x){x.text=t;x.title=ti;x.ts=Date.now()}BK.edit=null;toast("Saved")}
  else{bkList().unshift({id:uid(),kind:BK.kind,title:ti,text:t,uses:0,ts:Date.now()});toast("Saved to your bank")}
  touch();render();
}
function bkCopy(id){
  var x=bkList().filter(function(z){return z.id===id})[0];if(!x)return;
  var done=function(){x.uses=(x.uses||0)+1;if(!readOnly)touch();var g=$("bkgrid");if(g)g.innerHTML=bkCards();toast("Copied")};
  try{navigator.clipboard.writeText(x.text).then(done,function(){bkFallback(x.text);done()})}catch(e){bkFallback(x.text);done()}
}
function bkFallback(t){var a=document.createElement("textarea");a.value=t;a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove()}
function bkStarter(){
  var n=Date.now(),L=bkList();
  [["caption","Behind the scenes","Here's what it actually took to make this one 👇\n\nSave it for later and tell me what you'd do differently."],
   ["caption","Question to comments","Be honest: would you try this? Yes or no in the comments 👇"],
   ["hook","Mistake hook","I wasted months doing this wrong, so you don't have to."],
   ["hook","Result first","This is the result. Here's exactly how I got there."],
   ["tags","Travel set","#travel #travelvlog #india #backpacking #budgettravel #wanderlust #explore #travelgram"],
   ["tags","Creator set","#contentcreator #youtuber #creatorlife #behindthescenes #filmmaking #vlog"]].forEach(function(r,i){L.push({id:uid(),kind:r[0],title:r[1],text:r[2],uses:0,ts:n-i})});
  touch();render();toast("Starter set added. Edit them to sound like you.");
}
document.addEventListener("input",function(e){
  var t=e.target;if(!t)return;
  if(t.id==="bkq"){BK.q=t.value;var g=$("bkgrid");if(g)g.innerHTML=bkCards()}
  if(t.id==="bktext"){var c=$("bkcount");if(c){var tg=bkTags(t.value).length;c.textContent=t.value.length+" chars"+(tg?" · "+tg+" tags":"")+(tg>30?" · Instagram allows 30":"")}}
});

/* v14: repurpose one idea into a planned set */
var RPF=[
  ["long","Long video","YouTube",0,true,"Edit the long video"],
  ["shorts","Shorts","Shorts",1,true,"Cut the Shorts"],
  ["reel","Reel","Instagram",1,true,"Cut the Reel"],
  ["tiktok","TikTok","TikTok",2,true,""],
  ["carousel","Carousel","Instagram",3,false,"Design the carousel"],
  ["thread","Thread","X",0,false,"Write the thread"],
  ["linkedin","Post","LinkedIn",4,false,""],
  ["news","Newsletter","Newsletter",6,false,"Write the newsletter"],
  ["blog","Blog post","Blog",7,false,"Write the blog post"]];
var RP={src:"",title:"",date:"",post:null,idea:null};
function rpOpen(src){
  var k=String(src).split(":"),title="",date=ymd(new Date(Date.now()+864e5)),post=null,idea=null;
  if(k[0]==="idea"){idea=S.ideas.filter(function(x){return x.id===k[1]})[0];if(!idea)return;title=idea.text.replace(/\s*#[\w-]+/g,"").trim()||idea.text}
  else{post=S.posts.filter(function(x){return x.id===k[1]})[0];if(!post)return;title=post.title;date=post.date||date}
  RP={src:src,title:title,date:date,post:post,idea:idea};
  var rows=RPF.map(function(f){
    var main=post&&f[0]==="long";
    return '<label class="rp-row'+(main?" main":"")+'"><input type="checkbox" data-rp="'+f[0]+'"'+((f[4]||main)?" checked":"")+(main?" disabled":"")+'><span class="rp-dot" style="--c:'+platCol(f[2])+'"></span><span class="rp-n"><b>'+f[1]+'</b><i>'+f[2]+(main?" · this post":"")+'</i></span>'+
      (f[0]==="shorts"?'<select class="wsel" data-rp-n="shorts" aria-label="How many Shorts">'+[1,2,3,4,5].map(function(n){return '<option'+(n===3?" selected":"")+'>'+n+'</option>'}).join("")+'</select>':'')+
      '<span class="rp-d">'+(f[3]?"Day +"+f[3]:"Same day")+'</span></label>';
  }).join("");
  infoHTML='<div class="dlgbox rp-dlg" role="dialog" aria-modal="true" aria-label="Repurpose"><h2>Repurpose</h2><p class="muted" style="margin:-4px 0 14px;font-size:13.5px">Turn one piece into a planned set. Each one lands on the Calendar on its own day.</p>'+
    '<label class="plab">What is it about<input class="in" id="rptitle" maxlength="100" value="'+esc(title)+'"></label>'+
    '<label class="plab">Main piece goes out on<input class="in" type="date" id="rpdate" value="'+esc(date)+'"></label>'+
    '<div class="rp-list">'+rows+'</div>'+
    '<label class="cp-sw" style="margin-top:12px"><input type="checkbox" id="rptasks" checked><span><b>Add prep tasks</b><small>One task per piece that needs work, due the day before it goes out.</small></span></label>'+
    '<div class="row"><button class="btn" data-act="rp_cancel">Cancel</button><button class="btn pri" data-act="rp_go">Plan the set</button></div></div>';
  renderDialog();
}
function rpGo(){
  var title=($("rptitle").value||"").trim()||RP.title,start=$("rpdate").value||RP.date,tasks=$("rptasks").checked,grp="r"+uid(),n=0,t=0;
  var add=function(d,k){var x=dparse(start);x.setDate(x.getDate()+d);return ymd(x)};
  var nS=+((document.querySelector('[data-rp-n="shorts"]')||{}).value||3);
  if(RP.post){RP.post.rep=grp;RP.post.repTitle=title;if(!RP.post.date)RP.post.date=start}
  RPF.forEach(function(f){
    var on=document.querySelector('[data-rp="'+f[0]+'"]');if(!on||!on.checked||(RP.post&&f[0]==="long"))return;
    var count=f[0]==="shorts"?nS:1;
    for(var i=0;i<count;i++){
      var day=add(f[3]+(f[0]==="shorts"?i*2:0)),lbl=f[1]+(count>1?" "+(i+1):"");
      S.posts.push({id:uid(),sp:S.cur,title:title+" · "+lbl,platform:f[2],date:day,status:"idea",ideaId:RP.idea?RP.idea.id:(RP.post&&RP.post.ideaId||""),rep:grp,repTitle:title,ts:Date.now()});n++;
    }
    if(tasks&&f[5]){S.tasks.push({id:uid(),sp:S.cur,title:f[5]+(count>1?" ("+count+")":"")+": "+title,col:"i",due:add(Math.max(0,f[3]-1)),pri:0,ts:Date.now()});t++}
  });
  if(RP.idea)RP.idea.task=RP.idea.task||tasks;
  infoHTML="";calSel=start;var cd=dparse(start);calMonth=new Date(cd.getFullYear(),cd.getMonth(),1);touch();go("cal");renderDialog();
  toast("Planned "+n+" piece"+(n===1?"":"s")+(t?" and "+t+" prep task"+(t===1?"":"s"):""));
}

/* v14: video insights */
var DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],DAYL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function med(a){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y}),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2}
function isShort(v){return v.duration_s!=null?v.duration_s<=180:/#shorts/i.test(v.title||"")}
function insStats(vids){
  var now=Date.now(),views=vids.map(function(v){return Number(v.views)||0}),m=med(views);
  var byDay=[0,1,2,3,4,5,6].map(function(d){var a=vids.filter(function(v){return new Date(v.published_at).getDay()===d}).map(function(v){return Number(v.views)||0});return {d:d,n:a.length,m:med(a)}});
  var slots=[["Morning",6,12],["Afternoon",12,17],["Evening",17,21],["Night",21,30]].map(function(s){var a=vids.filter(function(v){var h=new Date(v.published_at).getHours();if(h<6)h+=24;return h>=s[1]&&h<s[2]}).map(function(v){return Number(v.views)||0});return {l:s[0],n:a.length,m:med(a)}});
  var eng=med(vids.filter(function(v){return v.views>0}).map(function(v){return ((Number(v.likes)||0)+(Number(v.comments)||0))/v.views*100}));
  var wk8=vids.filter(function(v){return now-new Date(v.published_at).getTime()<56*864e5}).length/8;
  var sh=vids.filter(isShort),lg=vids.filter(function(v){return !isShort(v)});
  return {m:m,byDay:byDay,slots:slots,eng:eng,wk:wk8,sh:sh,lg:lg,shM:med(sh.map(function(v){return +v.views||0})),lgM:med(lg.map(function(v){return +v.views||0}))};
}
function insHTML(){
  var chs=W.conns.filter(function(c){return (W.vids[c.id]||[]).length});
  if(!chs.length)return emptyCard("chart","No videos yet","Connect a YouTube channel and refresh to see which videos work best.","");
  var c=chs.filter(function(x){return x.id===W.insCh})[0]||chs.filter(function(x){return x.kind==="own"})[0]||chs[0];
  var all=(W.vids[c.id]||[]).slice(),kind=W.insKind||"all";
  var vids=all.filter(function(v){return kind==="all"||(kind==="short"?isShort(v):!isShort(v))});
  var h='<div class="ins-top"><div class="chips">'+chs.map(function(x){return '<button class="chip" data-act="ins_ch" data-id="'+x.id+'" aria-pressed="'+(x.id===c.id)+'">'+esc(x.title||x.handle||"Channel")+(x.kind==="watch"?' · following':'')+'</button>'}).join("")+'</div>'+
    '<div class="hd-seg" role="group" aria-label="Video type">'+[["all","All"],["long","Long"],["short","Shorts"]].map(function(k){return '<button data-act="ins_kind" data-id="'+k[0]+'" aria-pressed="'+(kind===k[0])+'">'+k[1]+'</button>'}).join("")+'</div></div>';
  if(vids.length<3)return h+'<div class="empty" style="padding:30px 0">Need at least 3 '+(kind==="short"?"Shorts":kind==="long"?"long videos":"videos")+' to find patterns. This channel has '+vids.length+'.</div>';
  var st=insStats(vids),m=st.m||1,now=Date.now();
  var bestDay=st.byDay.filter(function(d){return d.n}).sort(function(a,b){return b.m-a.m})[0],bestSlot=st.slots.filter(function(s){return s.n}).sort(function(a,b){return b.m-a.m})[0];
  var top=vids.slice().sort(function(a,b){return b.views-a.views});
  var tips=[];
  if(bestDay&&bestDay.m>m*1.15&&bestDay.n>=2)tips.push("Videos posted on <b>"+DAYL[bestDay.d]+"</b> get <b>"+(bestDay.m/m).toFixed(1)+"×</b> your usual views.");
  if(bestSlot&&bestSlot.m>m*1.15&&bestSlot.n>=2)tips.push("<b>"+bestSlot.l+"</b> uploads do best ("+nf(Math.round(bestSlot.m))+" median views).");
  if(kind==="all"&&st.sh.length>=2&&st.lg.length>=2){var r=st.shM/(st.lgM||1);tips.push(r>=1?"Shorts get <b>"+r.toFixed(1)+"×</b> the views of long videos.":"Long videos get <b>"+(1/r).toFixed(1)+"×</b> the views of Shorts.")}
  var brk=top.filter(function(v){return v.views>=m*2});if(brk.length)tips.push("<b>"+brk.length+"</b> breakout video"+(brk.length>1?"s":"")+" doubled your usual views. Worth a follow-up or a part 2.");
  if(st.wk)tips.push("You post about <b>"+(Math.round(st.wk*10)/10)+"</b> videos a week.");
  h+='<div class="ins-tiles">'+
    '<div class="vz-tile"><span class="vt-l">Usual views</span><b>'+nf(Math.round(m))+'</b><small class="muted">median of '+vids.length+' videos</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Best video</span><b>'+nf(top[0].views)+'</b><small class="muted">'+(top[0].views/m).toFixed(1)+'× usual</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Engagement</span><b>'+st.eng.toFixed(1)+'%</b><small class="muted">likes + comments per view</small></div>'+
    '<div class="vz-tile"><span class="vt-l">Upload pace</span><b>'+(Math.round(st.wk*10)/10)+'/wk</b><small class="muted">last 8 weeks</small></div></div>';
  if(tips.length)h+='<section class="panel ins-tips"><h3>What stands out</h3><ul>'+tips.map(function(t){return '<li>'+t+'</li>'}).join("")+'</ul></section>';
  var dmax=Math.max.apply(null,st.byDay.map(function(d){return d.m}).concat([1]));
  h+='<div class="ins-cols"><section class="panel"><h3>Best day to post</h3><div class="ins-bars">'+[1,2,3,4,5,6,0].map(function(i){var d=st.byDay[i];return '<div class="ib'+(bestDay&&bestDay.d===i?" best":"")+'"><span class="ib-v">'+(d.n?nf(Math.round(d.m)):"–")+'</span><span class="ib-b"><i style="height:'+Math.max(2,Math.round(d.m/dmax*100))+'%"></i></span><span class="ib-l">'+DAYS[i]+'</span><span class="ib-n">'+d.n+'</span></div>'}).join("")+'</div><p class="muted ins-note">Median views by upload day, with the number of videos under each.</p></section>';
  var smax=Math.max.apply(null,st.slots.map(function(s){return s.m}).concat([1]));
  h+='<section class="panel"><h3>Best time of day</h3>'+st.slots.map(function(s){return '<div class="is-row'+(bestSlot&&bestSlot.l===s.l?" best":"")+'"><span>'+s.l+'</span><span class="is-bar"><i style="width:'+Math.max(2,Math.round(s.m/smax*100))+'%"></i></span><b>'+(s.n?nf(Math.round(s.m)):"–")+'</b></div>'}).join("")+
    (kind==="all"&&st.sh.length&&st.lg.length?'<h3 style="margin-top:18px">Shorts vs long</h3><div class="is-row"><span>Shorts ('+st.sh.length+')</span><span class="is-bar"><i style="width:'+Math.round(st.shM/Math.max(st.shM,st.lgM,1)*100)+'%"></i></span><b>'+nf(Math.round(st.shM))+'</b></div><div class="is-row"><span>Long ('+st.lg.length+')</span><span class="is-bar"><i style="width:'+Math.round(st.lgM/Math.max(st.shM,st.lgM,1)*100)+'%"></i></span><b>'+nf(Math.round(st.lgM))+'</b></div>':'')+'</section></div>';
  h+='<section class="panel"><h3>Top videos</h3><div class="ins-list">'+top.slice(0,8).map(function(v,i){var age=Math.max(1,(now-new Date(v.published_at).getTime())/864e5),r=v.views/m;
    return '<a class="ins-v" href="https://www.youtube.com/watch?v='+esc(v.video_id)+'" target="_blank" rel="noopener noreferrer"><span class="ins-i">'+(i+1)+'</span>'+(v.thumb?'<img src="'+esc(v.thumb)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="ins-ph">'+(isShort(v)?"Short":"Video")+'</span>')+
      '<span class="ins-t"><b>'+esc(v.title||"")+'</b><small>'+esc(fmtDue(ymd(new Date(v.published_at))))+' · '+nf(Math.round(v.views/age))+' views/day · '+(v.views?(((+v.likes||0)+(+v.comments||0))/v.views*100).toFixed(1):"0")+'% engagement</small></span>'+
      '<span class="ins-n"><b>'+nf(v.views)+'</b>'+(r>=2?'<em class="ins-bk">Breakout '+r.toFixed(1)+'×</em>':'<small class="muted">'+r.toFixed(1)+'× usual</small>')+'</span></a>'}).join("")+'</div></section>';
  var rec=vids.slice().sort(function(a,b){return new Date(b.published_at)-new Date(a.published_at)}).slice(0,6);
  h+='<section class="panel"><h3>Latest uploads vs your usual</h3>'+rec.map(function(v){var r=v.views/m;return '<div class="is-row"><span class="is-t">'+esc(v.title||"")+'</span><span class="is-bar'+(r>=1?" up":" down")+'"><i style="width:'+Math.min(100,Math.round(r*50))+'%"></i></span><b class="'+(r>=1?"up":"down")+'">'+r.toFixed(1)+'×</b></div>'}).join("")+'<p class="muted ins-note">The bar crosses the middle when a video beats your usual views.</p></section>';
  var others=W.conns.filter(function(x){return x.id!==c.id&&(W.vids[x.id]||[]).length>=3});
  if(others.length){h+='<section class="panel"><h3>Compare channels</h3><div class="ins-cmp"><div class="ic-h"><span>Channel</span><span>Usual views</span><span>Engagement</span><span>Per week</span></div>'+[c].concat(others).map(function(x){var s2=insStats(W.vids[x.id]);return '<div class="ic-r'+(x.id===c.id?" me":"")+'"><span>'+esc(x.title||x.handle||"")+(x.kind==="watch"?' <small class="muted">following</small>':'')+'</span><span>'+nf(Math.round(s2.m))+'</span><span>'+s2.eng.toFixed(1)+'%</span><span>'+(Math.round(s2.wk*10)/10)+'</span></div>'}).join("")+'</div></section>'}
  return h;
}

/* v14: import center */
var IMP={step:"drop",name:"",rows:[],head:[],target:"",map:{},guess:"",msg:"",conn:"",plat:"instagram",busy:false,notes:null};
ICONS.upload='<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
var IMPT={
  tasks:{n:"Tasks",d:"Progress board and Calendar",f:[["title","Title",1],["due","Due date"],["stage","Status or list"]]},
  ideas:{n:"Ideas",d:"Your ideas list",f:[["text","Idea",1],["tags","Tags"]]},
  notes:{n:"Notes",d:"One note per row",f:[["title","Title",1],["body","Text"]]},
  posts:{n:"Calendar posts",d:"Planned or published posts",f:[["title","Title",1],["date","Date",1],["platform","Platform"],["status","Status"],["caption","Caption"]]},
  income:{n:"Income",d:"Business, Income tab",f:[["date","Date",1],["amount","Amount",1],["source","From"],["cat","Category"]]},
  deals:{n:"Sponsor deals",d:"Business, Sponsors tab",f:[["brand","Brand",1],["amount","Amount"],["status","Stage"],["due","Deliver by"]]},
  videos:{n:"Video stats",d:"Video insights in Audience",f:[["title","Title",1],["date","Published",1],["views","Views",1],["likes","Likes"],["comments","Comments"],["vid","Video ID"],["dur","Duration"]]},
  audience:{n:"Follower history",d:"Growth charts in Audience",f:[["date","Date",1],["followers","Followers",1],["views","Views"]]}
};
var IMPK={title:["title","name","card name","task","task name","video title","subject","heading"],due:["due","due date","deadline","date","end date"],stage:["status","list","list name","stage","section","section/column","column","state"],
  text:["idea","ideas","title","name","text","content"],tags:["tags","labels","tag","category"],body:["body","description","notes","content","text","card description","details"],
  date:["date","published","publish date","video publish time","day","posted","created","transaction date","txn date","value date"],platform:["platform","channel","network","where"],status:["status","stage","state"],caption:["caption","copy","text","description"],
  amount:["amount","credit","deposit","credit amount","amount (inr)","net","total","gross","fee","rate","value"],source:["source","description","narration","particulars","from","payer","client","brand","customer","details","remarks"],cat:["category","type"],
  brand:["brand","company","sponsor","client","name"],views:["views","view count","plays","video views"],likes:["likes","like count"],comments:["comments","comment count"],vid:["content","video id","video","id"],dur:["duration","length","duration (sec)"],
  followers:["followers","subscribers","follower count","total followers","fans"]};
function impNorm(h){return String(h||"").trim().toLowerCase().replace(/\s+/g," ")}
function impCSV(txt){
  txt=String(txt).replace(/^﻿/,"");var first=txt.split(/\r?\n/)[0]||"",sep=(first.split("\t").length>first.split(",").length)?"\t":((first.split(";").length>first.split(",").length)?";":",");
  var rows=[],row=[],cur="",q=false;
  for(var i=0;i<txt.length;i++){var ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;
    else if(ch===sep){row.push(cur);cur=""}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&txt[i+1]==="\n")i++;row.push(cur);cur="";if(row.some(function(c){return c.trim()}))rows.push(row);row=[]}
    else cur+=ch}
  row.push(cur);if(row.some(function(c){return c.trim()}))rows.push(row);
  return rows;
}
function impGuess(head){
  var H=head.map(impNorm),has=function(){for(var i=0;i<arguments.length;i++)if(H.indexOf(arguments[i])>-1)return true;return false};
  if(has("video title")&&has("views"))return ["videos","YouTube Studio export"];
  if(has("content")&&has("views")&&has("video publish time"))return ["videos","YouTube Studio export"];
  if(has("card name"))return ["tasks","Trello board"];
  if(has("section/column")||(has("name")&&has("section")&&has("assignee")))return ["tasks","Asana project"];
  if(has("followers","subscribers")&&has("date"))return ["audience","Follower history"];
  if(has("brand","sponsor")&&has("amount","rate","fee"))return ["deals","Sponsor list"];
  if((has("credit","deposit","narration","particulars","transaction date","txn date"))||(has("amount")&&has("date")&&!has("title","name")))return ["income","Bank or payments export"];
  if(has("platform")&&has("date")&&has("title","name"))return ["posts","Content calendar"];
  if(has("name")&&has("status")&&(has("due","date","due date")))return ["tasks","Notion or task list"];
  if(has("idea","ideas"))return ["ideas","Ideas list"];
  if(has("title","name")&&has("body","content","notes","description")&&!has("status","due"))return ["notes","Notes"];
  if(H.length===1)return ["ideas","A single list"];
  return ["tasks","Spreadsheet"];
}
function impAutoMap(t){
  var m={},used={},H=IMP.head.map(impNorm);
  IMPT[t].f.forEach(function(f){var c=IMPK[f[0]]||[];for(var i=0;i<c.length;i++){var ix=H.indexOf(c[i]);if(ix>-1&&!used[ix]){m[f[0]]=ix;used[ix]=1;return}}
    for(var j=0;j<H.length;j++){if(used[j])continue;for(var k=0;k<c.length;k++){if(H[j].indexOf(c[k])>-1){m[f[0]]=j;used[j]=1;return}}}
    m[f[0]]=-1});
  if(m[IMPT[t].f[0][0]]===-1){for(var x=0;x<H.length;x++)if(!used[x]){m[IMPT[t].f[0][0]]=x;break}}
  return m;
}
var IMPMON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function impDate(v){
  v=String(v||"").trim();if(!v)return "";var m;
  if(m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))return m[1]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[3]).padStart(2,"0");
  if(m=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/)){var a=+m[1],b=+m[2],y=+m[3];if(y<100)y+=2000;var d=a,mo=b;if(b>12){d=b;mo=a}return y+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
  if(m=v.match(/^(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})/i)){var mo2=IMPMON[m[2].slice(0,4).toLowerCase()]||IMPMON[m[2].slice(0,3).toLowerCase()];if(mo2)return m[3]+"-"+String(mo2).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0")}
  if(m=v.match(/^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i)){var mo3=IMPMON[m[1].slice(0,4).toLowerCase()]||IMPMON[m[1].slice(0,3).toLowerCase()];if(mo3)return m[3]+"-"+String(mo3).padStart(2,"0")+"-"+String(m[2]).padStart(2,"0")}
  var t=Date.parse(v);return isNaN(t)?"":ymd(new Date(t));
}
function impNum(v){v=String(v==null?"":v).trim();if(!v)return null;var neg=/^\(.*\)$/.test(v)||/^-/.test(v)||/\bdr\b/i.test(v);var n=parseFloat(v.replace(/[^0-9.]/g,""));if(isNaN(n))return null;var mult=/k$/i.test(v.replace(/[\s)]/g,""))?1e3:(/m$/i.test(v.replace(/[\s)]/g,""))?1e6:1);return (neg?-1:1)*n*mult}
function impDur(v){v=String(v||"").trim();if(!v)return null;if(/^\d+$/.test(v))return +v;var p=v.split(":").map(Number);if(p.every(function(x){return !isNaN(x)}))return p.reduce(function(a,b){return a*60+b},0);return null}
function impStage(v){v=impNorm(v);if(!v)return "i";if(/done|complete|shipped|published|finished|closed/.test(v))return "s";if(/review|qa|approval/.test(v))return "r";if(/doing|progress|making|editing|filming|active|working|started/.test(v))return "m";return "i"}
function impPostStatus(v){v=impNorm(v);if(/publish|posted|live|done/.test(v))return "published";if(/schedul/.test(v))return "scheduled";if(/edit/.test(v))return "editing";if(/film|shoot|record/.test(v))return "filming";if(/script|writ/.test(v))return "script";return "idea"}
function impPlat(v){v=impNorm(v);var hit=PLAT.filter(function(p){return v.indexOf(p[0].toLowerCase())>-1})[0];if(hit)return hit[0];if(/yt|youtube/.test(v))return "YouTube";if(/insta|ig|reel/.test(v))return "Instagram";if(/tweet|twitter/.test(v))return "X";return "YouTube"}
function impDealStage(v){v=impNorm(v);if(/paid/.test(v))return "paid";if(/deliver|done|live/.test(v))return "delivered";if(/sign|agree|confirm|won/.test(v))return "signed";if(/talk|negoti|discuss|proposal/.test(v))return "talking";return "lead"}
function impCell(r,k){var i=IMP.map[k];return i==null||i<0?"":String(r[i]==null?"":r[i]).trim()}
function impBuild(){
  var t=IMP.target,out=[],skip=0;
  IMP.rows.forEach(function(r){var o=null,g=function(k){return impCell(r,k)};
    if(t==="tasks"){var ti=g("title");if(ti)o={title:ti.slice(0,200),due:impDate(g("due")),col:impStage(g("stage"))}}
    else if(t==="ideas"){var tx=g("text");if(tx){var tg=g("tags").split(/[,;|]/).map(function(x){return x.trim().replace(/^#/,"").toLowerCase()}).filter(Boolean);o={text:tx.slice(0,240),tags:tg}}}
    else if(t==="notes"){var nt=g("title"),nb=g("body");if(nt||nb)o={title:(nt||nb.split("\n")[0]).slice(0,120),body:nb}}
    else if(t==="posts"){var pt=g("title"),pd=impDate(g("date"));if(pt&&pd)o={title:pt.slice(0,100),date:pd,platform:impPlat(g("platform")),status:impPostStatus(g("status")),caption:g("caption")}}
    else if(t==="income"){var am=impNum(g("amount")),dd=impDate(g("date"));if(am&&am>0&&dd)o={date:dd,amount:Math.round(am*100)/100,source:(g("source")||"Imported").slice(0,60),cat:g("cat")||"Other"}}
    else if(t==="deals"){var br=g("brand");if(br)o={brand:br.slice(0,60),amount:impNum(g("amount"))||0,status:impDealStage(g("status")),due:impDate(g("due"))}}
    else if(t==="videos"){var vt=g("title"),vd=impDate(g("date")),vv=impNum(g("views"));if(vt&&vv!=null&&vd&&!/^total/i.test(vt))o={title:vt.slice(0,200),published_at:vd+"T12:00:00Z",views:Math.round(vv),likes:Math.round(impNum(g("likes"))||0),comments:Math.round(impNum(g("comments"))||0),video_id:(g("vid")&&/^[\w-]{6,}$/.test(g("vid"))?g("vid"):"imp-"+vt.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)+"-"+vd),duration_s:impDur(g("dur"))}}
    else if(t==="audience"){var ad=impDate(g("date")),af=impNum(g("followers"));if(ad&&af!=null)o={date:ad,followers:Math.round(af),views:g("views")?Math.round(impNum(g("views"))||0):null}}
    if(o)out.push(o);else skip++});
  return {items:out,skip:skip};
}
function impParse(txt,name){
  var rows=impCSV(txt);if(!rows.length){IMP.msg="That file looks empty.";render();return}
  var head=rows[0],looksHead=head.some(function(h){return /[a-z]/i.test(h)})&&!head.every(function(h){return impDate(h)||impNum(h)!=null});
  if(!looksHead||head.length===1&&rows.length>1&&!/idea|title|name/i.test(head[0])){head=head.map(function(_,i){return "Column "+(i+1)});}else rows=rows.slice(1);
  IMP.name=name||"Pasted data";IMP.head=head;IMP.rows=rows.slice(0,5000);var g=impGuess(head);IMP.target=g[0];IMP.guess=g[1];IMP.map=impAutoMap(g[0]);IMP.step="map";IMP.msg="";
  if(g[0]==="videos"||g[0]==="audience"){var own=(typeof W!=="undefined"&&W.conns||[]).filter(function(c){return c.kind==="own"&&(g[0]==="audience"||c.platform==="youtube")});IMP.conn=own.length?own[0].id:"new";IMP.plat=g[0]==="videos"?"youtube":"instagram"}
  render();
}
function impNotesFiles(files){
  var list=[].slice.call(files),out=[],n=0;
  list.forEach(function(f){var r=new FileReader();r.onload=function(){var t=String(r.result||""),m=t.match(/^#\s+(.+)$/m);out.push({title:(m?m[1]:f.name.replace(/\.(md|txt)$/i,"")).slice(0,120),body:m?t.replace(m[0],"").trim():t});if(++n===list.length){IMP.notes=out;IMP.step="notes";IMP.name=list.length+" files";render()}};r.readAsText(f)});
}
function impHTML(){
  var h=hero("imp","Import","Bring your data in from other apps. Nothing is overwritten, and you can undo any import.","");
  if(IMP.step==="map")return h+impMapHTML();
  if(IMP.step==="notes")return h+'<section class="panel"><h3>'+IMP.notes.length+' notes ready</h3>'+IMP.notes.slice(0,8).map(function(n){return '<div class="im-pv"><b>'+esc(n.title)+'</b><span class="muted">'+esc(n.body.slice(0,90))+'</span></div>'}).join("")+'<div class="row im-go"><button class="btn" data-act="imp_reset">Cancel</button><button class="btn pri" data-act="imp_notes">Import '+IMP.notes.length+' notes</button></div></section>';
  h+='<label class="fdrop im-drop"><input type="file" id="impfile" accept=".csv,.tsv,.txt,.md,text/csv,text/plain" multiple><span class="ec-i">'+I("upload")+'</span><span><b>Drop a CSV file here, or click to choose</b><small>Export as CSV from Google Sheets, Excel, Notion, Trello, Asana, YouTube Studio, your bank or payment app. Markdown and text files become notes.</small></span></label>';
  h+='<section class="panel im-paste"><h3>Or paste from a spreadsheet</h3><textarea class="in" id="imppaste" aria-label="Pasted rows" rows="4" placeholder="Copy cells in Google Sheets or Excel (with the header row) and paste here"></textarea><div class="row"><button class="btn" data-act="imp_paste">Continue</button></div></section>';
  if(IMP.msg)h+='<p class="cp-note">'+esc(IMP.msg)+'</p>';
  h+='<section class="panel"><h3>Works well with</h3><div class="im-src">'+[
    ["YouTube Studio","Advanced mode → Content → Export → CSV. Becomes video stats for Video insights."],
    ["Instagram / TikTok","Any sheet with Date and Followers. Becomes growth history in Audience."],
    ["Trello, Asana, Notion","Export the board or database as CSV. Becomes tasks with dates and stages."],
    ["Bank or UPI statement","Credits become income with date, amount and who paid."],
    ["Sponsor tracker","Brand, amount, stage and deadline become deals in Business."],
    ["Google Sheets","Paste any list: ideas, posts, notes or tasks."]].map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join("")+'</div></section>';
  var log=(S.imports||[]).slice().reverse().slice(0,8);
  if(log.length)h+='<section class="panel"><h3>Recent imports</h3>'+log.map(function(l){return '<div class="setrow"><span><b style="color:var(--fg)">'+esc(l.file)+'</b> · '+l.n+' '+esc((IMPT[l.t]||{n:l.t}).n.toLowerCase())+' · '+ago(l.ts)+'</span>'+(l.undone?'<span class="muted">Undone</span>':'<button class="btn sm" data-act="imp_undo" data-id="'+l.id+'">Undo</button>')+'</div>'}).join("")+'</section>';
  return h;
}
function impMapHTML(){
  var t=IMP.target,T=IMPT[t],b=impBuild();
  var h='<section class="panel"><div class="im-h"><div><h3 style="margin:0">'+esc(IMP.name)+'</h3><span class="muted">'+IMP.rows.length+' rows · looks like: '+esc(IMP.guess)+'</span></div><button class="btn sm" data-act="imp_reset">Choose another file</button></div>';
  h+='<div class="plab" style="margin-top:14px">Import as<div class="im-targets">'+Object.keys(IMPT).map(function(k){return '<button class="im-t" data-act="imp_target" data-id="'+k+'" aria-pressed="'+(k===t)+'"><b>'+IMPT[k].n+'</b><small>'+IMPT[k].d+'</small></button>'}).join("")+'</div></div>';
  h+='<div class="im-map">'+T.f.map(function(f){return '<label class="plab"><span>'+f[1]+(f[2]?' <i class="req">required</i>':'')+'</span><select class="in" data-imp="'+f[0]+'"><option value="-1">Not in this file</option>'+IMP.head.map(function(hd,i){return '<option value="'+i+'"'+(IMP.map[f[0]]===i?" selected":"")+'>'+esc(hd||("Column "+(i+1)))+'</option>'}).join("")+'</select></label>'}).join("")+'</div>';
  if(t==="videos"||t==="audience"){var own=(W.conns||[]).filter(function(c){return c.kind==="own"&&(t==="audience"||c.platform==="youtube")});
    h+='<label class="plab">Add to channel<select class="in" data-imp-conn="1">'+own.map(function(c){return '<option value="'+c.id+'"'+(IMP.conn===c.id?" selected":"")+'>'+esc((c.title||c.handle||"Channel")+" · "+c.platform)+'</option>'}).join("")+'<option value="new"'+(IMP.conn==="new"?" selected":"")+'>A new channel…</option></select></label>';
    if(IMP.conn==="new")h+='<div class="cp-two"><label class="plab">Platform<select class="in" data-imp-plat="1">'+(t==="videos"?[["youtube","YouTube"]]:PLATS.map(function(p){return [p[0],p[1]]})).map(function(p){return '<option value="'+p[0]+'"'+(IMP.plat===p[0]?" selected":"")+'>'+p[1]+'</option>'}).join("")+'</select></label><label class="plab">Name<input class="in" id="impcname" maxlength="60" placeholder="Your channel or page name"></label></div>'}
  h+='<h3 style="margin:16px 0 8px">Preview</h3>';
  if(!b.items.length)h+='<p class="empty">No rows can be imported with these choices. Check the column matches above.</p>';
  else h+='<div class="im-prev"><table><thead><tr>'+T.f.map(function(f){return '<th>'+f[1]+'</th>'}).join("")+'</tr></thead><tbody>'+b.items.slice(0,6).map(function(o){return '<tr>'+T.f.map(function(f){return '<td>'+esc(impShow(t,f[0],o))+'</td>'}).join("")+'</tr>'}).join("")+'</tbody></table></div>';
  h+='<div class="row im-go"><span class="muted">'+b.items.length+' ready'+(b.skip?' · '+b.skip+' skipped (missing required values)':'')+'</span><button class="btn pri" data-act="imp_go"'+(b.items.length&&!IMP.busy?"":" disabled")+'>'+(IMP.busy?"Importing…":"Import "+b.items.length)+'</button></div></section>';
  return h;
}
function impShow(t,k,o){
  var map={title:o.title,due:o.due?fmtDue(o.due):"",stage:{i:"Idea",m:"Making",r:"Review",s:"Shipped"}[o.col],text:o.text,tags:(o.tags||[]).map(function(x){return "#"+x}).join(" "),body:(o.body||"").slice(0,60),
    date:t==="videos"?fmtDue(o.published_at.slice(0,10)):(o.date?fmtDue(o.date):""),platform:o.platform,status:o.status,caption:(o.caption||"").slice(0,40),amount:o.amount!=null?money(o.amount):"",source:o.source,cat:o.cat,brand:o.brand,
    views:o.views!=null?nf(o.views):"",likes:o.likes?nf(o.likes):"",comments:o.comments?nf(o.comments):"",vid:o.video_id,dur:o.duration_s?Math.round(o.duration_s)+"s":"",followers:o.followers!=null?nf(o.followers):""};
  if(t==="deals"&&k==="due")return o.due?fmtDue(o.due):"";if(t==="deals"&&k==="status")return o.status;
  return map[k]==null?"":String(map[k]);
}
async function impGo(){
  var t=IMP.target,b=impBuild(),id="imp"+uid(),n=0,cname=(($("impcname")||{}).value||"").trim();if(!b.items.length)return;
  IMP.busy=true;render();
  try{
    if(t==="videos"||t==="audience"){
      var cid=IMP.conn;
      if(cid==="new"||!cid){var nm=cname||"Imported "+(t==="videos"?"YouTube":IMP.plat);
        var cr=await WSB.from("connections").upsert({platform:t==="videos"?"youtube":IMP.plat,kind:"own",handle:nm,external_id:"imp-"+nm.toLowerCase().replace(/[^a-z0-9]+/g,"-"),title:nm,source:"manual",status:"ok",last_synced:new Date().toISOString()},{onConflict:"user_id,platform,external_id"}).select("*").single();
        if(cr.error)throw cr.error;cid=cr.data.id}
      if(t==="videos"){var rows=b.items.map(function(o){return Object.assign({},o,{connection_id:cid,user_id:window.__UID,updated_at:new Date().toISOString()})});
        for(var i=0;i<rows.length;i+=200){var r=await WSB.from("videos").upsert(rows.slice(i,i+200),{onConflict:"connection_id,video_id"});if(r.error)throw r.error}
        n=rows.length;impLog({id:id,t:t,n:n,file:IMP.name,conn:cid,vids:rows.map(function(x){return x.video_id})})}
      else{var srows=b.items.sort(function(a,c){return a.date<c.date?-1:1}).map(function(o){return {connection_id:cid,user_id:window.__UID,ts:o.date+"T12:00:00Z",followers:o.followers,views:o.views,extra:{imported:true}}});
        var ids=[];for(var j=0;j<srows.length;j+=200){var r2=await WSB.from("snapshots").insert(srows.slice(j,j+200)).select("id");if(r2.error)throw r2.error;(r2.data||[]).forEach(function(x){ids.push(x.id)})}
        n=srows.length;impLog({id:id,t:t,n:n,file:IMP.name,conn:cid,snaps:ids})}
      await audFresh();
    }else{
      var key={tasks:"tasks",ideas:"ideas",notes:"notes",posts:"posts",income:"income",deals:"deals"}[t],exist={};
      S[key].filter(function(x){return x.sp===S.cur}).forEach(function(x){exist[(x.title||x.text||x.brand||x.source||"")+"|"+(x.due||x.date||"")+"|"+(x.amount||"")]=1});
      b.items.forEach(function(o){var k=(o.title||o.text||o.brand||o.source||"")+"|"+(o.due||o.date||"")+"|"+(o.amount||"");if(exist[k])return;exist[k]=1;
        var it=Object.assign({id:uid(),sp:S.cur,imp:id,ts:Date.now()},o);
        if(t==="tasks")it.pri=0;if(t==="ideas"){it.star=false;it.task=false}if(t==="notes")it.pin=false;if(t==="posts")it.ideaId="";
        S[key].push(it);n++});
      impLog({id:id,t:t,n:n,file:IMP.name,key:key});touch();
    }
    var dest={tasks:"board",ideas:"ideas",notes:"notes",posts:"cal",income:"biz",deals:"biz",videos:"aud",audience:"aud"}[t];
    IMP.step="drop";IMP.busy=false;IMP.msg="";if(t==="income")bizTab="income";
    if(t==="videos")W.audTab="ins";if(t==="audience")W.audTab="ch";
    toast("Imported "+n+" "+IMPT[t].n.toLowerCase()+(b.items.length>n?" ("+(b.items.length-n)+" were already here)":""));go(dest);
  }catch(e){IMP.busy=false;IMP.msg="Import failed: "+((e&&e.message)||"try again");render()}
}
function impLog(o){o.ts=Date.now();o.sp=S.cur;if(!Array.isArray(S.imports))S.imports=[];S.imports.push(o);if(S.imports.length>30)S.imports.shift();touch()}
async function impUndo(id){
  var l=(S.imports||[]).filter(function(x){return x.id===id})[0];if(!l||l.undone)return;
  if(l.key){var before=S[l.key].length;S[l.key]=S[l.key].filter(function(x){return x.imp!==id});l.undone=true;touch();render();toast("Removed "+(before-S[l.key].length)+" items");return}
  try{if(l.vids)for(var i=0;i<l.vids.length;i+=100)await WSB.from("videos").delete().eq("connection_id",l.conn).in("video_id",l.vids.slice(i,i+100));
    if(l.snaps)for(var j=0;j<l.snaps.length;j+=100)await WSB.from("snapshots").delete().in("id",l.snaps.slice(j,j+100));
    l.undone=true;touch();await audFresh();render();toast("Import undone")}catch(e){toast("Couldn't undo that")}
}
document.addEventListener("change",function(e){
  var t=e.target;if(!t)return;
  if(t.id==="impfile"&&t.files&&t.files.length){var fs=[].slice.call(t.files);t.value="";
    if(fs.every(function(f){return /\.(md|txt)$/i.test(f.name)})&&!(fs.length===1&&/\t|,/.test(""))){impNotesFiles(fs);return}
    var f=fs[0];if(f.size>15*1048576){IMP.msg="That file is over 15 MB. Split it or export fewer rows.";render();return}
    if(/\.xlsx?$/i.test(f.name)){IMP.msg="Excel files can't be read here yet. In Excel or Google Sheets choose File → Download → CSV, then drop that file.";render();return}
    var r=new FileReader();r.onload=function(){impParse(String(r.result||""),f.name)};r.readAsText(f)}
  else if(t.dataset&&t.dataset.imp){IMP.map[t.dataset.imp]=+t.value;render()}
  else if(t.dataset&&t.dataset.impConn){IMP.conn=t.value;render()}
  else if(t.dataset&&t.dataset.impPlat){IMP.plat=t.value}
});

async function audFresh(){for(var i=0;i<50&&W.loading;i++)await new Promise(function(r){setTimeout(r,100)});W.loaded=false;W.painted=0;await audLoad(true)}

/* v15: open-plane shell. On desktop there is no top bar: New, search, notifications and a running timer sit at the top of the sidebar. */
var CHROME_AT=null;
function placeChrome(){
  var desk=window.matchMedia("(min-width: 821px)").matches;if(CHROME_AT===desk)return;
  var side=document.querySelector(".side"),top=document.querySelector(".top"),topr=document.querySelector(".topr");if(!side||!top||!topr)return;
  var st=$("sidetools");
  if(!st){st=document.createElement("div");st.id="sidetools";st.className="sidetools";var br=side.querySelector(".brand");side.insertBefore(st,br?br.nextSibling:side.firstChild)}
  var search=document.querySelector(".search"),bell=document.querySelector(".bellwrap"),newb=document.querySelector('[data-act="qtoggle"]'),ft=$("ftimer");newb=newb&&newb.parentNode;
  if(desk){[newb,search,bell,ft].forEach(function(n){if(n)st.appendChild(n)})}
  else{if(search)top.insertBefore(search,topr);[ft,bell,newb].forEach(function(n){if(n)topr.insertBefore(n,topr.firstChild)});if(newb)topr.appendChild(newb)}
  CHROME_AT=desk;
}
window.addEventListener("resize",function(){placeChrome()});

