// Keep the place in each workout on this device, including after closing the app.
function position(s) {
 const saved=localStorage.getItem('onemore.exercise.'+s.id);
 const index=s.items.findIndex(item=>item.id===saved);
 return index<0?0:index;
}
function focusItem(s,i){
 if(s.items[i])localStorage.setItem('onemore.exercise.'+s.id,s.items[i].id);
 page='session';render();scrollTo(0,0);
}
function listRow(x,i,interactive=false){
 const e=exercise(x.ex),count=(x.sets||[]).filter(r=>r.ok).length;
 const inner='<span class="thumbnail">'+exerciseArt(e.id)+'</span><span class="line-copy"><b>'+esc(e.name)+'</b><small>'+esc(e.muscle)+(count?' · '+count+' série'+(count>1?'s':'')+' validée'+(count>1?'s':''):'')+'</small></span>';
 return interactive?button('focus',inner+'<span aria-hidden="true">›</span>',i,'exercise-row'):'<div class="exercise-row">'+inner+'</div>';
}
function dashboard(){
 if(!state.gyms.length)return '<section class="cover"><div class="cover-art">'+exerciseArt('0')+'</div><small>One More</small><h1>Ma première séance</h1><p>Choisis ta salle pour y retrouver tes charges à chaque visite.</p>'+button('gym','Ajouter ma salle','','primary')+'</section>';
 const drafts=state.sessions.filter(s=>!s.done&&s.gym===gym).sort((a,b)=>b.created-a.created);
 const draft=drafts[0],idx=draft?draft.plan:nextPlan(),items=draft?draft.items:state.plans[idx].map(ex=>({ex}));
 const heroItem=items[draft?position(draft):0];
 const switcher='<details class="switcher"><summary>Choisir une autre séance</summary>'+programs.map((n,i)=>button('start',esc(n)+'　→',i,'choice')).join('')+'</details>';
 return gymLine()+'<section class="cover"><div class="cover-art">'+exerciseArt(heroItem?.ex)+'</div><small>'+(draft?'Séance en cours':'Prochaine séance')+'</small><h1>'+programs[idx]+'</h1><p>'+items.length+' exercices'+(draft?' · '+dateLabel(draft.date):'')+'</p>'+button(draft?'open':'start',draft?'Reprendre ma séance →':'Commencer ma séance →',draft?draft.id:idx,'primary')+'</section>'+switcher+(drafts.length>1?'<details><summary>Autres séances en cours</summary>'+drafts.slice(1).map(s=>button('open',programs[s.plan]+' · '+dateLabel(s.date),s.id,'choice')).join('')+'</details>':'')+'<h2 class="list-title">Au programme</h2><div class="exercise-list">'+items.map((x,i)=>listRow(x,i)).join('')+'</div>';
}
function overview(s){
 const total=s.items.reduce((n,x)=>n+x.sets.filter(r=>r.ok).length,0);
 return '<div class="tag">'+esc(state.gyms.find(g=>g.id===s.gym)?.name)+'</div><h1>'+programs[s.plan]+'</h1><p class="sub">'+dateLabel(s.date)+' · '+total+' série'+(total>1?'s':'')+' validée'+(total>1?'s':'')+'</p><div class="exercise-list">'+s.items.map((x,i)=>listRow(x,i,true)).join('')+'</div>'+button('addItem','+ Ajouter un exercice')+'<details><summary>Modifier la date</summary>'+field('Date','<input type="date" data-key="date" value="'+s.date+'" max="'+today()+'">')+'</details>'+button('finish',s.done?'Enregistrer les corrections':'Terminer la séance','','primary wide');
}
function focusedWorkout(s){
 if(!s.items.length)return overview(s);
 const i=position(s),x=s.items[i],e=exercise(x.ex),prev=previous(s,x);
 const completed=x.sets.filter(r=>r.ok).length;
 const pending=x.sets.findIndex(r=>!r.ok);
 const older=x.sets.map((r,j)=>j===pending?'':r.ok?seriesEditor(x,e,i,j):'<details><summary>Série '+(j+1)+' · à valider</summary>'+seriesEditor(x,e,i,j)+'</details>').join('');
 const nextLabel=i<s.items.length-1?'Exercice suivant →':'Voir le bilan →';
 const controls=button('up','Monter',i)+button('down','Descendre',i)+button('replace','Remplacer',i)+button('skip','Retirer de la séance',i)+button('restEx','Temps de repos',i);
 return '<div class="work-top">'+button('overview','‹ Ma séance','','link')+'<small>'+esc(state.gyms.find(g=>g.id===s.gym)?.name)+'</small></div><div class="progress-track"><i style="width:'+100*(i+1)/s.items.length+'%"></i></div><div class="exercise-heading"><div><div class="tag">Exercice '+(i+1)+' sur '+s.items.length+' · '+esc(e.muscle)+'</div><h1>'+esc(e.name)+'</h1></div><span class="portrait">'+exerciseArt(x.ex)+'</span></div>'+(e.kind==='pdc'?field('Variante',select('mode:'+i,['pdc','lest','aide'].map(k=>option(k,modes[k],x.mode)).join(''))):'')+(prev?'<div class="reference"><small>Dernière visite · '+dateLabel(prev.s.date)+'</small><b>'+prev.rows.map(r=>setText(r,x.mode)).join(' / ')+'</b>'+(!completed?button('copy','Reprendre les valeurs',i,'link'):'')+'</div>':'')+(pending>=0?seriesEditor(x,e,i,pending):'<div class="after-set"><small>'+completed+' série'+(completed>1?'s':'')+' validée'+(completed>1?'s':'')+'</small>'+button('addSet',completed?'Refaire une série':'Ajouter une série',i,'primary wide')+'</div>')+button('nextItem',nextLabel,i,'next wide')+(older?'<details class="log"><summary>Séries de cet exercice ('+(x.sets.length-(pending>=0?1:0))+')</summary>'+older+'</details>':'')+'<details class="options"><summary>Options de l’exercice</summary><div class="row">'+controls+'</div></details>';
}
