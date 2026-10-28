const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
const tab=async(pg,t)=>{await pg.evaluate(t=>{var b=document.querySelector('[data-act="cp_tab"][data-id="'+t+'"]');if(b)b.click()},t);await pg.waitForTimeout(300)};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','r@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/^cs/.test(k)&&localStorage.getItem(k).startsWith('{"cur"'))||'')||'{}'));
const view=()=>p.evaluate(()=>document.querySelector('.col-main').dataset.v||'');
// share
await p.click('#nav [data-id="cp"]');await p.waitForTimeout(300);ok((await p.textContent('.hero h1,.td-head h1,.wbname h1')||'').length>0&&await p.locator('.cp-grid,.hd-list').count()>0,'Share button opens handles/public page');
// new space
await p.click('[data-act="spaceadd"]');await p.waitForTimeout(300);console.log('spaceadd ->',await p.evaluate(()=>!!document.querySelector('.dlg input,.dlgbox input,#spname,input:focus')));
await p.keyboard.press('Escape');
// quick-add menu
await p.click('[data-act="qtoggle"]');await p.click('[data-act="qnote"]');await p.waitForTimeout(300);ok((await view())==='notes','New > Note opens notes');
await p.click('[data-act="qtoggle"]');await p.click('[data-act="qidea"]');await p.waitForTimeout(300);ok((await view())==='ideas','New > Idea');
await p.click('[data-act="qtoggle"]');await p.click('[data-act="qtask"]');await p.waitForTimeout(300);console.log('new task view',await view());
// timer
await p.click('#nav [data-id="home"]');await p.waitForTimeout(300);await p.click('#tdfocus [data-act="ftoggle"]');await p.waitForTimeout(1300);ok(!/^25:00$/.test(await p.textContent('#ftt2')),'timer counts down');ok(await p.locator('#ftt').isVisible(),'running timer shows in the top bar');
// theme
const t0=await p.evaluate(()=>document.documentElement.dataset.theme);await p.click('#nav [data-id="cp"]');await p.waitForTimeout(500);await tab(p,'settings');await p.click('[data-act="ms_theme"][data-id="'+(t0==='dark'?'light':'dark')+'"]');await p.waitForTimeout(200);ok(t0!==await p.evaluate(()=>document.documentElement.dataset.theme),'theme toggles');
// palette
await p.keyboard.press('Control+k');await p.waitForTimeout(300);ok(await p.locator('.pal,.palbox,[role=dialog]').count()>0,'command palette opens');await p.keyboard.press('Escape');
// bell
await p.click('#bellbtn');await p.waitForTimeout(200);ok(await p.locator('#bellm').isVisible(),'bell opens');
// data dialog
await p.click('#statusbtn');await p.waitForTimeout(300);ok(await p.locator('.dlgbox').count()>0,'Data and backup opens');
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
