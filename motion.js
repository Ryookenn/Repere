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
