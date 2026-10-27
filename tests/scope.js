const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const tab=async(pg,t)=>{await pg.evaluate(t=>{var b=document.querySelector('[data-act="cp_tab"][data-id="'+t+'"]');if(b)b.click()},t);await pg.waitForTimeout(300)};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const base='http://localhost:'+srv.address().port;const errs=[];
async function mk(){const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));return p}
async function signup(p,email){await p.goto(base+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000)}
const A=await mk();await signup(A,'a@x.co');
// main space: an idea. second space "Podcast": a note.
await A.click('#nav .si-row[data-id="ideas"]');await A.fill('#ideain','Main secret');await A.click('[data-act="addidea"]');await A.waitForTimeout(600);
await A.click('[data-act="spaceadd"]');await A.waitForTimeout(300);await A.fill('#newspace','Podcast');await A.keyboard.press('Enter');await A.waitForTimeout(600);
await A.click('[data-act="qtoggle"]');await A.click('[data-act="qnote"]');await A.waitForTimeout(300);await A.fill('#ntitle','Podcast secret');await A.waitForTimeout(1800);
await A.click('#pcard');await A.waitForTimeout(900);
await tab(A,'settings');await A.fill('[data-w="sh.email"]','b@x.co');await A.selectOption('[data-w="sh.space"]',{label:'Only Podcast'});await A.click('[data-act="sh_invite"]');await A.waitForTimeout(500);
ok((await A.locator('#dlg').textContent()).includes('Share only Podcast'),'asks before moving the space');
await A.click('[data-act="sh_isogo"]');await A.waitForTimeout(2500);
const sh=fake.st.tables.shares;ok(sh.length===1&&sh[0].space_id&&sh[0].invitee_email==='b@x.co','share saved with the space id');
const ownerId=fake.st.users.find(u=>u.email==='a@x.co').id;
ok(fake.st.tables.docs.some(d=>d.user_id===ownerId&&d.path.startsWith('sp/'+sh[0].space_id+'/store/')),'space data moved to its private area');
const root=fake.st.tables.docs.filter(d=>d.user_id===ownerId&&d.path.startsWith('store/k_notes'));
ok(root.every(d=>!/Podcast secret/.test(JSON.stringify(d.data))),'main storage no longer holds the private space');
await tab(A,'settings');ok(await A.locator('[data-act="sh_openiso"]').count()===1,'owner sees Your private spaces');
ok((await A.locator('.spsel option').allTextContents()).join('|').indexOf('Podcast')<0,'space gone from main space list');
// invitee
const B=await mk();await signup(B,'b@x.co');
await B.click('#pcard');await B.waitForTimeout(900);
await tab(B,'settings');ok(/One space/.test(await B.locator('.sh-list').last().textContent()),'invitee sees a one-space share');
await tab(B,'settings');await B.click('[data-act="sh_open"]');await B.waitForTimeout(3000);
ok((await B.textContent('#wsbar')).includes('Podcast'),'banner names the space: '+(await B.textContent('#wsbar')).slice(0,60));
await B.click('#nav .si-row[data-id="notes"]');await B.waitForTimeout(600);
ok((await B.textContent('#main')).includes('Podcast secret'),'invitee sees the shared space note');
await B.click('#nav .si-row[data-id="ideas"]');await B.waitForTimeout(400);
ok(!(await B.textContent('body')).includes('Main secret'),'invitee never sees the other space');
ok((await B.locator('.spsel option').allTextContents()).join('|')==='Podcast','only one space in the list');
ok(await B.locator('[data-act="spaceadd"]:not([disabled])').count()===0,'invitee cannot add spaces');
// direct database attack from the invitee's session
const res=await B.evaluate(async(oid)=>{
  const k=Object.keys(localStorage).find(x=>/auth-token/.test(x));const tok=JSON.parse(localStorage.getItem(k)).access_token;
  const h={authorization:'Bearer '+tok,apikey:'x'};
  const root=await (await fetch('https://ohkecamneutxggqwhend.supabase.co/rest/v1/docs?user_id=eq.'+oid+'&path=like.store/%25&select=path',{headers:h})).json();
  const mine=await (await fetch('https://ohkecamneutxggqwhend.supabase.co/rest/v1/docs?user_id=eq.'+oid+'&path=like.sp/%25&select=path',{headers:h})).json();
  const w=await fetch('https://ohkecamneutxggqwhend.supabase.co/rest/v1/docs',{method:'POST',headers:{...h,'content-type':'application/json',prefer:'resolution=merge-duplicates'},body:JSON.stringify({user_id:oid,path:'store/meta',data:{hack:1}})});
  return {root:root.length,mine:mine.length,write:w.status};
},ownerId);
ok(res.root===0&&res.mine>0,'database hides the owner main storage from the invitee (root rows '+res.root+', own rows '+res.mine+')');
ok(res.write===403,'database refuses writes outside the shared space ('+res.write+')');
// invitee edits, owner sees it
await B.fill('#ideain','From teammate');await B.click('[data-act="addidea"]');await B.waitForTimeout(3000);
await A.reload();await A.waitForTimeout(2500);await A.click('#pcard');await A.waitForTimeout(900);
await tab(A,'settings');await A.click('[data-act="sh_openiso"]');await A.waitForTimeout(3000);
ok((await A.textContent('#wsbar')).includes('Podcast'),'owner opens the private space');
await A.click('#nav .si-row[data-id="ideas"]');await A.waitForTimeout(500);
ok((await A.textContent('#main')).includes('From teammate'),'owner sees the teammate edit');
await A.click('#nav .si-row[data-id="notes"]');await A.waitForTimeout(500);
ok((await A.textContent('#main')).includes('Podcast secret'),'owner still has the original note');
await A.click('[data-act="sh_home"]');await A.waitForTimeout(2500);
ok((await A.locator('.spsel option').allTextContents()).join('|').indexOf('Podcast')<0&&(await A.locator('.spsel option').count())>=1,'back in the main workspace');
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close();process.exit(fail?1:0)})();
