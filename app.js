const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(v,label,sel)=>'<option value="'+esc(v)+'" '+(String(v)===String(sel)?'selected':'')+'>'+esc(label)+'</option>';
const tactileActions=new Set(['check','finish','endExercise']);
const nativeSwitch='switch' in document.createElement('input') && navigator.maxTouchPoints>0 && !navigator.vibrate;
function actionText(control,text){
 if(!control)return;
 if(control.matches('.tap-switch')){
  control.previousElementSibling.textContent=text;
  control.setAttribute('aria-label',text);
 }else control.textContent=text;
}
const button=(a,label,id='',cls='')=>nativeSwitch&&tactileActions.has(a)?
 '<span class="touch-control '+cls+'"><span>'+label+'</span><input role="button" class="tap-switch" aria-label="'+esc(label)+'" type="checkbox" switch data-act="'+a+'" data-id="'+esc(id)+'"></span>':'<button type="button" class="'+cls+'" data-act="'+a+'" data-id="'+esc(id)+'">'+label+'</button>';
const field=(label,html)=>'<label>'+label+html+'</label>';
const select=(key,html)=>'<select data-key="'+key+'">'+html+'</select>';
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1});
const dateLabel=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
const exercise=id=>state.ex.find(e=>e.id===id);
const modes={charge:'Charge',pdc:'Poids du corps',lest:'Lest',aide:'Assistance'};
const kinds=['machine','haltère','barre','pdc'];
const gyms=()=>state.gyms.map(g=>option(g.id,g.name,gym)).join('');
const exOptions=(id)=>state.ex.map(e=>option(e.id,e.name,id)).join('');
let page='home',gym=localStorage.getItem('repere.gym'),active='',plan=0,statEx='0',mode='pdc',metric='reps',target=0,pair=[],statsTab='progress',dialogSubmit;
const navs=[['home','','Séance'],['stats','↗','Progrès'],['history','◷','Journal']];
function statusText(){const el=$('#status');el.textContent=conflict?'Conflit à résoudre':busy?'Synchronisation…':!navigator.onLine?'Hors ligne':cloudError?'Sync à vérifier':!token?'Sur cet appareil':box.dirty?'En attente':'Synchronisé'}
function modal(title,fields,fn,submit='Enregistrer'){const d=$('#form').closest('dialog');if(d.open)d.close();$('#form').innerHTML='<h2>'+esc(title)+'</h2>'+fields+'<div class="row">'+button('cancel','Annuler')+'<button class="primary">'+submit+'</button></div>';dialogSubmit=fn;d.showModal()}
$('#form').onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target));$('#form').closest('dialog').close();Promise.resolve(dialogSubmit(values)).catch(e=>alert(e.message))};
const nameInput=(name='name')=>'<input name="'+name+'" maxlength="80" required pattern=".*[^ ].*" autocomplete="off">';
function nextPlan(){const last=state.sessions.filter(s=>s.done).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)[0];return last?(last.plan+1)%programs.length:0}
const gymLine=()=>field('Salle active',select('gym',gyms()));
function newItem(id){return {id:uid(),ex:id,mode:baseMode(exercise(id)),sets:[emptySet()]}}
function start(idx,first=0){if(!state.gyms.length)return;const s={id:uid(),gym,plan:idx,date:today(),created:Date.now(),done:false,items:state.plans[idx].map(newItem)};state.sessions.push(s);active=s.id;page='session';if(s.items[first]){s.items[first].started=true;localStorage.setItem('onemore.exercise.'+s.id,s.items[first].id)}changed();render();scrollTo(0,0)}
const session=()=>state.sessions.find(s=>s.id===active);
function setText(r,m){return (m==='pdc'?'':fmt(r.kg)+' kg × ')+r.reps+(m==='pdc'?' rép.':'')}
function previous(s,x){return performances(state,s.gym,x.ex,x.mode).filter(p=>p.s.id!==s.id&&(p.s.date<s.date||(p.s.date===s.date&&p.s.created<s.created))).at(-1)}
function seriesEditor(x, e, i, j) {
 const r=displayedSet(session(),x,j), id=i+','+j;
 function control(key,title,disabled=false) {
  if(disabled) return '<div class="measure"><strong>Corps</strong><small>poids du corps</small></div>';
  const ref=id+','+key, isKg=key==='kg';
  const input='<input aria-label="'+title+' série '+(j+1)+'" type="number" inputmode="'+(isKg?'decimal':'numeric')+'" min="'+(isKg?0:1)+'" step="'+(isKg?'any':1)+'" data-input="'+ref+'" value="'+esc(r[key])+'">';
  return '<div class="measure">'+field(title,input)+'<div class="steps">'+button('minus','<span aria-label="Diminuer '+title+'">−</span>',ref)+button('plus','<span aria-label="Augmenter '+title+'">+</span>',ref)+'</div></div>';
 }
 const fields='<div class="measures">'+control('kg',e.kind==='haltère'?'kg par main':'kg',x.mode==='pdc')+control('reps','répétitions')+'</div>';
 const actions='<div class="series-actions">'+button('check',r.ok?'Décocher la série':checkLabel(r,x.mode),id,'primary')+button('removeSet','<span aria-label="Retirer cette série">×</span>',id,'remove')+'</div>';
 return r.ok?'<details class="completed"><summary>Série '+(j+1)+' <b>'+setText(r,x.mode)+'</b> ✓</summary>'+fields+actions+'</details>':'<div class="entry"><small>Série '+(j+1)+'</small>'+fields+actions+'</div>';
}
function plot(points){
 if(!points.length)return '<p class="sub">Aucune série ne correspond encore à ce filtre.</p>';
 const values=points.map(p=>p.v),lo=Math.min(...values),hi=Math.max(...values),dates=points.map(p=>Date.parse(p.d)),first=dates[0],last=dates.at(-1);
 const xy=points.map((p,i)=>[last===first?165:42+244*(dates[i]-first)/(last-first),hi===lo?68:110-87*(p.v-lo)/(hi-lo)]);
 return '<svg viewBox="0 0 320 147" role="img" aria-label="Évolution de '+fmt(values[0])+' à '+fmt(values.at(-1))+'"><g stroke="var(--line)"><path d="M40 23H291M40 68H291M40 110H291"/></g><text x="1" y="'+(hi===lo?70:25)+'">'+fmt(hi)+'</text>'+(hi===lo?'':'<text x="1" y="113">'+fmt(lo)+'</text>')+'<polyline fill="none" stroke="var(--red)" stroke-width="2" points="'+xy.map(p=>p.join(',')).join(' ')+'"/>'+xy.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="var(--red)"><title>'+dateLabel(points[i].d)+' · '+fmt(values[i])+'</title></circle>').join('')+'<text x="40" y="140">'+dateLabel(points[0].d)+'</text><text text-anchor="end" x="291" y="140">'+dateLabel(points.at(-1).d)+'</text></svg><details><summary>Valeurs par séance</summary>'+points.map(p=>'<p>'+dateLabel(p.d)+' · '+fmt(p.v)+'</p>').join('')+'</details>'
}
function settings(){return '<h1>Réglages</h1><section><h2>Apparence</h2>'+field('Thème de l’application',select('appearance',Object.entries(appearance.choices).map(([key,label])=>option(key,label,appearance.value)).join('')))+'</section><section><h2>Mes salles</h2>'+state.gyms.map(g=>'<p>'+esc(g.name)+'</p>').join('')+button('gym','+ Ajouter une salle')+'</section><details class="settings-group"><summary>Modifier mon programme</summary>'+select('plan',programs.map((n,i)=>option(i,n,plan)).join(''))+state.plans[plan].map((id,i)=>'<div class="row spread"><span>'+esc(exercise(id).name)+'</span><div>'+button('planUp','↑',i)+button('planDown','↓',i)+button('planRemove','−',i)+'</div></div>').join('')+button('planAdd','+ Exercice au programme')+' '+button('custom','Créer un exercice')+'</details><section><h2>Repos entre séries</h2>'+field('Durée en secondes · 0 pour désactiver','<input data-key="rest" type="number" min="0" max="3600" value="'+state.rest+'">')+'</section><section><h2>Synchronisation</h2><p>'+(!configured?'Mode local. Renseigne config.js pour activer Supabase.':token?'Compte · '+esc(token.user.email)+'<br>Dernière synchronisation réussie · '+esc(lastSyncLabel()):'Connecte ton compte Supabase pour sauvegarder ton carnet.')+'</p>'+(cloudError?'<p class="bad">'+esc(cloudError)+'</p>':'')+(conflict?'<p>Une autre version existe en ligne. Exporte ta copie locale avant de charger la version en ligne.</p>'+button('export','Exporter ma copie')+' '+button('resolve','Charger la version en ligne'):'')+(configured?button('login',token?'Renouveler la connexion':'Me connecter')+' '+(token?button('sync','Synchroniser'):''):'')+'</section>'}
function render(){
 if(!state.gyms.some(g=>g.id===gym))gym=state.gyms[0]?.id||'';
 if(['session','overview','report'].includes(page)&&!session())page='home';
 $('nav').innerHTML=navs.map(([id,icon,n])=>button('nav',navGlyph(id)+n,id,(page===id||(id==='history'&&page==='report')||(id==='home'&&['session','overview'].includes(page)))?'on':'')).join('');
 $('#app').innerHTML=page==='home'?(configured&&!token&&!localStorage.getItem('onemore.local')?onboarding():dashboard()):page==='pickProgram'?programPicker():page==='settings'?settings():page==='session'?focusedWorkout(session()):page==='report'?sessionReport(session()):page==='overview'?overview(session()):!gym?dashboard():page==='stats'?(returnFromProgress?button('backWorkout','‹ Revenir à mon exercice','','link'):'')+stats():history();statusText();updateRestCard();
 if(finishNotice)showCelebration('finish',$('#app .record-badge')?.parentElement);
 else if(movedNotice){animateMove();showCelebration('move')}
 else if(setNotice){
  showCelebration('set');
  const stage=document.querySelector('.set-stage');
  if(stage){const top=stage.getBoundingClientRect().top;if(top<48||top>innerHeight*.58)stage.scrollIntoView({block:'center',behavior:reduceMotion()?'instant':'smooth'})}
 }
 finishNotice='';movedNotice='';setNotice=false;
}
function askExercise(cb){modal('Choisir un exercice',field('Exercice','<select name="ex">'+exOptions('')+'</select>'),v=>{cb(v.ex);changed();render()})}
function swap(list,i,d){if(i+d>=0&&i+d<list.length)[list[i],list[i+d]]=[list[i+d],list[i]]}
function eraseOK(x){return !x.sets.some(r=>r.ok||r.kg!==''||r.reps!=='')||confirm('Effacer les valeurs saisies pour cet exercice ?')}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const a=b.dataset.act,id=b.dataset.id||'',[i,j]=id.split(',').map(Number),s=session(),x=s?.items[i];
 if(a==='pickProgram'){page='pickProgram';render();scrollTo(0,0);return}
 if(a==='cancel')return $('#form').closest('dialog').close();
 if(a==='settings'||a==='nav'){returnFromProgress=null;movingPlan='';if(id==='stats'){detail=false;statsTab='progress'}page=a==='settings'?'settings':id;render();scrollTo(0,0);return}
 if(a==='gym')return modal('Ajouter une salle',field('Nom de la salle',nameInput()),v=>{const name=v.name.trim();if(!name||state.gyms.some(g=>g.name.toLowerCase()===name.toLowerCase()))return alert('Choisis un nom de salle distinct.');gym=uid();state.gyms.push({id:gym,name});localStorage.setItem('repere.gym',gym);changed();render()});
 if(a==='custom')return modal('Créer un exercice',field('Nom',nameInput())+field('Groupe musculaire principal',nameInput('muscle'))+field('Type','<select name="kind">'+kinds.map(k=>option(k,k==='pdc'?'Poids du corps':k,'machine')).join('')+'</select>'),v=>{state.ex.push({id:uid(),name:v.name.trim(),muscle:v.muscle.trim(),kind:v.kind});changed();render()});
 if(a==='start')return start(+id);
 if(a==='retro')return chooseSession('Saisir une séance',journalDay,v=>{gym=v.gym;start(v.plan);session().date=v.date;changed();render()},true);
 if(a==='schedule')return chooseSession('Planifier le '+dateLabel(journalDay),journalDay,v=>{state.agenda??=[];state.agenda.push({...v,planned:true});changed();render()});
 if(a==='unplan'){const entry=state.agenda?.find(t=>t.id===id);if(entry&&confirm('Annuler '+programs[entry.plan]+' du '+dateLabel(entry.date)+' à '+gymName(entry.gym)+' ?')){state.agenda=state.agenda.filter(t=>t.id!==id);changed();render()}return}
 if(a==='launchPlan')return launchScheduled(id);
 if(a==='editReport'&&s?.done){page='overview';render();scrollTo(0,0);return}
 if(a==='reportJournal'&&s){journalDay=s.date;journalGym=s.gym;page='history';render();scrollTo(0,0);return}
 if(a==='pin')return pinToggle();
 if(a==='workOptions'){document.querySelector('#workSheet').showModal();return}
 if(a==='closeSheet')return;
 if(a==='movePlan'){movingPlan=id;render();scrollTo(0,0);return}
 if(a==='stopMove'){movingPlan='';render();return}
 if(a==='day'&&movingPlan){
  const entry=state.agenda?.find(t=>t.id===movingPlan);
  if(entry){if(entry.date!==id){movedNotice=entry.id;moveFrom=document.querySelector('.day[data-id="'+entry.date+'"] span i')?.getBoundingClientRect()}entry.date=id;changed()}movingPlan='';journalDay=id;render();return
 }
 if(a==='cancelDraft')return cancelDraft(state.sessions.find(t=>t.id===id));
 if(a==='month'||a==='day'){journalDay=a==='month'?monthShift(journalDay,+id):id;render();return}
 if(a==='summary'){detail=false;render();return}
 if(a==='exDetail'){enterDetail(...id.split('|'));render();scrollTo(0,0);return}
 if(a==='point'){pointId=id;render();return}
 if(a==='journalPoint'){const event=state.sessions.find(t=>t.id===id);if(event){journalDay=event.date;journalGym=event.gym;page='history';render();scrollTo(0,0)}return}
 if(a==='local'){localStorage.setItem('onemore.local','1');render();return}
 if(a==='homeItem'){
  const {draft,scheduled}=homeChoice();
  if(draft){active=draft.id;gym=draft.gym}else if(scheduled)launchScheduled(scheduled.id,i);else start(nextPlan(),i);
  return focusItem(session(),i);
 }
 if(a==='endExercise')return finishExercise(s,x,i);
 if(a==='undo')return restoreValidation(s,x);
 if(a==='chart')return openProgress(s,x);
 if(a==='backWorkout'){
  const back=returnFromProgress;returnFromProgress=null;active=back.session;gym=back.gym;
  return focusItem(session(),Math.max(0,session().items.findIndex(item=>item.id===back.item)));
 }
 if(a==='stepSize')return modal('Pas de charge dans cette salle',field('Incrément en kg','<input name="step" type="number" min="0.01" max="100" step="0.01" required value="'+loadStep(s,x)+'">'),v=>{
  const e=exercise(x.ex);e.steps??={};e.steps[s.gym]=+v.step;changed();render()
 });
 if(a==='focus')return focusItem(s,i);
 if(a==='overview'){page='overview';render();scrollTo(0,0);return}
 if(a==='nextItem'){if(i+1<s.items.length)return focusItem(s,i+1);page='overview';render();scrollTo(0,0);return}
 if(a==='open'){active=id;if(session())gym=session().gym;page=session()?.done?'report':'session';render();scrollTo(0,0);return}
 if(a==='tab'){statsTab=id;render();return}
 if(a==='login')return modal('Connexion',field('E-mail','<input type="email" name="email" required autocomplete="username">')+field('Mot de passe','<input type="password" name="password" required autocomplete="current-password">'),async v=>{await login(v.email,v.password);render()},'Me connecter');
 if(a==='sync')return sync();
 if(a==='resolve'){if(confirm('Remplacer le carnet local par la version Supabase ?'))sync(true);return}
 if(a==='export'){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));link.download='one-more-carnet.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);return}
 if(a==='jumpSheet'){document.querySelector('#jumpSheet').showModal();return}
 if(a==='closeJump'){document.querySelector('#jumpSheet').close();return}
 if(a==='extraRest'){const end=Number(localStorage.getItem('repere.timer'));if(end>Date.now())localStorage.setItem('repere.timer',end+15000);tick();return}
 if(a==='fixSet')return correctSet(s,x,j);
 if(a==='stop'){localStorage.removeItem('repere.timer');tick();return}
 if(a==='planAdd')return askExercise(ex=>state.plans[plan].push(ex));
 if(a==='addItem')return askExercise(ex=>s.items.push(newItem(ex)));
 if(a==='replace'){if(eraseOK(x))askExercise(ex=>{s.items[i]=newItem(ex);localStorage.setItem('onemore.exercise.'+s.id,s.items[i].id)});return}
 if(a==='up'||a==='down')swap(s.items,i,a==='up'?-1:1);
 if(a==='planUp'||a==='planDown')swap(state.plans[plan],i,a==='planUp'?-1:1);
 if(a==='planRemove')state.plans[plan].splice(i,1);
 if(a==='skip'&&eraseOK(x)){s.items.splice(i,1);if(s.items.length)localStorage.setItem('onemore.exercise.'+s.id,s.items[Math.min(i,s.items.length-1)].id)}
 if(a==='restEx')return modal('Repos pour cet exercice',field('Durée en secondes · 0 pour désactiver','<input type="number" name="seconds" required min="0" max="3600" value="'+(exercise(x.ex).rest??state.rest)+'">'),v=>{exercise(x.ex).rest=+v.seconds;changed();render()});
 if(a==='addSet'){x.finished=false;const last=x.sets.at(-1);x.sets.push({...emptySet(),kg:last?.kg??'',reps:last?.reps??''})}
 if(a==='removeSet'&&(!x.sets[j].ok||confirm('Retirer cette série validée ?')))x.sets.splice(j,1);
 if(a==='copy'&&eraseOK(x))x.sets=previous(s,x).rows.map(r=>({...r,ok:false}));
 if(a==='plus'||a==='minus'){
 const key=id.split(',')[2],r=materialize(s,x,j),step=key==='reps'?1:loadStep(s,x);
 r[key]=Math.max(key==='reps'?1:0,Number((Number(r[key]||0)+(a==='plus'?step:-step)).toFixed(2)));r.ok=false;
 }
 if(a==='check'){if(!validateRow(s,x,i,j))return;if(setNotice)navigator.vibrate?.(18)}
 if(a==='finish'){
 const all=s.items.flatMap(x=>x.sets);
 if(!all.some(r=>r.ok))return alert('Valide au moins une série avec ✓.');
 if(all.some(r=>!r.ok&&(r.reps!==''||r.kg!==''))&&!confirm('Certaines valeurs sont saisies mais non validées. Terminer avec les séries cochées uniquement ?'))return;
 if(!s.done){finishNotice=s.id;navigator.vibrate?.([20,45,28])}
 s.items.forEach(x=>x.sets=x.sets.filter(r=>r.ok));s.items=s.items.filter(x=>x.sets.length);s.done=true;journalDay=s.date;journalGym=s.gym;page='report';localStorage.removeItem('repere.timer');tick();scrollTo(0,0)
 }
 changed();render();
 if((a==="plus"||a==="minus")&&!reduceMotion())document.querySelector('[data-input="'+id+'"]')?.animate([{opacity:.45,transform:"translateY(2px)"},{opacity:1,transform:"none"}],150)
});
document.addEventListener('input',e=>{const input=e.target;if(!input.dataset.input)return;const [i,j,k]=input.dataset.input.split(',');const x=session().items[i],r=materialize(session(),x,+j);r[k]=input.value;r.ok=false;const check=input.closest('.entry')?.querySelector('[data-act="check"]');actionText(check,checkLabel(r,x.mode));const panel=input.closest('.completed');if(panel){panel.querySelector('summary').textContent='Série '+(+j+1)+' · à valider';actionText(panel.querySelector('[data-act="check"]'),'Valider la série')}changed()});
document.addEventListener('change',e=>{
 const key=e.target.dataset.key,v=e.target.value;if(!key)return;
 if(key==='regularGym')regularGym=v;
 if(key==='period'){period=v;pointId=''}
 if(key==='journalGym')journalGym=v;
 if(key==='comparisonA')comparisonA=v;
 if(key==='comparisonB')comparisonB=v;
 if(key==='point')pointId=v;
 if(key==='browseEx'&&v)enterDetail(v,baseMode(exercise(v)));
 if(key==='detailMode')enterDetail(statEx,v);
 if(key==='loadChoice')target=Number(v);
 if(key==='detailMetric'){metric=v;target=metric==='load'?8:Number(performances(state,gym,statEx,mode).at(-1)?.rows.at(-1)?.kg||0);pointId=''}
 if(key==='appearance')appearance.set(v);
 if(key==='gym'){homeGymExplicit=true;gym=v;localStorage.setItem('repere.gym',gym);pair=[];detail=false}
 if(key==='plan')plan=+v;
 if(key==='rest'){if(v===''||!Number.isInteger(+v)||+v<0||+v>3600)return render();state.rest=+v;changed()}
 if(key==='date'){if(!v||v>today())return render();session().date=v;changed()}
 if(key.startsWith('mode:')){const x=session().items[+key.split(':')[1]];if(eraseOK(x)){x.mode=v;x.finished=false;x.sets=[emptySet()];changed()}}
 if(key==='statEx'||key==='statMode'){if(key==='statEx')statEx=v;mode=key==='statMode'?v:baseMode(exercise(statEx));metric=mode==='pdc'?'reps':'load';target=metric==='load'?8:0;pair=[]}
 if(key==='metric'){metric=v;target=metric==='load'?8:0}
 if(key==='target')target=Math.max(metric==='load'?1:0,+v||0);
 if(key==='A'||key==='B')pair[key==='A'?0:1]=v;
 render()
});
function tick(){syncRestAlert();const end=Number(localStorage.getItem('repere.timer'));const el=$('#clock');const undo=document.querySelector('[data-act="undo"]');if(undo&&(!undoSet||Date.now()>undoSet.expires))undo.hidden=true;const inlineRest=updateRestCard();el.hidden=end<=Date.now()||inlineRest;if(end){const left=Math.max(0,Math.ceil((end-Date.now())/1000));const pulse=!left&&lastRestEnd!==end;if(pulse){lastRestEnd=end;if(Date.now()-end<10000&&document.visibilityState==='visible'&&page==='session')showCelebration('rest')}el.innerHTML=(pulse?'<b class="rest-pulse">':'<b>')+(left?'Repos · '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0'):'Repos terminé')+'</b> '+button('stop','Fermer')}}
setInterval(tick,1000);tick();render();sync();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();sync()}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(console.error);
