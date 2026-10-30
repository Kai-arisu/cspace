// the owner sets today's agenda; a team member sees it and ticks items off
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const e=path.extname(f);res.writeHead(200,{'content-type':e==='.html'?'text/html':e==='.js'?'application/javascript':'application/octet-stream'});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const errs=[];const base='http://localhost:'+srv.address().port;
async function mk(poll){const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);if(poll)await ctx.addInitScript('window.__agendaPoll=1500');const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p}
async function signup(p,email){await p.goto(base+'/?signup');await p.waitForTimeout(400);await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2500)}
const A=await mk(true);await signup(A,'ceo@x.co');
const uid=await A.evaluate(()=>window.__UID);
fake.st.tables.team_members.push({id:'m1',owner_id:uid,name:'Mia Editor',role_title:'Editor',email:'mia@x.co',status:'active',kind:'salary',amount:1,can_login:true,see_pay:false});
await A.reload();await A.waitForTimeout(3000);
ok(await A.locator('.tg-plan').count()===1,'the owner sees an agenda editor on Today');
await A.fill('#ag-in','Ship the Ladakh vlog');await A.click('[data-act="ag_add"]');await A.waitForTimeout(500);
await A.fill('#ag-in','Reply to brand emails');await A.click('[data-act="ag_add"]');await A.waitForTimeout(500);
ok(await A.locator('.tg-plan .ag-l li').count()===2,'two agenda items added');
ok(fake.st.tables.team_agenda.length===2,'they are saved');
const M=await mk(true);await signup(M,'mia@x.co');
await M.click('#nav .si-row[data-id="team"]');await M.waitForTimeout(1200);
ok((await M.textContent('#main')).includes('Ship the Ladakh vlog'),'the team member sees the agenda');
await M.click('[data-act="ag_mtick"]');await M.waitForTimeout(600);
ok(fake.st.tables.team_agenda[0].done===true,'ticking it saves for the owner');
await A.waitForTimeout(3500);
ok(await A.locator('.tg-plan li.done').count()===1,'the owner sees it tick over on their own screen');
await A.click('.tg-plan li:not(.done) [data-act="ag_tick"]');await A.waitForTimeout(600);
ok(fake.st.tables.team_agenda.filter(a=>a.done).length===2,'the owner can tick items too');
await A.click('.tg-plan [data-act="ag_del"]');await A.waitForTimeout(800);
ok(fake.st.tables.team_agenda.length===1,'the owner can remove an item');
const S2=await mk();await signup(S2,'stranger@x.co');await S2.click('#nav .si-row[data-id="team"]').catch(()=>{});await S2.waitForTimeout(800);
ok(!(await S2.textContent('body')).includes('Reply to brand emails'),'a stranger never sees the agenda');
ok(!errs.length,'no page errors '+errs.join('|'));
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close();process.exit(fail?1:0)})();
