const prefix='repere-'+self.registration.scope+'-',cacheName=prefix+'4-training';
const assets=['./','./index.html','./theme.js','./mark.svg','./style.css','./pictos.js','./flow.js','./training.js','./app.js','./model.js','./config.js','./cloud.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(assets.map(url=>new Request(url,{cache:'reload'}))))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(caches.open(cacheName).then(async c=>(await c.match(e.request))||fetch(e.request)))});
