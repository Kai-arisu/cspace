// usage: node tests/probe.js <viewId> <css selector>  -> prints matching element classes + computed style bits
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'text/plain'});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\./,r=>r.abort());
const p=await ctx.newPage();await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);
await p.click('[data-ag="up"]');await p.fill('#agemail','p@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
await p.evaluate(i=>{var b=document.querySelector('[data-act="view"][data-id="'+i+'"]');if(b)b.click()},process.argv[2]);await p.waitForTimeout(300);
const out=await p.evaluate(sel=>[...document.querySelectorAll(sel)].slice(0,6).map(e=>({tag:e.tagName,cls:e.className,html:e.outerHTML.slice(0,160),border:getComputedStyle(e).border,bg:getComputedStyle(e).backgroundColor,sh:getComputedStyle(e).boxShadow.slice(0,80)})),process.argv[3]);
console.log(JSON.stringify(out,null,1));await b.close();srv.close()})();
