const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':u.endsWith('.html')?'text/html':u.endsWith('.js')?'application/javascript':'text/plain'});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);const p=await ctx.newPage();
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','q@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
seed(fake,'q@x.co');await p.reload();await p.waitForTimeout(2000);
console.log(await p.evaluate(process.argv[2]));await b.close();srv.close()})();
