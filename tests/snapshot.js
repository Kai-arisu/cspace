// node tests/snapshot.js <outdir> [views] [dark]: signs in with demo data and saves each view as a static page
// (scripts removed) so design inspectors that cannot sign in can measure it.
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');const site=path.join(process.cwd(),'public');
const out=process.argv[2]||'/tmp/snap';fs.mkdirSync(out,{recursive:true});
for(const f of fs.readdirSync(site))if(/\.(woff2|png|webmanifest)$/.test(f))fs.copyFileSync(path.join(site,f),path.join(out,f));
const views=(process.argv[3]||'home,notes,ideas,mood,clips,bank,cal,board,viz,aud,biz,team,imp,cp').split(',');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':u.endsWith('.html')?'text/html':u.endsWith('.js')?'application/javascript':u.endsWith('.woff2')?'font/woff2':'text/plain'});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:process.argv[4]==='dark'?'dark':'light'});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());const p=await ctx.newPage();
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','snap@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
seed(fake,'snap@x.co');await p.reload();await p.waitForTimeout(3000);
for(const vv of views){const [v,sub]=vv.split(':');
  await p.evaluate(v=>{var b=document.querySelector('#nav [data-id="'+v+'"]');if(b)b.click()},v);await p.waitForTimeout(900);
  if(v==='aud'){await p.evaluate(()=>{var t=document.querySelector('[data-act="aud_tab"][data-id="ins"]');if(t)t.click()});await p.waitForTimeout(500)}
  if(v==='mood'&&sub){await p.evaluate(s=>{var t=document.querySelector('[data-act="mlayout"][data-id="'+s+'"]');if(t)t.click()},sub);await p.waitForTimeout(400)}
  const html=await p.evaluate(()=>{var d=document.documentElement.cloneNode(true);d.querySelectorAll('script').forEach(s=>s.remove());d.classList.remove('authing');return '<!doctype html>'+d.outerHTML});
  fs.writeFileSync(path.join(out,vv.replace(':','-')+'.html'),html);
  if(v==='mood'&&sub){await p.evaluate(()=>{var t=document.querySelector('[data-act="mlayout"][data-id="poster"]');if(t)t.click()})}
}
await b.close();srv.close();console.log('saved',views.length,'views to',out)})();
