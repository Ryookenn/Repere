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
  lines.push('<article class="report-row"><span class="thumbnail">'+exerciseArt(x.ex)+'</span><div><small>'+esc(exercise(x.ex).muscle)+(x.mode==='charge'?'':' · '+esc(modes[x.mode]))+'</small><h3>'+esc(exercise(x.ex).name)+'</h3><b>'+series+'</b>'+badge+'<p>'+compareRows(hist[index-1]?.rows,rows,x.mode)+'</p></div></article>');
 }
 return '<div class="work-top">'+button('reportJournal','‹ Journal','','link')+button('editReport','Modifier',s.id)+'</div>'+'<div class="tag">Bilan de séance</div><h1>'+programs[s.plan]+'</h1><p>'+dateLabel(s.date)+' · '+esc(gymName(s.gym))+'</p>'+lines.join('');
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
