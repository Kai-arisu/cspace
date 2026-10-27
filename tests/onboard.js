// First-run checklist, empty states, sample space
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');
const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);
await p.click('[data-ag="up"]');await p.fill('#agemail','n@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
await p.waitForTimeout(1500);
// no seed: brand-new account
ok(await p.locator('.ob').count()===1,'new account sees Get set up');
ok(await p.locator('.td-stat').count()===0,'no wall of zeros for a new account');
await p.fill('#obname','Cash Tea Vlogs');await p.click('[data-act="ob_name"]');await p.waitForTimeout(300);
ok((await p.textContent('#spaces')).includes('Cash Tea Vlogs'),'naming the space renames it');
ok(await p.locator('.ob-l li.done').count()===1,'step ticks off');
await p.fill('#qcin','First idea #test');await p.press('#qcin','Enter');await p.waitForTimeout(400);
await p.evaluate(()=>{document.querySelector('#nav [data-id="home"]').click()});await p.waitForTimeout(300);
ok(await p.locator('.ob-l li.done').count()===2,'capturing an idea ticks step 2');
for(const v of ['notes','board','clips']){await p.evaluate(v=>document.querySelector('#nav [data-id="'+v+'"]').click(),v);await p.waitForTimeout(300);ok(await p.locator('.ecard').count()===1,v+' shows a helpful empty state')}
await p.evaluate(()=>{document.querySelector('#nav [data-id="notes"]').click()});await p.waitForTimeout(200);
await p.click('.ecard [data-act="ntpl"][data-id="video"]');await p.waitForTimeout(300);ok(await p.locator('#nbody').count()===1,'template starts a note');
await p.evaluate(()=>{document.querySelector('#nav [data-id="home"]').click()});await p.waitForTimeout(300);
await p.click('[data-act="ob_sample"]');await p.waitForTimeout(500);
ok((await p.textContent('#spaces')).includes('Sample: Travel vlog'),'sample space created');
ok(await p.locator('.td-stat').count()===4,'sample space shows the full Today');
ok(await p.locator('[data-act="ob_sample"]').count()===0,'sample button gone once used');
await p.click('[data-act="ob_hide"]');await p.waitForTimeout(300);
ok(await p.locator('.ob').count()===0,'Hide removes the checklist');
await p.reload();await p.waitForTimeout(2500);
ok(await p.locator('.ob').count()===0,'checklist stays hidden after reload');
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
