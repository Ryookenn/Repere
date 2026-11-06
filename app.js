const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(v,label,sel)=>'<option value="'+esc(v)+'" '+(String(v)===String(sel)?'selected':'')+'>'+esc(label)+'</option>';
const button=(a,label,id='',cls='')=>'<button type="button" class="'+cls+'" data-act="'+a+'" data-id="'+esc(id)+'">'+label+'</button>';
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
function modal(title,fields,fn,submit='Enregistrer'){const d=$('dialog');if(d.open)d.close();$('#form').innerHTML='<h2>'+esc(title)+'</h2>'+fields+'<div class="row">'+button('cancel','Annuler')+'<button class="primary">'+submit+'</button></div>';dialogSubmit=fn;d.showModal()}
$('#form').onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.target));$('dialog').close();Promise.resolve(dialogSubmit(values)).catch(e=>alert(e.message))};
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
function history(){return '<h1>Journal</h1>'+gymLine()+button('retro','+ Saisir une ancienne séance','','primary')+state.sessions.filter(s=>s.gym===gym).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).map(s=>'<section><small>'+dateLabel(s.date)+' · '+(s.done?'Terminée':'En cours')+'</small><h2>'+programs[s.plan]+'</h2>'+button('open','Ouvrir',s.id)+'</section>').join('')}
function plot(points){
 if(!points.length)return '<p class="sub">Aucune série ne correspond encore à ce filtre.</p>';
 const values=points.map(p=>p.v),lo=Math.min(...values),hi=Math.max(...values),dates=points.map(p=>Date.parse(p.d)),first=dates[0],last=dates.at(-1);
 const xy=points.map((p,i)=>[last===first?165:42+244*(dates[i]-first)/(last-first),hi===lo?68:110-87*(p.v-lo)/(hi-lo)]);
 return '<svg viewBox="0 0 320 147" role="img" aria-label="Évolution de '+fmt(values[0])+' à '+fmt(values.at(-1))+'"><g stroke="var(--line)"><path d="M40 23H291M40 68H291M40 110H291"/></g><text x="1" y="'+(hi===lo?70:25)+'">'+fmt(hi)+'</text>'+(hi===lo?'':'<text x="1" y="113">'+fmt(lo)+'</text>')+'<polyline fill="none" stroke="var(--red)" stroke-width="2" points="'+xy.map(p=>p.join(',')).join(' ')+'"/>'+xy.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="var(--red)"><title>'+dateLabel(points[i].d)+' · '+fmt(values[i])+'</title></circle>').join('')+'<text x="40" y="140">'+dateLabel(points[0].d)+'</text><text text-anchor="end" x="291" y="140">'+dateLabel(points.at(-1).d)+'</text></svg><details><summary>Valeurs par séance</summary>'+points.map(p=>'<p>'+dateLabel(p.d)+' · '+fmt(p.v)+'</p>').join('')+'</details>'
}
function volume(){
 const weeks=[],now=new Date();now.setHours(12,0,0,0);now.setDate(now.getDate()-(now.getDay()+6)%7-49);
 for(let i=0;i<8;i++){weeks.push({d:localDate(now),v:0});now.setDate(now.getDate()+7)}
 const muscles={};for(const s of state.sessions.filter(s=>s.done&&s.gym===gym)){const w=weeks.filter(w=>w.d<=s.date).at(-1);if(!w)continue;w.v++;for(const x of s.items){const m=exercise(x.ex).muscle;muscles[m]=(muscles[m]||0)+x.sets.filter(r=>r.ok).length}}
 return '<section><div class="tag">8 dernières semaines · salle active</div><h2>Séances par semaine</h2>'+plot(weeks)+'</section><section><h2>Séries par groupe principal</h2>'+ (Object.entries(muscles).sort((a,b)=>b[1]-a[1]).map(([m,v])=>'<div class="row spread"><span>'+esc(m)+'</span><b>'+v+'</b></div><span class="bar"><i style="width:'+100*v/Math.max(1,...Object.values(muscles))+'%"></i></span>').join('')||'<p>Aucune série sur cette période.</p>')+'</section>'
}
function stats(){
 const tabs='<div class="tabs">'+[['progress','Courbes'],['compare','Comparer'],['volume','Régularité']].map(([v,n])=>button('tab',n,v,v===statsTab?'done':'')).join('')+'</div>';
 let out='<h1>Progrès</h1>'+gymLine()+tabs;if(statsTab==='volume')return out+volume();
 const ex=exercise(statEx),items=performances(state,gym,statEx,mode),rows=items.flatMap(p=>p.rows);
 out+='<div class="stats-picker"><span class="thumbnail">'+exerciseArt(statEx)+'</span>'+field('Exercice',select('statEx',exOptions(statEx)))+'</div>'+(ex.kind==='pdc'?field('Variante',select('statMode',['pdc','lest','aide'].map(k=>option(k,modes[k],mode)).join(''))):'');
 if(statsTab==='compare'){
 if(items.length<2)return out+'<section>Termine deux séances avec cet exercice dans cette salle pour comparer tes séries.</section>';
 const ids=items.map(p=>p.s.id);if(!ids.includes(pair[0])||!ids.includes(pair[1]))pair=ids.slice(-2);
 const [a,b]=pair.map(id=>items.find(p=>p.s.id===id));const opts=id=>items.map((p,i)=>option(p.s.id,dateLabel(p.s.date)+' · séance '+(i+1),id)).join('');
 return out+'<section>'+field('Séance A',select('A',opts(pair[0])))+field('Séance B',select('B',opts(pair[1])))+'<table><tr><th>Série</th><th>A</th><th>B</th></tr>'+Array.from({length:Math.max(a.rows.length,b.rows.length)},(_,i)=>'<tr><td>'+(i+1)+'</td>'+[a,b].map(p=>'<td>'+(p.rows[i]?setText(p.rows[i],mode):'—')+'</td>').join('')+'</tr>').join('')+'</table></section>'
 }
 const metrics={reps:'Répétitions à charge fixe',load:mode==='aide'?'Assistance minimale':'Charge pour un minimum de répétitions',rm:'1RM estimé'};
 const allowed=mode==='pdc'?['reps']:mode==='charge'?['load','reps','rm']:['load','reps'];
 if(!allowed.includes(metric))metric=allowed[0];
 const pts=items.map(p=>({d:p.s.date,v:best(p.rows,metric,target,mode)})).filter(p=>p.v!==null);
 const unit=metric==='reps'?' rép.':' kg',rm=best(rows,'rm',0,mode);
 const delta=pts.length>1?pts.at(-1).v-pts[0].v:null;
 const trend=delta===null?'':'<p class="sub">'+(delta>0?'+':'')+fmt(delta)+unit+' depuis le '+dateLabel(pts[0].d)+'</p>';
 return out+'<section>'+field('Indicateur',select('metric',allowed.map(k=>option(k,mode==='pdc'?'Répétitions au poids du corps':metrics[k],metric)).join('')))+(mode!=='pdc'&&metric!=='rm'?field(metric==='load'?'Minimum de répétitions':'Charge en kg','<input data-key="target" type="number" min="'+(metric==='load'?1:0)+'" step="'+(metric==='load'?1:'any')+'" value="'+target+'">'):'')+'<div class="metric">'+(pts.length?fmt(pts.at(-1).v)+unit:'—')+'</div>'+trend+plot(pts)+'</section><section><div class="tag">Records personnels · salle active</div><h2>'+esc(ex.name)+'</h2>'+(rows.length?'<p>Meilleure série en répétitions <b>'+setText(rows.reduce((a,b)=>+a.reps>=+b.reps?a:b),mode)+'</b></p>'+(mode==='pdc'?'':'<p>'+(mode==='aide'?'Assistance minimale':'Charge maximale')+' <b>'+fmt(best(rows,'load',1,mode))+' kg</b></p>'):'<p>Valide ta première série pour établir un record.</p>')+(mode==='charge'?'<p>Meilleur 1RM estimé <b>'+(rm===null?'—':fmt(rm)+' kg')+'</b></p><small>Epley · séries de 1 à 10 répétitions. Pour les haltères, valeur par main.</small>':'')+'</section>'
}
function settings(){return '<h1>Réglages</h1><section><h2>Apparence</h2>'+field('Thème de l’application',select('appearance',Object.entries(appearance.choices).map(([key,label])=>option(key,label,appearance.value)).join('')))+'</section><section><h2>Mes salles</h2>'+state.gyms.map(g=>'<p>'+esc(g.name)+'</p>').join('')+button('gym','+ Ajouter une salle')+'</section><details class="settings-group"><summary>Modifier mon programme</summary>'+select('plan',programs.map((n,i)=>option(i,n,plan)).join(''))+state.plans[plan].map((id,i)=>'<div class="row spread"><span>'+esc(exercise(id).name)+'</span><div>'+button('planUp','↑',i)+button('planDown','↓',i)+button('planRemove','−',i)+'</div></div>').join('')+button('planAdd','+ Exercice au programme')+' '+button('custom','Créer un exercice')+'</details><section><h2>Repos entre séries</h2>'+field('Durée en secondes · 0 pour désactiver','<input data-key="rest" type="number" min="0" max="3600" value="'+state.rest+'">')+'</section><section><h2>Synchronisation</h2><p>'+(!configured?'Mode local. Renseigne config.js pour activer Supabase.':token?'Compte · '+esc(token.user.email)+'<br>Dernière synchronisation réussie · '+esc(lastSyncLabel()):'Connecte ton compte Supabase pour sauvegarder ton carnet.')+'</p>'+(cloudError?'<p class="bad">'+esc(cloudError)+'</p>':'')+(conflict?'<p>Une autre version existe en ligne. Exporte ta copie locale avant de charger la version en ligne.</p>'+button('export','Exporter ma copie')+' '+button('resolve','Charger la version en ligne'):'')+(configured?button('login',token?'Renouveler la connexion':'Me connecter')+' '+(token?button('sync','Synchroniser'):''):'')+'</section>'}
function render(){
 if(!state.gyms.some(g=>g.id===gym))gym=state.gyms[0]?.id||'';
 if(['session','overview'].includes(page)&&!session())page='home';
 $('nav').innerHTML=navs.map(([id,icon,n])=>button('nav',navGlyph(id)+n,id,(page===id||(id==='home'&&['session','overview'].includes(page)))?'on':'')).join('');
 $('#app').innerHTML=page==='home'?(configured&&!token&&!localStorage.getItem('onemore.local')?onboarding():dashboard()):page==='settings'?settings():page==='session'?focusedWorkout(session()):page==='overview'?overview(session()):!gym?dashboard():page==='stats'?(returnFromProgress?button('backWorkout','‹ Revenir à mon exercice','','link'):'')+stats():history();statusText()
}
function askExercise(cb){modal('Choisir un exercice',field('Exercice','<select name="ex">'+exOptions('')+'</select>'),v=>{cb(v.ex);changed();render()})}
function swap(list,i,d){if(i+d>=0&&i+d<list.length)[list[i],list[i+d]]=[list[i+d],list[i]]}
function eraseOK(x){return !x.sets.some(r=>r.ok||r.kg!==''||r.reps!=='')||confirm('Effacer les valeurs saisies pour cet exercice ?')}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const a=b.dataset.act,id=b.dataset.id||'',[i,j]=id.split(',').map(Number),s=session(),x=s?.items[i];
 if(a==='cancel')return $('dialog').close();
 if(a==='settings'||a==='nav'){returnFromProgress=null;page=a==='settings'?'settings':id;render();scrollTo(0,0);return}
 if(a==='gym')return modal('Ajouter une salle',field('Nom de la salle',nameInput()),v=>{const name=v.name.trim();if(!name||state.gyms.some(g=>g.name.toLowerCase()===name.toLowerCase()))return alert('Choisis un nom de salle distinct.');gym=uid();state.gyms.push({id:gym,name});localStorage.setItem('repere.gym',gym);changed();render()});
 if(a==='custom')return modal('Créer un exercice',field('Nom',nameInput())+field('Groupe musculaire principal',nameInput('muscle'))+field('Type','<select name="kind">'+kinds.map(k=>option(k,k==='pdc'?'Poids du corps':k,'machine')).join('')+'</select>'),v=>{state.ex.push({id:uid(),name:v.name.trim(),muscle:v.muscle.trim(),kind:v.kind});changed();render()});
 if(a==='start')return start(+id);
 if(a==='retro')return modal('Ajouter une séance passée',field('Date','<input type="date" name="date" required max="'+today()+'" value="'+today()+'">')+field('Séance','<select name="plan">'+programs.map((n,i)=>option(i,n,0)).join('')+'</select>'),v=>{start(+v.plan);session().date=v.date;changed();render()});
 if(a==='local'){localStorage.setItem('onemore.local','1');render();return}
 if(a==='homeItem'){
  const draft=state.sessions.filter(t=>t.gym===gym&&!t.done).sort((a,b)=>b.created-a.created)[0];
  if(draft)active=draft.id;else start(nextPlan(),i);
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
 if(a==='open'){active=id;page=session()?.done?'overview':'session';render();scrollTo(0,0);return}
 if(a==='tab'){statsTab=id;render();return}
 if(a==='login')return modal('Connexion',field('E-mail','<input type="email" name="email" required autocomplete="username">')+field('Mot de passe','<input type="password" name="password" required autocomplete="current-password">'),async v=>{await login(v.email,v.password);render()},'Me connecter');
 if(a==='sync')return sync();
 if(a==='resolve'){if(confirm('Remplacer le carnet local par la version Supabase ?'))sync(true);return}
 if(a==='export'){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));link.download='one-more-carnet.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);return}
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
 if(a==='check'&&!validateRow(s,x,i,j))return;
 if(a==='finish'){
 const all=s.items.flatMap(x=>x.sets);
 if(!all.some(r=>r.ok))return alert('Valide au moins une série avec ✓.');
 if(all.some(r=>!r.ok&&(r.reps!==''||r.kg!==''))&&!confirm('Certaines valeurs sont saisies mais non validées. Terminer avec les séries cochées uniquement ?'))return;
 s.items.forEach(x=>x.sets=x.sets.filter(r=>r.ok));s.items=s.items.filter(x=>x.sets.length);s.done=true;page='history';localStorage.removeItem('repere.timer');tick();scrollTo(0,0)
 }
 changed();render()
});
document.addEventListener('input',e=>{const input=e.target;if(!input.dataset.input)return;const [i,j,k]=input.dataset.input.split(',');const x=session().items[i],r=materialize(session(),x,+j);r[k]=input.value;r.ok=false;const check=input.closest('.entry')?.querySelector('[data-act="check"]');if(check)check.textContent=checkLabel(r,x.mode);const panel=input.closest('.completed');if(panel){panel.querySelector('summary').textContent='Série '+(+j+1)+' · à valider';panel.querySelector('[data-act="check"]').textContent='Valider la série'}changed()});
document.addEventListener('change',e=>{
 const key=e.target.dataset.key,v=e.target.value;if(!key)return;
 if(key==='appearance')appearance.set(v);
 if(key==='gym'){gym=v;localStorage.setItem('repere.gym',gym);pair=[]}
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
function tick(){const end=Number(localStorage.getItem('repere.timer'));const el=$('#clock');const undo=document.querySelector('[data-act="undo"]');if(undo&&(!undoSet||Date.now()>undoSet.expires))undo.hidden=true;el.hidden=!end;if(end){const left=Math.max(0,Math.ceil((end-Date.now())/1000));el.innerHTML='<b>'+(left?'Repos · '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0'):'Repos terminé')+'</b> '+button('stop','Fermer')}}
setInterval(tick,1000);tick();render();sync();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();sync()}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(console.error);
