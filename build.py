import re,os,shutil
base=os.path.dirname(os.path.abspath(__file__))+'/'
src=open(base+'creator-space.html').read()
web=open(base+'web/web.js').read()
boot=open(base+'web/boot.js').read()
css=open(base+'web/web.css').read()+'\n'+open(base+'web/frost.css').read()+'\n'+open(base+'web/studio.css').read()+'\n'+open(base+'web/editorial.css').read()+'\n'+open(base+'web/mid.css').read()+'\n'+open(base+'web/pubpage.css').read()+'\n'+open(base+'web/landing.css').read()
# split
i=src.index('<script>');j=src.rindex('</script>')
pre=src[:i];js=src[i+len('<script>'):j]
def rep(a,b,cnt=1):
    global js
    assert js.count(a)==cnt,(a[:70],js.count(a))
    js=js.replace(a,b)
rep('/* ---------- boot ---------- */',web+'\n/* ---------- boot ---------- */')
rep('  $("wrap").innerHTML=html;\n','  var wv=webView(v);if(wv!==null)html=wv;\n  $("wrap").innerHTML=html;\n  webMount(v);\n')
rep('||dataAct(a,b)||rerrAct(a,b))return;','||dataAct(a,b)||rerrAct(a,b)||webAct(a,b))return;')
rep("""    '<p class="muted" style="font-size:12px;margin-top:10px">Appearance is saved""","""    '<div class="plab">Account<div class="pseg"><span class="muted" style="font-size:13px;align-self:center">'+esc(window.__EMAIL||"")+'</span><button class="btn sm" data-act="signout">Sign out</button></div></div>'+
    '<p class="muted" style="font-size:12px;margin-top:10px">Appearance is saved""")
rep("""if(roleName())h+='<p class="muted" style="margin:8px 0 0;font-size:13px">Your access: <b>'+roleName()+'</b></p>';""","""h+='<p class="muted" style="margin:8px 0 0;font-size:13px">Signed in as <b>'+esc(window.__EMAIL||"")+'</b></p>';""")
rep("""'<p class="muted" style="font-size:13px;margin:4px 0 0">Only people you invite, or who open your link and sign in, can see this data. Only editors can change it. Use the Share menu at the top of the page to change who has access.</p>'""" if False else "Only people you invite, or who open your link and sign in, can see this data. Only editors can change it. Use the Share menu at the top of the page to change who has access.","Only you can see your notes, boards and files. They are tied to your account. Your public creator page shows only what you choose to publish.")
k=js.index('function showShare(){');k2=js.index('function commentOn(')
js=js[:k]+'function showShare(){S.view="cp";render()}\n'+js[k2:]
rep('Sign in to sync it to your cloud database.','Sign in again to sync it.')
rep("""  $("tabbar").innerHTML=VIEWS.map(function(v){
    return '<button data-act="view" data-id="'+v.id+'" aria-current="'+(S.view===v.id)+'" style="--c:'+v.c+'">'+I(v.ic)+'<span>'+v.name+'</span></button>';
  }).join("");""",'  $("tabbar").innerHTML=webTabs();')
rep('case "profile":profOpenDlg(true);return true;','case "profile":if(window.__WS){toast("Switch back to your own workspace to open your handles");return true}S.view="cp";if(typeof W!=="undefined")W.cpTab="profile";render();return true;')
rep('paintTheme();ftPaint();paintProfile();paintBell();\n}','paintTheme();ftPaint();paintProfile();paintBell();webCrumb();\n}')
# html assembly
m=re.search(r'</style>',pre);head_end=m.end()
head=pre[:head_end].replace('<meta name="claude:viewport-fit-sides" content="cover">','')
body=pre[head_end:]
out='<!doctype html><html lang="en" class="authing"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">'+head+'<style id="webcss">'+css+'</style></head><body>'
landing=open(base+'web/landing.html').read();lpjs=open(base+'web/landing.js').read()
early='<script>try{if(location.pathname==="/"&&!/[?&](signin|signup)\\b/.test(location.search)&&!/type=recovery/.test(location.hash+location.search)&&!Object.keys(localStorage).some(function(k){return /^sb-.*-auth-token$/.test(k)}))document.documentElement.className="landing"}catch(e){}</script>'
out=out.replace('</head><body>',early+'</head><body>',1)
out+='<div id="authgate" hidden></div><div id="pubpage" hidden></div><div id="landing" hidden>'+landing+'</div>'+body
out+='<script src="/supabase.js"></script><script>'+boot+'</script><script>'+lpjs+'</script><script type="text/plain" id="appjs">'+js+'</script><script>if("serviceWorker"in navigator){var hadSW=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener("controllerchange",function(){if(!hadSW){hadSW=true;return}if(document.getElementById("swup"))return;var d=document.createElement("div");d.id="swup";d.className="swup";d.innerHTML=\'<span>A new version of Creator Space is ready.</span><button onclick="location.reload()">Reload</button>\';document.body.appendChild(d)});addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").then(function(r){setInterval(function(){r.update().catch(function(){})},36e5)}).catch(function(){})})}</script></body></html>'
out=re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com/[^"]*">','<link rel="preload" href="/jost.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/young.woff2" as="font" type="font/woff2" crossorigin>',out,count=1)
out=out.replace('<title>Creator Space</title>','<title>Creator Space: one workspace for creators</title><meta name="description" content="A free workspace for YouTube and Instagram creators: write scripts, plan posts, watch your live numbers and run sponsor deals in one calm place."><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%2317171A%27/%3E%3Cpath d=%27M21 11a7 7 0 1 0 0 10%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27 stroke-linecap=%27round%27/%3E%3C/svg%3E">',1)
old='<div class="brand"><span class="logo" id="logo"></span><b>Creator Space</b></div>'
assert out.count(old)==1
out=out.replace(old,'<button class="brand" id="railbtn" data-act="rail" aria-expanded="true" aria-label="Collapse sidebar" title="Collapse sidebar  ["><span class="logo" id="logo"></span><b>Creator Space</b><span class="rail-ic" aria-hidden="true"><svg class="i" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg></span></button>')
os.makedirs(base+'public',exist_ok=True)
open(base+'public/index.html','w').write(out)
shutil.copy(base+'vendor/supabase.js',base+'public/supabase.js')
shutil.copy(base+'vendor/591.supabase.js',base+'public/591.supabase.js')

shutil.copy(base+'vendor/fonts/geist-latin-wght-normal.woff2',base+'public/geist.woff2')
os.makedirs(base+'public/lp',exist_ok=True)
for f in os.listdir(base+'vendor/lp'):shutil.copy(base+'vendor/lp/'+f,base+'public/lp/'+f)
shutil.copy(base+'vendor/fonts/instrument-sans-latin-wght-normal.woff2',base+'public/is.woff2')
shutil.copy(base+'vendor/fonts/instrument-sans-latin-ext-wght-normal.woff2',base+'public/is-ext.woff2')
shutil.copy(base+'vendor/fonts/instrument-serif-latin-400-normal.woff2',base+'public/iserif.woff2')
shutil.copy(base+'vendor/fonts/jost-latin-wght-normal.woff2',base+'public/jost.woff2')
shutil.copy(base+'vendor/fonts/jost-latin-ext-wght-normal.woff2',base+'public/jost-ext.woff2')
shutil.copy(base+'vendor/fonts/young-serif-latin-400-normal.woff2',base+'public/young.woff2')
# ---- PWA ----
import json
from PIL import Image, ImageDraw
def icon(n,pad):
    im=Image.new('RGB',(n,n),(255,194,26));d=ImageDraw.Draw(im)
    r=n*(0.5-pad);c=n/2;w=max(2,int(n*0.1))
    d.arc([c-r*0.55,c-r*0.55,c+r*0.55,c+r*0.55],40,320,fill=(28,26,23),width=w)
    return im
icon(192,0.1).save(base+'public/icon-192.png');icon(512,0.1).save(base+'public/icon-512.png');icon(512,0.2).save(base+'public/icon-maskable.png')
open(base+'public/manifest.webmanifest','w').write(json.dumps({"name":"Creator Space","short_name":"Creator","start_url":"/","scope":"/","display":"standalone","background_color":"#FFFFFF","theme_color":"#FFFFFF","icons":[{"src":"/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"/icon-512.png","sizes":"512x512","type":"image/png"},{"src":"/icon-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}))
import hashlib
_ver=hashlib.sha1(out.encode()).hexdigest()[:10]
open(base+'public/sw.js','w').write("""const C='cs-shell-"""+_ver+"""';
const SHELL=['/','/supabase.js','/591.supabase.js','/jost.woff2','/young.woff2','/is.woff2','/manifest.webmanifest','/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 const p=u.pathname;
 if(p.startsWith('/_blob/')||p.startsWith('/u/')||p.startsWith('/cal/')||p==='/sw.js')return;
 // the app itself: open instantly from cache, a new version arrives with a new service worker
 if(r.mode==='navigate'&&(p==='/'||p==='/index.html')){e.respondWith(caches.match('/').then(m=>m||fetch(r)));return}
 // fonts, scripts and icons: cache first
 if(/\\.(js|woff2|png|webmanifest)$/.test(p)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x})));return}
 e.respondWith(fetch(r).catch(()=>caches.match(r).then(m=>m||caches.match('/'))))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){}
 e.waitUntil(self.registration.showNotification(d.title||'Creator Space',{body:d.body||'',tag:d.tag||'cs',icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=(e.notification.data&&e.notification.data.url)||'/';
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if(c.url.startsWith(self.location.origin)&&'focus'in c)return c.focus()}return clients.openWindow(u)}))});
""")

# syntax check of the app js and boot
os.makedirs(base+'build',exist_ok=True);open(base+'build/check-app.js','w').write(js);open(base+'build/check-boot.js','w').write(boot)
print('built',len(out))
