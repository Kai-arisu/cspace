// App opens offline from cache; a new deploy shows a reload prompt
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
let swOverride=null;
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';
  if(u==='/sw.js'&&swOverride){res.writeHead(200,{'content-type':'application/javascript','cache-control':'no-cache'});return res.end(swOverride)}
  const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':ext==='.png'?'image/png':'text/plain','content-security-policy':csp,'cache-control':'no-cache'});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const origin='http://localhost:'+srv.address().port;
await p.goto(origin+'/');await p.waitForTimeout(500);
await p.click('[data-ag="up"]');await p.fill('#agemail','o@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
seed(fake,'o@x.co');await p.reload();await p.waitForTimeout(2500);
ok(await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>!!navigator.serviceWorker.controller)),'service worker controls the page');
const cached=await p.evaluate(()=>caches.keys().then(k=>Promise.all(k.map(n=>caches.open(n).then(c=>c.keys()).then(r=>r.map(x=>new URL(x.url).pathname))))).then(a=>a.flat()));
ok(cached.includes('/')&&cached.includes('/is.woff2'),'app shell cached');
// offline
await ctx.setOffline(true);
await p.reload();await p.waitForTimeout(2500);
ok(await p.locator('.td-head h1, .hero h1').count()===1,'app opens with no network');
ok((await p.textContent('#spaces')).includes('Cash Tea Vlogs'),'your data shows offline');
await ctx.setOffline(false);
// new deploy
swOverride=fs.readFileSync(site+'/sw.js','utf8').replace(/cs-shell-[a-z0-9]+/,'cs-shell-next');
await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()));
await p.waitForTimeout(2500);
ok(await p.locator('#swup').count()===1,'new version prompt appears');
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
