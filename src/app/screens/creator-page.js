/* ---------- creator page ---------- */
var CPACC=["#12163A","#5B5BF0","#0E9F6E","#E0388A","#F59E0B","#0284C7","#DC2626"];
function suggestHandle(){
  var base=((S.profile&&S.profile.name)||(window.__EMAIL||"").split("@")[0]||"creator").toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(base.length<3)base=(base+"creator").slice(0,12);return base.slice(0,24);
}
function normKit(k){
  k=k&&typeof k==="object"?k:{};
  function pairs(a,n){return (Array.isArray(a)?a:[]).slice(0,n).map(function(x){return [String(x&&x[0]||"").slice(0,40),String(x&&x[1]||"").slice(0,60)]})}
  return {on:!!k.on,intro:String(k.intro||"").slice(0,600),email:String(k.email||"").slice(0,120),stats:pairs(k.stats,6),rates:pairs(k.rates,8),
    brands:(Array.isArray(k.brands)?k.brands:[]).slice(0,10).map(function(b){return {name:String(b&&b.name||"").slice(0,60),note:String(b&&b.note||"").slice(0,120)}})};
}
async function cpLoad(){
  try{
    var r=await WSB.from("profiles").select("*").eq("user_id",window.__UID).maybeSingle();
    if(r.error)throw r.error;
    var d=r.data;
    W.p=d?{handle:d.handle||"",display_name:d.display_name||"",tagline:d.tagline||"",bio:d.bio||"",accent:d.accent||"#12163A",look:d.look||"plain",is_public:!!d.is_public,avatar_url:d.avatar_url||"",links:Array.isArray(d.links)?d.links:[],kit:normKit(d.kit),exists:true}
      :{handle:suggestHandle(),display_name:(S.profile&&S.profile.name)||"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit(),exists:false};
    W.pLoaded=true;W.pErr="";
    try{S.profile=S.profile||{};
      if(!W.p.avatar_url&&S.profile.avatar)W.p.avatar_url="/_blob/"+S.profile.avatar;
      else if(W.p.avatar_url&&!S.profile.avatar&&W.p.avatar_url.indexOf("/_blob/")===0){S.profile.avatar=W.p.avatar_url.slice(7);touch()}
      if(!W.p.display_name&&S.profile.name)W.p.display_name=S.profile.name;
      else if(W.p.display_name&&!S.profile.name){S.profile.name=W.p.display_name;touch()}
      if(typeof paintProfile==="function")paintProfile()}catch(e){}
  }catch(e){W.pErr="Couldn't load your profile. "+((e&&e.message)||"");W.pLoaded=true;if(!W.p)W.p={handle:"",display_name:"",tagline:"",bio:"",accent:"#111111",look:"plain",is_public:false,avatar_url:"",links:[],kit:normKit()}}
  if(S.view==="cp")render();
}
function cpLink(){return location.origin+"/u/"+(W.p&&W.p.handle||"")}
function cpPreviewHTML(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#111111";
  return '<div class="cp-pv" data-look="'+(p.look||"plain")+'" style="--pa:'+ac+'">'+(cpAvatarSrc()?'<img class="cp-av" src="'+esc(cpAvatarSrc())+'" alt="">':'<span class="cp-av cp-ini">'+esc((p.display_name||p.handle||"?").slice(0,1).toUpperCase())+'</span>')+
    '<b>'+esc(p.display_name||p.handle||"Your name")+'</b><span class="cp-h">@'+esc(p.handle||"handle")+'</span>'+(p.tagline?'<span class="cp-tg">'+esc(p.tagline)+'</span>':"")+(p.bio?'<p>'+esc(p.bio)+'</p>':"")+
    (p.links.length?'<div class="cp-ls">'+p.links.filter(function(l){return l.label||l.url}).map(function(l){return '<span>'+esc(l.label||l.url)+'</span>'}).join("")+'</div>':"")+'</div>';
}
var HANDLES=[["YouTube","https://youtube.com/@"],["Instagram","https://instagram.com/"],["TikTok","https://tiktok.com/@"],["X","https://x.com/"],["Facebook","https://facebook.com/"],["LinkedIn","https://linkedin.com/in/"],["WhatsApp","https://chat.whatsapp.com/","/","invite code or full invite link"],["Telegram","https://t.me/","@","channel or username"],["Discord","https://discord.gg/","/","invite code or full invite link"],["Website",""]];
function hdFind(name){var L=W.p.links;for(var i=0;i<L.length;i++)if(L[i].label===name)return i;return -1}
function hdValue(h){var i=hdFind(h[0]);if(i<0)return "";var u=W.p.links[i].url||"";return h[1]&&u.indexOf(h[1])===0?u.slice(h[1].length):u}
function hdSet(h,raw){
  var v=String(raw||"").trim(),i=hdFind(h[0]);
  if(!v){if(i>=0)W.p.links.splice(i,1);return}
  var url;
  if(/^https?:\/\//i.test(v))url=v;
  else if(!h[1])url="https://"+v;
  else url=h[1]+v.replace(/^@+/,"").replace(/^\/+/,"");
  if(i>=0)W.p.links[i].url=url;else W.p.links.push({label:h[0],url:url});
}
function hdRows(){
  var names=HANDLES.map(function(h){return h[0]});
  var h='<div class="hd-list">'+HANDLES.map(function(x,k){
    var v=hdValue(x),i=hdFind(x[0]);
    return '<div class="hd-row"><b>'+x[0]+'</b><label class="cp-pre">'+(x[1]?'<i>'+(x[2]||'@')+'</i>':'')+'<input class="in" data-w="h.'+k+'" maxlength="200" value="'+esc(v)+'" placeholder="'+(x[1]?(x[3]||"yourname"):"yourwebsite.com")+'" autocapitalize="none" spellcheck="false" aria-label="'+x[0]+' handle"></label>'+
      (i>=0&&W.p.links[i].url?'<a class="btn" href="'+esc(W.p.links[i].url)+'" target="_blank" rel="noopener noreferrer">Open</a>':'<span></span>')+'</div>';
  }).join("")+'</div>';
  var extra=W.p.links.map(function(l,i){return [l,i]}).filter(function(p){return names.indexOf(p[0].label)<0});
  if(extra.length)h+='<div class="plab" style="margin-top:14px">Other links'+extra.map(function(p){var i=p[1],l=p[0];return '<div class="cp-lr"><input class="in" data-w="l.'+i+'.label" maxlength="30" placeholder="Label" value="'+esc(l.label||"")+'"><input class="in" data-w="l.'+i+'.url" maxlength="300" placeholder="https://" value="'+esc(l.url||"")+'"><button class="ico" data-act="cp_ldel" data-id="'+i+'" aria-label="Remove link">'+I("x")+'</button></div>'}).join("")+'</div>';
  if(W.p.links.length<9)h+='<button class="btn" style="margin-top:12px" data-act="cp_ladd">Add another link</button>';
  return h;
}
var ACCENTS=["#111111","#E5484D","#F5A524","#30A46C","#0091FF","#8E4EC6","#E0388A","#0F766E"];
var LOOKS=[["plain","Plain"],["tint","Tinted"],["glow","Glow"],["dark","Dark"]];
function lookPanel(){
  var p=W.p,ac=/^#[0-9a-f]{6}$/i.test(p.accent)?p.accent:"#111111";
  return '<div class="plab">Accent colour<div class="acc-row">'+ACCENTS.map(function(c){return '<button class="acc-sw" data-act="cp_acc" data-id="'+c+'" style="--c:'+c+'" aria-label="Accent '+c+'" aria-pressed="'+(c.toLowerCase()===ac.toLowerCase())+'"></button>'}).join("")+'<input type="color" class="acc-in" data-w="p.accent" value="'+ac+'" aria-label="Custom accent colour"></div></div>'+
    '<div class="plab">Page look<div class="hd-seg" role="group" aria-label="Page look">'+LOOKS.map(function(o){return '<button data-act="cp_look" data-id="'+o[0]+'" aria-pressed="'+((p.look||"plain")===o[0])+'">'+o[1]+'</button>'}).join("")+'</div></div>';
}
async function cpShareImage(){
  var p=W.p;if(!p||!p.handle){toast("Save your handle first");return}
  var stats=[];
  try{
    var cs=await WSB.from("connections").select("id,platform").eq("user_id",window.__UID).eq("show_public",true).eq("kind","own");
    var ids=(cs.data||[]).map(function(c){return c.id});
    if(ids.length){var sn=await WSB.from("snapshots").select("connection_id,followers,ts").in("connection_id",ids).order("ts",{ascending:false}).limit(100);var got={};(sn.data||[]).forEach(function(x){if(!got[x.connection_id])got[x.connection_id]=x});
      stats=(cs.data||[]).map(function(c){var s=got[c.id];return s&&s.followers!=null?[c.platform==="youtube"?"YouTube":c.platform.charAt(0).toUpperCase()+c.platform.slice(1),s.followers]:null}).filter(Boolean)}
  }catch(e){}
  if(window.csShare)window.csShare({name:p.display_name||p.handle,handle:p.handle,tagline:p.tagline,accent:p.accent,look:p.look,avatar:p.avatar_url,stats:stats});
}
function cpAvatarHTML(size){var p=W.p,src=cpAvatarSrc();return '<span class="av '+(size||"xl")+'">'+(src?'<img src="'+esc(src)+'" alt="">':'<span>'+esc(((p&&p.display_name)||(S.profile&&S.profile.name)||"?").slice(0,1).toUpperCase())+'</span>')+'</span>'}
function cpAvatarSrc(){var a=S.profile&&S.profile.avatar;if(a)return "/_blob/"+a;return (W.p&&W.p.avatar_url)||""}
function cpTabs(){var t=W.cpTab||"profile";return '<div class="cp-tabs" role="tablist">'+[["profile","Profile"],["page","Public page"],["settings","Settings"]].map(function(x){return '<button role="tab" data-act="cp_tab" data-id="'+x[0]+'" aria-selected="'+(t===x[0])+'">'+x[1]+'</button>'}).join("")+'</div>'}
function cpLinkCard(){
  var p=W.p;
  if(!(p.exists&&p.is_public))return '<div class="panel"><h3>Your link</h3><p class="muted" style="margin:0;font-size:13.5px">'+(p.exists?"Your page is private. Switch on “Make this page public” and save to get a link.":"Pick your link name and save to create your page.")+'</p></div>';
  return '<div class="panel"><h3>Your link</h3><p class="cp-url">'+esc(cpLink())+'</p><div class="drow"><button class="btn pri sm" data-act="cp_copy">Copy link</button><button class="btn sm" data-act="cp_open">Open page</button><button class="btn sm" data-act="cp_shareimg">Share as image</button></div></div>';
}
function cpHTML(){
  if(!W.pLoaded){cpLoad();return hero("cp","Profile & settings",null,"")+'<p class="muted">Loading…</p>'}
  var p=W.p,mode=themeMode(),tab=W.cpTab||"profile";
  var save=tab==="settings"?"":'<button class="btn pri" data-act="cp_save"'+(W.pSaving?" disabled":"")+'>'+(W.pSaving?"Saving…":"Save changes")+'</button>';
  var h=hero("cp","Profile & settings",null,save)+cpTabs();
  if(W.pErr)h+='<p class="ac-errmsg">'+esc(W.pErr)+'</p>';
  if(W.pMsg&&tab!=="settings")h+='<p id="cpmsg" class="cp-note" role="status">'+esc(W.pMsg)+'</p>';else h+='<p id="cpmsg" class="cp-note" role="status" hidden></p>';
  if(tab==="profile"){
    h+='<div class="cp-grid"><div class="cp-main">'+
      '<section class="panel"><h3>You</h3><div class="cp-me">'+cpAvatarHTML("xl")+'<div class="cp-mebtn"><button class="btn sm" data-act="cp_avatar">'+(cpAvatarSrc()?"Change photo":"Upload photo")+'</button>'+(cpAvatarSrc()?'<button class="btn sm" data-act="cp_avrm">Remove</button>':'')+'<small class="muted">Used everywhere: sidebar, team, public page.</small></div></div>'+
      '<div class="cp-two"><label class="plab">Name<input class="in" data-w="p.display_name" maxlength="60" value="'+esc(p.display_name||(S.profile&&S.profile.name)||"")+'"></label>'+
      '<label class="plab">Role<input class="in" data-w="s.role" maxlength="40" value="'+esc((S.profile&&S.profile.role)||"")+'" placeholder="Creator, editor, podcaster…"></label></div>'+
      '<label class="plab">Tagline<input class="in" data-w="p.tagline" maxlength="90" value="'+esc(p.tagline)+'" placeholder="What you make, in one line"></label>'+
      '<label class="plab">About<textarea class="in" data-w="p.bio" rows="3" maxlength="600" placeholder="A few lines about you and your work">'+esc(p.bio)+'</textarea></label></section>'+
      '<section class="panel"><h3>Where people find you</h3>'+hdRows()+'</section></div>'+
      '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+cpLinkCard()+'</aside></div>';
  }else if(tab==="page"){
    h+='<div class="cp-grid"><div class="cp-main">'+
      '<section class="panel"><h3>Your page</h3>'+
      '<label class="plab">Link<span class="cp-pre"><i>'+esc(location.host)+'/u/</i><input class="in" data-w="p.handle" maxlength="24" value="'+esc(p.handle)+'" placeholder="yourname" autocapitalize="none" spellcheck="false"></span></label>'+
      '<label class="cp-sw"><input type="checkbox" data-act="cp_pub"'+(p.is_public?" checked":"")+'><span><b>Make this page public</b><small>Anyone with the link can see your name, photo, handles and the channels you choose in Audience.</small></span></label>'+
      lookPanel()+'</section>'+kitPanel()+'</div>'+
      '<aside class="cp-side"><div class="panel"><h3>Preview</h3><div id="cppv">'+cpPreviewHTML()+'</div></div>'+cpLinkCard()+'</aside></div>';
  }else{
    h+='<div class="cp-set">'+
      '<section class="panel"><h3>Appearance</h3>'+
      '<div class="setrow"><span>Theme</span><div class="hd-seg" role="group" aria-label="Appearance">'+[["auto","Auto"],["light","Light"],["dark","Dark"]].map(function(o){return '<button data-act="ms_theme" data-id="'+o[0]+'" aria-pressed="'+(mode===o[0])+'">'+o[1]+'</button>'}).join("")+'</div></div>'+
      '<div class="setrow"><span>Sounds</span><div class="hd-seg" role="group" aria-label="Sounds">'+[["on","On"],["off","Off"]].map(function(o){return '<button data-act="snd" data-id="'+o[0]+'" aria-pressed="'+((o[0]==="on")===sndOn())+'">'+o[1]+'</button>'}).join("")+'</div></div></section>'+
      '<section class="panel"><h3>Phone alerts</h3>'+pushPanel().replace('>Alerts<p','><p')+'</section>'+
      (window.__WS?'':shPanel())+
      '<section class="panel"><h3>Account</h3>'+
      '<div class="setrow"><span>Signed in as</span><b>'+esc(window.__EMAIL||"")+'</b></div>'+
      '<div class="setrow"><span>Your data</span><span style="display:flex;gap:6px"><button class="btn sm" data-act="imp_open">Import from other apps</button><button class="btn sm" data-act="datadlg">Backup and export</button></span></div>'+
      '<div class="setrow"><span>Password</span><button class="btn sm" data-act="cp_pw">Email me a reset link</button></div>'+
      '<div class="setrow"><span>Sign out of this device</span><button class="btn sm" data-act="signout">Sign out</button></div></section></div>';
  }
  return h+'<input type="file" id="cpfile" accept="image/*" hidden>';
}
function kitRows(title,key,arr,ph1,ph2,max,hint){
  var h='<div class="kt-blk"><div class="kt-h"><b>'+title+'</b>'+(arr.length<max?'<button class="btn sm" data-act="kit_add" data-id="'+key+'">Add</button>':"")+'</div>';
  if(hint&&!arr.length)h+='<p class="muted kt-hint">'+hint+'</p>';
  h+=arr.map(function(x,i){
    var a=key==="b"?x.name:x[0],b=key==="b"?x.note:x[1],f1=key==="b"?"name":"0",f2=key==="b"?"note":"1";
    return '<div class="kt-row"><input class="in" data-w="k.'+key+'.'+i+'.'+f1+'" maxlength="60" placeholder="'+ph1+'" value="'+esc(a)+'" aria-label="'+ph1+'"><input class="in" data-w="k.'+key+'.'+i+'.'+f2+'" maxlength="'+(key==="b"?120:60)+'" placeholder="'+ph2+'" value="'+esc(b)+'" aria-label="'+ph2+'"><button class="ico" data-act="kit_del" data-id="'+key+'.'+i+'" aria-label="Remove">'+I("x")+'</button></div>';
  }).join("")+'</div>';
  return h;
}
function kitPanel(){
  var k=W.p.kit;
  return '<section class="panel cp-form"><h3>Media kit</h3><p class="muted" style="margin:-4px 0 6px;font-size:14px">A page for sponsors: your numbers, rates and past brands. Send them the link or save it as a PDF.</p>'+
    '<label class="cp-pub"><input type="checkbox" data-act="kit_on"'+(k.on?" checked":"")+'> Publish my media kit</label>'+
    '<label class="plab">Intro<textarea class="in" data-w="k.intro" rows="3" maxlength="600" placeholder="Who you are, what you make and who watches">'+esc(k.intro)+'</textarea></label>'+
    '<label class="plab">Contact email<input class="in" data-w="k.email" maxlength="120" placeholder="business@yourname.com" value="'+esc(k.email)+'"></label>'+
    kitRows("Extra stats","s",k.stats,"Label, e.g. Avg. views","Value",6,"Your connected channels already show their numbers. Add things like average views or top region.")+
    kitRows("Rates","r",k.rates,"Service, e.g. Integrated video","Price",8,"Add what you charge.")+
    kitRows("Brands you have worked with","b",k.brands,"Brand","What you did",10,"Add past sponsors or collaborations.")+
    '<div class="drow"><button class="btn" data-act="kit_import">Import from Business tab</button>'+(W.p.exists&&W.p.is_public&&k.on?'<a class="btn" href="/u/'+esc(W.p.handle)+'/kit" target="_blank" rel="noopener noreferrer">Open media kit</a><button class="btn" data-act="kit_copy">Copy link</button>':'')+'</div>'+
    '<p class="muted" style="font-size:13px;margin:0">The kit is shown only when your page is public and this is switched on. Remember to press Save.</p></section>';
}
