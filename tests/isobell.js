// Private spaces reach the bell and search
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
seed(fake,'n@x.co',{iso:true});await p.reload();await p.waitForTimeout(3500);
await p.click('#bellbtn');await p.waitForTimeout(300);
const txt=await p.textContent('#bellm');
ok(txt.includes('Pitch deck for label')&&txt.includes('Secret project'),'private-space task shows in the bell with its space name');
await p.keyboard.press('Escape');await p.click('body',{position:{x:600,y:400}}).catch(()=>{});
await p.fill('#gsearch','Hidden pitch');await p.waitForTimeout(400);
ok((await p.textContent('#sres')).includes('Hidden pitch notes'),'search finds notes in private spaces');
// Today stays focused on the current space
ok(!(await p.textContent('.td-cols')).includes('Pitch deck for label'),'Today shows only the current space');
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
