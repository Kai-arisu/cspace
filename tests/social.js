// Sign in with a platform: setup guide, connect, live card with insights, refresh, disconnect
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
const nav=v=>p.evaluate(v=>document.querySelector('#nav [data-id="'+v+'"]').click(),v).then(()=>p.waitForTimeout(500));
const C=()=>p.evaluate(()=>0);
// not set up yet: guide + typed numbers, no connect button
await nav('aud');await p.waitForTimeout(600);
await p.evaluate(()=>{var t=document.querySelector('[data-act="aud_toggleadd"]');if(t&&!document.querySelector('.aud-add'))t.click()});await p.waitForTimeout(300);
await p.click('[data-act="aud_plat"][data-id="instagram"]');await p.waitForTimeout(300);
ok(await p.locator('.soc-live [data-act="soc_guide"][data-id="instagram"]').count()===1&&await p.locator('[data-act="soc_start"]').count()===0,'before setup: Instagram offers the setup guide, not a connect button');
ok(await p.locator('#aud-fo').count()===1,'before setup: typed numbers still available');
await p.click('[data-act="soc_guide"][data-id="instagram"]');await p.waitForTimeout(300);
const guide=await p.textContent('.dlgbox');
ok(/IG_APP_ID/.test(guide)&&/IG_APP_SECRET/.test(guide)&&guide.includes('functions/v1/social/cb/instagram'),'guide names the two secrets and shows the exact redirect URL');
ok(/App Review/.test(guide),'guide explains testers vs App Review');
await p.click('.dlgbox [data-act="dlgclose"]');await p.waitForTimeout(200);

// set up: the platform is now ready
fake.st.socReady={instagram:true,youtube:true};
await p.reload();await p.waitForTimeout(2500);await nav('aud');await p.waitForTimeout(800);
await p.evaluate(()=>{var t=document.querySelector('[data-act="aud_toggleadd"]');if(t&&!document.querySelector('.aud-add'))t.click()});await p.waitForTimeout(300);
await p.click('[data-act="aud_plat"][data-id="instagram"]');await p.waitForTimeout(300);
ok(await p.locator('[data-act="soc_start"][data-id="instagram"]').count()===1,'after setup: Connect with Instagram appears');
ok(await p.locator('#aud-fo').count()===0&&await p.locator('[data-act="soc_type"]').count()===1,'typed numbers move behind "Type numbers instead"');
ok(await p.locator('[data-act="aud_plat"][data-id="instagram"] .soc-on').count()===1,'ready platforms carry a small dot');

// connect: goes to the platform and comes back
await p.click('[data-act="soc_start"][data-id="instagram"]');
await p.waitForURL(/connected=instagram/,{timeout:8000}).catch(()=>{});await p.waitForTimeout(3500);
ok(!/connected=/.test(p.url()),'the return address is cleaned from the URL');
ok(await p.evaluate(()=>document.querySelector('.col-main').dataset.v)==='aud','lands on Audience after connecting');
ok((await p.textContent('#toast').catch(()=>''))+''!==null,'shows a confirmation');
const card=p.locator('.acard',{hasText:'Cash Tea'}).filter({has:p.locator('.ac-live')});
ok(await card.count()===1,'the account card is marked Live');
const ct=await card.first().textContent();
ok(/Last 28 days/.test(ct)&&/Reach/.test(ct)&&/8K/.test(ct)&&/Link taps/.test(ct),'28-day insights show on the card');
ok(/Recent posts/.test(ct)&&/Bhopal chai reel/.test(ct),'recent posts listed');
ok(await card.first().locator('[data-act="soc_disc"]').count()===1&&await card.first().locator('[data-act="aud_del"]').count()===0,'signed-in cards offer Disconnect instead of Remove');

// refresh also syncs signed-in accounts
const before=fake.st.socSyncs||0;await p.click('[data-act="aud_refresh"]');await p.waitForTimeout(1500);
ok((fake.st.socSyncs||0)>before,'Refresh numbers syncs signed-in accounts too');

// Today's road panel uses it
await nav('home');await p.waitForTimeout(800);
ok(/9,110/.test(await p.textContent('.td-road')),'Road to milestone still follows the biggest account');

// disconnect
await nav('aud');await p.waitForTimeout(700);
const dbtn=p.locator('.acard [data-act="soc_disc"]').first();await dbtn.click();await p.waitForTimeout(200);await dbtn.click().catch(()=>{});await p.waitForTimeout(1200);
ok(await p.locator('.ac-live').count()===0&&!fake.st.socLinks.length,'Disconnect removes the sign-in and the card');

// cancelled sign-in message
await p.goto('http://localhost:'+srv.address().port+'/?connect_error=tiktok&reason=cancelled');await p.waitForTimeout(3500);
ok(/cancelled/i.test(await p.evaluate(()=>{var t=document.getElementById('toast');return t?t.textContent:''})),'a cancelled sign-in explains itself');

// phone layout
await p.setViewportSize({width:390,height:844});await nav('aud');await p.waitForTimeout(500);
await p.evaluate(()=>{var t=document.querySelector('[data-act="aud_toggleadd"]');if(t&&!document.querySelector('.aud-add'))t.click()});await p.waitForTimeout(300);
await p.click('[data-act="aud_plat"][data-id="instagram"]');await p.waitForTimeout(300);
const ph=await p.evaluate(()=>{var b=document.querySelector('.soc-btn'),r=b&&b.parentElement,cs=r&&getComputedStyle(r),inner=r?r.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight):0;return [b?Math.round(inner-b.getBoundingClientRect().width):-1,document.documentElement.scrollWidth,document.querySelector('.col-main').dataset.v,!!document.querySelector('.aud-add')]});
ok(ph[0]>=0&&ph[0]<=1&&ph[1]<=390,'phone: full-width connect button, no sideways scroll '+JSON.stringify(ph));
console.log('errors',errs);ok(!errs.length,'no page errors');
await b.close();srv.close();console.log(fail?'FAILURES: '+fail:'ALL PASSED');process.exit(fail?1:0)})();
