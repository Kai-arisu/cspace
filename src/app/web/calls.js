/* ---------- calls ---------- */
async function ytCall(body){
  try{
    var r=await WSB.functions.invoke("youtube-sync",{body:body});
    if(r.error){
      var info=null;try{info=await r.error.context.json()}catch(e){}
      return {ok:false,err:info||{error:"network",message:"Could not reach the server. Check your connection."}};
    }
    return {ok:true,data:r.data};
  }catch(e){return {ok:false,err:{error:"network",message:"Could not reach the server. Check your connection."}}}
}
async function audLoad(quiet){
  if(W.loading)return;W.loading=true;
  try{
    var c=await WSB.from("connections").select("*").eq("user_id",window.__UID).order("created_at",{ascending:true});
    if(c.error)throw c.error;
    var conns=c.data||[],ids=conns.map(function(x){return x.id}),snaps={},vids={};
    if(ids.length){
      var since=new Date(Date.now()-35*864e5).toISOString();
      var s=await WSB.from("snapshots").select("connection_id,ts,followers,views,posts,extra").in("connection_id",ids).gte("ts",since).order("ts",{ascending:true}).limit(3000);
      if(s.error)throw s.error;
      (s.data||[]).forEach(function(x){(snaps[x.connection_id]=snaps[x.connection_id]||[]).push(x)});
      var v=await WSB.from("videos").select("*").in("connection_id",ids).order("published_at",{ascending:false}).limit(2000);
      if(v.error)throw v.error;
      (v.data||[]).forEach(function(x){(vids[x.connection_id]=vids[x.connection_id]||[]).push(x)});
    }
    W.conns=conns;W.snaps=snaps;W.vids=vids;W.loaded=true;W.err="";
  }catch(e){W.err="Couldn't load your channels. "+((e&&e.message)||"");if(!W.loaded)W.loaded=true}
  W.loading=false;
  if(S.view==="aud"){if(!W.painted){W.painted=1;render()}else audPaint()}else if(S.view==="home"&&!(document.activeElement&&document.activeElement.id==="qcin"))render();
}
async function audRefresh(force){
  if(W.busy)return;W.busy=true;audPaintBtn();
  var r=await ytCall({refresh:true,force:!!force});
  var so=await socSync(force);
  W.busy=false;W.lastRefresh=Date.now();var wasCfg=W.cfg;
  if(!r.ok){
    if(r.err.error==="not_configured"){W.cfg=false}
    else if(force){toast(r.err.message||"Couldn't refresh")}
  }else{W.cfg=true;if(force)toast((r.data.refreshed||(so&&so.refreshed))?"Numbers updated":"Already up to date")}
  if(force&&so&&so.errors&&so.errors.length)toast(so.errors[0]);
  await audLoad();audPaintBtn();
  if(wasCfg!==W.cfg&&S.view==="aud")render();
}
function audPaintBtn(){var b=document.querySelector('[data-act="aud_refresh"]');if(b){b.disabled=W.busy;b.textContent=W.busy?"Refreshing…":"Refresh numbers"}}

