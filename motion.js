// Transient presentation state; workout data and cloud revisions carry no animation flags.
let finishNotice='',movedNotice='',setNotice=false,lastRestEnd=0;
function finishGraphic(){
 const strokes=['M17 4h12l-6 64H11z','M36 4h12l-6 64H30z','M55 4h12l-6 64H49z','M74 4h12l-6 64H68z','M1 49l98-37v12L1 61z'];
 return '<div class="finish-mark" role="status"><svg aria-hidden="true" viewBox="0 0 100 72">'+strokes.map((d,i)=>'<path style="--i:'+i+'" d="'+d+'"/>').join('')+'</svg><strong>Séance terminée</strong></div>';
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
  if(same.every(p=>current>+p.reps))return current+' répétitions'+(mode==='pdc'?' au poids du corps':' à '+fmt(r.kg)+' kg');
 }
 return '';
}

let celebrationTimer;
function showCelebration(kind,record){
 const labels={finish:'Séance terminée',set:'Série validée',move:'Séance déplacée',rest:'Repos terminé'};
 const durations={finish:record?2800:2000,set:700,move:1000,rest:950};
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
 card.append(title);
 if(record){
  const detail=document.createElement('small');
  detail.textContent=record.querySelector('h3').textContent+' · '+record.querySelector('.record-badge').textContent;
  card.append(detail);
 }
 layer.replaceChildren(card);
 document.body.append(layer);
 layer.onclick=()=>{clearTimeout(celebrationTimer);layer.remove()};
 celebrationTimer=setTimeout(()=>layer.remove(),durations[kind]);
}
