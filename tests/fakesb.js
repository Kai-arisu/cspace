// in-memory stand-in for Supabase (auth, PostgREST, storage, functions)
const crypto=require('crypto');
function b64(o){return Buffer.from(JSON.stringify(o)).toString('base64url')}
function jwt(user){return b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:user.id,email:user.email,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.sig'}
module.exports=function(){
  const st={users:[],tables:{docs:[],leases:[],profiles:[],shares:[],connections:[],snapshots:[],videos:[],cal_tokens:[],push_subs:[],team_members:[],team_work:[],team_pay:[]},files:{},ytConfigured:true,calls:[],snapId:1};
  const OWNER=['docs','leases','connections','snapshots','videos','cal_tokens','push_subs'];
  function session(u){const t=jwt(u);return {access_token:t,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'r_'+u.id,user:{id:u.id,aud:'authenticated',role:'authenticated',email:u.email,app_metadata:{},user_metadata:{},created_at:new Date().toISOString()}}}
  function uidOf(req){const a=req.headers()['authorization']||'';const m=a.match(/Bearer ([^ ]+)/);if(!m)return null;try{return JSON.parse(Buffer.from(m[1].split('.')[1],'base64url').toString()).sub||null}catch(e){return null}}
  function emailOf(uid){const u=st.users.find(u=>u.id===uid);return u?u.email.toLowerCase():null}
  function shareFor(owner,uid,path,edit){return st.tables.shares.find(x=>x.owner_id===owner&&x.invitee_email.toLowerCase()===emailOf(uid)&&(!edit||x.role==='editor')&&(!x.space_id||(typeof path==='string'&&path.startsWith('sp/'+x.space_id+'/'))))}
  function visible(t,row,uid){
    if(t==='shares')return row.owner_id===uid||row.invitee_email.toLowerCase()===emailOf(uid);
    if(t==='docs'&&row.user_id!==uid&&uid&&shareFor(row.user_id,uid,row.path))return true;
    if(t==='team_members'||t==='team_work'||t==='team_pay')return !!uid&&row.owner_id===uid;
    if(t==='profiles')return row.user_id===uid||row.is_public;
    if(OWNER.includes(t)&&row.user_id===uid)return true;
    if(t==='connections')return row.show_public&&row.kind==='own'&&st.tables.profiles.some(p=>p.user_id===row.user_id&&p.is_public);
    if(t==='snapshots'||t==='videos'){const c=st.tables.connections.find(c=>c.id===row.connection_id);return !!c&&visible('connections',c,uid)&&!uid||false}
    return false;
  }
  function parseVal(v){return v}
  function matchFilter(row,key,val){
    const m=val.match(/^(eq|neq|gte|lte|gt|lt|like|in|is)\.(.*)$/);if(!m)return true;const [,op,arg]=m;const x=row[key];
    switch(op){case 'eq':return String(x)===arg||(x===true&&arg==='true')||(x===false&&arg==='false');case 'neq':return String(x)!==arg;
      case 'gte':return String(x)>=arg;case 'lte':return String(x)<=arg;case 'gt':return String(x)>arg;case 'lt':return String(x)<arg;
      case 'like':return new RegExp('^'+arg.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*')+'$').test(String(x));
      case 'in':return arg.replace(/^\(|\)$/g,'').split(',').map(s=>s.replace(/^"|"$/g,'')).includes(String(x));
      case 'is':return arg==='null'?x==null:String(x)===arg}
    return true;
  }
  async function handle(route,req){
    const url=new URL(req.url()),p=url.pathname,method=req.method(),uid=uidOf(req);
    const J=(status,body,h={})=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*',...h},body:body===undefined?'':JSON.stringify(body)});
    if(method==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
    let body=null;try{body=req.postData()?JSON.parse(req.postData()):null}catch(e){}
    st.calls.push(method+' '+p);
    if(p==='/auth/v1/signup'){if(st.users.some(u=>u.email===body.email))return J(422,{code:422,error_code:'user_already_exists',msg:'User already registered'});
      const u={id:crypto.randomUUID(),email:body.email,password:body.password};st.users.push(u);if(st.confirm)return J(200,{id:u.id,email:u.email,aud:'authenticated'});return J(200,session(u))}
    if(p==='/auth/v1/token'){const g=url.searchParams.get('grant_type');
      if(g==='password'){const u=st.users.find(u=>u.email===body.email&&u.password===body.password);if(!u)return J(400,{code:400,error_code:'invalid_credentials',msg:'Invalid login credentials',error:'invalid_grant',error_description:'Invalid login credentials'});return J(200,session(u))}
      if(g==='refresh_token'){const u=st.users.find(u=>'r_'+u.id===body.refresh_token);if(!u)return J(400,{msg:'bad refresh'});return J(200,session(u))}}
    if(p==='/auth/v1/user'){const u=st.users.find(u=>u.id===uid);return u?J(200,session(u).user):J(401,{msg:'no'})}
    if(p==='/auth/v1/logout')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}});
    if(p==='/auth/v1/recover')return J(200,{});
    if(p.startsWith('/rest/v1/rpc/acquire_lease')){return J(200,true)}
    if(p.startsWith('/rest/v1/rpc/my_team')){const em=emailOf(uid);if(!em)return J(200,[]);
      return J(200,st.tables.team_members.filter(m=>m.email&&m.email.toLowerCase()===em&&m.can_login&&m.status==='active').map(m=>({member_id:m.id,owner_email:emailOf(m.owner_id),name:m.name,role_title:m.role_title,kind:m.kind,start_date:m.start_date,end_date:m.end_date,see_pay:m.see_pay,amount:m.see_pay?m.amount:null,
        work:st.tables.team_work.filter(w=>w.member_id===m.id).map(w=>({id:w.id,title:w.title,due:w.due,status:w.status,done_at:w.done_at})),
        pay:m.see_pay?st.tables.team_pay.filter(x=>x.member_id===m.id).map(x=>({id:x.id,label:x.label,amount:x.amount,status:x.status,paid_on:x.paid_on})):null})))}
    if(p.startsWith('/rest/v1/rpc/my_work_update')){const em=emailOf(uid);const w=st.tables.team_work.find(w=>w.id===body.p_id);const m=w&&st.tables.team_members.find(m=>m.id===w.member_id);
      if(!w||!m||!em||!m.email||m.email.toLowerCase()!==em||!m.can_login||m.status!=='active')return J(200,false);w.status=body.p_status;w.done_at=body.p_status==='done'?new Date().toISOString():null;return J(200,true)}
    if(p.startsWith('/rest/v1/rpc/list_workspaces')){return J(200,st.tables.shares.filter(x=>x.invitee_email.toLowerCase()===emailOf(uid)).map(x=>({owner_id:x.owner_id,owner_email:emailOf(x.owner_id),role:x.role,space_id:x.space_id||null,space_name:x.space_name||null})))}
    if(p.startsWith('/rest/v1/')){
      const t=p.slice('/rest/v1/'.length);if(!st.tables[t])return J(404,{message:'no table'});
      const rows=st.tables[t],prefer=req.headers()['prefer']||'',acc=req.headers()['accept']||'';
      const filters=[...url.searchParams.entries()].filter(([k])=>!['select','order','limit','on_conflict'].includes(k));
      const pick=()=>rows.filter(r=>filters.every(([k,v])=>matchFilter(r,k,v))&&(visible(t,r,uid)));
      if(method==='GET'){
        let out=pick();const ord=url.searchParams.get('order');if(ord){const [c,d]=ord.split('.');out.sort((a,b)=>(a[c]>b[c]?1:a[c]<b[c]?-1:0)*(d==='desc'?-1:1))}
        const lim=url.searchParams.get('limit');if(lim)out=out.slice(0,+lim);
        const sel=url.searchParams.get('select');if(sel&&sel!=='*'){const cols=sel.split(',');out=out.map(r=>{const o={};cols.forEach(c=>o[c]=r[c]);return o})}
        if(acc.includes('vnd.pgrst.object')){if(out.length!==1)return J(406,{code:'PGRST116',message:'JSON object requested, multiple (or no) rows returned'});return J(200,out[0])}
        return J(200,out);
      }
      if(method==='POST'){
        if(!uid&&OWNER.includes(t))return J(401,{message:'JWT required'});
        const arr=Array.isArray(body)?body:[body],oc=(url.searchParams.get('on_conflict')||'').split(',').filter(Boolean),res=[];
        for(const b of arr){
          let row={...b};
          if(t==='shares'){if(row.owner_id!==uid)return J(403,{code:'42501',message:'rls'});row.id=row.id||crypto.randomUUID();row.space_id=row.space_id||null;row.space_key=row.space_id||''}
          if(OWNER.includes(t)||t==='profiles'){if(!row.user_id)row.user_id=uid;const sh=t==='docs'&&row.user_id!==uid?shareFor(row.user_id,uid,row.path,true):null;if(row.user_id!==uid&&!sh)return J(403,{code:'42501',message:'new row violates row-level security policy'})}
          if(t==='cal_tokens'){row.token=row.token||crypto.randomUUID()}
          if(t==='team_members'||t==='team_work'||t==='team_pay'){
            row.owner_id=uid;row.id=row.id||crypto.randomUUID();row.created_at=new Date().toISOString();
            if(t==='team_members'){row.status=row.status||'active';if(row.can_login===undefined)row.can_login=true;if(row.see_pay===undefined)row.see_pay=true;row.notes=row.notes||null;
              if(row.email&&rows.some(r=>r.owner_id===uid&&r.email&&r.email.toLowerCase()===row.email.toLowerCase()))return J(409,{code:'23505',message:'duplicate key'})}
            else{if(!st.tables.team_members.some(m=>m.id===row.member_id&&m.owner_id===uid))return J(403,{code:'42501',message:'new row violates row-level security policy'});
              if(t==='team_work'){row.status=row.status||'todo';row.done_at=null}else{row.status=row.status||'due';row.paid_on=null}}
          }
          if(t==='connections'){row.id=row.id||crypto.randomUUID();row.kind=row.kind||'own';row.show_public=row.show_public||false;row.created_at=row.created_at||new Date().toISOString();row.source=row.source||'api';row.status=row.status||'ok'}
          if(t==='snapshots'){row.id=st.snapId++;row.ts=row.ts||new Date().toISOString()}
          if(t==='profiles'&&row.handle&&rows.some(r=>r.handle===row.handle&&r.user_id!==row.user_id))return J(409,{code:'23505',message:'duplicate key value violates unique constraint'});
          const key=oc.length?oc:(t==='docs'?['user_id','path']:[]);
          const ex=key.length?rows.find(r=>key.every(k=>r[k]===row[k])):null;
          if(ex){if(prefer.includes('merge-duplicates')){Object.assign(ex,row);res.push(ex)}else return J(409,{code:'23505',message:'duplicate'})}else{rows.push(row);res.push(row)}
        }
        if(prefer.includes('return=representation')||url.searchParams.get('select')){const o=Array.isArray(body)?res:res[0];if(acc.includes('vnd.pgrst.object'))return J(201,res[0]);return J(201,Array.isArray(body)?res:[res[0]])}
        return route.fulfill({status:201,headers:{'access-control-allow-origin':'*'},body:''});
      }
      if(method==='PATCH'){pick().forEach(r=>Object.assign(r,body));return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}})}
      if(method==='DELETE'){const del=pick().filter(r=>r.user_id===uid||r.owner_id===uid||(t==='shares'&&r.invitee_email.toLowerCase()===emailOf(uid))||(t==='docs'&&shareFor(r.user_id,uid,r.path,true)));del.forEach(r=>rows.splice(rows.indexOf(r),1));
        if(t==='team_members')del.forEach(d=>{st.tables.team_work=st.tables.team_work.filter(r=>r.member_id!==d.id);st.tables.team_pay=st.tables.team_pay.filter(r=>r.member_id!==d.id)});
        if(t==='connections')del.forEach(d=>{['snapshots','videos'].forEach(x=>{st.tables[x]=st.tables[x].filter(r=>r.connection_id!==d.id)})});
        return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}})}
    }
    if(p.startsWith('/storage/v1/object/assets/')){st.files[p]=true;return J(200,{Key:p.replace('/storage/v1/object/','')})}
    if(p==='/functions/v1/invite'){
      if(!uid)return J(401,{error:'unauthorized'});const em=String(body.email||'').toLowerCase();
      const known=st.tables.shares.some(x=>x.owner_id===uid&&x.invitee_email.toLowerCase()===em)||st.tables.team_members.some(x=>x.owner_id===uid&&String(x.email||'').toLowerCase()===em);
      if(!known)return J(403,{error:'not_invited',message:'Add this person first, then send the invite.'});
      st.invites=(st.invites||[]);if(st.invites.includes(uid+em))return J(429,{error:'already_sent',message:'An invite already went to this email today.'});
      st.invites.push(uid+em);return J(200,{ok:true,kind:'invite'});
    }
    if(p==='/functions/v1/youtube-sync'){
      if(!st.ytConfigured)return J(503,{error:'not_configured',message:'The YouTube API key has not been added yet.'});
      if(body.refresh)return J(200,{ok:true,refreshed:0,skipped:0});
      if(/bad/.test(body.input||''))return J(400,{error:'bad_input',message:'Paste a channel link, an @handle, or a channel ID that starts with UC.'});
      const ext='UC'+'a'.repeat(22);let c=st.tables.connections.find(c=>c.user_id===uid&&c.external_id===ext);
      if(!c){c={id:crypto.randomUUID(),user_id:uid,platform:'youtube',kind:body.kind||'own',handle:'@demo',external_id:ext,title:'Demo Channel',avatar_url:null,url:'https://www.youtube.com/channel/'+ext,source:'api',show_public:false,status:'ok',created_at:new Date().toISOString()};st.tables.connections.push(c)}
      st.tables.snapshots.push({id:st.snapId++,connection_id:c.id,user_id:uid,ts:new Date().toISOString(),followers:12345,views:987654,posts:42,extra:{}});
      st.tables.videos.push({connection_id:c.id,video_id:'v1'+st.snapId,user_id:uid,title:'First video',thumb:null,published_at:new Date().toISOString(),views:5000,likes:300,comments:12});
      return J(200,{ok:true,connection_id:c.id,title:c.title,followers:12345,views:987654,posts:42});
    }
    return J(404,{message:'unhandled '+p});
  }
  return {st,handle};
};
