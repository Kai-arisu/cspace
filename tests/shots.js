// usage: node tests/shots.js <outdir> ; screenshots every view at desktop + phone, light + dark
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();
const site=path.join(process.cwd(),'public');
const out=process.argv[2]||'/tmp/shots';fs.mkdirSync(out,{recursive:true});
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u.startsWith('/u/')||u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
(async()=>{await new Promise(r=>srv.listen(0,r));const origin='http://localhost:'+srv.address().port;
const b=await chromium.launch();
async function run(tag,vp,scheme){
  const ctx=await b.newContext({viewport:vp,colorScheme:scheme,deviceScaleFactor:1});
  await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();await p.goto(origin+'/');await p.waitForTimeout(600);
  await p.screenshot({path:`${out}/${tag}-login.png`});
  await p.click('[data-ag="up"]');await p.fill('#agemail','a'+Math.random().toString(36).slice(2,6)+'@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(2200);
  const ids=[...fs.readFileSync('creator-space.html','utf8').slice(0,200000).match(/var VIEWS=\[[\s\S]*?\n\];/)[0].matchAll(/\{id:"(\w+)"/g)].map(m=>m[1]).concat(['cp']);
  for(const id of ids){await p.evaluate(i=>{var b=document.querySelector('[data-act="view"][data-id="'+i+'"]');if(b)b.click()},id);await p.waitForTimeout(350);await p.screenshot({path:`${out}/${tag}-${id}.png`})}
  await ctx.close()}
await run('d-l',{width:1280,height:800},'light');
await run('m-l',{width:390,height:844},'light');
if(process.argv[3]==='dark'){await run('d-d',{width:1280,height:800},'dark');await run('m-d',{width:390,height:844},'dark')}
await b.close();srv.close()})();
