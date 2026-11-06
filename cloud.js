// A revision match prevents two devices from silently overwriting each other.
const cfg=window.REPERE_CONFIG;
const configured=Boolean(cfg.url&&cfg.key);
const storageKey='repere.carnet.v1';
let box=JSON.parse(localStorage.getItem(storageKey)||'null')||{state:seed(),rev:0,dirty:false,owner:null};
let state=box.state, token=JSON.parse(localStorage.getItem('repere.auth')||'null');
let busy=false, conflict=false, cloudError='', job;
function persist(){localStorage.setItem(storageKey,JSON.stringify(box))}
function synced(){box.lastSync=Date.now();persist()}
function changed(){box.dirty=true;persist();queueSync();statusText()}
function queueSync(){clearTimeout(job);job=setTimeout(sync,800)}
function keepToken(t){token=t;if(t)localStorage.setItem('repere.auth',JSON.stringify(t));else localStorage.removeItem('repere.auth')}
async function call(path,options={},access=null){
 const res=await fetch(cfg.url.replace(/\/$/,'')+path,{...options,headers:{apikey:cfg.key,'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{}),...options.headers}});
 if(!res.ok){const err=new Error('Supabase '+res.status);err.status=res.status;throw err}
 return res.status===204?null:JSON.parse((await res.text())||'null');
}
async function login(email,password){
 const t=await call('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
 if(box.owner&&box.owner!==t.user.id)throw Error('Cet appareil contient le carnet d’un autre compte.');
 keepToken(t);box.owner=t.user.id;persist();await sync();
}
async function access(){if(token.expires_at*1000<Date.now()+60000)keepToken(await call('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:token.refresh_token})}));return token.access_token}
async function sync(resolve=false){
 if(!configured||!token||!navigator.onLine||busy||(conflict&&!resolve))return;
 busy=true;cloudError='';statusText();
 try{
 const jwt=await access(),path='/rest/v1/repere_carnets',filter='?owner_id=eq.'+token.user.id;
 const [remote]=await call(path+filter+'&select=carnet,revision',{},jwt);
 if(remote&&(resolve||remote.revision!==box.rev)){
  if(box.dirty&&!resolve){conflict=true;return}
  box.state=remote.carnet;state=box.state;box.rev=remote.revision;box.dirty=false;conflict=false;synced();render();return;
 }
 if(!box.dirty&&remote){synced();return}
 const snapshot=JSON.stringify(state),rev=box.rev+1;
 const data={carnet:JSON.parse(snapshot),revision:rev};
 if(!remote)data.owner_id=token.user.id;
 const result=await call(remote?path+filter+'&revision=eq.'+box.rev:path,{method:remote?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(data)},jwt);
 if(!result?.length){conflict=true;return}
 box.rev=rev;box.dirty=JSON.stringify(state)!==snapshot;synced();if(box.dirty)queueSync();
 }catch(e){if(e.status===409)conflict=true;else cloudError=e.message}finally{busy=false;statusText();if(page==='settings')render()}
}
window.addEventListener('online',()=>sync());window.addEventListener('offline',()=>statusText());
