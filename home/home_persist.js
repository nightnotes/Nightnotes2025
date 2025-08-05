// home/home.js  – nu mét:
// * maxDays 45
// * Undo-balk 'Laatste afgerond'
// * Persistente status in localStorage per release

/* ---------- Helpers voor opslag ---------- */
function loadStates() {
  try { return JSON.parse(localStorage.getItem('releaseStates') || '{}'); }
  catch(e) { return {}; }
}
function saveStates(states) {
  localStorage.setItem('releaseStates', JSON.stringify(states));
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
        <td><span class="status-dot ${d.done ? 'status-done' : 'status-pending'}"></span></td>
      `;
      body.appendChild(tr);
    }
  });
}

/* ---------- EP CHECKLIST ---------- */
function nextTask(data) {
  const user     = localStorage.getItem('user');
  const pending  = data.filter(d => d.who === user && !d.done);
  const row      = document.getElementById('task-row');
  row.innerHTML  = '';

  if (!pending.length) {
    row.innerHTML = '<tr><td colspan="7">Geen openstaande taken 🎉</td></tr>';
    return;
  }
  const t = pending[0];                 // eerstvolgende taak
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${t.date}</td>
    <td>${t.name}</td>
    <td>${t.who}</td>
    <td>${t.dist}</td>
    <td><input type="checkbox" id="c-splits" ${t.splits?'checked':''}></td>
    <td><input type="checkbox" id="c-buma"   ${t.buma?'checked':''}></td>
    <td><input type="checkbox" id="c-done"   ${t.done?'checked':''}></td>
  `;
  row.appendChild(tr);

  // listeners
  ['splits','buma','done'].forEach(key => {
    document.getElementById('c-'+key).onchange = (e) => {
      t[key] = e.target.checked;
      persistState(t);
      if (key==='done' && t.done) {
        showUndo(t);
        renderCal(data);
        nextTask(data);
      }
    };
  });
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

/* ---------- Undo ---------- */
function showUndo(task) {
  const bar = document.getElementById('last-completed');
  bar.innerHTML = `
    Laatste afgerond: ${task.date} – ${task.name}
    <button id="undo-btn">Herstel</button>
  `;
  bar.classList.remove('hidden');
  document.getElementById('undo-btn').onclick = () => {
    task.done = false;
    persistState(task);
    bar.classList.add('hidden');
    renderCal(window._allData || []);
    nextTask(window._allData || []);
  };
}

/* ---------- Uitloggen ---------- */
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.onclick = () => {
      localStorage.clear();
      window.location.href = '../';
    };
  }
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
