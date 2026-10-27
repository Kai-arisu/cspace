// Notification center + Today home
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
seed(fake,'n@x.co');await p.reload();await p.waitForTimeout(2500);
const badge=()=>p.evaluate(()=>{var b=document.querySelector('#bellbtn .bdg');return b?b.textContent:''});
ok(await p.locator('.td-head h1').count()===1,'Today header shows');
ok(await p.locator('.td-stat').count()===4,'four stat tiles');
const n0=await badge();ok(Number(n0)>0,'bell badge shows unread count '+n0);
await p.click('#bellbtn');await p.waitForTimeout(300);
ok(await p.locator('#bellm .bgrp').count()>0,'notifications grouped');
const items=await p.locator('#bellm .bit').count();ok(items===Number(n0),'every item listed ('+items+')');
await p.click('#bellm .bit >> nth=0');await p.waitForTimeout(400);
ok(Number(await badge()||0)===Number(n0)-1,'opening one marks it read');
await p.click('#bellbtn');await p.waitForTimeout(300);
ok(await p.locator('#bellm .bit.read').count()===1,'read item is dimmed');
await p.click('#bellm [data-act="bellall"]');await p.waitForTimeout(300);
ok(await badge()==='','mark all read clears badge');
await p.reload();await p.waitForTimeout(2500);
ok(await badge()==='','read state survives reload');
// quick capture
await p.evaluate(()=>{var b=document.querySelector('[data-act="view"][data-id="home"]');if(b)b.click()});await p.waitForTimeout(300);
await p.fill('#qcin','Test capture idea');await p.press('#qcin','Enter');await p.waitForTimeout(400);
const hasIdea=await p.evaluate(()=>document.body.innerText.indexOf('Test capture idea')>-1);
ok(hasIdea,'Enter in quick capture saves an idea');
await p.fill('#qcin','Test capture task');await p.click('[data-act="qcap"][data-id="task"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>document.querySelector('.td-pipe b').textContent)!=='','task capture updates pipeline');

// board -> team assignment
await p.evaluate(()=>{var b=document.querySelector('[data-act="view"][data-id="board"]');if(b)b.click()});await p.waitForTimeout(600);
const tname=await p.evaluate(()=>{var c=document.querySelector('.col[data-col="i"] .card');return c?c.querySelector('[data-f="task"]').value:''});
await p.hover('.col[data-col="i"] .card >> nth=0');await p.click('.col[data-col="i"] .card >> nth=0 >> [data-act="tk_assign"]');await p.waitForTimeout(300);
ok(await p.locator('.tk-m').count()>0,'assign dialog lists teammates');
const before=fake.st.tables.team_work.length;
await p.click('.tk-m >> nth=0');await p.waitForTimeout(600);
ok(fake.st.tables.team_work.length===before+1&&fake.st.tables.team_work.some(w=>w.title===tname),'assigning creates team work');
ok(await p.locator('.card .who').count()===1,'card shows who it is assigned to');
ok(await p.evaluate(t=>[...document.querySelectorAll('.col[data-col="m"] [data-f="task"]')].some(i=>i.value===t),tname),'assigned idea moves to Making');
fake.st.tables.team_work.find(w=>w.title===tname).status='done';
await p.reload();await p.waitForTimeout(3500);
await p.evaluate(()=>{var b=document.querySelector('[data-act="view"][data-id="board"]');if(b)b.click()});await p.waitForTimeout(500);
ok(await p.evaluate(t=>[...document.querySelectorAll('.col[data-col="r"] [data-f="task"]')].some(i=>i.value===t),tname),'teammate finishing moves task to Review');

// idea -> planned post
await p.evaluate(()=>{var b=document.querySelector('[data-act="view"][data-id="ideas"]');if(b)b.click()});await p.waitForTimeout(500);
const np=await p.locator('[data-act="idea2post"]').count();ok(np>0,'ideas offer Plan post');
await p.evaluate(()=>document.querySelector('[data-act="idea2post"]').click());await p.waitForTimeout(600);
ok(await p.evaluate(()=>document.querySelector('.col-main').dataset.v)==='cal','Plan post opens the calendar');
ok(await p.locator('.cc-side .cpost').count()>0||(await p.content()).includes('planned'),'post appears on the chosen day');

// merged calendar
ok(await p.locator('#nav [data-id="plan"], #nav [data-id="ai"]').count()===0,'Planner and Writing helper gone from nav');
await p.evaluate(()=>{var b=document.querySelector('#nav [data-id="cal"]');b.click()});await p.waitForTimeout(500);
ok(await p.locator('.ccd .cct').count()>0,'calendar shows tasks on their days');
await p.fill('#planin','Calendar day task');await p.press('#planin','Enter');await p.waitForTimeout(400);
ok(await p.evaluate(()=>[...document.querySelectorAll('.cc-side [data-f="task"]')].some(i=>i.value==='Calendar day task')),'task added to the selected day');
ok(await p.locator('#tdfocus').count()===0,'focus tile only on Today');
await p.evaluate(()=>{document.querySelector('#nav [data-id="home"]').click()});await p.waitForTimeout(400);
ok(await p.locator('#tdfocus [data-act="ftoggle"]').count()===1,'focus timer lives on Today');
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
