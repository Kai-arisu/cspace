// Profile: one photo everywhere, no carry-over between accounts
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
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{if(!/Failed to fetch|NetworkError/.test(e.message))errs.push(e.message)});
const origin='http://localhost:'+srv.address().port;
async function signup(email){await p.goto(origin+'/');await p.waitForTimeout(600);await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2200)}
const openCp=async(tab)=>{await p.evaluate(()=>document.querySelector('#nav [data-id="cp"]').click());await p.waitForTimeout(700);if(tab){await p.click('[data-act="cp_tab"][data-id="'+tab+'"]');await p.waitForTimeout(300)}};
// account A
await signup('alice@x.co');
await openCp();
ok(await p.locator('.cp-tabs [role=tab]').count()===3,'profile page has three tabs');
await p.fill('[data-w="p.display_name"]','Alice Maker');await p.fill('[data-w="s.role"]','Travel vlogger');await p.waitForTimeout(200);
ok((await p.textContent('#pcard')).includes('Alice Maker')&&(await p.textContent('#pcard')).includes('Travel vlogger'),'name and role update the sidebar card live');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');
await p.setInputFiles('#cpfile',{name:'me.png',mimeType:'image/png',buffer:png});await p.waitForTimeout(800);
const srcs=await p.evaluate(()=>[...document.querySelectorAll('#pcard img,#pavbtn img,#cppv img,.cp-me img')].map(i=>i.getAttribute('src')));
ok(srcs.length===4&&srcs.every(s=>s&&s.indexOf('/_blob/')===0&&s===srcs[0]),'one photo shows in sidebar, top bar, preview and profile ('+srcs.length+')');
await p.click('[data-act="cp_tab"][data-id="page"]');await p.waitForTimeout(300);
await p.fill('[data-w="p.handle"]','alice');await p.check('[data-act="cp_pub"]');await p.click('[data-act="cp_save"]');await p.waitForTimeout(800);
const prow=fake.st.tables.profiles.find(r=>r.handle==='alice');
ok(prow&&prow.is_public&&prow.display_name==='Alice Maker'&&String(prow.avatar_url).indexOf('/_blob/')===0,'public page saved with the same name and photo');
// sign out, account B on the same browser
await p.click('[data-act="cp_tab"][data-id="settings"]');await p.waitForTimeout(300);
await p.click('[data-act="signout"]');await p.click('[data-act="signout"]');await p.waitForTimeout(1500);
await signup('bob@x.co');
await openCp();
const nm=await p.inputValue('[data-w="p.display_name"]');
ok(nm!=='Alice Maker','second account does not see the first account\'s name ('+nm+')');
ok(await p.locator('#pcard img,.cp-me img,#cppv img').count()===0,'second account does not see the first account\'s photo');
await p.click('[data-act="cp_tab"][data-id="page"]');await p.waitForTimeout(300);
ok(await p.inputValue('[data-w="p.handle"]')!=='alice','second account gets its own handle');
await p.evaluate(()=>document.querySelector('#nav [data-id="aud"]').click());await p.waitForTimeout(800);
ok(await p.locator('.acard').count()===0,'second account sees no channels from the first');
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
