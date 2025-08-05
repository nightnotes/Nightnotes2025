// ==== CONFIG ====
const MAX_DAYS = 45;

// ---- Helper storage ----
function loadStates(){try{return JSON.parse(localStorage.getItem('releaseStates')||'{}')}catch(e){return {}}}
function saveStates(s){localStorage.setItem('releaseStates',JSON.stringify(s))}
function setLastCompleted(id){localStorage.setItem('lastCompleted',id||'')}
function getLastCompleted(){return localStorage.getItem('lastCompleted')||''}

// ---- Data load ----
async function loadData(){
  const raw = await fetch('../data.json').then(r=>r.json());
  const st = loadStates();
  return raw.map(([date,name,who,dist])=>{
    const id=`${date}_${name}`;
    const s=st[id]||{};
    return {id,date,name,who,dist,
      splits:!!s.splits,buma:!!s.buma,done:!!s.done};
  });
}

// ---- Calendar ----
function renderCal(data){
  const body=document.getElementById('cal-body'); body.innerHTML='';
  const today=new Date();
  data.forEach(d=>{
    const [dd,mm,yy]=d.date.split('-'); const dt=new Date(`${yy}-${mm}-${dd}`);
    if(dt>=today && (dt-today)/86400000<MAX_DAYS){
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${d.date}</td><td>${d.name}</td><td>${d.who}</td><td>${d.dist}</td>
        <td><span class="status-dot ${d.done?'status-done':'status-pending'}" data-id="${d.id}"></span></td>`;
      body.appendChild(tr);
    }
  });

  // long-press logic
  body.querySelectorAll('.status-dot').forEach(dot=>{
    let tmr; const id=dot.dataset.id; const t=window._data.find(x=>x.id===id);
    const start=()=>{
      if(!t.done){ t.done=true; persistState(t,true); return;}
      tmr=setTimeout(()=>{t.done=false; persistState(t,false);},3000);
    };
    const cancel=()=>clearTimeout(tmr);
    dot.addEventListener('mousedown',start);
    dot.addEventListener('touchstart',start);
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>dot.addEventListener(ev,cancel));
  });
}

// ---- Checklist ----
function nextTask(data){
  const user=localStorage.getItem('user');
  const pending=data.filter(d=>d.who===user && !d.done);
  const row=document.getElementById('task-row'); row.innerHTML='';
  if(!pending.length){row.innerHTML='<tr><td colspan="7">Geen openstaande taken 🎉</td></tr>'; renderLast(data); return;}
  const t=pending[0];
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${t.date}</td><td>${t.name}</td><td>${t.who}</td><td>${t.dist}</td>
    <td><input type="checkbox" id="c-splits" ${t.splits?'checked':''}></td>
    <td><input type="checkbox" id="c-buma"   ${t.buma?'checked':''}></td>
    <td><input type="checkbox" id="c-done"   ${t.done?'checked':''} ${(t.splits&&t.buma)?'':'disabled'}></td>`;
  row.appendChild(tr);

  function updateDone(){
    const doneBox=document.getElementById('c-done');
    doneBox.disabled=!(t.splits&&t.buma);
    if(doneBox.disabled){doneBox.checked=false; t.done=false;}
  } updateDone();

  ['splits','buma','done'].forEach(key=>{
    document.getElementById('c-'+key).onchange=e=>{
      t[key]=e.target.checked; if(key!=='done') updateDone();
      persistState(t,key==='done'&&t.done);
    };
  });
  renderLast(data);
}

// ---- Persist ----
function persistState(t,showConfetti){
  const st=loadStates(); st[t.id]={splits:t.splits,buma:t.buma,done:t.done}; saveStates(st);
  showConfetti? (showCongrats(), setLastCompleted(t.id)) : setLastCompleted('');
  renderCal(window._data); nextTask(window._data);
}

// ---- Undo bar ----
function renderLast(data){
  const bar=document.getElementById('last-completed');
  const id=getLastCompleted(); const t=data.find(x=>x.id===id&&x.done);
  if(!t){bar.classList.add('hidden'); return;}
  bar.innerHTML=`Laatste afgerond: ${t.date} – ${t.name} <button id="undo-btn">Herstel</button>`;
  bar.classList.remove('hidden');
  document.getElementById('undo-btn').onclick=()=>{t.done=false; persistState(t,false);};
}

// ---- Toast + Confetti ----
function showCongrats(){
  if(document.getElementById('toast')) return;
  const d=document.createElement('div'); d.id='toast'; d.textContent='Hoppa!!! Weer een Kanertje verdiend!';
  Object.assign(d.style,{position:'fixed',bottom:'20px',right:'20px',padding:'12px 20px',background:'rgba(74,192,107,.9)',color:'#fff',borderRadius:'8px',fontWeight:'bold',boxShadow:'0 4px 8px rgba(0,0,0,.3)'});
  document.body.appendChild(d);
  if(typeof confetti==='function'){confetti({particleCount:120,spread:70,origin:{y:0.75}});}
  setTimeout(()=>d.remove(),3000);
}

// ---- Navigation ----
function showSection(id){
  ['calendar','tasks'].forEach(s=>document.getElementById(s).classList.toggle('hidden',s!==id));
  document.querySelectorAll('nav .nav-btn').forEach(b=>b.classList.toggle('active',b.id==='view-'+id));
}

// ---- Init ----
document.addEventListener('DOMContentLoaded',async()=>{
  window._data=await loadData();
  renderCal(window._data); nextTask(window._data);

  document.getElementById('view-cal').onclick   =()=>showSection('calendar');
  document.getElementById('view-tasks').onclick =()=>showSection('tasks');
  document.getElementById('view-artworks').onclick=()=>window.open('https://drive.google.com/drive/folders/1jZpWCyjCzOlqNfuVA7QrpDu_npU0A8_g','_blank');
  document.getElementById('view-ads').onclick  =()=>window.open('https://adsmanager.facebook.com/adsmanager/manage/campaigns?global_scope_id=1588689962026120','_blank');

  document.getElementById('link-distrokid').onclick=()=>window.open('https://distrokid.com/new/','_blank');
  document.getElementById('link-amuse').onclick    =()=>window.open('https://artist.amuse.io/studio','_blank');
  document.getElementById('link-buma').onclick     =()=>window.open('https://mijn.bumastemra.nl/','_blank');

  document.getElementById('logout-btn').onclick=()=>{localStorage.clear();location.href='../';};

  document.getElementById('user').textContent=localStorage.getItem('user')||'';
});
