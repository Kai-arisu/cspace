// node tests/visual.js <outdir> : screenshots every screen (light and dark, desktop and phone) with demo data,
// animations off, so two builds can be compared pixel by pixel (tests/visual-diff.py).
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const site=path.join(process.cwd(),'public');const out=process.argv[2]||'/tmp/visual';fs.mkdirSync(out,{recursive:true});
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}const e=path.extname(f);res.writeHead(200,{'content-type':e=='.html'?'text/html':e=='.js'?'application/javascript':e=='.woff2'?'font/woff2':e=='.webp'?'image/webp':'application/octet-stream'});res.end(fs.readFileSync(f))});
const NOW=new Date('2026-10-28T11:00:00+05:30').getTime();
const VIEWS=['home','notes','notes:[data-act=nmode][data-id=read]','ideas','mood','mood:[data-act=mlayout][data-id=canvas]','wb','clips','bank','cal','board','viz','aud','biz','team','cp'];
(async()=>{await new Promise(r=>srv.listen(0,r));const base='http://localhost:'+srv.address().port;const b=await chromium.launch();
for(const [tag,vp,scheme] of [['d-light',{width:1440,height:900},'light'],['d-dark',{width:1440,height:900},'dark'],['p-light',{width:390,height:844},'light']]){
  const fake=require('./fakesb.js')();const seed=require('./seed.js');
  const ctx=await b.newContext({viewport:vp,colorScheme:scheme,reducedMotion:'reduce'});
  await ctx.addInitScript(`{const N=${NOW};const D=Date;class FD extends D{constructor(...a){super(...(a.length?a:[N]))}static now(){return N}};globalThis.Date=FD;Math.random=(()=>{let s=1;return()=>{s=(s*16807)%2147483647;return s/2147483647}})()}`);
  await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  const p=await ctx.newPage();await p.goto(base+'/?signup');await p.waitForTimeout(500);await p.fill('#agemail','v@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1500);
  seed(fake,'v@x.co');await p.reload();await p.waitForTimeout(2500);
  await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  for(const vv of VIEWS){const [v,sub]=vv.split(':');
    await p.evaluate(v=>{var x=document.querySelector('[data-act="view"][data-id="'+v+'"]');if(x)x.click()},v);await p.waitForTimeout(700);
    if(sub){await p.evaluate(s=>{var t=document.querySelector(s);if(t)t.click()},sub);await p.waitForTimeout(500)}
    await p.evaluate(()=>{document.activeElement&&document.activeElement.blur&&document.activeElement.blur();scrollTo(0,0)});await p.waitForTimeout(150);
    await p.screenshot({path:path.join(out,tag+'-'+vv.replace(/[^a-z0-9]+/gi,'_')+'.png')});
    if(sub&&v==='mood')await p.evaluate(()=>{var t=document.querySelector('[data-act=mlayout][data-id=poster]');if(t)t.click()});
  }
  await ctx.close()}
await b.close();srv.close();console.log('saved to',out)})();
