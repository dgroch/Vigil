async function loadSite() {
  const res = await fetch('data/site.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load site.json (${res.status})`);
  return res.json();
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function card(title, body) {
  return `<article class="card"><h3 class="entry-title">${esc(title)}</h3>${body}</article>`;
}

function renderOverview(data) {
  const summary = data.summary || {};
  return `
    <div class="grid">
      <article class="card"><dl class="kv"><dt>Name</dt><dd>${esc(summary.name || 'Vigil')}</dd></dl></article>
      <article class="card"><dl class="kv"><dt>Last export</dt><dd>${esc(summary.generatedAt || 'unknown')}</dd></dl></article>
      <article class="card"><dl class="kv"><dt>Latest day</dt><dd>${esc(summary.latestDay || 'none')}</dd></dl></article>
      <article class="card"><dl class="kv"><dt>Active intentions</dt><dd>${esc(summary.activeIntentionsCount ?? 0)}</dd></dl></article>
    </div>
    ${card('Current shape', `<p>${esc(summary.description || 'No summary yet.')}</p>`)}
    ${card('Latest commitment', summary.latestCommitment ? `<pre>${esc(summary.latestCommitment)}</pre>` : `<p class="empty">No commitment exported yet.</p>`)}
    ${card('Latest tension', summary.latestHaunting ? `<pre>${esc(summary.latestHaunting)}</pre>` : `<p class="empty">No active tension exported yet.</p>`)}
  `;
}

function renderCollection(items, emptyText, formatter) {
  if (!items || !items.length) return `<p class="empty">${esc(emptyText)}</p>`;
  return `<div class="list">${items.map(formatter).join('')}</div>`;
}

function render() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  }));

  loadSite().then(data => {
    document.getElementById('status').textContent = `Updated ${data.summary?.generatedAt || 'unknown'}`;
    document.getElementById('overview').innerHTML = renderOverview(data);
    document.getElementById('daily').innerHTML = renderCollection(data.daily, 'No daily posts yet.', item => card(item.date, `<div class="entry-meta">${esc(item.title || 'Daily artefact')}</div><pre>${esc(item.body || '')}</pre>`));
    document.getElementById('weekly').innerHTML = renderCollection(data.weekly, 'No weekly summaries yet.', item => card(item.week, `<div class="entry-meta">${esc(item.title || 'Weekly review')}</div><pre>${esc(item.body || '')}</pre>`));
    document.getElementById('tasks').innerHTML = `
      ${card('Open tasks', renderCollection(data.tasks?.open, 'No open tasks.', item => `<article class="card"><div class="badge">${esc(item.status || 'open')}</div><pre>${esc(item.text || '')}</pre></article>`))}
      ${card('Closed tasks', renderCollection(data.tasks?.closed, 'No closed tasks.', item => `<article class="card"><div class="badge">${esc(item.status || 'closed')}</div><pre>${esc(item.text || '')}</pre></article>`))}
    `;
    document.getElementById('intentions').innerHTML = renderCollection(data.intentions, 'No active intentions.', item => card(item.name || 'Untitled intention', `<div class="entry-meta">${esc(item.status || 'active')}</div><pre>${esc(item.description || '')}${item.note ? '\n\nLatest note: ' + esc(item.note) : ''}</pre>`));
  }).catch(err => {
    document.getElementById('status').textContent = 'Load failed';
    document.getElementById('overview').innerHTML = card('Error', `<pre>${esc(err.message)}</pre>`);
  });
}

render();
