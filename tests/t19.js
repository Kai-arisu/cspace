const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
// build test copy with hooks
let h=fs.readFileSync('creator-space.html','utf8');
h=h.replace('var DATA={open:false','window.__T={SY:function(){return SY},S:function(){return S},flush:function(f){return syFlush(f)},wb:function(){return WB},touch:function(){touch()},ro:function(){return readOnly},render:function(){render()},wbTouch:function(){wbTouch()},cloudBackup:function(l){return cloudBackup(l)},cloud:function(){return cloudList()},bk:function(){return backupObj()},val:function(o){return validState(o)}};\nvar DATA={open:false');
fs.writeFileSync('test-copy.html',h);
const store=new Map();const cfg={failSets:0,maxDoc:256*1024,sets:0};
function dbop(op,path,data,q){
  if(op==='get'){return store.has(path)?{exists:true,data:store.get(path)}:{exists:false}}
  if(op==='set'){if(cfg.failSets>0){cfg.failSets--;throw {code:'unavailable',message:'x'}}
    if(JSON.stringify(data).length>cfg.maxDoc)throw {code:'invalid_argument',message:'too big'};store.set(path,JSON.parse(JSON.stringify(data)));cfg.sets++;return {}}
  if(op==='delete'){store.delete(path);return {}}
  if(op==='acquire'){const L=cfg.L||(cfg.L=new Map());const l=L.get(path),now=Date.now();if(l&&l.exp>now&&l.holder!==data.holder)return {acquired:false};L.set(path,{holder:data.holder,exp:now+(data.ttlMs||30000)});return {acquired:true}}
  if(op==='query'){const pre=path+'/';let a=[];for(const [k,v] of store){if(k.startsWith(pre)&&k.indexOf('/',pre.length)<0)a.push(v)}
    if(q.where)a=a.filter(x=>x[q.where[0]]===q.where[2]);if(q.order)a.sort((x,y)=>q.dir==='desc'?y[q.order]-x[q.order]:x[q.order]-y[q.order]);return {docs:a}}
}
async function mk(browser,opts={}){
  const ctx=await browser.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.errs=errs;
  await p.exposeFunction('__dbop',(op,path,data,q)=>{try{return dbop(op,path,data,q)}catch(e){return {__err:{code:e.code,message:e.message}}}});
  await p.addInitScript((o)=>{
    const call=async(op,path,data,q)=>{const r=await window.__dbop(op,path,data,q);if(r&&r.__err)throw r.__err;return r};
    const snap=(r,id)=>({id,exists:r.exists,data:()=>r.exists?r.data:undefined,metadata:{hasPendingWrites:false}});
    const doc=(path)=>({path,id:path.split('/').pop(),get:async()=>snap(await call('get',path),path),set:async d=>{await call('set',path,d)},delete:async()=>{await call('delete',path)},acquire:async o=>call('acquire',path,o),
      onSnapshot:(next,err)=>{let last=null,dead=false;const tick=async()=>{if(dead)return;try{const r=await call('get',path);const j=JSON.stringify(r);if(j!==last){last=j;next(snap(r,path))}}catch(e){err&&err(e)}setTimeout(tick,250)};tick();return()=>{dead=true}}});
    const col=(path)=>{const q={};const o={where(f,op,v){q.where=[f,op,v];return o},orderBy(f,d){q.order=f;q.dir=d;return o},limit(){return o},get:async()=>{const r=await call('query',path,null,q);const docs=r.docs.map(d=>({data:()=>d}));return {docs,forEach:f=>docs.forEach(f)}}};return o};
    window.claude={use:async n=>{
      if(n==='db')return o.nodb?null:{doc,collection:col};
      if(n==='user')return {isOwner:async()=>!o.ro,canEdit:async()=>!o.ro,can:async()=>!o.ro};
      return null}};
  },opts);
  await p.goto('file://'+process.cwd()+'/test-copy.html');await p.waitForTimeout(900);return p;
}
const T=async(p,fn,...a)=>p.evaluate(fn,...a);
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
(async()=>{const b=await chromium.launch();
// 1 device A edits -> remote
const A=await mk(b);
await T(A,()=>{const S=__T.S();S.notes.push({id:'nA1',sp:S.cur,title:'From A',body:'hello',pin:false,ts:Date.now()});__T.touch()});
await A.waitForTimeout(2500);
ok(store.has('store/meta'),'A wrote store/meta');ok([...store.keys()].some(k=>k.startsWith('store/k_notes_')),'A wrote notes shard');
ok(await T(A,()=>__T.SY().pending===false),'A no pending');
ok((await T(A,()=>document.getElementById('status').textContent))==='All changes saved','A status saved');
// 2 device B adopts
const B=await mk(b);
ok(await T(B,()=>__T.S().notes.some(n=>n.id==='nA1')),'B adopted A note');
// 3 concurrent offline edits both survive
cfg.failSets=100;
await T(B,()=>{const S=__T.S();S.ideas.push({id:'iB',sp:S.cur,text:'idea from B',tags:[],star:false,task:false,ts:Date.now()});__T.touch()});
cfg.failSets=0;
await T(A,()=>{const S=__T.S();S.ideas.push({id:'iA',sp:S.cur,text:'idea from A',tags:[],star:false,task:false,ts:Date.now()});__T.touch()});
await A.waitForTimeout(2500);
await B.waitForTimeout(7000); // B retry backoff
const ia=await T(A,()=>__T.S().ideas.map(i=>i.id).sort()),ib=await T(B,()=>__T.S().ideas.map(i=>i.id).sort());
console.log('A ideas',ia.join(','),'B ideas',ib.join(','));ok(ia.includes('iA')&&ia.includes('iB'),'A has both ideas '+ia.length);ok(ib.includes('iA')&&ib.includes('iB'),'B has both ideas '+ib.length);
// 4 huge doc chunked
const big='x'.repeat(700000);
await T(A,(b)=>{const S=__T.S();S.notes.push({id:'big',sp:S.cur,title:'Big',body:b,pin:false,ts:Date.now()});__T.touch()},big);
for(let i=0;i<30&&await T(A,()=>__T.SY().pending||__T.SY().busy);i++)await A.waitForTimeout(500);
ok(await T(A,()=>__T.SY().pending===false&&!__T.ro()),'big write ok, not readOnly');
await B.waitForTimeout(2500);
ok(await T(B,()=>{const n=__T.S().notes.filter(x=>x.id==='big')[0];return n&&n.body.length===700000}),'B received 700k note');
// 5 retry on failures
cfg.failSets=3;
await T(A,()=>{const S=__T.S();S.tasks.push({id:'tR',sp:S.cur,title:'retry me',col:'i',due:'',ts:Date.now()});__T.touch()});
await A.waitForTimeout(1500);
ok((await T(A,()=>document.getElementById('status').textContent)).match(/Retrying|Saving/),'A shows retry status');
await A.waitForTimeout(12000);
ok(await T(A,()=>__T.SY().pending===false),'A recovered after failures');
// 6 whiteboard chunked
await T(A,()=>{__T.wb().loadedFor=__T.S().cur;__T.wb().items=[];for(let i=0;i<900;i++)__T.wb().items.push({id:'w'+i,t:'sticky',x:i,y:i,w:100,h:100,txt:'n'.repeat(300)});__T.wbTouch()});
await A.waitForTimeout(3500);
ok([...store.keys()].some(k=>/^bd\/.+_m$/.test(k)),'whiteboard meta written');
ok(!await T(A,()=>__T.wb().dirty),'whiteboard clean after save');
// 7 backup
await T(A,()=>__T.cloudBackup('t1'));await A.waitForTimeout(500);
ok([...store.keys()].some(k=>/^bk\/.+_m$/.test(k)),'cloud backup meta');
const bobj=await T(A,()=>__T.bk());ok(bobj.boards&&Object.keys(bobj.boards).length>=1,'backup includes boards');
ok(!!(await T(A,(o)=>__T.val(o),bobj)),'backup validates');
// 8 data dialog opens
await A.keyboard.press('Escape');await A.click('#statusbtn');await A.waitForTimeout(500);
ok(await A.locator('.dstat').count()===1,'data dialog opens');await A.screenshot({path:'f-data.png'});
await A.click('[data-act="dlgclose"]');
// 9 legacy migration
await A.close();await B.close();store.clear();store.set('app/main',{state:{cur:'x',view:'ideas',spaces:[{id:'sL',name:'Legacy'}],notes:[{id:'L1',sp:'sL',title:'old',body:'b',ts:1}],ideas:[],tasks:[],mood:[],files:[]}});
const C=await mk(b);await C.waitForTimeout(4500);
console.log('C notes',JSON.stringify(await T(C,()=>__T.S().notes.map(n=>n.id))),JSON.stringify(await T(C,()=>({r:__T.SY().ready,p:__T.SY().pending,e:__T.SY().err,lt:__T.SY().localTs}))));ok(await T(C,()=>__T.S().notes.some(n=>n.id==='L1')),'legacy state adopted');ok(store.has('store/meta'),'legacy re-saved as sharded');ok(store.has('app/main'),'legacy doc kept');
// 10 read-only viewer
const V=await mk(b,{ro:true});const before=cfg.sets;await T(V,()=>{__T.S().notes.push({id:'vx',sp:__T.S().cur,title:'x',body:'x',ts:1});__T.touch()});await V.waitForTimeout(2000);
ok(await T(V,()=>__T.ro()),'viewer is readOnly');ok(cfg.sets===before,'viewer made no cloud writes');
// 11 signed out
const O=await mk(b,{nodb:true});await T(O,()=>{__T.S().notes.push({id:'o1',sp:__T.S().cur,title:'o',body:'o',ts:1});__T.touch()});
ok((await T(O,()=>document.getElementById('status').textContent))==='Saved on this device','signed-out status');
// 12 render failure doesn't throw
await T(O,()=>{document.getElementById('wrap').remove();__T.render()});
for(const p of [C,V,O])if(p.errs.filter(e=>!/ERR_TUNNEL/.test(e)).length)console.log('PAGE ERRORS',p.errs);
console.log(fail?'FAILURES: '+fail:'ALL PASSED');await b.close()})();
