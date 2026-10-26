const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/Content Security|Refused/.test(m.text()))errs.push(m.text())});
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','r@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
await p.evaluate(()=>{});
// make a second space with a note, search from the first
await p.click('[data-act="spaceadd"]').catch(()=>{});await p.waitForTimeout(300);
const inp=p.locator('#dlg input').first();if(await inp.count()){await inp.fill('Second');await p.keyboard.press('Enter');await p.waitForTimeout(500)}
await p.click('[data-act="qtoggle"]');await p.click('[data-act="qnote"]');await p.waitForTimeout(300);
await p.fill('#ntitle','Zebra plan');await p.waitForTimeout(300);
await p.selectOption('.spsel',{index:0}).catch(()=>{});await p.waitForTimeout(400);
await p.fill('#gsearch','zebra');await p.waitForTimeout(300);
ok(await p.locator('#sres button').count()>=1,'search finds a note from another space');
ok(/Second/.test(await p.textContent('#sres')),'result shows its space name');
await p.click('#sres button');await p.waitForTimeout(400);
ok(/Second/.test(await p.inputValue('.spsel').then(v=>p.locator('.spsel option:checked').textContent())),'clicking jumps to that space');
ok(errs.length===0,'no page errors '+errs.join('|'));
await b.close();srv.close();console.log(fail?'FAILED':'ALL PASSED');process.exit(fail?1:0)})();
