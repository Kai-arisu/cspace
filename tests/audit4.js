const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','r@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/^cs/.test(k)&&localStorage.getItem(k).startsWith('{"cur"'))||'')||'{}'));
const view=()=>p.evaluate(()=>document.querySelector('.col-main').dataset.v||'');

const cnt=()=>p.evaluate(()=>{const k=Object.keys(localStorage).find(k=>{try{return JSON.parse(localStorage.getItem(k)).spaces}catch(e){return false}});const S=k?JSON.parse(localStorage.getItem(k)):{spaces:[],notes:[],ideas:[],tasks:[],mood:[],clips:[],deals:[],income:[],invoices:[],posts:[],files:[]};return {notes:S.notes.length,ideas:S.ideas.length,tasks:S.tasks.length,mood:S.mood.length,clips:S.clips.length,deals:S.deals.length,income:S.income.length,invoices:S.invoices.length,posts:S.posts.length,files:S.files.length,spaces:S.spaces.length,wb:JSON.stringify(S).length}});
const go=async v=>{await p.click('#nav .si-row[data-id="'+v+'"]');await p.waitForTimeout(250)};
let c0=await cnt();
// notes
await go('notes');await p.click('[data-act="newnote"]');await p.waitForTimeout(250);await p.fill('#ntitle','T1');await p.fill('#nbody','hello world');await p.waitForTimeout(400);let c=await cnt();ok(c.notes===c0.notes+1,'note created');
await p.click('[data-act="pinnote"]').catch(()=>{});
// ideas
await go('ideas');await p.fill('#ideain','idea one #x');await p.click('[data-act="addidea"]');await p.waitForTimeout(200);c=await cnt();ok(c.ideas===1,'idea added');
await p.click('[data-act="staridea"]');await p.click('[data-act="idea2task"]');await p.waitForTimeout(200);c=await cnt();ok(c.tasks===1,'idea -> task');
// calendar (planner merged)
await go('cal');const pin=await p.locator('#planin').count();console.log('planin',pin);
if(pin){await p.fill('#planin','plan task');await p.keyboard.press('Enter');await p.waitForTimeout(250);c=await cnt();ok(c.tasks===2,'calendar task added')}else ok(false,'calendar task input present')
// board
await go('board').catch(()=>{});
// clips
await go('clips');await p.fill('#clurl','https://example.com/a');await p.fill('#cltitle','Ex').catch(()=>{});await p.click('.clipform .btn.pri, .clipform button');await p.waitForTimeout(300);c=await cnt();ok(c.clips===1,'clip saved');
// mood
await go('mood');await p.click('[data-act="mform"][data-id="color"]').catch(async()=>{await p.click('[data-act="mform"]')});await p.waitForTimeout(200);await p.click('[data-act="msave"]').catch(()=>{});await p.waitForTimeout(250);c=await cnt();console.log('mood',c.mood);
// whiteboard
await go('wb');const w0=await p.locator('#wbsvg *, #wbitems *').count();await p.click('[data-act="wbmenu"][data-id="more"]');await p.click('[data-act="wbstart"]');await p.waitForTimeout(300);await p.waitForTimeout(900);ok(await p.locator('#wbsvg *, #wbitems *').count()>w0,'whiteboard starter flow adds items');
// business
await go('biz');await p.click('[data-act="biztab"][data-id="deals"]');await p.fill('#dbrand','Acme');await p.fill('#damt','5000');await p.click('#main .btn.pri, .col-main form .btn.pri').catch(()=>{});await p.waitForTimeout(300);c=await cnt();console.log('deals',c.deals);
await p.click('[data-act="biztab"][data-id="income"]').catch(()=>{});await p.waitForTimeout(200);console.log('biz tabs',await p.$$eval('[data-act="biztab"]',e=>e.map(x=>x.dataset.id)));
// visualizer, progress, calendar, library render
for(const v of ['cal','prog','viz','lib','aud','board']){await go(v).catch(()=>{});console.log(v,(await p.textContent('.hero h1,.td-head h1').catch(()=>'-')).slice(0,30))}
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
