const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const base='http://localhost:'+srv.address().port;const errs=[];
async function mk(){const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p}
async function signup(p,email){await p.goto(base+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000)}
const A=await mk();await signup(A,'a@x.co');
await A.click('#nav .si-row[data-id="team"]');await A.waitForTimeout(800);
ok(await A.locator('.tm-empty').count()===1,'empty Team page invites you to add someone');
await A.click('[data-act="tm_add"]');await A.fill('[data-tmf="name"]','Mia Editor');await A.fill('[data-tmf="role"]','Video editor');await A.fill('[data-tmf="email"]','mia@x.co');await A.fill('[data-tmf="amount"]','30000');
await A.click('[data-act="tm_create"]');await A.waitForTimeout(800);
ok((await A.textContent('.tm-list')).includes('Mia Editor')&&/30,000/.test(await A.textContent('.tm-list')),'salary member added');
await A.fill('[data-tmw="title"]','Edit video 12');await A.click('[data-act="tm_wadd"]');await A.waitForTimeout(500);
await A.fill('[data-tmw="title"]','Make thumbnail');await A.click('[data-act="tm_wadd"]');await A.waitForTimeout(500);
await A.click('[data-act="tm_salary"]');await A.waitForTimeout(500);
ok(/salary/.test(await A.textContent('.tm-det'))&&/To pay/.test(await A.textContent('.tm-card')),'monthly salary row added and counted as to pay');
// temp hire with hidden pay
await A.click('[data-act="tm_add"]');await A.click('[data-act="tm_kind"][data-id="temp"]');await A.fill('[data-tmf="name"]','Raj Temp');await A.fill('[data-tmf="email"]','raj@x.co');await A.fill('[data-tmf="amount"]','5000');await A.uncheck('[data-tmf="seepay"]');
await A.click('[data-act="tm_create"]');await A.waitForTimeout(800);
ok((await A.textContent('.tm-list')).includes('Temporary'),'temporary hire added');
await A.fill('[data-tmw="title"]','Design poster');await A.click('[data-act="tm_wadd"]');await A.waitForTimeout(500);
await A.fill('[data-tmp="label"]','Poster fee');await A.fill('[data-tmp="amount"]','5000');await A.click('[data-act="tm_padd"]');await A.waitForTimeout(500);
await A.screenshot({path:'/tmp/team-owner.png',fullPage:true});
ok(/Active members/.test(await A.textContent('.tm-stats'))&&(await A.textContent('.tm-stats')).includes('2'),'summary counts two active members');
// Mia signs in
const M=await mk();await signup(M,'mia@x.co');
await M.click('#nav .si-row[data-id="team"]');await M.waitForTimeout(1000);
ok((await M.textContent('#main')).includes('Edit video 12')&&(await M.textContent('#main')).includes('Working for a@x.co'),'Mia sees her own work');
ok(!(await M.textContent('#main')).includes('Design poster')&&!(await M.textContent('#main')).includes('Raj'),'Mia does not see anyone else');
ok(/Your pay/.test(await M.textContent('#main'))&&/30,000/.test(await M.textContent('#main')),'Mia sees her pay');
await M.selectOption('[data-tmmy]',{index:0},{}).catch(()=>{});
const sel=M.locator('select[data-tmmy]').first();await sel.selectOption('done');await M.waitForTimeout(800);
ok(fake.st.tables.team_work.filter(w=>w.status==='done').length===1,'Mia marking work done reaches the owner data');
// Raj sees work, not pay
const R=await mk();await signup(R,'raj@x.co');await R.click('#nav .si-row[data-id="team"]');await R.waitForTimeout(1000);
ok((await R.textContent('#main')).includes('Design poster')&&!/Your pay/.test(await R.textContent('#main'))&&!/5,000/.test(await R.textContent('#main')),'Raj sees work but not pay');
await R.screenshot({path:'/tmp/team-raj.png',fullPage:true});
// owner sees progress
await A.reload();await A.waitForTimeout(2500);await A.click('#nav .si-row[data-id="team"]');await A.waitForTimeout(1000);
ok(/1 of 2 done/.test(await A.textContent('.tm-list')),'owner sees Mia progress 1 of 2');
// a stranger sees nothing
const X=await mk();await signup(X,'zed@x.co');await X.click('#nav .si-row[data-id="team"]');await X.waitForTimeout(800);
ok(!(await X.textContent('#main')).includes('Mia'),'a stranger sees no team data');
// stop sign-in
await A.click('[data-act="tm_open"]');await A.waitForTimeout(300);
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close();process.exit(fail?1:0)})();
