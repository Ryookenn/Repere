let journalDay=today(), journalGym='all';
const atNoon=day=>new Date(day+'T12:00:00');
const gymName=id=>state.gyms.find(g=>g.id===id)?.name||'Salle';
const gymFilter=(key,value)=>select(key,option('all','Toutes les salles',value)+state.gyms.map(g=>option(g.id,g.name,value)).join(''));
function monthShift(day,months){
 const d=atNoon(day),n=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);
 const end=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(end,n));return localDate(d);
}
function history(){
 const date=atNoon(journalDay),month=journalDay.slice(0,7),first=atNoon(month+'-01');
 const entries=[...state.sessions,...(state.agenda||[])].filter(s=>journalGym==='all'||s.gym===journalGym);
 const days=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
 let cells='<span></span>'.repeat((first.getDay()+6)%7);
 for(let n=1;n<=days;n++){
  const day=month+'-'+String(n).padStart(2,'0'), matches=entries.filter(s=>s.date===day);
  const markers=matches.map(s=>'<i class="p'+s.plan+' '+statusIcon(s)+'"></i>').join('');
  cells+='<button type="button" data-act="day" data-id="'+day+'" aria-pressed="'+(day===journalDay)+'" aria-label="'+dateLabel(day)+' · '+esc(matches.map(s=>programs[s.plan]+' '+statusName(s)).join(', '))+'" class="day '+(day===today()?'today ':'')+(day===journalDay?'selected':'')+'">'+n+'<span>'+markers+'</span></button>';
 }
 const selected=entries.filter(s=>s.date===journalDay);
 const agenda=selected.map(s=>{
  const planned=s.planned===true;
  const actions=planned?(s.date<=today()?button('launchPlan','Commencer',s.id,'primary'):'')+button('movePlan','Déplacer',s.id)+button('unplan','Retirer',s.id):button('open',s.done?'Voir la séance':'Reprendre',s.id);
  return '<article class="event p'+s.plan+'"><small>'+esc(gymName(s.gym))+' · '+(planned?'Planifiée':s.done?'Terminée':'En cours')+'</small><h3>'+programs[s.plan]+'</h3>'+actions+'</article>';
 }).join('');
 const moving=state.agenda?.find(t=>t.id===movingPlan);
 const prompt=moving?'<div class="move-hint"><b>Déplacer · '+programs[moving.plan]+'</b><p>Touche le nouveau jour dans le calendrier.</p>'+button('stopMove','Annuler')+'</div>':'';
 return '<h1>Journal</h1>'+prompt+field('Salles affichées',gymFilter('journalGym',journalGym))+'<section class="calendar"><div class="month-head">'+button('month','‹',-1)+'<h2>'+date.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})+'</h2>'+button('month','›',1)+'</div><div class="days">'+['L','M','M','J','V','S','D'].map(n=>'<small>'+n+'</small>').join('')+cells+'</div>'+button('day','Aujourd’hui',today(),'link')+'</section><div class="legend">'+programs.map((n,i)=>'<small><i class="p'+i+'"></i>'+n+'</small>').join('')+'</div><div class="legend states"><small><i class="planned"></i>Prévue</small><small><i class="ongoing"></i>En cours</small><small><i class="complete"></i>Terminée</small></div><section><h2>'+dateLabel(journalDay)+'</h2>'+ (agenda||'<p class="sub">Aucune séance ce jour.</p>')+(journalDay<=today()?button('retro','+ Saisir une séance'):'')+(journalDay>=today()?button('schedule','Planifier une séance','','primary'):'')+'</section>';
}
function chooseSession(title,day,fn,allowDate=false){
 modal(title,(allowDate?field('Date','<input type="date" name="date" required value="'+day+'" max="'+today()+'">'):'')+field('Salle','<select name="gym">'+state.gyms.map(g=>option(g.id,g.name,journalGym==='all'?gym:journalGym)).join('')+'</select>')+field('Programme','<select name="plan">'+programs.map((n,i)=>option(i,n,nextPlan())).join('')+'</select>'),v=>fn({id:uid(),date:v.date||day,gym:v.gym,plan:Number(v.plan)}));
}
function cancelDraft(s){
 if(!s||s.done)return;
 modal('Annuler cette séance ?', '<p>'+esc(programs[s.plan])+' · '+esc(gymName(s.gym))+' · '+dateLabel(s.date)+'</p><p>Le brouillon et ses séries seront supprimés du carnet.</p>',()=>{
  if(!state.sessions.some(t=>t.id===s.id&&!t.done))return;
  state.sessions=state.sessions.filter(t=>t.id!==s.id);
  localStorage.removeItem('onemore.exercise.'+s.id);
  if(localStorage.getItem('onemore.timerOwner')===s.id){localStorage.removeItem('repere.timer');localStorage.removeItem('onemore.timerOwner');tick()}
  if(undoSet?.session===s.id)undoSet=null;
  returnFromProgress=null;active='';page='home';changed();render();scrollTo(0,0);
 },'Supprimer la séance');
 const back=$('#form [data-act="cancel"]');if(back)back.textContent='Garder ma séance';
}
