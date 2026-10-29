/* ---------- clips ---------- */
var clipTag="all", clipQ="";
function ytId(u){var m=String(u).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);return m?m[1]:""}
function clipHost(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return u}}
function clipListHTML(){
  var q=clipQ.toLowerCase(),list=mine("clips").slice().sort(function(a,b){return (b.star-a.star)||(b.ts-a.ts)}).filter(function(c){return (clipTag==="all"||(c.tags||[]).indexOf(clipTag)>-1)&&(!q||(c.title+" "+c.note+" "+c.url).toLowerCase().indexOf(q)>-1)});
  if(!list.length)return mine("clips").length?'<div class="empty">No clips match.</div>':emptyCard("link","Build your reference library","Paste a video, an article or any link you want to learn from. Add a note like #lighting to find it later, or send it to your moodboard.","");
  return '<div class="clips">'+list.map(function(c){
    var y=ytId(c.url),host=clipHost(c.url),hue=0;for(var i=0;i<host.length;i++)hue=(hue*31+host.charCodeAt(i))%360;
    var th=y?'<img src="https://i.ytimg.com/vi/'+y+'/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">':"";
    return '<article class="clip"><a class="cl-th'+(y?"":" noimg")+'" href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg,hsl('+hue+' 60% 55%),hsl('+((hue+50)%360)+' 60% 40%))" aria-label="Open '+esc(c.title||host)+'"><span>'+esc(host.slice(0,1).toUpperCase())+'</span>'+th+'</a><div class="cl-b"><b>'+esc(c.title||host)+'</b><small class="muted">'+esc(host)+' · '+ago(c.ts)+'</small>'+(c.note?'<p>'+esc(c.note)+'</p>':"")+((c.tags||[]).length?'<div class="cl-tags">'+c.tags.map(function(t){return '<span class="mb-chip" style="font-size:11px;letter-spacing:.04em;text-transform:none">#'+esc(t)+'</span>'}).join("")+'</div>':"")+
      '<div class="cl-a"><button class="ico" data-act="clipstar" data-id="'+c.id+'" aria-label="Star" aria-pressed="'+!!c.star+'"'+(readOnly?" disabled":"")+'>'+I("star")+'</button><button class="btn sm" data-act="clipmood" data-id="'+c.id+'"'+(readOnly?" disabled":"")+'>To moodboard</button><button class="btn sm" data-act="clipidea" data-id="'+c.id+'"'+(readOnly?" disabled":"")+'>To ideas</button><button class="ico danger" data-act="clipdel" data-id="'+c.id+'" aria-label="Delete clip"'+(readOnly?" disabled":"")+'>'+I("x")+'</button></div></div></article>';
  }).join("")+'</div>';
}
function vClips(){
  var all=mine("clips"),tags={};all.forEach(function(c){(c.tags||[]).forEach(function(t){tags[t]=1})});
  var h=hero("clips","Clips","Save links and videos, and upload files. Add #tags to find links later.","");
  if(!readOnly)h+='<div class="form clipform"><label style="flex:2 1 260px"><span class="vh">Link</span><input class="in" id="clurl" placeholder="Paste a link" maxlength="400"></label><label style="flex:1 1 160px"><span class="vh">Title</span><input class="in" id="cltitle" placeholder="Optional" maxlength="90"></label><label style="flex:2 1 220px"><span class="vh">Note and #tags</span><input class="in" id="clnote" placeholder="Why it is worth keeping #lighting" maxlength="240"></label><button class="btn pri" data-act="clipadd">Save</button></div>';
  h+='<div class="chips" role="group" aria-label="Filter clips"><button class="chip" data-act="clipf" data-id="all" aria-pressed="'+(clipTag==="all")+'">All '+all.length+'</button>'+Object.keys(tags).sort().map(function(t){return '<button class="chip" data-act="clipf" data-id="'+esc(t)+'" aria-pressed="'+(clipTag===t)+'">#'+esc(t)+'</button>'}).join("")+'<input class="in" id="clipq" data-clipq="1" placeholder="Search clips" style="max-width:220px;margin-left:auto" value="'+esc(clipQ)+'" aria-label="Search clips"></div><div id="cliplist">'+clipListHTML()+'</div>';
  h+=vFiles();
  return h;
}
function clipAdd(){
  var u=($("clurl").value||"").trim();if(u&&!/^https?:\/\//i.test(u))u="https://"+u;
  try{var p=new URL(u);if(!/^https?:$/.test(p.protocol))throw 0}catch(e){return toast("Paste a valid link")}
  var note=($("clnote").value||"").trim(),tags=(note.match(/#[\w-]+/g)||[]).map(function(t){return t.slice(1).toLowerCase()});
  var c={id:uid(),sp:S.cur,url:u,title:($("cltitle").value||"").trim(),note:note.replace(/\s*#[\w-]+/g,"").trim(),tags:tags,star:false,ts:Date.now()};
  S.clips.push(c);touch();render();
  if(!c.title&&ytId(u)){
    try{fetch("https://www.youtube.com/oembed?format=json&url="+encodeURIComponent(u)).then(function(r){return r.json()}).then(function(j){if(j&&j.title){c.title=String(j.title).slice(0,90);touch();if(S.view==="clips")render()}}).catch(function(){})}catch(e){}
  }
}
