let detail=false,period='3',regularGym='all',pointId='',comparisonA='',comparisonB='';
function inPeriod(day){
 return period==='all'||day>=monthShift(today(),-Number(period));
}
function periodPicker(){return field('Période',select('period',[['1','1 mois'],['3','3 mois'],['all','Tout']].map(([v,n])=>option(v,n,period)).join('')))}
function signed(n){return (n>0?'+':'')+fmt(n)}
function compareRows(a,b,m){
 if(!a?.length||!b?.length)return 'Première référence';
 const n=Math.min(a.length,b.length),first=a.slice(0,n),last=b.slice(0,n);
 const extra=b.length-a.length;
 const suffix=extra?' · '+Math.abs(extra)+' série(s) '+(extra>0?'en plus':'en moins'):'';
 if(m==='pdc'||first.every((r,i)=>+r.kg===+last[i].kg)){
  const gain=last.reduce((v,r,i)=>v+Number(r.reps)-Number(first[i].reps),0);
  const same=last.every(r=>+r.kg===+last[0].kg);
  return (gain?signed(gain)+' rép.':'Même total de répétitions')+(m==='pdc'?' au poids du corps':same?' à '+fmt(last[0].kg)+' kg':' à charges identiques')+' sur '+n+' série(s)'+suffix;
 }
 const k=first.findIndex((r,i)=>+r.kg!==+last[i].kg);
 const before=first[k],after=last[k];
 if(m==='aide'&&+before.reps===+after.reps){
  const diff=Number(after.kg)-Number(before.kg);
  return fmt(Math.abs(diff))+' kg d’assistance '+(diff<0?'en moins':'en plus')+' pour '+after.reps+' rép. · série '+(k+1)+suffix;
 }
 return 'Série '+(k+1)+' : '+setText(before,m)+' → '+setText(after,m)+suffix;
}
function enterDetail(id,variant){
 statEx=id;mode=variant;detail=true;statsTab='progress';metric='reps';pointId='';comparisonA='';comparisonB='';
 const rows=performances(state,gym,id,variant).at(-1)?.rows||[];
 target=Number(rows.at(-1)?.kg||0);
}
function stats(){
 const regular=statsTab==='volume';
 const tabs='<div class="tabs">'+button('tab','Performances','progress',regular?'':'done')+button('tab','Régularité','volume',regular?'done':'')+'</div>';
 if(regular)return '<h1>Progrès</h1>'+tabs+regularity();
 const head='<h1>Progrès</h1>'+tabs+gymLine();
 if(detail)return head+exerciseDetail();
 const latest=state.sessions.filter(s=>s.done&&s.gym===gym).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created)[0];
 const picker=field('Consulter un exercice',select('browseEx',option('','Choisir un exercice…','')+exOptions('')));
 if(!latest)return head+'<section><h2>Ton premier bilan</h2><p>Termine une séance dans cette salle pour retrouver ici tes performances.</p></section>'+picker;
 const seen=new Set();
 const rows=latest.items.map(x=>{
  const key=x.ex+'|'+x.mode;if(seen.has(key))return '';seen.add(key);
  const history=performances(state,gym,x.ex,x.mode),idx=history.findIndex(p=>p.s.id===latest.id);
  if(idx<0)return '';
  const label=compareRows(history[idx-1]?.rows,history[idx].rows,x.mode);
  return button('exDetail','<span class="thumbnail">'+exerciseArt(x.ex)+'</span><span class="line-copy"><b>'+esc(exercise(x.ex).name)+'</b><small>'+esc(label)+'</small></span>›',key,'exercise-row');
 }).join('');
 return head+'<section><div class="tag">Dernière séance · '+dateLabel(latest.date)+'</div><h2>'+programs[latest.plan]+'</h2>'+rows+'</section>'+picker;
}
function interactiveChart(points){
 if(!points.length)return '<p class="sub">Aucune série pour ces filtres.</p>';
 const selected=points.find(p=>p.s.id===pointId)||points.at(-1);
 const vals=points.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals);
 const times=points.map(p=>Date.parse(p.s.date)),span=times.at(-1)-times[0];
 const xy=points.map((p,i)=>[span?36+250*(times[i]-times[0])/span:36+250*i/Math.max(1,points.length-1),max===min?62:105-83*(p.v-min)/(max-min)]);
 const graph='<svg viewBox="0 0 320 142" aria-label="Évolution par date"><path d="M35 22H294M35 63H294M35 105H294" stroke="var(--line)" fill="none"/><text x="0" y="'+(max===min?65:26)+'">'+fmt(max)+'</text>'+(max===min?'':'<text x="0" y="108">'+fmt(min)+'</text>')+'<polyline points="'+xy.map(p=>p.join(',')).join(' ')+'" stroke="var(--red)" fill="none" stroke-width="2"/>'+xy.map(([x,y],i)=>'<g data-act="point" data-id="'+esc(points[i].s.id)+'" style="cursor:pointer"><circle cx="'+x+'" cy="'+y+'" r="12" fill="transparent"/><circle cx="'+x+'" cy="'+y+'" r="'+(points[i]===selected?5:3)+'" fill="var(--red)"/></g>').join('')+'<text x="36" y="133">'+dateLabel(points[0].s.date)+'</text><text x="290" y="133" text-anchor="end">'+dateLabel(points.at(-1).s.date)+'</text></svg>';
 return graph+field('Point sélectionné',select('point',points.map((p,i)=>option(p.s.id,dateLabel(p.s.date)+' · '+(i+1),selected.s.id)).join('')))+'<p>'+selected.rows.map(r=>setText(r,mode)).join(' / ')+'</p>'+button('journalPoint','Ouvrir dans le journal',selected.s.id,'link');
}
function recordList(hist){
 const all=hist.flatMap(p=>p.rows.map(r=>({r,s:p.s})));
 if(!all.length)return '';
 function line(label,score,low=false){
  let record=null;
  for(const item of all){const v=score(item.r);if(v!==null&&(!record||(low?v<record.v:v>record.v)))record={...item,v}}
  return record?'<p><b>'+label+(label==='1RM estimé'?' · '+fmt(record.v)+' kg':'')+'</b><br>'+setText(record.r,mode)+' · '+dateLabel(record.s.date)+'</p>':'';
 }
 return '<details><summary>Records dans cette salle · tout l’historique</summary>'+line('Répétitions maximales',r=>+r.reps)+(mode==='pdc'?'':line(mode==='aide'?'Assistance minimale':'Charge maximale',r=>+r.kg,mode==='aide'))+(mode==='charge'?line('1RM estimé',estimate):'')+'</details>';
}
function compareTable(history){
 if(history.length<2)return '<p>Deux séances comparables sont nécessaires.</p>';
 const find=id=>history.find(p=>p.s.id===id),a=find(comparisonA)||history.at(-2),b=find(comparisonB)||history.at(-1);
 const opts=id=>history.map((p,i)=>option(p.s.id,dateLabel(p.s.date)+' · '+(i+1),id)).join('');
 return field('Séance A',select('comparisonA',opts(a.s.id)))+field('Séance B',select('comparisonB',opts(b.s.id)))+'<p>'+compareRows(a.rows,b.rows,mode)+'</p><table><tr><th>Série</th><th>A</th><th>B</th></tr>'+Array.from({length:Math.max(a.rows.length,b.rows.length)},(_,i)=>'<tr><td>'+(i+1)+'</td>'+[a,b].map(p=>'<td>'+(p.rows[i]?setText(p.rows[i],mode):'—')+'</td>').join('')+'</tr>').join('')+'</table>';
}
function exerciseDetail(){
 const e=exercise(statEx),history=performances(state,gym,statEx,mode),windowed=history.filter(p=>inPeriod(p.s.date));
 const allowed=mode==='pdc'?['reps','total']:mode==='charge'?['reps','total','load','rm']:['reps','total','load'];
 const names={reps:'Meilleure série (répétitions)',total:'Total des répétitions',load:mode==='aide'?'Assistance minimale':'Charge maximale',rm:'1RM estimé'};
 const loads=[...new Set(history.flatMap(p=>p.rows.map(r=>+r.kg)))].sort((a,b)=>a-b);
 if(!allowed.includes(metric))metric='reps';
 if(['total','reps'].includes(metric)&&!loads.includes(target))target=Number(history.at(-1)?.rows.at(-1)?.kg||0);
 const filter=['total','reps'].includes(metric)&&mode!=='pdc'?field('Charge utilisée',select('loadChoice',loads.map(n=>option(n,fmt(n)+' kg',target)).join(''))):metric==='load'?field('Minimum de répétitions','<input data-key="target" type="number" min="1" value="'+target+'">'):'';
 const points=windowed.map(p=>{
  const eligible=p.rows.filter(r=>mode==='pdc'||+r.kg===target);
  const v=metric==='total'?(eligible.length?eligible.reduce((n,r)=>n+Number(r.reps),0):null):best(p.rows,metric,target,mode);
  return {...p,v};
 }).filter(p=>p.v!==null);
 const unit=['reps','total'].includes(metric)?' rép.':' kg',delta=points.length>1?points.at(-1).v-points[0].v:null;
 return button('summary','‹ Bilan de la salle','','link')+'<div class="exercise-heading"><h2>'+esc(e.name)+'</h2><span class="thumbnail">'+exerciseArt(e.id)+'</span></div>'+(e.kind==='pdc'?field('Variante',select('detailMode',['pdc','aide','lest'].map(k=>option(k,modes[k],mode)).join(''))):'')+periodPicker()+field('Indicateur',select('detailMetric',allowed.map(k=>option(k,names[k],metric)).join('')))+filter+(delta===null?'':'<div class="metric">'+signed(delta)+unit+'</div><small>Du '+dateLabel(points[0].s.date)+' au '+dateLabel(points.at(-1).s.date)+'</small>')+interactiveChart(points)+'<section><h2>Comparer deux séances</h2>'+compareTable(windowed)+'</section>'+recordList(history);
}
function regularity(){
 const sessions=state.sessions.filter(s=>s.done&&(regularGym==='all'||s.gym===regularGym)&&inPeriod(s.date));
 const counts=programs.map((_,i)=>sessions.filter(s=>s.plan===i).length),muscles={};
 for(const s of sessions)for(const x of s.items){const name=exercise(x.ex).muscle;muscles[name]=(muscles[name]||0)+x.sets.filter(r=>r.ok).length}
 const start=atNoon(period==='all'?(sessions.map(s=>s.date).sort()[0]||today()):monthShift(today(),-Number(period)));
 start.setDate(start.getDate()-(start.getDay()+6)%7);const weeks=new Map();
 for(const d=new Date(start);localDate(d)<=today();d.setDate(d.getDate()+7))weeks.set(localDate(d),0);
 for(const s of sessions){const d=atNoon(s.date);d.setDate(d.getDate()-(d.getDay()+6)%7);const k=localDate(d);weeks.set(k,(weeks.get(k)||0)+1)}
 const bars=Object.entries(muscles).sort((a,b)=>b[1]-a[1]).map(([m,v])=>'<div class="row spread"><span>'+esc(m)+'</span><b>'+v+'</b></div><span class="bar"><i style="width:'+100*v/Math.max(1,...Object.values(muscles))+'%"></i></span>').join('');
 return field('Périmètre',gymFilter('regularGym',regularGym))+periodPicker()+'<section><div class="metric">'+sessions.length+'</div><p>Séances terminées sur la période</p>'+plot([...weeks].map(([d,v])=>({d,v})))+'</section><section><h2>Ton cycle</h2>'+programs.map((n,i)=>'<p>'+n+' <b>· '+counts[i]+'</b></p>').join('')+'</section><section><h2>Séries par groupe musculaire</h2>'+bars+'</section>';
}
