const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const site=path.join(process.cwd(),'public');const out=process.argv[2]||'/tmp/s2';fs.mkdirSync(out,{recursive:true});
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u.startsWith('/u/')||u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const o='http://localhost:'+srv.address().port;const b=await chromium.launch();
async function ctxFor(vp,scheme,email){const c=await b.newContext({viewport:vp,colorScheme:scheme});await c.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await c.route(/fonts\.googleapis/,r=>r.abort());const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/Content Security|Refused/.test(m.text()))errs.push(m.text())});await p.goto(o+'/');await p.waitForTimeout(500);await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2000);return {c,p,errs}}
const clickv=(p,i)=>p.evaluate(i=>{var b=document.querySelector('[data-act="view"][data-id="'+i+'"]');if(b)b.click()},i);
let {p,errs}=await ctxFor({width:390,height:844},'light','m1@x.co');
await p.click('.tabbar [data-act="more"]');await p.waitForTimeout(400);await p.screenshot({path:out+'/m-more.png'});
await p.click('#msheet [data-id="cp"]');await p.waitForTimeout(500);await p.screenshot({path:out+'/m-handles.png'});
console.log('mobile errs',errs);
({p,errs}=await ctxFor({width:390,height:844},'dark','m2@x.co'));await p.screenshot({path:out+'/m-dark-home.png'});await p.click('.tabbar [data-act="more"]');await p.waitForTimeout(300);await p.screenshot({path:out+'/m-dark-more.png'});
({p,errs}=await ctxFor({width:1280,height:800},'dark','d1@x.co'));await p.screenshot({path:out+'/d-dark-home.png'});await clickv(p,'aud');await p.waitForTimeout(500);await p.screenshot({path:out+'/d-dark-aud.png'});
console.log('dark errs',errs);
({p,errs}=await ctxFor({width:1280,height:800},'light','d2@x.co'));await clickv(p,'aud');await p.waitForTimeout(500);
await p.fill('#aud-in','https://youtube.com/@demo');await p.click('[data-act="aud_add"]');await p.waitForTimeout(1500);await p.screenshot({path:out+'/d-aud.png'});
await p.click('[data-act="profile"]');await p.waitForTimeout(400);await p.fill('[data-w="p.handle"]','abhinav');await p.fill('[data-w="h.0"]','demo');await p.fill('[data-w="h.1"]','abhinav.makes');await p.check('[data-act="cp_pub"]');await p.click('[data-act="cp_save"]');await p.waitForTimeout(700);await p.screenshot({path:out+'/d-handles.png'});
const pp=await p.context().newPage();await pp.goto(o+'/u/abhinav');await pp.waitForTimeout(900);await pp.screenshot({path:out+'/d-public.png'});
await b.close();srv.close()})();
