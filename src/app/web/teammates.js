/* ---------- teammates ---------- */
var SH={loaded:false,loading:false,list:[],ws:[],email:"",role:"editor",space:"",msg:""};
async function shLoad(){
  if(SH.loading)return;SH.loading=true;
  try{
    var a=await WSB.from("shares").select("*").eq("owner_id",window.__UID).order("created_at");
    var b=await WSB.rpc("list_workspaces");
    SH.list=a.data||[];SH.ws=b.data||[];if(a.error)SH.msg="Couldn't load teammates.";
  }catch(e){SH.msg="Couldn't load teammates."}
  SH.loaded=true;SH.loading=false;if(S.view==="cp")render();
}
function shMsg(t){SH.msg=t||"";var e=$("shmsg");if(e)e.textContent=SH.msg}
function shSpaceName(id){
  if(!id)return "Everything";
  var f=(S.spaces||[]).concat(S.iso||[]).filter(function(x){return x.id===id})[0];return f?f.name:"A space";
}
function shIsIso(id){return (S.iso||[]).some(function(x){return x.id===id})}
function shAccessOpts(sel){
  var o='<option value=""'+(!sel?" selected":"")+'>Everything</option>';
  (S.spaces||[]).forEach(function(x){o+='<option value="'+esc(x.id)+'"'+(sel===x.id?" selected":"")+'>Only '+esc(x.name)+'</option>'});
  (S.iso||[]).forEach(function(x){o+='<option value="'+esc(x.id)+'"'+(sel===x.id?" selected":"")+'>Only '+esc(x.name)+' (private)</option>'});
  return o;
}
function shPanel(){
  var h='<section class="panel cp-form"><h3>Teammates</h3><p class="muted" style="margin:-4px 0 6px;font-size:14px">Let someone else work in your Creator Space. They sign in with the email you enter, then open it from this page. Choose to share everything, or only one space. A single space is kept completely apart: they cannot see your other spaces. Editors can change things. Viewers can only look.</p>'+
    '<div class="sh-add"><input class="in" data-w="sh.email" type="email" maxlength="120" placeholder="teammate@email.com" value="'+esc(SH.email)+'" aria-label="Teammate email" autocapitalize="none" spellcheck="false"><select class="wsel" data-w="sh.space" aria-label="What they can open">'+shAccessOpts(SH.space)+'</select><select class="wsel" data-w="sh.role" aria-label="Role"><option value="editor"'+(SH.role==="editor"?" selected":"")+'>Editor</option><option value="viewer"'+(SH.role==="viewer"?" selected":"")+'>Viewer</option></select><button class="btn pri" data-act="sh_invite">Invite</button></div>'+
    '<p id="shmsg" class="aud-msg" role="status">'+esc(SH.msg)+'</p>';
  if(!SH.loaded){shLoad();h+='<p class="muted">Loading…</p>'}
  else if(SH.list.length)h+='<div class="sh-list">'+SH.list.map(function(x,i){return '<div class="sh-row"><span class="sh-em">'+esc(x.invitee_email)+'<small> · '+esc(shSpaceName(x.space_id))+'</small></span><select class="wsel" data-w="sh.r.'+i+'" aria-label="Role for '+esc(x.invitee_email)+'"><option value="editor"'+(x.role==="editor"?" selected":"")+'>Editor</option><option value="viewer"'+(x.role==="viewer"?" selected":"")+'>Viewer</option></select><span class="sh-btns"><button class="btn sm" data-act="sh_mail" data-id="'+i+'">Email invite</button><button class="btn sm" data-act="sh_del" data-id="'+esc(x.id)+'">Remove</button></span></div>'}).join("")+'</div>';
  else h+='<p class="muted" style="margin:0">No teammates yet.</p>';
  if((S.iso||[]).length)h+='<h3 style="margin-top:18px">Your private spaces</h3><p class="muted" style="margin:-4px 0 6px;font-size:13px">These are kept apart so they can be shared on their own. Open one to work in it.</p><div class="sh-list">'+S.iso.map(function(x){return '<div class="sh-row"><span class="sh-em">'+esc(x.name)+'</span><button class="btn sm pri" data-act="sh_openiso" data-id="'+esc(x.id)+'">Open</button></div>'}).join("")+'</div>';
  if(SH.ws.length)h+='<h3 style="margin-top:18px">Shared with you</h3><div class="sh-list">'+SH.ws.map(function(w,i){return '<div class="sh-row"><span class="sh-em">'+esc(w.owner_email)+'<small> · '+(w.space_id?"One space · ":"")+(w.role==="editor"?"Editor":"Viewer")+'</small></span><button class="btn sm pri" data-act="sh_open" data-id="'+i+'">Open</button><button class="btn sm" data-act="sh_leave" data-id="'+i+'">Leave</button></div>'}).join("")+'</div>';
  return h+'</section>';
}
function shWsKey(){return "cs-ws-"+window.__UID}
function cpMsg(t){W.pMsg=t||"";var e=$("cpmsg");if(e){e.textContent=W.pMsg;e.hidden=!W.pMsg}}
function cpPreviewPaint(){var e=$("cppv");if(e)e.innerHTML=cpPreviewHTML();var a=$("cpavprev");if(a&&W.p){a.innerHTML=W.p.avatar_url?'<img src="'+esc(W.p.avatar_url)+'" alt="">':esc((W.p.display_name||"?").slice(0,1).toUpperCase())}}
function kitClean(k){
  k=normKit(k);
  var ok=function(x){return x[0].trim()||x[1].trim()};
  k.stats=k.stats.filter(ok);k.rates=k.rates.filter(ok);k.brands=k.brands.filter(function(b){return b.name.trim()||b.note.trim()});
  return k;
}
async function cpSave(){
  var p=W.p;
  p.handle=(p.handle||"").trim().toLowerCase();
  if(!/^[a-z0-9_]{3,24}$/.test(p.handle)){cpMsg("Handles use 3 to 24 letters, numbers or underscores.");return}
  var links=p.links.map(function(l){return {label:(l.label||"").trim().slice(0,30),url:(l.url||"").trim()}}).filter(function(l){return l.url||l.label});
  for(var i=0;i<links.length;i++){if(!/^https?:\/\/\S+\.\S+/i.test(links[i].url)){cpMsg("Link "+(i+1)+" needs a full address starting with https://");return}}
  W.pSaving=true;cpMsg("Saving…");
  var row={user_id:window.__UID,handle:p.handle,display_name:(p.display_name||"").trim()||null,tagline:(p.tagline||"").trim()||null,bio:(p.bio||"").trim()||null,avatar_url:p.avatar_url||null,accent:p.accent,look:p.look||"plain",links:links,kit:kitClean(p.kit),is_public:!!p.is_public,updated_at:new Date().toISOString()};
  var r=await WSB.from("profiles").upsert(row,{onConflict:"user_id"});
  W.pSaving=false;
  if(r.error){cpMsg(r.error.code==="23505"?"That handle is taken. Try another.":"Couldn't save. "+r.error.message);return}
  p.links=links;p.exists=true;W.pMsg="Saved.";render();toast("Creator page saved");
}

