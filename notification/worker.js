const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export default {async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return new Response(null,{status:405,headers:cors});
 const auth=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_KEY,Authorization:req.headers.get('Authorization')||''}});
 if(!auth.ok||(await auth.json()).id!==env.OWNER_ID)return new Response(null,{status:403,headers:cors});
 const {end,version}=await req.json();
 if(!Number.isSafeInteger(end)||!Number.isSafeInteger(version)||end>Date.now()+86400000)return new Response(null,{status:400,headers:cors});
 const timer=env.TIMERS.get(env.TIMERS.idFromName(env.OWNER_ID));
 await timer.fetch('https://timer/update',{method:'POST',body:JSON.stringify({end,version})});
 return new Response(null,{status:204,headers:cors});
}};
export class RestTimer{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async fetch(req){
  const job=await req.json();
  await this.ctx.storage.transaction(async tx=>{
   const prev=await tx.get('job');
   if(prev&&prev.version>=job.version)return;
   await tx.put('job',job);
   if(job.end>Date.now())await tx.setAlarm(job.end);
   else await tx.deleteAlarm();
  });
  return new Response(null);
 }
 async alarm(){
  const job=await this.ctx.storage.get('job');
  if(!job?.end||job.end>Date.now()||Date.now()-job.end>60000)return;
  const res=await fetch('https://ntfy.sh/'+encodeURIComponent(this.env.NTFY_TOPIC),{method:'POST',headers:{Title:'One More'},body:'Repos terminé. Ta prochaine série t’attend.'});
  if(!res.ok)throw Error('ntfy '+res.status);
 }
}
