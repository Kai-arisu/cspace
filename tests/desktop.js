// the Windows and Mac apps open /?app=desktop: no marketing page, straight to sign-in, and it sticks
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const e=path.extname(f);res.writeHead(200,{'content-type':e==='.html'?'text/html':e==='.js'?'application/javascript':'application/octet-stream'});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const base='http://localhost:'+srv.address().port;const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1280,height:800}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(base+'/');await p.waitForTimeout(800);ok(await p.locator('#landing').isVisible(),'browser visitors still see the landing page');
await p.goto(base+'/?app=desktop');await p.waitForTimeout(800);
ok(!(await p.locator('#landing').isVisible()),'desktop app skips the landing page');
ok(await p.locator('#authgate .ag-card').isVisible(),'desktop app opens on sign-in');
ok(await p.locator('#agback').count()===0,'no "Back to the start" link in the app');
await p.goto(base+'/');await p.waitForTimeout(800);
ok(await p.locator('#authgate .ag-card').isVisible()&&!(await p.locator('#landing').isVisible()),'after sign-out to / the app still opens on sign-in');
ok(errs.length===0,'no page errors '+errs.join('|'));
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close();process.exit(fail?1:0)})();
