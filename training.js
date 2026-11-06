// Suggested values are virtual until edited or validated. They never enter statistics.
let undoSet=null,returnFromProgress=null;
function recommendation(s,x,j){
 const rows=previous(s,x)?.rows||[];
 return rows[j]||x.sets.slice(0,j).filter(r=>r.ok).at(-1)||emptySet();
}
function displayedSet(s,x,j){
 const row=x.sets[j];
 if(!s.done&&!row.ok&&!row.edited&&row.kg===''&&row.reps===''){
  const ref=recommendation(s,x,j);
  return {kg:ref.kg,reps:ref.reps,ok:false};
 }
 return row;
}
function materialize(s,x,j){
 const row=displayedSet(s,x,j);
 Object.assign(x.sets[j],row,{edited:true});
 return x.sets[j];
}
function targetSets(s,x){return previous(s,x)?.rows.length||3}
function loadStep(s,x){return Number(exercise(x.ex).steps?.[s.gym])||0.5}
function checkLabel(r,mode){return valid(r,mode)?'Valider · '+setText(r,mode):'Valider la série'}
function validateRow(s,x,i,j){
 const was=x.sets[j].ok, value=displayedSet(s,x,j);
 if(!valid(value,x.mode)){alert(x.mode==='pdc'?'Indique ton nombre de répétitions.':'Indique ta charge et ton nombre de répétitions.');return false}
 const before=JSON.stringify(x.sets),priorTimer=localStorage.getItem('repere.timer');
 const row=materialize(s,x,j);row.ok=!was;
 if(was){x.finished=false;undoSet=null;return true}
 if(!s.done&&!x.finished&&!x.sets.some(r=>!r.ok)&&x.sets.length<targetSets(s,x))x.sets.push(emptySet());
 const seconds=exercise(x.ex).rest??state.rest;
 if(!s.done&&s.date===today()&&seconds)localStorage.setItem('repere.timer',Date.now()+seconds*1000);
 undoSet={session:s.id,item:x.id,before,after:JSON.stringify(x.sets),priorTimer,expires:Date.now()+10000};
 tick();return true;
}
function restoreValidation(s,x){
 if(!undoSet||undoSet.expires<Date.now()||s.id!==undoSet.session||x.id!==undoSet.item||JSON.stringify(x.sets)!==undoSet.after)return;
 x.sets=JSON.parse(undoSet.before);
 if(undoSet.priorTimer)localStorage.setItem('repere.timer',undoSet.priorTimer);
 else localStorage.removeItem('repere.timer');
 undoSet=null;tick();changed();render();
}
function finishExercise(s,x,i){
 if(x.sets.some(r=>!r.ok&&(r.reps!==''||r.kg!==''))&&!confirm('Terminer cet exercice en conservant uniquement les séries validées ?'))return;
 x.sets=x.sets.filter(r=>r.ok);x.finished=true;undoSet=null;changed();
 const next=s.items.findIndex((item,k)=>k>i&&!item.finished);
 const index=next>=0?next:s.items.findIndex(item=>!item.finished);
 if(index>=0)focusItem(s,index);
 else{page='overview';render();scrollTo(0,0)}
}
function openProgress(s,x){
 returnFromProgress={session:s.id,gym:s.gym,item:x.id};
 gym=s.gym;statEx=x.ex;mode=x.mode;statsTab='progress';metric='reps';
 const j=x.sets.findIndex(r=>!r.ok);
 const ref=j>=0?displayedSet(s,x,j):x.sets.at(-1);
 target=Number(ref?.kg||previous(s,x)?.rows.at(-1)?.kg||0);pair=[];
 page='stats';render();scrollTo(0,0);
}
function onboarding(){return '<section class="cover"><small>One More</small><h1>Retrouve ton carnet</h1><p>Connecte ton compte pour sauvegarder tes séances et retrouver tes salles.</p>'+button('login','Me connecter','','primary')+'</section>'+button('local','Continuer sur cet appareil','','link')}
function lastSyncLabel(){return box.lastSync?new Date(box.lastSync).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'medium'}):'En attente de la première vérification'}
