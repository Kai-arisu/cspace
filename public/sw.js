const C='cs-shell-977d5be2a5';
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
 if(/\.(js|woff2|png|webmanifest)$/.test(p)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x})));return}
 e.respondWith(fetch(r).catch(()=>caches.match(r).then(m=>m||caches.match('/'))))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){}
 e.waitUntil(self.registration.showNotification(d.title||'Creator Space',{body:d.body||'',tag:d.tag||'cs',icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=(e.notification.data&&e.notification.data.url)||'/';
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if(c.url.startsWith(self.location.origin)&&'focus'in c)return c.focus()}return clients.openWindow(u)}))});
