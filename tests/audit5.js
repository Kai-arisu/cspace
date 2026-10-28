const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','r@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
const S=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/^cs/.test(k)&&localStorage.getItem(k).startsWith('{"cur"'))||'')||'{}'));
const view=()=>p.evaluate(()=>document.querySelector('.col-main').dataset.v||'');

await p.click('#tabbar [data-act="more"]');await p.waitForTimeout(400);ok(await p.locator('.msheet:not([hidden])').count()===1,'More sheet opens');
const ids=await p.$$eval('.msheet [data-act="view"]',e=>e.map(x=>x.dataset.id));console.log(ids.join(','));
for(const id of ids){await p.click('#tabbar [data-act="more"]').catch(()=>{});await p.waitForTimeout(250);await p.click('.msheet [data-act="view"][data-id="'+id+'"]');await p.waitForTimeout(300);
 const h=await p.textContent('.hero h1,.td-head h1,.wbname h1').catch(()=>'');ok(h.length>0&&await p.locator('.msheet:not([hidden])').count()===0,'phone nav '+id+' -> '+h)}
await p.click('#tabbar [data-act="more"]');await p.click('.msheet [data-act="datadlg"]');await p.waitForTimeout(300);ok(await p.locator('.dlgbox').count()>0,'data dialog from phone');
console.log('errors',errs);console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
