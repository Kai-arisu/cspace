/* Creator Space landing: the strip, the idea you can type, the stage slider, the switches, the named space */
(function(){
var L=document.getElementById("landing");if(!L||L.__init)return;L.__init=1;
function $(id){return document.getElementById(id)}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;

/* the strip inside the headline: a shutter opens once, then the four screens take turns */
var strip=L.querySelector(".lp-strip"),imgs=strip?strip.querySelectorAll("img"):[],k=0;
if(imgs.length){imgs[0].classList.add("on");
  if(!RM){strip.classList.add("shut");requestAnimationFrame(function(){requestAnimationFrame(function(){strip.classList.add("open");strip.classList.remove("shut")})})}
  setInterval(function(){if(document.hidden)return;imgs[k].classList.remove("on");k=(k+1)%imgs.length;imgs[k].classList.add("on")},RM?5000:2600);
}

/* the idea you can type: tags come out of the sentence, like in the app */
var inp=$("lp-in");
function paintIdea(){
  var v=(inp.value||"").slice(0,80),tags=(v.match(/#[\w-]+/g)||[]).map(function(t){return t.toLowerCase()}),txt=v.replace(/\s*#[\w-]+/g,"").trim();
  $("lp-it").textContent=txt||"Your idea";
  $("lp-tags").innerHTML=tags.map(function(t){return '<span class="lp-tag">'+esc(t)+'</span>'}).join("")+"<span>just now</span>";
  $("lp-said").textContent=tags.length?"Saved to Ideas, sorted under "+tags.join(" and ")+". One press turns it into a card on your board or a post on your calendar."
    :"Saved to Ideas. Add a #tag to sort it, then one press turns it into a card on your board or a post on your calendar.";
}
if(inp){inp.addEventListener("input",paintIdea);
  L.querySelectorAll("[data-ex]").forEach(function(b){b.addEventListener("click",function(){inp.value=b.dataset.ex;paintIdea();inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)})});
  paintIdea();}

/* drag through the stages: one card moves from Idea to Shipped */
var ST=[
  {n:"Idea",dot:"#8c8c88",c:"Start with the idea.",s:"Every idea you save waits in the first column until you are ready for it.",
   h:'<b>Street food tour in Bhopal</b><div class="lp-row"><span class="lp-chip">#vlog</span><span class="lp-chip">Fri 31 Oct</span></div><div class="lp-row"><span class="lp-mini">Plan post</span><span class="lp-mini">Repurpose</span></div>'},
  {n:"Making",dot:"#1f201d",c:"Script it, shoot it.",s:"The script sits in Notes, the checklist ticks off as you go, and the teleprompter reads it back.",
   h:'<b>Street food tour in Bhopal</b><ul class="lp-chk"><li class="d"><i></i>Write the script</li><li class="d"><i></i>Film at the night market</li><li><i></i>Record the voiceover</li></ul><div class="lp-row"><span class="lp-chip">2 of 3 done</span><span class="lp-mini">Teleprompter</span></div>'},
  {n:"Review",dot:"#a86b12",c:"Hand it over, get it back.",s:"Assign the edit to a teammate. When they mark it done, it lands back here for your check.",
   h:'<b>Street food tour in Bhopal</b><div class="lp-row"><span class="lp-chip">Mia · Editor</span><span class="lp-chip warn">Due tomorrow</span></div><div class="lp-row"><span class="lp-mini">Open the cut</span><span class="lp-mini">Approve</span></div>'},
  {n:"Shipped",dot:"#1b6e66",c:"Ship it, watch it land.",s:"Published posts move to Shipped, and their views come in with your live numbers.",
   h:'<b>Street food tour in Bhopal</b><div class="lp-row"><span class="lp-chip ok">Published · Instagram</span></div><div class="lp-row" style="align-items:baseline;gap:10px"><span class="lp-num">5.2K</span><span style="font-size:13px;color:#636361">views in the first two days</span></div>'}
];
var rg=$("lp-stage"),col=$("lp-col"),stops=L.querySelectorAll(".lp-stops li"),clause=L.querySelector(".lp-clause"),sub=$("lp-clause-s");
function stage(i,instant){
  var s=ST[i];rg.value=i;rg.setAttribute("aria-valuetext",s.n);rg.parentNode.style.setProperty("--p",(i/3*100)+"%");
  stops.forEach(function(li,j){li.setAttribute("aria-current",String(j===i))});
  var draw=function(){
    clause.textContent=s.c;sub.textContent=s.s;
    col.style.setProperty("--dot",s.dot);
    col.innerHTML='<h4><i></i>'+s.n+'<small>'+(i===3?"12":i===0?"4":"1")+'</small></h4><div class="lp-card">'+s.h+'</div>'+(i===0?'<div class="lp-ghost">+ Add task</div>':"");
    clause.style.opacity=sub.style.opacity=col.style.opacity=1;
  };
  if(instant||RM){draw();return}
  clause.style.opacity=sub.style.opacity=col.style.opacity=0;setTimeout(draw,200);
}
if(rg){rg.addEventListener("input",function(){stage(+rg.value)});stops.forEach(function(li,j){li.addEventListener("click",function(){stage(j)})});stage(0,true)}

/* sentences with switches */
L.querySelectorAll(".lp-band").forEach(function(b){
  var sw=b.querySelector(".lp-sw");
  function set(on){sw.setAttribute("aria-checked",String(on));b.classList.toggle("on",on)}
  set(sw.getAttribute("aria-checked")==="true");
  sw.addEventListener("click",function(){set(sw.getAttribute("aria-checked")!=="true")});
});

/* a sentence with a blank: the name becomes the first space after sign-up */
var f=$("lp-cta");
if(f)f.addEventListener("submit",function(e){e.preventDefault();var n=($("lp-name").value||"").trim().slice(0,40);
  try{if(n)localStorage.setItem("cs-new-space",n);else localStorage.removeItem("cs-new-space")}catch(x){}
  if(window.__lpGate)window.__lpGate("up");});

/* the parts of each section rise in as it arrives */
var parts=L.querySelectorAll(".lp-show>*,.lp-how-l>*,.lp-how-r>*,.lp-band,.lp-list .lp-h2,.lp-pic,.lp-tbl,.lp-faq .lp-h2,.lp-qs details,.lp-cta>*,.lp-inv,.lp-flinks");
if(!RM&&"IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("lp-seen");io.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px"});
  parts.forEach(function(el,i){var sib=el.parentNode?Array.prototype.indexOf.call(el.parentNode.children,el):0;el.classList.add("lp-rise");el.style.transitionDelay=Math.min(sib,6)*75+"ms";io.observe(el)});
}
})();
