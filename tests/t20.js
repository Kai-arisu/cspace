const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const st=fake.st;
const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u.startsWith('/u/'))u='/index.html';if(u==='/')u='/index.html';
  const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const tab=async(pg,t)=>{await pg.evaluate(t=>{var b=document.querySelector('[data-act="cp_tab"][data-id="'+t+'"]');if(b)b.click()},t);await pg.waitForTimeout(300)};
(async()=>{await new Promise(r=>srv.listen(0,r));const origin='http://localhost:'+srv.address().port;
const b=await chromium.launch();
async function mkctx(){const ctx=await b.newContext({viewport:{width:1200,height:900}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());return ctx}
const ctx=await mkctx();const p=await ctx.newPage();const errs=[],csps=[];
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{const t=m.text();if(/Content Security Policy|Refused to/.test(t))csps.push(t)});
await p.goto(origin+'/');await p.waitForTimeout(700);
ok(await p.locator('#authgate .ag-card').isVisible(),'login gate shows');
ok(!(await p.locator('#nav').isVisible()),'app hidden behind gate');
await p.screenshot({path:'f-login.png'});
// wrong password
await p.fill('#agemail','a@b.co');await p.fill('#agpass','wrongpass1');await p.click('#aggo');await p.waitForTimeout(500);
ok((await p.textContent('#agmsg')).includes("don't match"),'wrong login message');
// sign up
await p.click('[data-ag="up"]');await p.fill('#agemail','creator@example.com');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2500);
ok(await p.locator('#nav').isVisible(),'app visible after sign up');
ok(!(await p.locator('#authgate').isVisible()),'gate hidden');
// edit a note -> synced
await p.evaluate(()=>{});await p.click('[data-act="view"][data-id="notes"]');await p.waitForTimeout(300);
await p.click('[data-act="newnote"]');await p.waitForTimeout(300);
await p.fill('#nbody','Hello from the website');await p.waitForTimeout(2500);
const metaRow=st.tables.docs.find(r=>r.path==='store/meta');ok(!!metaRow,'store/meta saved to database');
ok(st.tables.docs.some(r=>r.path==='store/k_notes_0'&&JSON.stringify(r.data).includes('Hello from the website')),'note text in database');
ok((await p.textContent('#status'))==='All changes saved','status all saved');
// wipe local cache, keep auth, reload -> pulls from db
await p.evaluate(()=>{Object.keys(localStorage).filter(k=>k.startsWith('creator-space-v1-')).forEach(k=>localStorage.removeItem(k))});
await p.reload();await p.waitForTimeout(2500);
await p.click('[data-act="view"][data-id="notes"]');await p.waitForTimeout(400);
ok((await p.content()).includes('Hello from the website'),'note restored from database after cache wipe');
// audience
await p.click('[data-act="view"][data-id="aud"]');await p.waitForTimeout(800);
ok(await p.locator('.aud-add').isVisible(),'audience view renders');
await p.fill('#aud-in','https://youtube.com/@demo');await p.click('[data-act="aud_add"]');await p.waitForTimeout(1500);
ok(await p.locator('.acard').count()===1,'youtube channel card shown');
await p.click('[data-act="aud_gedit"]');await p.fill('#ag-in','5000');await p.click('[data-act="aud_gsave"]');await p.waitForTimeout(700);
ok(await p.locator('.ag-bar').count()===1,'goal progress bar shown');
ok(st.tables.connections.some(r=>r.goal===5000),'goal saved in database');
await p.screenshot({path:'f-goal.png'});
await p.emulateMedia({colorScheme:'dark'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);await p.screenshot({path:'f-goal-m-dark.png'});
const ovf=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);ok(!ovf,'no horizontal scroll at phone width (audience)');
await p.emulateMedia({colorScheme:'light'});await p.setViewportSize({width:1200,height:900});
ok((await p.textContent('.ac-stats')).includes('12K'),'subscriber number shown');
await p.screenshot({path:'f-aud.png'});
// bad input
await p.fill('#aud-in','bad input!');await p.click('[data-act="aud_add"]');await p.waitForTimeout(700);
ok((await p.textContent('#audmsg')).includes('Paste a channel'),'bad channel message');
// manual instagram
await p.click('[data-act="aud_plat"][data-id="instagram"]');await p.waitForTimeout(300);
await p.fill('#aud-h','@mygram');await p.fill('#aud-fo','2500');await p.click('[data-act="aud_addm"]');await p.waitForTimeout(900);
ok(await p.locator('.acard').count()===2,'manual instagram card added');
// toggle public on youtube
await p.locator('.acard').first().locator('[data-act="aud_pub"]').click();await p.waitForTimeout(500);
// not configured
st.ytConfigured=false;await p.click('[data-act="aud_refresh"]');await p.waitForTimeout(1200);
ok(await p.locator('.aud-setup').count()===1,'setup steps shown when key missing');st.ytConfigured=true;
// creator page
await p.click('[data-act="view"][data-id="cp"]');await p.waitForTimeout(1000);
await tab(p,'page');await p.fill('[data-w="p.handle"]','abhinav_c');await tab(p,'profile');await p.fill('[data-w="p.display_name"]','Abhinav C');await p.fill('[data-w="p.tagline"]','Making things');
await p.click('[data-act="cp_ladd"]');await p.waitForTimeout(200);
await p.fill('[data-w="l.0.label"]','Site');await p.fill('[data-w="l.0.url"]','https://example.com');
await tab(p,'page');await p.check('[data-act="cp_pub"]');await p.click('[data-act="cp_save"]');await p.waitForTimeout(1000);
ok(st.tables.profiles.length===1&&st.tables.profiles[0].is_public===true,'profile saved public');
await p.screenshot({path:'f-cp.png'});
// public page in a fresh context
const c2=await mkctx();const pp=await c2.newPage();pp.on('pageerror',e=>errs.push('PUB '+e.message));
await pp.goto(origin+'/u/abhinav_c');await pp.waitForTimeout(1500);
ok((await pp.textContent('body')).includes('Abhinav C'),'public page shows name');
ok((await pp.textContent('body')).includes('12K'),'public page shows channel numbers');
ok(!(await pp.textContent('body')).includes('mygram'),'private channel not on public page');
await pp.screenshot({path:'f-public.png'});
await pp.goto(origin+'/u/nobody');await pp.waitForTimeout(800);
ok((await pp.textContent('body')).includes('Page not found'),'unknown handle shows not found');
// sign out
await p.click('[data-act="profile"]');await p.waitForTimeout(400);
ok(await p.locator('.hd-list').isVisible(),'account button opens Handles');
await p.fill('[data-w="h.1"]','mygram');await p.waitForTimeout(100);
ok((await p.textContent('#cppv')).includes('Instagram'),'handle shows in preview');
ok(!(await p.textContent('#nav')).includes('Video editor'),'video editor removed from menu');
await p.click('[data-act="cp_save"]');await p.waitForTimeout(800);
ok(st.tables.profiles.some(r=>(r.links||[]).some(l=>l.label==='Instagram'&&l.url==='https://instagram.com/mygram')),'handle saved as link');
await tab(p,'settings');await p.click('main [data-act="signout"]');await p.click('main [data-act="signout"]');await p.waitForTimeout(1500);
ok(await p.locator('#authgate .ag-card').isVisible(),'back at login after sign out');
// sign in again keeps data
await p.fill('#agemail','creator@example.com');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2500);
await p.click('[data-act="view"][data-id="notes"]');await p.waitForTimeout(400);
ok((await p.content()).includes('Hello from the website'),'data back after sign in');
console.log('CSP messages:',csps.slice(0,5));console.log('page errors:',errs.filter(e=>!/ERR_|Failed to fetch|net::/.test(e)).slice(0,5));
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
