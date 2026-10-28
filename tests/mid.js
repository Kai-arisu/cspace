// mid-century pass: ideas wall, notes read mode and phone one-pane, free-form moodboard canvas, new public page
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');const site=path.join(process.cwd(),'public');
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/'||u.startsWith('/u/'))u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}const e=path.extname(f);res.writeHead(200,{'content-type':e==='.html'?'text/html':e==='.js'?'application/javascript':e==='.woff2'?'font/woff2':'application/octet-stream'});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const base='http://localhost:'+srv.address().port;const b=await chromium.launch();const errs=[];
async function signin(vp,email){const ctx=await b.newContext({viewport:vp});await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(base+'/?signup');await p.waitForTimeout(400);await p.fill('#agemail',email);await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1500);
  const r=seed(fake,email);await p.reload();await p.waitForTimeout(2200);return {ctx,p,uid:r.uid}}
const go=(p,v)=>p.evaluate(v=>document.querySelector('[data-act="view"][data-id="'+v+'"]').click(),v).then(()=>p.waitForTimeout(500));
let {ctx,p,uid}=await signin({width:1440,height:900},'mid@x.co');
// fonts and identity
ok(await p.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Jost')),'body set in Jost');
ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#nav .si-row[aria-current="true"]')).backgroundColor==='rgb(255, 194, 26)'),'current view row is yellow');
// ideas wall
await go(p,'ideas');
ok(await p.locator('.id-wall .icard').count()>=2,'ideas show as cards');
ok(await p.locator('.icard.starred').count()>=1,'starred idea is a yellow card');
await p.click('.id-chips [data-act="ifilter"][data-id="star"]');await p.waitForTimeout(300);
ok(await p.locator('.icard').count()===await p.locator('.icard.starred').count(),'starred filter shows only starred');
// notes read mode
await go(p,'notes');
await p.click('[data-act="nmode"][data-id="read"]');await p.waitForTimeout(300);
ok(await p.locator('#ndoc .nd-c input[type=checkbox]').count()>=2,'read mode renders checklist as checkboxes');
await p.locator('#ndoc .nd-c input').first().click();await p.waitForTimeout(300);
ok(await p.evaluate(()=>/- \[x\] Film the sunrise/.test(JSON.stringify(window.S?S.notes:[]))||document.querySelector('#ndoc .nd-c.done')!==null),'ticking a box marks the line done');
await p.click('[data-act="nmode"][data-id="write"]');await p.waitForTimeout(300);
ok((await p.inputValue('#nbody')).includes('- [x] Film the sunrise'),'the tick is saved into the note text');
// moodboard canvas
await go(p,'mood');await p.evaluate(()=>document.querySelector('[data-act="mlayout"][data-id="canvas"]').click());await p.waitForTimeout(600);
ok(await p.locator('#mcv .mcv-it').count()>=5,'canvas shows every board item');
const it=p.locator('#mcv .mcv-it').nth(6);const bx=await it.boundingBox();
await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2);await p.mouse.down();await p.mouse.move(bx.x+bx.width/2+120,bx.y+bx.height/2+60,{steps:6});await p.mouse.up();await p.waitForTimeout(300);
const bx2=await it.boundingBox();ok(bx2.x-bx.x>60&&bx2.y-bx.y>25,'dragging moves an item ('+Math.round(bx2.x-bx.x)+','+Math.round(bx2.y-bx.y)+')');
await p.waitForTimeout(2600);
ok(fake.st.tables.docs.some(d=>d.user_id===uid&&/k_mood_/.test(d.path)&&/"cx":/.test(d.data.s||'')),'item position is saved');
const w0=(await it.boundingBox()).width;const rs=it.locator('.mcv-rs');const rb=await rs.boundingBox();
await p.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2);await p.mouse.down();await p.mouse.move(rb.x+80,rb.y+10,{steps:5});await p.mouse.up();await p.waitForTimeout(200);
ok((await it.boundingBox()).width>w0+30,'the corner handle resizes');
await p.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','https://example.com/ref');const c=document.getElementById('mcv');const r=c.getBoundingClientRect();
  c.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,clientX:r.left+200,clientY:r.top+200,bubbles:true,cancelable:true}))});await p.waitForTimeout(500);
ok(await p.locator('#mcv .mb-link').count()>=2,'dropping a link adds it to the canvas');
await ctx.close();
// phone: notes open one pane at a time
({ctx,p}=await signin({width:390,height:844},'midp@x.co'));
await go(p,'notes');
ok(await p.locator('#nlist').isVisible()&&!(await p.locator('#neditor').isVisible()),'phone shows the note list first');
await p.click('.ncard');await p.waitForTimeout(400);
ok(await p.locator('#neditor').isVisible()&&!(await p.locator('#nlist').isVisible()),'opening a note shows only the editor');
await p.click('[data-act="nback"]');await p.waitForTimeout(300);
ok(await p.locator('#nlist').isVisible(),'back returns to the list');
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no sideways scroll on phone');
await ctx.close();
// public page
fake.st.tables.profiles.push({user_id:uid,handle:'midtest',is_public:true,display_name:'Mid Test',tagline:'Tagline here',bio:'Bio',links:[{label:'Site',url:'https://example.com'}],kit:{on:true,email:'a@b.co',rates:[['Video','₹1']]}});
const c2=await b.newContext({viewport:{width:1280,height:800}});await c2.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);const q=await c2.newPage();q.on('pageerror',e=>errs.push(e.message));
await q.goto(base+'/u/midtest');await q.waitForTimeout(1200);
ok((await q.textContent('.pg-name'))==='Mid Test','public page shows the name large');
ok(await q.locator('.pg-band .pg-n').count()>=1,'numbers band');ok(await q.locator('.pg-links a').count()===1,'links as a list');
await q.goto(base+'/u/midtest/kit');await q.waitForTimeout(1200);
ok(await q.locator('.pg-rates tr').count()===1,'media kit rate table');
ok(errs.length===0,'no page errors '+errs.join('|'));
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close();process.exit(fail?1:0)})();
