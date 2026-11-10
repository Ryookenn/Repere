let movingPlan='',homeGymExplicit=false;

function homeChoice(){
 const applies=s=>!homeGymExplicit||s.gym===gym;
 const drafts=state.sessions.filter(s=>!s.done&&applies(s)).sort((a,b)=>b.created-a.created);
 const agenda=(state.agenda||[]).filter(s=>s.date===today()&&applies(s));
 const draft=drafts.find(s=>s.gym===gym)||drafts[0];
 const scheduled=agenda.find(s=>s.gym===gym)||agenda[0];
 return {draft,scheduled,drafts:drafts.filter(s=>s.id!==draft?.id)};
}
function launchScheduled(id,first=0){
 const s=state.agenda?.find(item=>item.id===id);
 if(!s||s.date>today())return;
 gym=s.gym;state.agenda=state.agenda.filter(item=>item.id!==id);
 start(s.plan,first);
}
function sessionReport(s){
 const celebrate=finishNotice===s.id;
 const gone=new Set(),lines=[];
 for(const x of s.items){
  const key=x.ex+'|'+x.mode;
  if(gone.has(key))continue;
  gone.add(key);
  const hist=performances(state,s.gym,x.ex,x.mode),index=hist.findIndex(entry=>entry.s.id===s.id);
  if(index<0)continue;
  const rows=hist[index].rows;
  const fixed=rows.every(r=>Number(r.kg)===Number(rows[0].kg));
  const series=(fixed||x.mode==='pdc')?(x.mode==='pdc'?'':fmt(rows[0].kg)+' kg · ')+rows.map(r=>r.reps).join(' / ')+' rép.':rows.map(r=>setText(r,x.mode)).join('　/　');
  const message=recordMessage(hist,index,x.mode);
  const badge=message?'<div class="record-badge'+(celebrate?' record-enter':'')+'"><strong>Nouveau record</strong> · '+message+'</div>':'';
  lines.push('<article class="report-row"><span class="thumbnail">'+exerciseArt(x.ex)+'</span><div><small>'+esc(exercise(x.ex).muscle)+(x.mode==='charge'?'':' · '+esc(modes[x.mode]))+'</small><h3>'+esc(exercise(x.ex).name)+'</h3><b>'+series+'</b>'+badge+progressBreakdown(hist[index-1],rows,x.mode)+'</div></article>');
 }
 return '<div class="work-top">'+button('reportJournal','‹ Journal','','link')+button('editReport','Modifier',s.id)+'</div>'+'<div class="tag">Bilan de progression</div><h1>'+programs[s.plan]+'</h1><p>'+dateLabel(s.date)+' · '+esc(gymName(s.gym))+'</p>'+lines.join('');
}
function pinMatches(p){return p.ex===statEx&&p.mode===mode&&p.gym===gym}
function pinToggle(){
 const pins=state.pins||[];
 state.pins=pins.some(pinMatches)?pins.filter(p=>!pinMatches(p)):[...pins,{ex:statEx,mode,gym}];
 changed();render();
}
function pinnedList(){
 const pins=(state.pins||[]).filter(p=>p.gym===gym&&exercise(p.ex));
 if(!pins.length)return '';
 return '<section><h2>Mes exercices épinglés</h2>'+pins.map(p=>button('exDetail','<span class="thumbnail">'+exerciseArt(p.ex)+'</span><span class="line-copy"><b>'+esc(exercise(p.ex).name)+'</b><small>'+esc(modes[p.mode])+' · '+esc(gymName(p.gym))+'</small></span>›',p.ex+'|'+p.mode,'exercise-row')).join('')+'</section>';
}
const statusIcon=s=>s.planned?'planned':s.done?'complete':'ongoing';
const statusName=s=>s.planned?'Planifiée':s.done?'Terminée':'En cours';

function progressBreakdown(previous,rows,mode){
 if(!previous)return '<p>Première référence dans cette salle pour cette variante.</p>';
 const before=previous.rows;
 const count=Math.max(before.length,rows.length);
 const lines=Array.from({length:count},(_,i)=>{
  const old=before[i],now=rows[i];
  const comparable=old&&now&&(mode==='pdc'||+old.kg===+now.kg);
  let change='Charge modifiée';
  if(!old)change='Ajoutée';
  else if(!now)change='En moins';
  else if(comparable)change=signed(now.reps-old.reps)+' rép.';
  const gain=comparable&&+now.reps>+old.reps;
  return '<tr><th scope="row">'+(i+1)+'</th><td>'+(old?setText(old,mode):'—')+'</td><td>'+(now?setText(now,mode):'—')+'</td><td class="'+(gain?'rep-gain':'')+'">'+change+'</td></tr>';
 }).join('');
 return '<div class="progress-recap"><strong>'+compareRows(before,rows,mode)+'</strong><small>Comparé au '+dateLabel(previous.s.date)+'</small><table><thead><tr><th>Série</th><th>Avant</th><th>Ce jour</th><th>Écart</th></tr></thead><tbody>'+lines+'</tbody></table></div>';
}
