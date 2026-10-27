// node tests/_shot.js out.png "<js to run before shot>" [w] [h] [scroll]
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':u.endsWith('.html')?'text/html':u.endsWith('.js')?'application/javascript':u.endsWith('.woff2')?'font/woff2':'text/plain'});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:+(process.argv[4]||1280),height:+(process.argv[5]||800)},colorScheme:process.env.DARK?'dark':'light'});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','q@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
seed(fake,'q@x.co');await p.reload();await p.waitForTimeout(2200);
for(const step of process.argv[3].split(';;')){await p.evaluate(step);await p.waitForTimeout(500)}
if(process.argv[6])await p.evaluate(y=>{document.querySelectorAll('*').forEach(e=>{if(e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!=='visible')e.scrollTop=+y});window.scrollTo(0,+y)},process.argv[6]);
await p.waitForTimeout(300);await p.screenshot({path:process.argv[2]});if(errs.length)console.log('ERR',errs);await b.close();srv.close()})();
