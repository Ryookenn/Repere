// Keep the place in each workout on this device, including after closing the app.
function position(s) {
 const saved=localStorage.getItem('onemore.exercise.'+s.id);
 const index=s.items.findIndex(item=>item.id===saved);
 return index<0?0:index;
}
function focusItem(s,i){
 if(s.items[i]&&!s.done&&!s.items[i].started){s.items[i].started=true;changed()}
 if(s.items[i])localStorage.setItem('onemore.exercise.'+s.id,s.items[i].id);
 page='session';render();scrollTo(0,0);
}
function listRow(x,i,action="homeItem",sessionDone=false){
 const e=exercise(x.ex),count=(x.sets||[]).filter(r=>r.ok).length;
 const inner='<span class="thumbnail">'+exerciseArt(e.id)+'</span><span class="line-copy"><b>'+esc(e.name)+'</b><small>'+esc(e.muscle)+' · '+(sessionDone||x.finished?'Terminé':x.started||count||x.sets?.some(r=>r.edited)?'En cours':'À faire')+(count?' · '+count+' série'+(count>1?'s':'')+' validée'+(count>1?'s':''):'')+'</small></span>';
 return button(action,inner+'<span aria-hidden="true">›</span>',i,'exercise-row');
}
function dashboard(){
 const planned=(state.agenda||[]).filter(entry=>entry.date===today());
 const drafts=state.sessions.filter(entry=>!entry.done).sort((a,b)=>b.created-a.created);
 const rows=(entries,action,label,style)=>entries.map(entry=>
  '<article class="home-event"><div><strong>'+esc(programs[entry.plan])+'</strong><small>'+esc(gymName(entry.gym))+'</small></div>'+button(action,label,entry.id,style)+'</article>').join('');
 const startAction=state.gyms.length?'pickProgram':'gym';
 const startLabel=state.gyms.length?'Lancer une séance':'Ajouter ma première salle';
 return '<section class="home-launch"><small>'+atNoon(today()).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})+'</small><h1>Ma séance</h1>'+
 (planned.length?'<h2>Au programme aujourd’hui</h2>'+rows(planned,'launchPlan','Commencer','primary'):'')+
 button(startAction,startLabel,'',planned.length?'wide':'wide primary')+'</section>'+
 (drafts.length?'<section><h2>En cours</h2>'+rows(drafts,'open','Reprendre','')+'</section>':'');
}
function programPicker(){
 return button('nav','‹ Ma séance','home','link')+'<h1>Choisir ma séance</h1>'+gymLine()+
 '<div class="program-list">'+programs.map((name,i)=>button('start','<span><b>'+esc(name)+'</b><small>'+state.plans[i].length+' exercices</small></span><span aria-hidden="true">›</span>',i,'program-choice')).join('')+'</div>';
}
function overview(s){
 const total=s.items.reduce((n,x)=>n+x.sets.filter(r=>r.ok).length,0);
 return '<div class="tag">'+esc(state.gyms.find(g=>g.id===s.gym)?.name)+'</div><h1>'+programs[s.plan]+'</h1><p class="sub">'+dateLabel(s.date)+' · '+total+' série'+(total>1?'s':'')+' validée'+(total>1?'s':'')+'</p><div class="exercise-list">'+s.items.map((x,i)=>listRow(x,i,"focus",s.done)).join('')+'</div>'+button('addItem','+ Ajouter un exercice')+'<details><summary>Modifier la date</summary>'+field('Date','<input type="date" data-key="date" value="'+s.date+'" max="'+today()+'">')+'</details>'+button('finish',s.done?'Enregistrer les corrections':'Terminer la séance','','primary wide')+(!s.done?button('cancelDraft','Annuler cette séance',s.id,'link'):'');
}
function focusedWorkout(s){
 if(!s.items.length)return overview(s);
 const i=position(s),x=s.items[i],e=exercise(x.ex),prev=previous(s,x);
 const completed=x.sets.filter(r=>r.ok).length;
 const pending=x.sets.findIndex(r=>!r.ok);
 const older=x.sets.map((r,j)=>j===pending?'':r.ok?seriesEditor(x,e,i,j):'<details><summary>Série '+(j+1)+' · à valider</summary>'+seriesEditor(x,e,i,j)+'</details>').join('');
 const reference=pending>=0?prev?.rows[pending]:prev?.rows.at(-1);
 const expected=targetSets(s,x);
 const controls=button('up','Monter',i)+button('down','Descendre',i)+button('replace','Remplacer',i)+button('skip','Retirer de la séance',i)+button('restEx','Temps de repos',i)+(x.mode==='pdc'?'':button('stepSize','Pas de charge · '+fmt(loadStep(s,x))+' kg',i));
 const heading='<div class="work-top">'+button('overview','‹ Ma séance','','link')+'<small>'+esc(state.gyms.find(g=>g.id===s.gym)?.name)+'</small></div><div class="progress-track"><i style="width:'+100*(i+1)/s.items.length+'%"></i></div><div class="exercise-heading"><div><div class="tag">Exercice '+(i+1)+' sur '+s.items.length+' · '+esc(e.muscle)+'</div><h1>'+esc(e.name)+'</h1></div><span class="portrait">'+exerciseArt(x.ex)+'</span></div>';
 const variant=e.kind==='pdc'?field('Variante',select('mode:'+i,['pdc','lest','aide'].map(k=>option(k,modes[k],x.mode)).join(''))):'';
 const history='<div class="reference">'+(reference?'<small>Dernière visite · '+dateLabel(prev.s.date)+'</small><b>'+setText(reference,x.mode)+'</b>':'')+button('chart','Voir ma progression →',i,'link')+'</div>';
 const undo=undoSet?.session===s.id&&undoSet.item===x.id&&undoSet.expires>Date.now()&&undoSet.after===JSON.stringify(x.sets)?button('undo','Dernière série · '+undoSet.label+' · Annuler',i,'link'):'';
 const editor=pending>=0?'<div class="current-set"><small>Série '+(pending+1)+' sur '+Math.max(expected,x.sets.length)+'</small>'+seriesEditor(x,e,i,pending)+'</div>':'';
 const finish=button('endExercise',pending>=0?'Terminer cet exercice':i<s.items.length-1?'Terminer · Exercice suivant →':'Terminer cet exercice →',i,pending>=0?'next wide':'dock primary wide');
 return heading+variant+history+editor+undo+(!s.done?finish:button('overview','Retour au bilan','','next wide'))+(pending<0?button('addSet','+ Ajouter une série',i,'link'):'')+(older?'<details class="log"><summary>Séries de cet exercice ('+(x.sets.length-(pending>=0?1:0))+')</summary>'+older+'</details>':'')+button('workOptions','Options de l’exercice',i,'wide')+'<dialog id="workSheet"><h2>'+esc(e.name)+'</h2><div class="sheet-actions">'+controls+(!s.done?button('cancelDraft','Annuler la séance',s.id):'')+button('closeSheet','Fermer')+'</div></dialog>';
}
