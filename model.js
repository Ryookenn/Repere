const programs=['Dos / Biceps','Pectoraux / Triceps / Épaules','Jambes'];
const initialExercises=[
 ['Tractions','Dos','pdc'],['Seated row','Dos','machine'],['Curl biceps à la poulie','Biceps','machine'],['Curl marteau à la poulie','Biceps','machine'],['Élévations latérales aux haltères','Épaules','haltère'],
 ['Pec fly','Pectoraux','machine'],['Extension triceps vers le bas','Triceps','machine'],['Extension triceps au-dessus de la tête','Triceps','machine'],['Shoulder press','Épaules','machine'],['Rear delt','Épaules','machine'],
 ['Squats assistés','Quadriceps','machine'],['Fentes bulgares aux haltères','Quadriceps','haltère'],['Hip thrusts','Fessiers','barre'],['Kick-back à la poulie','Fessiers','machine'],['Back extension','Chaîne postérieure','pdc']
];
const uid=()=>crypto.randomUUID();
const today=()=>localDate(new Date());
function localDate(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function seed(){return {gyms:[],ex:initialExercises.map(([name,muscle,kind],i)=>({id:String(i),name,muscle,kind})),plans:[[0,1,2,3,4],[5,6,7,8,9,4],[10,11,12,13,14]].map(p=>p.map(String)),sessions:[],rest:90}}
const baseMode=e=>e.kind==='pdc'?'pdc':'charge';
const emptySet=()=>({kg:'',reps:'',ok:false});
function valid(r,mode){return Number.isInteger(+r.reps)&&+r.reps>0&&r.reps!==''&&(mode==='pdc'||(String(r.kg).trim()!==''&&Number.isFinite(+r.kg)&&+r.kg>=0))}
function performances(state,gym,id,mode){return state.sessions.filter(s=>s.done&&s.gym===gym).flatMap(s=>{const rows=s.items.filter(x=>x.ex===id&&x.mode===mode).flatMap(x=>x.sets.filter(r=>r.ok&&valid(r,mode)));return rows.length?[{s,rows}]:[]}).sort((a,b)=>a.s.date.localeCompare(b.s.date)||a.s.created-b.s.created)}
function estimate(r){return +r.kg>0&&+r.reps<=10?(+r.reps===1?+r.kg:+r.kg*(1+r.reps/30)):null}
function best(rows,metric,target,mode){let values=[];for(const r of rows){if(metric==='reps'&&(mode==='pdc'||+r.kg===target))values.push(+r.reps);if(metric==='load'&&+r.reps>=target)values.push(+r.kg);if(metric==='rm'&&mode==='charge'&&estimate(r)!==null)values.push(estimate(r))}return values.length?(metric==='load'&&mode==='aide'?Math.min(...values):Math.max(...values)):null}
