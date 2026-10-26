const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800},permissions:[]});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.googleapis/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.dismiss());
const url='http://localhost:'+srv.address().port+'/';
await p.goto(url);await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail','r@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);
const views=await p.$$eval('#nav .si-row[data-id]',e=>e.map(x=>x.dataset.id));
const dead=[];
for(const v of views){
  await p.click('#nav .si-row[data-id="'+v+'"]').catch(()=>{});await p.waitForTimeout(300);
  const acts=await p.$$eval('.col-main [data-act]',els=>els.map((e,i)=>({i,act:e.dataset.act,id:e.dataset.id||'',txt:(e.getAttribute('aria-label')||e.title||e.textContent||'').trim().slice(0,30)})));
  const seen=new Set();
  for(const a of acts){const key=a.act+'|'+a.id;if(seen.has(key))continue;seen.add(key);
    if(/signout|del|clear|reset|wipe/i.test(a.act))continue;
    const sel=`.col-main [data-act="${a.act}"]`+(a.id?`[data-id="${a.id}"]`:'');
    const el=p.locator(sel).first();if(!(await el.isVisible().catch(()=>false)))continue;
    const before=await p.evaluate(()=>document.body.innerHTML.length+'|'+localStorage.length+'|'+(localStorage.getItem('cs-state')||'').length+'|'+Object.keys(localStorage).map(k=>localStorage.getItem(k).length).join(','));
    const bs=await p.evaluate(()=>document.body.innerHTML);
    try{await el.click({timeout:1500})}catch(e){dead.push([v,a.act,a.id,a.txt,'CLICK-FAIL '+e.message.split('\n')[0]]);continue}
    await p.waitForTimeout(150);
    const as=await p.evaluate(()=>document.body.innerHTML);const ls=await p.evaluate(()=>JSON.stringify(localStorage));
    if(as===bs&&ls===(globalThis.__l||ls)&&true){dead.push([v,a.act,a.id,a.txt,'NO CHANGE'])}
    await p.keyboard.press('Escape');
    // return to view
    if(!(await p.locator('#nav .si-row[data-id="'+v+'"][aria-current="true"]').count())){await p.click('#nav .si-row[data-id="'+v+'"]').catch(()=>{});await p.waitForTimeout(200)}
  }
}
console.log(JSON.stringify(dead,null,0).replace(/\],\[/g,'],\n['));console.log('errors',errs);await b.close();srv.close()})();
