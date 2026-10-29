/* ---------- AI helpers ---------- */
var AIH=[
  {id:"ideas",name:"Idea suggestions",mode:"list",n:8,ph:"A theme or niche to focus on (optional)",ask:"Suggest {n} fresh, specific content ideas as one-line titles with a clear angle"},
  {id:"titles",name:"Title ideas",mode:"list",n:10,ph:"What is the video or post about?",ask:"Write {n} strong titles (mix curiosity, clarity and brevity, each under 70 characters)"},
  {id:"hooks",name:"Opening hooks",mode:"list",n:6,ph:"What is the video or post about?",ask:"Write {n} opening hooks for the first 15 seconds, each one or two sentences"},
  {id:"thumbs",name:"Thumbnail concepts",mode:"list",n:6,ph:"What is the video about?",ask:"Describe {n} thumbnail concepts: the image, the text (max 4 words) and the colour feel, in one line each"},
  {id:"script",name:"Script outline",mode:"text",ph:"Topic and the one thing viewers should take away",ask:"Write a script outline with these sections: Hook, Problem, Main points (with short talking lines), Call to action. Use headings that start with ## and keep it practical"},
  {id:"caption",name:"Caption and hashtags",mode:"text",ph:"What is the post about?",ask:"Write a caption (hook line, two short paragraphs, a call to action) followed by 8 relevant hashtags on one line"},
  {id:"repurpose",name:"Repurpose an idea",mode:"text",ph:"Paste the idea, note or video summary",ask:"Turn this into: a 30 second short script, a carousel outline of 6 slides, and a 5 post thread. Use ## headings for each"}
];
var AITONES=["Casual and friendly","Energetic","Educational and clear","Calm and thoughtful","Funny and playful"];
var aiH="ideas", aiTopic="", aiTone=AITONES[0], aiPlat="YouTube", aiRes=null, aiBusy=false, aiErr="", aiCtl=null;
function aiHelper(){return AIH.filter(function(h){return h.id===aiH})[0]||AIH[0]}
function aiPrompt(){
  var h=aiHelper(),m=bm(),ex=mine("ideas").slice(-10).map(function(i){return "- "+i.text.replace(/\s*#[\w-]+/g,"")}).join("\n");
  var p='You are a sharp content strategist helping a creator.\nCreator space: "'+spaceName()+'".'+(m.keywords.length?"\nBrand keywords: "+m.keywords.join(", ")+".":"")+"\nPlatform: "+aiPlat+".\nTone: "+aiTone+".\n"+(ex&&h.id==="ideas"?"Existing ideas (do not repeat these):\n"+ex+"\n":"")+
    "\nTask: "+h.ask.replace("{n}",h.n||"")+".\nSubject: "+(aiTopic.trim()||"the creator's niche, inferred from the space name and keywords")+".\n";
  if(h.mode==="list")p+="\nReturn ONLY a JSON array of "+h.n+" strings. No markdown, no numbering, no extra text.";
  else p+="\nReturn only the finished text, no preamble.";
  return p;
}
function aiOutHTML(){
  var nt=aiNote&&!aiBusy?'<div class="ai-nt">'+esc(aiNote)+'</div>':"";
  return nt+aiOutHTML0();
}
function aiOutHTML0(){
  if(aiErr)return '<div class="empty" style="color:var(--danger)">'+esc(aiErr)+'</div>';
  if(aiBusy&&!aiRes)return '<div class="ai-think"><i></i><i></i><i></i> Thinking…</div>';
  if(!aiRes)return '<div class="empty">Pick a helper, describe what you need, then press Generate.</div>';
  var h=aiHelper();
  if(Array.isArray(aiRes))return '<div class="ai-list">'+aiRes.map(function(t,i){return '<div class="ai-it"><span>'+esc(t)+'</span><span class="ai-a"><button class="btn sm" data-act="aicopy" data-i="'+i+'">Copy</button>'+(readOnly?"":'<button class="btn sm" data-act="aisaveidea" data-i="'+i+'">Save as idea</button>')+'</span></div>'}).join("")+'</div>'+(readOnly?"":'<button class="btn" data-act="aisaveall" style="margin-top:10px">Save all as ideas</button>');
  return '<div class="ai-text">'+esc(aiRes)+(aiBusy?'<span class="ai-caret"></span>':"")+'</div>'+(aiBusy?"":'<div class="ai-act"><button class="btn sm" data-act="aicopy" data-i="all">Copy</button>'+(readOnly?"":'<button class="btn sm pri" data-act="aisavenote">Save as note</button>')+'</div>');
}
function vAi(){
  var h=hero("ai","Writing helper","Draft ideas, titles, hooks, scripts and captions for this space.","");
  if(!sampleApi)h+='<p class="ai-off">These drafts come from built-in templates. Edit them to make them yours.</p>';
  var src=mine("notes").map(function(n){return ["n:"+n.id,"Note: "+(n.title||"Untitled")]}).concat(mine("ideas").map(function(i){return ["i:"+i.id,"Idea: "+i.text.replace(/\s*#[\w-]+/g,"").slice(0,50)]}));
  h+='<div class="ai"><section class="panel"><h2>Helpers</h2><div class="ai-hl" role="listbox" aria-label="Helpers">'+AIH.map(function(x){return '<button class="plf" role="option" data-act="aihelper" data-id="'+x.id+'" aria-pressed="'+(aiH===x.id)+'"><span class="nm">'+x.name+'</span></button>'}).join("")+'</div></section>'+
    '<section class="panel"><h2>'+aiHelper().name+'</h2><label style="display:block">What is it about?<textarea class="in" id="aitopic" data-ai="topic" placeholder="'+esc(aiHelper().ph)+'" maxlength="800" style="min-height:90px">'+esc(aiTopic)+'</textarea></label>'+
    '<div class="form" style="margin-top:10px"><label>Use something you wrote<select class="in" data-ai="src"><option value="">Choose…</option>'+opts(src,"")+'</select></label><label>Tone<select class="in" data-ai="tone">'+opts(AITONES,aiTone)+'</select></label><label>Platform<select class="in" data-ai="plat">'+opts(PLAT.map(function(p){return p[0]}),aiPlat)+'</select></label></div>'+
    '<div style="display:flex;gap:8px;margin:6px 0 16px"><button class="btn pri" data-act="airun"'+(aiBusy?" disabled":"")+'>'+(aiBusy?"Working…":(aiRes?"Generate again":"Generate"))+'</button>'+(aiBusy?'<button class="btn" data-act="aistop">Stop</button>':"")+'</div><div id="aiout">'+aiOutHTML()+'</div></section></div>';
  return h;
}
function aiPaint(){var o=$("aiout");if(o)o.innerHTML=aiOutHTML()}
function aiRun(){
  if(aiBusy)return;
  var t=$("aitopic");if(t)aiTopic=t.value;aiNote="";
  if(!sampleApi){aiErr="";aiRes=aiLocal();aiNote="Template draft. Edit it to make it yours.";render();return}
  var h=aiHelper();aiBusy=true;aiErr="";aiRes=null;aiCtl=new AbortController();render();
  var done=function(){aiBusy=false;aiCtl=null;render()};
  var fail=function(e){aiBusy=false;aiCtl=null;if(e&&e.name==="AbortError"){render();return}
    var c=e&&e.code;aiErr="";aiRes=aiLocal();aiNote=(c==="not_granted"?"Live drafting was not allowed here, so this is a template draft.":(c==="rate_limited"?"Too many requests in a row, so this is a template draft.":"Live drafting did not answer, so this is a template draft."))+" Try again to get a full AI draft.";render()};
  try{
    if(h.mode==="list"){
      sampleApi.json(aiPrompt(),{cache:false,signal:aiCtl.signal}).then(function(v){
        if(!Array.isArray(v))v=(v&&Array.isArray(v.items))?v.items:[];
        aiRes=v.map(function(x){return String(x).trim()}).filter(Boolean).slice(0,12);
        if(!aiRes.length){aiRes=null;aiErr="No results came back. Try again with more detail."}
        done();
      }).catch(fail);
    }else{
      sampleApi(aiPrompt(),{cache:false,signal:aiCtl.signal,onText:function(u){aiRes=u.text;aiPaint()}}).then(function(r){aiRes=(r&&r.text)||aiRes;done()}).catch(fail);
    }
  }catch(e){fail(e)}
}
function aiSaveIdea(text){S.ideas.push({id:uid(),sp:S.cur,text:text,tags:[],star:false,task:false,ts:Date.now()})}

/* ---------- offline assistant ---------- */
var aiNote="";
var AIL={
  ideas:["The beginner's guide to {T} I wish I had","{T}: 5 mistakes everyone makes and the quick fix","I tried {T} for 30 days. Here is what changed","{T} on a budget: what actually matters","Behind the scenes: how I really do {T}","{T} myths that need to die","One tool, one minute: {T}","Viewer questions about {T}, answered","{T} in 10 minutes a day: a realistic routine","What I would do differently if I started {T} again","The {T} setup tour","Beginner vs expert: {T} side by side","Rating every popular way to do {T}","A week of {T}, unfiltered"],
  titles:["How to get started with {T} (the simple way)","{T}: what nobody tells you","I tested {T} so you do not have to","Stop making this {T} mistake","The honest guide to {T}","{T} in 5 steps","Why {T} is easier than you think","{T}: before and after","Everything I learned about {T}","The only {T} tips you need","Is {T} worth it?","{T} for complete beginners","What changed when I started {T}","{T} explained in plain words"],
  hooks:["Most people get {T} wrong in the first minute. Here is what to do instead.","I spent a month on {T} so you can skip the boring part.","If {T} feels hard, you are probably missing one small thing.","Before you try {T}, watch this. It will save you a week.","Here is the fastest way I found to get better at {T}.","Everyone talks about {T}. Almost nobody shows how it really works.","Three things changed my results with {T}. The last one surprised me.","You do not need expensive gear for {T}. You need this."],
  thumbs:["Close-up of the result, big text: \"{T}\" in 3 words or fewer, high contrast with one loud colour","Split screen: before on the left, after on the right, an arrow and the text \"WORKS?\"","Your face with a clear expression, the key object in focus, and a short text like \"STOP THIS\"","One bold number (\"7 DAYS\") over a simple image of {T}, clean dark background","Flat lay of the tools for {T}, labels on the key item, warm colour feel","Red circle on the detail that matters, small text \"LOOK HERE\", bright and punchy","A single question on a plain background: \"Is {T} worth it?\", minimal black and white","Over the shoulder shot working on {T}, subtle glow, text \"HOW I DO IT\""]
};
function aiSeed(){var t=(aiTopic||"").trim();if(!t){var m=bm();t=(m.keywords&&m.keywords[0])||spaceName()||"your niche"}return t.replace(/\s+/g," ").replace(/[.?!]+$/,"")}
function aiShuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x}return a}
function aiLocal(){
  var h=aiHelper(),T=aiSeed(),f=function(s){return s.replace(/\{T\}/g,T)};
  if(h.mode==="list")return aiShuf(AIL[h.id]||AIL.ideas).slice(0,h.n||8).map(f);
  var tags=T.toLowerCase().split(/[^a-z0-9]+/).filter(function(w){return w.length>2}).slice(0,4).map(function(w){return "#"+w}).concat(["#creator","#contentcreator","#howto","#tips","#learn","#behindthescenes"]).slice(0,8).join(" ");
  if(h.id==="script")return "## Hook (0:00 to 0:15)\nShow the result first. Say what the viewer will get: \""+T+" without the guesswork.\"\n\n## Problem\nWhy "+T+" feels harder than it should. Name the one mistake you made yourself.\n\n## Main points\n1. The simple version: the smallest step that works.\n2. The common trap and how to avoid it.\n3. One trick that saves time.\n\n## Call to action\nAsk for one comment: \"Which part of "+T+" should I cover next?\"";
  if(h.id==="caption")return "Nobody told me this about "+T+".\n\nI spent a while getting it wrong, so here is the short version: start small, keep it simple, and repeat what works.\n\nSave this for later and tell me which part you want next.\n\n"+tags;
  return "## 30 second short\nHook: the one surprising fact about "+T+".\nBeat 1: the common mistake. Beat 2: the fix. Beat 3: the result. End: \"Follow for part two.\"\n\n## Carousel (6 slides)\n1. Title: "+T+" in 6 slides\n2. The problem\n3. Mistake to avoid\n4. The simple fix\n5. Example\n6. Save this and follow for more\n\n## Thread (5 posts)\n1. Hook about "+T+"\n2. The mistake\n3. The fix\n4. A quick example\n5. Question for the reader";
}

