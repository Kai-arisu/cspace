// Creator tools: teleprompter, caption bank, repurpose, insights, import
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const fake=require('./fakesb.js')();const seed=require('./seed.js');
const site=path.join(process.cwd(),'public');
const csp=fs.readFileSync(site+'/_headers','utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv=http.createServer((req,res)=>{let u=req.url.split('?')[0];if(u==='/')u='/index.html';const f=path.join(site,u);if(!fs.existsSync(f)){res.writeHead(404);return res.end('nf')}
  const ext=path.extname(f);res.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'application/javascript':'text/plain','content-security-policy':csp});res.end(fs.readFileSync(f))});
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{await new Promise(r=>srv.listen(0,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:800}});
await ctx.route('https://ohkecamneutxggqwhend.supabase.co/**',fake.handle);await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:'+srv.address().port+'/');await p.waitForTimeout(500);
await p.click('[data-ag="up"]');await p.fill('#agemail','n@x.co');await p.fill('#agpass','supersecret1');await p.click('#aggo');await p.waitForTimeout(1800);
seed(fake,'n@x.co');await p.reload();await p.waitForTimeout(2500);
const nav=v=>p.evaluate(v=>document.querySelector('#nav [data-id="'+v+'"]').click(),v).then(()=>p.waitForTimeout(500));
// teleprompter
await nav('notes');await p.click('[data-act="tp_open"]');await p.waitForTimeout(300);
ok(await p.locator('#tp:not([hidden]) #tptext').count()===1,'teleprompter opens full screen');
ok((await p.textContent('#tptext')).includes('Film the sunrise')&&!(await p.textContent('#tptext')).includes('[ ]'),'shows the script without checkbox marks');
const y0=await p.evaluate(()=>document.getElementById('tptext').style.transform);
await p.click('[data-act="tp_play"]');await p.waitForTimeout(3600);
const y1=await p.evaluate(()=>document.getElementById('tptext').style.transform);
ok(y0!==y1,'scrolls after a 3-2-1 countdown ('+y1+')');
await p.keyboard.press('ArrowUp');ok((await p.textContent('#tpsp')).includes('4'),'arrow up speeds up');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
ok(await p.locator('#tp:not([hidden])').count()===0,'Escape closes it');

// calendar shows today
await nav('cal');ok(await p.evaluate(()=>{var e=document.querySelector('.ccd.today');return !!e&&e.getBoundingClientRect().width>0}),'today is visible on the calendar');
// caption bank
await nav('bank');ok(await p.locator('.ecard').count()===1,'empty bank explains itself');
await p.click('[data-act="bk_starter"]');await p.waitForTimeout(300);
ok(await p.locator('.bk-card').count()===6,'starter set adds 6 items');
await p.click('[data-act="bk_kind"][data-id="tags"]');await p.fill('#bktitle','Food set');await p.fill('#bktext','#food #streetfood #bhopal');
ok((await p.textContent('#bkcount')).includes('3 tags'),'counts hashtags as you type');
await p.click('[data-act="bk_save"]');await p.waitForTimeout(300);
ok(await p.locator('.bk-card').count()===7,'saves a hashtag set');
await p.click('[data-act="bk_filter"][data-id="tags"]');await p.waitForTimeout(200);
ok(await p.locator('.bk-card').count()===3,'filter by type');
await ctx.grantPermissions(['clipboard-read','clipboard-write']);
await p.click('.bk-card >> nth=0 >> [data-act="bk_copy"]');await p.waitForTimeout(300);
ok((await p.evaluate(()=>navigator.clipboard.readText())).includes('#'),'copy puts it on the clipboard');
ok((await p.textContent('.bk-card >> nth=0')).includes('used 1×'),'tracks how often you use it');
await nav('cal');
await p.click('.cc-side [data-act="bk_use"] >> nth=0');await p.waitForTimeout(300);
ok((await p.inputValue('.cc-side .cp-cap')).length>5,'drop a bank item into a planned post');

// repurpose
await nav('ideas');const before=await p.evaluate(()=>document.querySelectorAll('.icard').length);
await p.click('[data-act="rp_open"] >> nth=0');await p.waitForTimeout(300);
ok(await p.locator('.rp-row').count()===9,'repurpose offers 9 formats');
await p.selectOption('[data-rp-n="shorts"]','2');await p.check('[data-rp="thread"]');
const startD=await p.inputValue('#rpdate');
await p.click('[data-act="rp_go"]');await p.waitForTimeout(600);
ok(await p.evaluate(()=>document.querySelector('.col-main').dataset.v)==='cal','lands on the Calendar');
const st=JSON.parse(await p.evaluate(()=>{var k=Object.keys(localStorage).find(k=>k.startsWith('creator-space-v1-')&&(localStorage.getItem(k)||'').startsWith('{"cur"'));return localStorage.getItem(k)}));
const set=st.posts.filter(x=>x.rep);
ok(set.length===6,'long + 2 shorts + reel + tiktok + thread = 6 posts ('+set.length+')');
ok(new Set(set.map(x=>x.rep)).size===1,'all pieces share one set');
ok(set.find(x=>/Long video/.test(x.title)).date===startD,'main piece on the chosen day');
ok(set.filter(x=>x.platform==='Shorts').map(x=>x.date).join()!==startD+','+startD,'shorts spread across days');
ok(st.tasks.filter(t=>/Cut the Shorts \(2\)|Edit the long video|Cut the Reel|Write the thread/.test(t.title)).length===4,'prep tasks added');
ok(await p.locator('.cc-side .cp-rep').count()>=1,'calendar shows the piece is part of a set');

// video insights
await nav('aud');await p.waitForTimeout(800);
await p.click('[data-act="aud_tab"][data-id="ins"]');await p.waitForTimeout(400);
ok((await p.textContent('.ins-tiles')).includes('median of 24 videos'),'insights use all 24 videos');
ok(await p.locator('.ins-bars .ib').count()===7,'best day chart has 7 days');
ok(await p.locator('.ins-bk').count()>=1,'breakout videos flagged');
ok((await p.textContent('.ins-tips')).includes('Shorts get'),'compares Shorts with long videos');
await p.click('[data-act="ins_kind"][data-id="short"]');await p.waitForTimeout(300);
ok((await p.textContent('.ins-tiles')).includes('median of 8 videos'),'filter to Shorts only');
ok((await p.textContent('.ins-cmp')).includes('Wanderer'),'compares with a channel you follow');

// import center
const csvFile=(name,txt)=>({name,mimeType:'text/csv',buffer:Buffer.from(txt)});
await nav('imp');ok(await p.locator('#impfile').count()===1,'import page has a drop zone');
// Trello
await p.setInputFiles('#impfile',csvFile('trello.csv','Card ID,Card Name,List Name,Due Date,Description\n1,"Shoot intro, take 2",Doing,2026-11-03T10:00:00.000Z,x\n2,Upload vlog,Done,,y\n3,Plan Goa trip,To Do,11/05/2026,z\n'));await p.waitForTimeout(400);
ok((await p.textContent('.im-h')).includes('Trello'),'recognises a Trello export');
ok(await p.locator('.im-t[aria-pressed="true"][data-id="tasks"]').count()===1,'picks Tasks');
ok((await p.textContent('.im-prev')).includes('Shoot intro, take 2'),'handles commas inside quotes');
await p.click('[data-act="imp_go"]');await p.waitForTimeout(500);
ok(await p.evaluate(()=>document.querySelector('.col-main').dataset.v)==='board','opens the board after import');
ok(await p.evaluate(()=>[...document.querySelectorAll('.col[data-col="m"] [data-f="task"]')].some(i=>i.value==='Shoot intro, take 2')),'Doing list lands in Making');
ok(await p.evaluate(()=>[...document.querySelectorAll('.col[data-col="s"] [data-f="task"]')].some(i=>i.value==='Upload vlog')),'Done list lands in Shipped');
// bank statement
await nav('imp');
await p.setInputFiles('#impfile',csvFile('hdfc.csv','Txn Date,Narration,Debit,Credit,Balance\n05/10/2026,UPI-BRAND CO,,"25,000.00",80000\n06/10/2026,AMAZON,1200,,78800\n12/10/2026,YOUTUBE ADSENSE,,8200.50,87000\n'));await p.waitForTimeout(400);
ok(await p.locator('.im-t[aria-pressed="true"][data-id="income"]').count()===1,'recognises a bank statement as income');
ok((await p.textContent('.im-go')).includes('2 ready'),'only credits become income');
await p.click('[data-act="imp_go"]');await p.waitForTimeout(500);
ok((await p.textContent('#wrap')).includes('YOUTUBE ADSENSE'),'income shows in Business');
// follower history for Instagram
await nav('imp');
await p.setInputFiles('#impfile',csvFile('ig.csv','Date,Followers\n2026-10-01,1200\n2026-10-08,1350\n2026-10-15,1490\n'));await p.waitForTimeout(400);
ok(await p.locator('.im-t[aria-pressed="true"][data-id="audience"]').count()===1,'recognises follower history');
await p.selectOption('[data-imp-conn]','new');await p.waitForTimeout(200);await p.selectOption('[data-imp-plat]','instagram');await p.fill('#impcname','@cashtea.ig');
await p.click('[data-act="imp_go"]');await p.waitForTimeout(900);
ok(fake.st.tables.snapshots.filter(x=>x.extra&&x.extra.imported).length===3,'saved 3 follower readings');
ok((await p.textContent('#wrap')).includes('@cashtea.ig'),'new Instagram channel shows in Audience');
// YouTube Studio
await nav('imp');
await p.setInputFiles('#impfile',csvFile('Table data.csv','Content,Video title,Video publish time,Duration,Views,Watch time (hours),Subscribers\nTotal,,,,99999,10,5\nabcDEF12345,My Studio video,"Oct 2, 2026",612,15400,800,40\nxyzXYZ98765,Second studio video,"Sep 20, 2026",45,61000,300,90\n'));await p.waitForTimeout(400);
ok(await p.locator('.im-t[aria-pressed="true"][data-id="videos"]').count()===1,'recognises a YouTube Studio export');
ok((await p.textContent('.im-go')).includes('2 ready'),'skips the Total row');
await p.click('[data-act="imp_go"]');await p.waitForTimeout(900);
ok(fake.st.tables.videos.some(v=>v.video_id==='abcDEF12345'&&v.views===15400&&v.duration_s===612),'video stats saved with id and length');
// paste ideas
await nav('imp');await p.fill('#imppaste','Idea\tTags\nSunrise timelapse\tvlog, travel\nGear review\ttech');await p.click('[data-act="imp_paste"]');await p.waitForTimeout(300);
ok(await p.locator('.im-t[aria-pressed="true"][data-id="ideas"]').count()===1,'pasted cells become ideas');
await p.click('[data-act="imp_go"]');await p.waitForTimeout(400);
ok((await p.textContent('#wrap')).includes('Sunrise timelapse'),'pasted ideas imported with tags');
// markdown notes
await nav('imp');await p.setInputFiles('#impfile',[{name:'a.md',mimeType:'text/markdown',buffer:Buffer.from('# Goa script\nHook here')},{name:'b.txt',mimeType:'text/plain',buffer:Buffer.from('plain note body')}]);await p.waitForTimeout(500);
ok((await p.textContent('#wrap')).includes('2 notes ready'),'markdown and text files become notes');
await p.click('[data-act="imp_notes"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>[...document.querySelectorAll('.ncard b')].some(b=>b.textContent.includes('Goa script'))),'note title from the heading');
// undo
await nav('imp');ok(await p.locator('[data-act="imp_undo"]').count()>=5,'recent imports listed with Undo');
await p.click('[data-act="imp_undo"] >> nth=5');await p.waitForTimeout(400);
await nav('board');ok(!(await p.evaluate(()=>[...document.querySelectorAll('[data-f="task"]')].some(i=>i.value==='Upload vlog'))),'undo removes the Trello tasks');
//__NEXT__
console.log('errors',errs);ok(!errs.length,'no page errors');
console.log(fail?'FAILURES '+fail:'ALL PASSED');await b.close();srv.close()})();
