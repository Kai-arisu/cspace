// usage: node tests/shots3.js <outdir> [dark] ; seeded screenshots of every view, desktop + phone
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');
const site=path.join(process.cwd(),'public');const out=process.argv[2]||'/tmp/shots';fs.mkdirSync(out,{recursive:true});
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u.startsWith('/u/')||u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':ext==='.woff2'?'font/woff2':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const origin='http://localhost:'+srv.address().port;const b=await chromium.launch();let n=0;
async function run(tag,vp,scheme){
  const email='demo'+(++n)+'@x.co';
  const ctx=await b.newContext({viewport:vp,colorScheme:scheme});
  await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(origin+'/');await p.waitForTimeout(500);
  await p.click('[data-ag="up"]');await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
  seed(fake,email);await p.reload();await p.waitForTimeout(2500);
  const ids=(process.env.VIEWS||'home,notes,ideas,mood,wb,clips,ai,plan,cal,board,viz,aud,biz,team,cp').split(',');
  for(const id of ids){
    const ok=await p.evaluate(i=>{var b=document.querySelector('[data-act="view"][data-id="'+i+'"]');if(b){b.click();return true}return false},id);
    if(!ok){await p.evaluate(()=>{var m=document.querySelector('[data-act="more"]');if(m)m.click()});await p.waitForTimeout(200);await p.evaluate(i=>{var b=document.querySelector('.msheet [data-act="view"][data-id="'+i+'"]');if(b)b.click()},id)}
    await p.waitForTimeout(700);if(process.env.SCROLL)await p.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{if(e.scrollHeight>e.clientHeight+50&&getComputedStyle(e).overflowY!=='visible')e.scrollTop=e.scrollHeight});window.scrollTo(0,99999)});await p.waitForTimeout(300);await p.screenshot({path:`${out}/${tag}-${id}.png`});
  }
  if(errs.length)console.log(tag,'ERRORS',errs);
  await ctx.close()}
await run('d',{width:1280,height:800},process.argv[3]==='dark'?'dark':'light');
await run('m',{width:390,height:844},process.argv[3]==='dark'?'dark':'light');
await b.close();srv.close()})();
