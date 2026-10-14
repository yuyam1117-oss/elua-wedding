const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
let password = sessionStorage.getItem('elua_admin_password') || '';
const isLocalPreview = ['localhost', '127.0.0.1', '::1', '[::1]', '[::]'].includes(location.hostname);

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Password': password, ...(options.headers || {}) };
  let response;
  try { response = await fetch(path, { ...options, headers }); }
  catch { throw new Error('APIに接続できません。Cloudflare Pages Functionsが動く環境で開いているか確認してください。'); }
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    if (response.status === 401) throw new Error('認証に失敗しました。管理パスワードを確認して、再ログインしてください。');
    if (response.status === 404) throw new Error('APIが見つかりません（404）。ローカルの簡易サーバーではなく、Cloudflare Pages Functionsが動作する環境で確認してください。');
    throw new Error(data.error || `通信に失敗しました（HTTP ${response.status}）。`);
  }
  return data;
}
function setStatus(el, message, kind = '') {
  const node = typeof el === 'string' ? $(el) : el;
  if (!node) return;
  node.textContent = message || '';
  node.classList.toggle('status-error', kind === 'error');
  node.classList.toggle('status-success', kind === 'success');
}
function escText(parent, tag, text, cls) {
  const el = document.createElement(tag); el.textContent = text ?? ''; if (cls) el.className = cls; parent.append(el); return el;
}
function showEditor() {
  document.body.classList.add('admin-authenticated'); $('#login-panel').hidden = true; $('#editor-panel').hidden = false;
  loadSettings(); loadPlans(); loadNotices(); loadGallery(); loadInquiries();
}
function showLogin() { document.body.classList.remove('admin-authenticated'); $('#login-panel').hidden = false; $('#editor-panel').hidden = true; }
function setActiveTab(tabName) {
  $$('#admin-nav [data-tab]').forEach(btn => { const active = btn.dataset.tab === tabName; btn.classList.toggle('active', active); btn.setAttribute('aria-current', active ? 'page' : 'false'); });
  $$('.admin-tab').forEach(section => { section.hidden = section.id !== `tab-${tabName}`; });
  document.dispatchEvent(new CustomEvent('admin:tab-change', { detail: { tab: tabName } }));
  if (tabName === 'home') refreshDashboard();
}
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault(); password = $('#password').value; setStatus('#login-status', '確認しています…');
  if (isLocalPreview) {
    sessionStorage.setItem('elua_admin_password', password); setStatus('#login-status', ''); showEditor();
    setStatus('#dashboard-status', 'ローカルプレビュー中です。APIを使う保存・読み込みはCloudflare Pages Functions環境で確認してください。'); return;
  }
  try { await api('/api/admin/content'); sessionStorage.setItem('elua_admin_password', password); setStatus('#login-status', ''); showEditor(); }
  catch (err) { password = ''; setStatus('#login-status', `ログインできませんでした：${err.message}`, 'error'); }
});
$('#admin-nav').addEventListener('click', e => { const btn = e.target.closest('[data-tab]'); if (btn) setActiveTab(btn.dataset.tab); });
$$('[data-go]').forEach(btn => btn.addEventListener('click', () => { setActiveTab(btn.dataset.go); if (btn.dataset.new) openNew(btn.dataset.new); }));

// Site settings: each card submits only its own fields, so unrelated settings are never overwritten.
const settingForms = $$('.settings-form');
async function loadSettings() {
  if (isLocalPreview) { setStatus('#settings-load-status', 'ローカルプレビュー：API接続がないため、保存済みデータは読み込めません。'); return; }
  try {
    const { content = {} } = await api('/api/admin/content');
    settingForms.forEach(form => $$('input[name],textarea[name]', form).forEach(field => { field.value = content[field.name] ?? ''; }));
    setStatus('#settings-load-status', '保存済みの設定を読み込みました。');
  } catch (err) { setStatus('#settings-load-status', err.message, 'error'); }
}
settingForms.forEach(form => form.addEventListener('submit', async e => {
  e.preventDefault(); const button = $('button[type="submit"]', form); const statusEl = $('.status', form); button.disabled = true; setStatus(statusEl, '保存しています…');
  const content = {}; $$('input[name],textarea[name]', form).forEach(field => { content[field.name] = field.value.trim(); });
  try { await api('/api/admin/content', { method: 'PUT', body: JSON.stringify({ content }) }); setStatus(statusEl, '保存しました。公開サイトに反映されました。', 'success'); }
  catch (err) { setStatus(statusEl, err.message, 'error'); }
  finally { button.disabled = false; }
}));

function renderRecords(boxSelector, items, config) {
  const box = $(boxSelector); box.replaceChildren();
  if (!items.length) { escText(box, 'p', config.empty, 'empty-state'); return; }
  items.forEach(item => {
    const card = document.createElement('article'); card.className = 'record'; const main = document.createElement('div'); main.className = 'record-main';
    escText(main, 'strong', config.title(item)); escText(main, 'p', config.subtitle(item));
    if (item.image_url) { const img = document.createElement('img'); img.src = item.image_url; img.alt = item.title || ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.className = 'record-thumb'; img.onerror = () => { img.hidden = true; }; main.prepend(img); }
    const actions = document.createElement('div'); actions.className = 'record-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'secondary'; edit.textContent = '編集'; edit.addEventListener('click', () => config.edit(item));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = '削除'; remove.addEventListener('click', () => config.remove(item));
    actions.append(edit, remove); card.append(main, actions); box.append(card);
  });
}
function formToObject(form) { const data = Object.fromEntries(new FormData(form).entries()); data.is_published = form.elements.is_published.checked; return data; }
function showRecordForm(type, editing = false) {
  const form = $(`#${type}-form`); const list = $(`#${type === 'plan' ? 'plans' : type === 'notice' ? 'notices' : 'gallery'}-list`);
  list.hidden = true; form.hidden = false; $(`#${type}-new`).hidden = true;
  $(`#${type}-form-title`).textContent = editing ? `${type === 'plan' ? 'プラン' : type === 'notice' ? 'お知らせ' : '写真'}を編集` : `${type === 'plan' ? 'プラン' : type === 'notice' ? 'お知らせ' : '写真'}を新規登録`;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function showRecordList(type) {
  const form = $(`#${type}-form`); const list = $(`#${type === 'plan' ? 'plans' : type === 'notice' ? 'notices' : 'gallery'}-list`);
  form.hidden = true; list.hidden = false; $(`#${type}-new`).hidden = false;
}
function openNew(type) {
  const form = $(`#${type}-form`); form.reset(); form.elements.id.value = '';
  if (form.elements.is_published) form.elements.is_published.checked = true;
  if (type === 'plan') form.elements.sort_order.value = 10;
  if (type === 'notice') form.elements.published_at.value = new Date().toLocaleDateString('sv-SE');
  if (type === 'gallery') { form.elements.category.value = 'WEDDING'; form.elements.sort_order.value = 10; }
  setStatus(`#${type}-status`, ''); showRecordForm(type, false);
}
function openEdit(type, item) {
  const form = $(`#${type}-form`); Object.keys(item).forEach(key => { const field = form.elements[key]; if (!field) return; if (field.type === 'checkbox') field.checked = !!item[key]; else field.value = item[key] ?? ''; });
  if (type === 'notice') form.elements.published_at.value = (item.published_at || '').slice(0, 10);
  setStatus(`#${type}-status`, ''); showRecordForm(type, true);
}
function wireCancel(type) { $(`#${type}-cancel`).addEventListener('click', () => showRecordList(type)); $(`#${type}-new`).addEventListener('click', () => openNew(type)); }
wireCancel('plan'); wireCancel('notice'); wireCancel('gallery');

async function loadPlans() {
  if (isLocalPreview) { $('#plans-list').innerHTML = '<p class="empty-state">ローカルプレビュー中です。Cloudflare環境で保存済みプランが表示されます。</p>'; return; }
  try { const { plans = [] } = await api('/api/admin/plans'); renderRecords('#plans-list', plans, { title: p => `${p.title} · ${p.is_published ? '公開中' : '非公開'}`, subtitle: p => `${p.category || 'カテゴリなし'} / ${p.price || '要相談'}\n${p.description}`, empty: 'プランがありません。', edit: p => { openEdit('plan', p); }, remove: async p => { if (confirm(`「${p.title}」を削除しますか？`)) try { await api('/api/admin/plans', { method: 'DELETE', body: JSON.stringify({ id: p.id }) }); await loadPlans(); } catch (e) { alert(e.message); } } }); updateStat('stat-plans', plans.filter(p => p.is_published).length); }
  catch (e) { $('#plans-list').replaceChildren(); escText($('#plans-list'), 'p', e.message, 'status-error'); }
}
$('#plan-form').addEventListener('submit', async e => {
  e.preventDefault(); const form = e.currentTarget, button = $('button[type="submit"]', form), d = formToObject(form); d.id = Number(d.id) || undefined; d.sort_order = Number(d.sort_order) || 0; button.disabled = true; setStatus('#plan-status', '保存しています…');
  try { await api('/api/admin/plans', { method: d.id ? 'PUT' : 'POST', body: JSON.stringify(d) }); setStatus('#plan-status', '保存しました。公開サイトに反映されました。', 'success'); await loadPlans(); await refreshDashboard(); showRecordList('plan'); }
  catch (err) { setStatus('#plan-status', err.message, 'error'); } finally { button.disabled = false; }
});

async function loadNotices() {
  if (isLocalPreview) { $('#notices-list').innerHTML = '<p class="empty-state">ローカルプレビュー中です。Cloudflare環境で保存済みのお知らせが表示されます。</p>'; $('#latest-notices').innerHTML = '<p class="empty-state">最新のお知らせを表示するにはCloudflare環境で開いてください。</p>'; return; }
  try { const { notices = [] } = await api('/api/admin/notices'); renderRecords('#notices-list', notices, { title: n => `${n.title} · ${n.is_published ? '公開中' : '非公開'}`, subtitle: n => `${n.published_at}\n${n.body}`, empty: 'お知らせはありません。', edit: n => openEdit('notice', n), remove: async n => { if (confirm(`「${n.title}」を削除しますか？`)) try { await api('/api/admin/notices', { method: 'DELETE', body: JSON.stringify({ id: n.id }) }); await loadNotices(); await refreshDashboard(); } catch (e) { alert(e.message); } } });
    const latest = $('#latest-notices'); latest.replaceChildren(); const published = notices.filter(n => n.is_published).slice(0, 5); updateStat('stat-notices', notices.filter(n => n.is_published).length);
    if (!published.length) escText(latest, 'p', '公開中のお知らせはありません。', 'empty-state');
    published.forEach(n => { const row = document.createElement('article'); row.className = 'latest-notice'; escText(row, 'time', (n.published_at || '').slice(0, 10)); escText(row, 'strong', n.title); latest.append(row); });
  } catch (e) { $('#notices-list').replaceChildren(); escText($('#notices-list'), 'p', e.message, 'status-error'); setStatus('#dashboard-status', e.message, 'error'); }
}
$('#notice-form').addEventListener('submit', async e => {
  e.preventDefault(); const form = e.currentTarget, button = $('button[type="submit"]', form), d = formToObject(form); d.id = Number(d.id) || undefined; button.disabled = true; setStatus('#notice-status', '保存しています…');
  try { await api('/api/admin/notices', { method: d.id ? 'PUT' : 'POST', body: JSON.stringify(d) }); setStatus('#notice-status', '保存しました。公開サイトに反映されました。', 'success'); await loadNotices(); await refreshDashboard(); showRecordList('notice'); }
  catch (err) { setStatus('#notice-status', err.message, 'error'); } finally { button.disabled = false; }
});

async function loadGallery() {
  if (isLocalPreview) { $('#gallery-list').innerHTML = '<p class="empty-state">ローカルプレビュー中です。Cloudflare環境で登録済みの写真が表示されます。</p>'; return; }
  try { const { items = [] } = await api('/api/admin/gallery'); renderRecords('#gallery-list', items, { title: g => `${g.title || 'タイトルなし'} · ${g.is_published ? '公開中' : '非公開'}`, subtitle: g => `${g.category || 'WEDDING'} / 表示順 ${g.sort_order}\n${g.image_url}\n${g.description || ''}`, empty: '写真がありません。', edit: g => openEdit('gallery', g), remove: async g => { if (confirm('この写真を削除しますか？')) try { await api('/api/admin/gallery', { method: 'DELETE', body: JSON.stringify({ id: g.id }) }); await loadGallery(); await refreshDashboard(); } catch (e) { alert(e.message); } } }); updateStat('stat-gallery', items.length); }
  catch (e) { $('#gallery-list').replaceChildren(); escText($('#gallery-list'), 'p', e.message, 'status-error'); }
}
$('#gallery-form').addEventListener('submit', async e => {
  e.preventDefault(); const form = e.currentTarget, button = $('button[type="submit"]', form), d = formToObject(form); d.id = Number(d.id) || undefined; d.sort_order = Number(d.sort_order) || 0; button.disabled = true; setStatus('#gallery-status', '保存しています…');
  try { await api('/api/admin/gallery', { method: d.id ? 'PUT' : 'POST', body: JSON.stringify(d) }); setStatus('#gallery-status', '保存しました。公開サイトに反映されました。', 'success'); await loadGallery(); await refreshDashboard(); showRecordList('gallery'); }
  catch (err) { setStatus('#gallery-status', err.message, 'error'); } finally { button.disabled = false; }
});

async function loadInquiries() {
  const box = $('#inquiries');
  if (isLocalPreview) { box.innerHTML = '<p class="empty-state">ローカルプレビュー中です。お問い合わせ一覧はCloudflare環境で確認できます。</p>'; updateStat('stat-inquiries', '—'); return; }
  box.textContent = '読み込み中…';
  try { const { inquiries = [] } = await api('/api/admin/inquiries'); box.replaceChildren(); updateStat('stat-inquiries', inquiries.length); if (!inquiries.length) { escText(box, 'p', 'お問い合わせはまだありません。', 'empty-state'); return; }
    inquiries.forEach(item => { const card = document.createElement('article'); card.className = 'record'; const main = document.createElement('div'); main.className = 'record-main'; escText(main, 'strong', `${item.name}（${item.topic}）`); escText(main, 'small', `${item.email} · ${item.created_at}`); escText(main, 'p', item.message); const actions = document.createElement('div'); actions.className = 'record-actions'; const mail = document.createElement('a'); mail.className = 'button-link'; mail.href = `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent('Elua Wedding お問い合わせへの返信')}`; mail.textContent = '返信する'; actions.append(mail); card.append(main, actions); box.append(card); });
  } catch (e) { box.replaceChildren(); escText(box, 'p', e.message, 'status-error'); }
}
$('#refresh-inquiries').addEventListener('click', loadInquiries);
function updateStat(id, value) { const node = $(`#${id}`); if (node) node.textContent = value; }
async function refreshDashboard() {
  if (isLocalPreview) { setStatus('#dashboard-status', 'ローカルプレビュー中：件数や最新のお知らせはAPI接続後に表示されます。'); return; }
  try { const [p, n, g, i] = await Promise.all([api('/api/admin/plans'), api('/api/admin/notices'), api('/api/admin/gallery'), api('/api/admin/inquiries')]); updateStat('stat-plans', (p.plans || []).filter(x => x.is_published).length); updateStat('stat-notices', (n.notices || []).filter(x => x.is_published).length); updateStat('stat-gallery', (g.items || []).length); updateStat('stat-inquiries', (i.inquiries || []).length); setStatus('#dashboard-status', '最新の管理データを読み込みました。'); }
  catch (e) { setStatus('#dashboard-status', e.message, 'error'); }
}
$('#logout').addEventListener('click', () => { sessionStorage.removeItem('elua_admin_password'); password = ''; $('#password').value = ''; showLogin(); });
setActiveTab('home');
if (password) showEditor(); else showLogin();