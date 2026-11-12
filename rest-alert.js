// Persist the latest mutation until acknowledged, including a cancelled timer.
let alertBusy=false,alertRetry=0;
function syncRestAlert(){
 if(!cfg.restAlertUrl||!token)return;
 const end=Number(localStorage.getItem('repere.timer'))||0;
 const key='onemore.restAlert.'+token.user.id;
 const saved=JSON.parse(localStorage.getItem(key)||'null');
 let job=saved;
 if(saved?.end!==end){
  job={end,version:Math.max(Date.now(),(saved?.version||0)+1),sent:false};
  localStorage.setItem(key,JSON.stringify(job));alertRetry=0;
 }
 if(job.sent||alertBusy||!navigator.onLine||Date.now()<alertRetry)return;
 alertBusy=true;
 (async()=>{
  const res=await fetch(cfg.restAlertUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await access()},body:JSON.stringify(job)});
  if(!res.ok)throw Error('notification');
  const current=JSON.parse(localStorage.getItem(key));
  if(current.version===job.version)localStorage.setItem(key,JSON.stringify({...job,sent:true}));
 })().catch(()=>{alertRetry=Date.now()+10000}).finally(()=>{alertBusy=false});
}
