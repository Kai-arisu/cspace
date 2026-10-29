/* ---------- boot ---------- */
applyPrefs();
try{var th=localStorage.getItem(LS+"-theme");if(th==="light"||th==="dark")document.documentElement.setAttribute("data-theme",th)}catch(e){}
$("logo").innerHTML=I("logo");$("logo2").innerHTML=I("logo");$("sico").innerHTML=I("search");$("plusico").innerHTML=I("plus");$("sharebtn").innerHTML=I("users");
try{var raw=localStorage.getItem(LS);if(raw)S=JSON.parse(raw)}catch(e){S=null;try{localStorage.setItem(LS+"-corrupt",localStorage.getItem(LS))}catch(e2){}}
if(!S||typeof S!=="object"||Array.isArray(S))S=defaults();
syLoad();
try{fix();render()}catch(e){renderFail(e)}
syStatus();

(async function(){
  var c=window.claude;
  if(!c||!c.use){syStatus();return}
  try{assets=await c.use("assets")}catch(e){assets=null}
  try{db=await c.use("db")}catch(e){db=null}
  try{sampleApi=await c.use("sample")}catch(e){sampleApi=null}
  try{downloadsApi=await c.use("downloads")}catch(e){downloadsApi=null}
  try{commentsApi=await c.use("comments")}catch(e){commentsApi=null}
  try{userApi=await c.use("user")}catch(e){userApi=null}
  try{roomApi=await c.use("room");if(roomApi&&roomApi.onPeers)roomApi.onPeers(function(ch){peers=ch.peers||[];paintPeers()})}catch(e){roomApi=null}
  if(db)await syRole();
  render();syStatus();
  if(!db)return;
  try{
    db.doc("store/meta").onSnapshot(function(snap){syOnMeta(snap)},function(e){syFail(e,"pull")});
  }catch(e){syFail(e,"pull")}
  setTimeout(function(){if(db&&!SY.ready&&!SY.err){SY.err="slow";syStatus()}},12000);
})();
})();

