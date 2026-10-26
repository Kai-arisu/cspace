const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const base='http://localhost:'+srv.address().port;const errs=[];
async function mk(){const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p}
async function signup(p,email){await p.goto(base+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000)}
const A=await mk();await signup(A,'a@x.co');
await A.click('#nav .si-row[data-id="ideas"]');await A.fill('#ideain','Owner idea');await A.click('[data-act="addidea"]');await A.waitForTimeout(1800);
await A.click('#pcard');await A.waitForTimeout(800);
ok(await A.locator('[data-act="sh_invite"]').count()===1,'owner sees Teammates panel');
await A.fill('[data-w="sh.email"]','b@x.co');await A.selectOption('[data-w="sh.role"]','viewer');await A.click('[data-act="sh_invite"]');await A.waitForTimeout(800);
ok((await A.textContent('.sh-list')).includes('b@x.co'),'invite listed');await A.locator('.sh-add').scrollIntoViewIfNeeded();await A.screenshot({path:'/tmp/sh.png'});
const B=await mk();await signup(B,'b@x.co');
await B.click('#pcard');await B.waitForTimeout(800);
ok(await B.locator('[data-act="sh_open"]').count()===1,'invitee sees Shared with you');
await B.click('[data-act="sh_open"]');await B.waitForTimeout(2500);
ok(await B.locator('#wsbar').count()===1,'banner shows in shared mode');
ok((await B.textContent('#wsbar')).includes('a@x.co')&&/viewer/.test(await B.textContent('#wsbar')),'banner names owner and role');
await B.click('#nav .si-row[data-id="ideas"]');await B.waitForTimeout(600);
ok((await B.textContent('#main')).includes('Owner idea'),'viewer sees owner data');
ok(await B.locator('#nav .si-row[data-id="cp"]').count()===0,'handles hidden in shared mode');
const before=fake.st.tables.docs.length;
await B.fill('#ideain','Viewer tries').catch(()=>{});await B.click('[data-act="addidea"]').catch(()=>{});await B.waitForTimeout(2500);
const A2=A;await A2.reload();await A2.waitForTimeout(2000);await A2.click('#nav .si-row[data-id="ideas"]');await A2.waitForTimeout(400);
ok(!(await A2.textContent('#main')).includes('Viewer tries'),'viewer edit does not reach owner');
// upgrade to editor
await A.click('#pcard');await A.waitForTimeout(800);await A.selectOption('[data-w="sh.r.0"]','editor');await A.waitForTimeout(600);
await B.reload();await B.waitForTimeout(2500);
ok(/editor/.test(await B.textContent('#wsbar')),'banner shows editor after upgrade');
await B.click('#nav .si-row[data-id="ideas"]');await B.fill('#ideain','Editor idea');await B.click('[data-act="addidea"]');await B.waitForTimeout(3000);
await A.reload();await A.waitForTimeout(2000);await A.click('#nav .si-row[data-id="ideas"]');await A.waitForTimeout(500);
ok((await A.textContent('#main')).includes('Editor idea'),'editor edit reaches owner');
await B.click('[data-act="sh_home"]');await B.waitForTimeout(2500);
ok(await B.locator('#wsbar').count()===0,'back to own workspace');
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
