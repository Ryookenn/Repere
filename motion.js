// Transient presentation state; workout data and cloud revisions carry no animation flags.
let finishNotice='',movedNotice='',setNotice=false,lastRestEnd=0;
function finishGraphic(){
 const bars=Array.from({length:4},(_,i)=>{
  const x=17+19*i;
  const shape=bend=>'M'+x+' 4h12 Q'+(x+9+bend)+' 36 '+(x+6)+' 68h-12 Q'+(x-3+bend)+' 36 '+x+' 4Z';
  const morph=reduceMotion()?'':'<animate attributeName="d" begin="'+(.65+i*.095)+'s" dur=".45s" values="'+[0,10,-3,1,0].map(shape).join(';')+'"/>';
  return '<path class="upright" style="--i:'+i+'" d="'+shape(0)+'">'+morph+'</path>';
 }).join('');
 return '<div class="finish-mark"><svg viewBox="0 0 100 72" aria-hidden="true">'+bars+'<path class="slash" d="M1 49l98-37v12L1 61z"/></svg></div>';
}
function recordMessage(hist,index,mode){
 if(index<1)return '';
 const past=hist.slice(0,index).flatMap(h=>h.rows),rows=hist[index].rows;
 if(!past.length||!rows.length)return '';
 const low=mode==='aide';
 if(mode!=='pdc'){
  const extreme=rs=>rs.reduce((v,r)=>low?Math.min(v,+r.kg):Math.max(v,+r.kg),low?Infinity:-Infinity);
  const value=extreme(rows),old=extreme(past);
  if(low?value<old:value>old)return (low?'Assistance minimale':mode==='lest'?'Lest maximal':'Charge maximale')+' · '+fmt(value)+' kg';
 }
 for(const r of rows){
  const same=past.filter(p=>mode==='pdc'||+p.kg===+r.kg);
  if(!same.length)continue;
  const current=rows.filter(p=>mode==='pdc'||+p.kg===+r.kg).reduce((v,p)=>Math.max(v,+p.reps),0);
  if(same.every(p=>current>+p.reps))return current+' répétitions'+(mode==='pdc'?' au poids du corps':' à '+fmt(r.kg)+' kg')+' (+'+(current-Math.max(...same.map(p=>+p.reps)))+' rép.)';
 }
 return '';
}

let celebrationTimer;
function showCelebration(kind,record){
 const labels={finish:'Séance terminée',set:setNotice||'Série validée',move:'Séance déplacée',rest:'Repos terminé'};
 const durations={finish:record?3400:2050,set:650,move:1000,rest:950};
 const layer=document.querySelector('.encore')||document.createElement('div');
 clearTimeout(celebrationTimer);
 layer.remove();
 layer.className='encore encore-'+kind;
 const card=document.createElement('div');
 card.className='encore-card';
 card.setAttribute('role','status');
 if(kind==='finish')card.innerHTML=finishGraphic().replace('<strong>Séance terminée</strong>','');
 else {
  const paths={set:'M5 13l5 5L21 6',move:'M4 12h16m-7-7 7 7-7 7',rest:'M9 3h6m-3 5v5l3 2 M20 14a8 8 0 1 1-16 0 8 8 0 1 1 16 0'};
  card.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="'+paths[kind]+'"/></svg>';
 }
 const title=document.createElement('strong');
 title.textContent=labels[kind];
 if(kind==='rest'){
  const s=session(),item=s?.items[position(s)],next=item?.sets.findIndex(r=>!r.ok);
  if(next>=0)title.textContent='Repos terminé · Série '+(next+1);
 }
 card.append(title);
 if(kind==='set'){
  const s=session(),item=s.items[position(s)];
  const next=item.sets.findIndex(row=>!row.ok);
  const direction=document.createElement('small');
  direction.textContent=next<0?'Toutes les séries sont validées':'À suivre · Série '+(next+1);
  card.append(direction);
 }
 if(record){
  const detail=document.createElement('small');
  detail.textContent=record.querySelector('h3').textContent+' · '+record.querySelector('.record-badge').textContent;
  card.classList.add('has-record');card.append(detail);
 }
 layer.replaceChildren(card);
 document.body.append(layer);
 layer.onclick=()=>{clearTimeout(celebrationTimer);layer.remove()};
 celebrationTimer=setTimeout(()=>layer.remove(),durations[kind]);
}

const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let moveFrom;
function animateMove(){
 const dot=document.querySelector('.moved-mark');
 if(!dot||reduceMotion())return;
 const dest=dot.getBoundingClientRect();
 const dx=moveFrom?moveFrom.left-dest.left:-28;
 const dy=moveFrom?moveFrom.top-dest.top:0;
 dot.animate([{transform:'translate('+dx+'px,'+dy+'px) scale(1.4)'},{transform:'none'}],{duration:540,easing:'cubic-bezier(.2,.7,.2,1)'});
 moveFrom=null;
}
document.addEventListener('click',event=>{
 const sheet=event.target.closest('#workSheet');
 if(sheet&&(event.target===sheet||event.target.closest('button')))sheet.close();
},true);
function unitLabel(){return metric==='reps'||metric==='total'?' rép.':' kg'}
document.addEventListener('pointerdown',event=>{
 const svg=event.target.closest('.scrub');
 if(!svg)return;
 const nodes=[...svg.querySelectorAll('[data-readout]')];
 const read=ev=>{
  const point=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(svg.getScreenCTM().inverse());
  const dist=n=>Math.abs(+n.firstElementChild.getAttribute('cx')-point.x);
  const closest=nodes.reduce((a,b)=>dist(b)<dist(a)?b:a);
  nodes.forEach(n=>n.lastElementChild.setAttribute('r',n===closest?6:3));
  svg.previousElementSibling.textContent=closest.dataset.readout;
  pointId=closest.dataset.id;
 };
 svg.setPointerCapture(event.pointerId);read(event);
 svg.onpointermove=read;
 svg.onlostpointercapture=()=>{svg.onpointermove=null;svg.onlostpointercapture=null;render()};
});

// Keep the input mounted while repeating, so pointer capture survives each increment.
document.addEventListener('pointerdown',event=>{
 const key=event.target.closest('.steps button');
 if(!key||event.button!==0||!event.isPrimary||!key.dataset.id.endsWith(',kg'))return;
 const input=key.closest('.measure').querySelector('input');
 const [i]=key.dataset.id.split(',').map(Number),s=session();
 const delta=loadStep(s,s.items[i])*(key.dataset.act==='plus'?1:-1);
 let repeated=false,loop;
 const increment=()=>{
  repeated=true;
  input.value=Math.max(0,Number((Number(input.value||0)+delta).toFixed(2)));
  input.dispatchEvent(new Event('input',{bubbles:true}));
 };
 const timer=setTimeout(()=>{increment();loop=setInterval(increment,110)},420);
 key.setPointerCapture(event.pointerId);
 function stop(){
  clearTimeout(timer);clearInterval(loop);
  key.removeEventListener('lostpointercapture',stop);
  key.removeEventListener('pointerup',stop);
  key.removeEventListener('pointercancel',stop);
  window.removeEventListener('blur',stop);
  if(repeated){
   const suppress=e=>{e.stopPropagation();e.preventDefault()};
   key.addEventListener('click',suppress,{once:true});
   setTimeout(()=>key.removeEventListener('click',suppress),300);
  }
 }
 key.addEventListener('pointerup',stop);key.addEventListener('pointercancel',stop);
 key.addEventListener('lostpointercapture',stop);window.addEventListener('blur',stop);
});
