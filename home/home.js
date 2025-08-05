// home/home.js  – Undo blijft staan tot volgende 'klaar' én over tab‑wissels

/* ---------- Helpers voor opslag ---------- */
function loadStates() {
  try { return JSON.parse(localStorage.getItem('releaseStates') || '{}'); }
  catch(e) { return {}; }
}
function saveStates(states) {
  localStorage.setItem('releaseStates', JSON.stringify(states));
}
function setLastCompleted(id) {
  localStorage.setItem('lastCompleted', id || '');
}
function getLastCompleted() {
  return localStorage.getItem('lastCompleted') || '';
}

/* ---------- Data laden ---------- */
async function loadData() {
  const raw = await fetch('../data.json').then(r => r.json());
  const states = loadStates();
  return raw.map(([date,name,who,dist]) => {
    const id = `${date}_${name}`;                     // unieke sleutel
    const st = states[id] || {};
    return {
      id, date, name, who, dist,
      splits: !!st.splits,
      buma: !!st.buma,
      done: !!st.done
    };
  });
}

/* ---------- RELEASES-kalender ---------- */
function renderCal(data) {
  const maxDays  = 45;
  const today    = new Date();
  const body     = document.getElementById('cal-body');
  body.innerHTML = '';

  data.forEach(d => {
    const [dd, mm, yyyy] = d.date.split('-');
    const dt = new Date(`${yyyy}-${mm}-${dd}`);
    if (dt >= today && (dt - today) / 86400000 < maxDays) {
      const tr = document.createElement('tr');
      tr.innerHTML = `

<td>${d.date}</td>
<td>${d.name}</td>
<td>${d.who}</td>
<td>${d.dist}</td>
<td><span class="status-dot ${d.done ? 'status-done' : 'status-pending'}" data-id="${d.id}" style="cursor:pointer;"></span></td>

      `;
      body.appendChild(tr);
    }
  })
body.querySelectorAll('.status-dot').forEach(dot => {
  let timerId;
  const id = dot.dataset.id;
  const task = data.find(t => t.id === id);
  if (!task) return;

  const start = () => {
    if (!task.done) {
      task.done = true;
      persistState(task);
      showCongrats();
      setLastCompleted(task.id);
      renderCal(data); nextTask(data);
      return;
    }
    timerId = setTimeout(() => {
      task.done = false;
      persistState(task);
      setLastCompleted('');
      renderCal(data); nextTask(data);
    }, 3000);
  };
  const cancel = () => clearTimeout(timerId);
  ['mousedown','touchstart'].forEach(ev=>dot.addEventListener(ev,start));
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>dot.addEventListener(ev,cancel));
});
;
}

/* ---------- EP CHECKLIST ---------- */
function nextTask(data) {
  const user     = localStorage.getItem('user');
  const pending  = data.filter(d => d.who === user && !d.done);
  const row      = document.getElementById('task-row');
  row.innerHTML  = '';

  if (!pending.length) {
    row.innerHTML = '<tr><td colspan="7">Geen openstaande taken 🎉</td></tr>';
    renderLastCompleted(data);
    return;
  }
  const t = pending[0];
  const tr = document.createElement('tr');
  tr.innerHTML = `

<td>${t.date}</td>
<td>${t.name}</td>
<td>${t.who}</td>
<td>${t.dist}</td>
<td><input type="checkbox" id="c-splits" ${t.splits?'checked':''}></td>
<td><input type="checkbox" id="c-buma"   ${t.buma?'checked':''}></td>
<td><input type="checkbox" id="c-done"   ${t.done?'checked disabled':'disabled'}></td>

  `;
  row.appendChild(tr);

function updateDoneState() {
  const doneBox = document.getElementById('c-done');
  doneBox.disabled = !(t.splits && t.buma);
  if (doneBox.disabled) {
    doneBox.checked = false;
    t.done = false;
  }
}
updateDoneState();


  // listeners
  ['splits','buma','done'].forEach(key => {
    document.getElementById('c-'+key).onchange = (e) => {
      t[key] = e.target.checked;
      if (key!=='done') updateDoneState();
      persistState(t);
      if (key==='done' && t.done) {
        showCongrats();
        setLastCompleted(t.id);
        renderLastCompleted(data);
        renderCal(data);
        nextTask(data);          // laad volgende taak
      }
    };
  });

  // toon evt vorige lastCompleted
  renderLastCompleted(data);
}


/* ---------- Pop‑up bij alle taken klaar ---------- */

function showCongrats() {
  if (document.getElementById('kanertje-toast')) return; // al getoond
  const div = document.createElement('div');
  div.id = 'kanertje-toast';
  div.textContent = 'Hoppa!!! Weer een Kanertje verdiend!';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.padding = '12px 20px';
  div.style.background = 'rgba(74,192,107,0.9)';
  div.style.color = '#fff';
  div.style.borderRadius = '8px';
  div.style.fontWeight = 'bold';
  div.style.boxShadow = '0 4px 8px rgba(0,0,0,.3)';
  document.body.appendChild(div);

  // confetti burst
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.75 }
    });
  }

  setTimeout(()=> div.remove(), 3000);
}

/* ---------- Opslaan ---------- */
function persistState(task) {
  const states = loadStates();
  states[task.id] = {
    splits: task.splits,
    buma:   task.buma,
    done:   task.done
  };
  saveStates(states);
}

/* ---------- Last‑completed balk ---------- */
function renderLastCompleted(data) {
  const bar   = document.getElementById('last-completed');
  const id    = getLastCompleted();
  const task  = data.find(d => d.id === id && d.done);
  if (!task) { bar.classList.add('hidden'); return; }

  bar.innerHTML = `
    Laatste afgerond: ${task.date} – ${task.name}
    <button id="undo-btn">Herstel</button>
  `;
  bar.classList.remove('hidden');
  document.getElementById('undo-btn').onclick = () => {
    task.done = false;
    persistState(task);
    setLastCompleted('');
    bar.classList.add('hidden');
    renderCal(data);
    nextTask(data);
  };
}

/* ---------- Uitloggen ---------- */
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.onclick = () => { localStorage.clear(); window.location.href = '../'; };
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  window._allData = await loadData();
  renderCal(window._allData);
  nextTask(window._allData);
  initLogout();

  document.getElementById('view-cal').onclick     = () => showSection('calendar');
  document.getElementById('view-tasks').onclick   = () => showSection('tasks');
  document.getElementById('view-artworks').onclick = () => window.open('https://drive.google.com/drive/folders/1jZpWCyjCzOlqNfuVA7QrpDu_npU0A8_g?usp=sharing','_blank');

document.getElementById('link-distrokid').onclick = () => window.open('https://distrokid.com/new/','_blank');
document.getElementById('link-amuse').onclick     = () => window.open('https://artist.amuse.io/studio','_blank');
document.getElementById('link-buma').onclick      = () => window.open('https://mijn.bumastemra.nl/','_blank');
  document.getElementById('view-ads').onclick = () => window.open('https://adsmanager.facebook.com/adsmanager/manage/campaigns?nav_entry_point=lep_237&nav_source=no_referrer&global_scope_id=1588689962026120&business_id=1588689962026120&act=925502492631790','_blank');

  document.getElementById('user').textContent     = localStorage.getItem('user');
});

function showSection(id) {
  ['calendar','tasks'].forEach(s =>
    document.getElementById(s).classList.toggle('hidden', s!==id)
  );
  document.querySelectorAll('nav button').forEach(btn =>
    btn.classList.toggle('active', btn.id==='view-'+id)
  );
}
