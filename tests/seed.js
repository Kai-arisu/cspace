// Realistic demo data for screenshots and tests. seed(fake, email) fills the fake backend for that user.
function hsh(s){var h=5381,i=s.length;while(i)h=(h*33)^s.charCodeAt(--i);return (h>>>0).toString(36)+"."+s.length.toString(36)}
module.exports=function seed(fake,email,opt){opt=opt||{};
  const u=fake.st.users.find(x=>x.email===email);const uid=u.id;
  const day=n=>{const d=new Date(Date.now()+n*864e5);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const now=Date.now(),id=(p,i)=>p+i;
  const s1='sp1',s2='sp2';
  const S={
    spaces:[{id:s1,name:'Cash Tea Vlogs'},{id:s2,name:'Tech Reviews'}],
    notes:[
      {id:'n1',sp:s1,title:'Ladakh vlog script',body:'Hook: 7 days, one backpack.\n\n- [ ] Film the sunrise at Pangong\n- [ ] Record voiceover\n\nOutro: ask people to subscribe.',pin:true,ts:now-3e6},
      {id:'n2',sp:s1,title:'Channel growth plan',body:'Post 3 times a week. Shorts on Tuesday and Friday.',pin:false,ts:now-9e6},
      {id:'n3',sp:s2,title:'Phone review checklist',body:'Camera, battery, gaming, price.',pin:false,ts:now-5e6}],
    ideas:[
      {id:'i1',sp:s1,text:'Street food tour in Bhopal #food #vlog',tags:['food','vlog'],star:true,task:false,ts:now-2e6},
      {id:'i2',sp:s1,text:'Budget travel hacks for students #travel',tags:['travel'],star:false,task:false,ts:now-4e6},
      {id:'i3',sp:s2,text:'Best phones under 20k #tech',tags:['tech'],star:false,task:false,ts:now-6e6}],
    tasks:[
      {id:'t1',sp:s1,title:'Edit Ladakh vlog',col:'m',due:day(1),pri:1,ts:now-1e6},
      {id:'t2',sp:s1,title:'Design thumbnail',col:'i',due:day(-1),pri:0,ts:now-2e6},
      {id:'t3',sp:s1,title:'Write captions for reels',col:'i',due:day(3),pri:0,ts:now-3e6},
      {id:'t4',sp:s1,title:'Reply to sponsor email',col:'s',due:day(-2),pri:0,ts:now-4e6,done:now-1e6},
      {id:'t5',sp:s2,title:'Unbox the test phone',col:'m',due:day(0),pri:0,ts:now-5e6}],
    mood:[{id:'m1',sp:s1,kind:'color',sec:'palette',value:'#F5A524',label:''},{id:'m2',sp:s1,kind:'color',sec:'palette',value:'#111111',label:''},{id:'m3',sp:s1,kind:'color',sec:'palette',value:'#F2F2F2',label:''}],
    files:[{id:'f1',sp:s1,name:'ladakh-broll.mp4',assetId:'a1',type:'video/mp4',size:48000000}],
    posts:[
      {id:'p1',sp:s1,title:'Ladakh vlog: 7 days',platform:'youtube',date:day(2),status:'editing',ideaId:'',ts:now},
      {id:'p2',sp:s1,title:'Bhopal street food reel',platform:'instagram',date:day(0),status:'scheduled',ideaId:'i1',ts:now},
      {id:'p3',sp:s1,title:'Budget travel tips short',platform:'youtube',date:day(5),status:'script',ideaId:'i2',ts:now},
      {id:'p4',sp:s1,title:'Channel update',platform:'youtube',date:day(-3),status:'published',ideaId:'',ts:now}],
    clips:[{id:'c1',sp:s1,url:'https://example.com/ref',title:'Great travel intro',note:'Study the pacing',ts:now}],
    deals:[{id:'d1',sp:s1,brand:'Boat Audio',amount:25000,status:'talking',due:day(6),ts:now},{id:'d2',sp:s1,brand:'Nord VPN',amount:15000,status:'signed',due:day(10),ts:now}],
    income:[{id:'in1',sp:s1,date:day(-10),source:'YouTube AdSense',amount:8200,cat:'Ads'},{id:'in2',sp:s1,date:day(-4),source:'Brand deal',amount:20000,cat:'Sponsorship'}],
    invoices:[{id:'v1',sp:s1,no:'INV-001',client:'Boat Audio',date:day(-5),due:day(-1),items:[{d:'Integrated video',q:1,p:25000}],notes:'',paid:false,ts:now}],
    cfg:{},kit:{},palette:{[s1]:['#F5A524','#111111','#F2F2F2'],[s2]:['#0091FF','#111111','#F2F2F2']},focus:{},bmeta:{},profile:{name:'Abhinav',role:'Creator'},edit:{},iso:opt.iso?[{id:'iso1',name:'Secret project'}]:[]};
  const keys={},put=(path,data)=>fake.st.tables.docs.push({user_id:uid,path,data,updated_at:new Date().toISOString()});
  Object.keys(S).forEach(k=>{const j=JSON.stringify(S[k]);keys[k]={n:1,h:hsh(j)};put('store/k_'+k+'_0',{s:j,i:0})});
  put('store/meta',{ts:Date.now(),dev:'seed',keys,v:2});
  if(opt.iso){
    put('sp/iso1/store/k_tasks_0',{s:JSON.stringify([{id:'it1',sp:'iso1',title:'Pitch deck for label',col:'m',due:day(-1),ts:now}]),i:0});
    put('sp/iso1/store/k_notes_0',{s:JSON.stringify([{id:'in1',sp:'iso1',title:'Hidden pitch notes',body:'Talking points',pin:false,ts:now}]),i:0});
    put('sp/iso1/store/k_spaces_0',{s:JSON.stringify([{id:'iso1',name:'Secret project'}]),i:0});
  }
  // audience + team
  const cid=crypto.randomUUID();
  fake.st.tables.connections.push({id:cid,user_id:uid,platform:'youtube',kind:'own',handle:'@cashtea',external_id:'UC'+'a'.repeat(22),title:'Cash Tea',avatar_url:null,url:'https://youtube.com/@cashtea',source:'api',show_public:true,status:'ok',created_at:new Date().toISOString(),goal:10000});
  for(let i=0;i<8;i++)fake.st.tables.snapshots.push({id:fake.st.snapId++,connection_id:cid,user_id:uid,ts:new Date(Date.now()-(7-i)*864e5).toISOString(),followers:8200+i*130,views:210000+i*5200,posts:42+i,extra:{}});
  const mid=crypto.randomUUID();
  fake.st.tables.team_members.push({id:mid,owner_id:uid,name:'Mia Editor',email:'mia@x.co',role_title:'Video editor',kind:'salary',amount:30000,start_date:day(-60),end_date:null,can_login:true,see_pay:true,notes:null,status:'active',created_at:new Date().toISOString()});
  fake.st.tables.team_work.push({id:crypto.randomUUID(),owner_id:uid,member_id:mid,title:'Edit Ladakh vlog',due:day(1),status:'doing',done_at:null,created_at:new Date().toISOString()});
  fake.st.tables.team_work.push({id:crypto.randomUUID(),owner_id:uid,member_id:mid,title:'Cut 3 shorts',due:day(-1),status:'todo',done_at:null,created_at:new Date().toISOString()});
  fake.st.tables.team_pay.push({id:crypto.randomUUID(),owner_id:uid,member_id:mid,label:'Oct 2026 salary',amount:30000,status:'due',paid_on:null,created_at:new Date().toISOString()});
  return {uid,S};
};
