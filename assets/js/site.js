const q = (selector, root = document) => root.querySelector(selector);
const make = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};
const safeImage = value => /^https:\/\//i.test(value || '') || /^data:image\/(jpeg|png|webp|gif);base64,/i.test(value || '') || /^\/media\/[a-zA-Z0-9/_-]+\.(jpg|png|webp|gif)$/i.test(value || '');
function videoEmbedUrl(value) { try { const url = new URL(value); if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1).split('/')[0]}`; if (/(^|\.)youtube\.com$/.test(url.hostname)) { const id = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]; return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''; } if (/(^|\.)vimeo\.com$/.test(url.hostname)) { const id = url.pathname.split('/').filter(Boolean).pop(); return /^\d+$/.test(id || '') ? `https://player.vimeo.com/video/${id}` : ''; } } catch {} return ''; }
const modal = q('#content-modal');
const modalContent = q('#modal-content');
const nav = q('#site-nav');
const menuToggle = q('.menu-toggle');
let siteContent = {};

function setText(id, value) {
  const node = document.getElementById(id);
  if (node && value !== undefined && value !== null) node.textContent = value;
}
function parseArray(value, fallback = []) {
  try { const parsed = JSON.parse(value || ''); return Array.isArray(parsed) ? parsed : fallback; }
  catch { return fallback; }
}
function openModal(content) {
  modalContent.replaceChildren();
  modalContent.append(content);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  q('.modal-close', modal).focus();
}
function closeModal() {
  modal.hidden = true;
  modalContent.replaceChildren();
  document.body.classList.remove('modal-open');
}
q('.modal-close')?.addEventListener('click', closeModal);
modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal && !modal.hidden) closeModal(); });

function getNavItems() {
  return String(siteContent.nav_items_json || '')
    .split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    .map(line => { const [key, label, order] = line.split('|'); return { key, label, order: Number(order) || 99 }; })
    .filter(item => ['home', 'plans', 'flow', 'gallery', 'news', 'faq', 'contact', 'privacy'].includes(item.key) && item.label)
    .sort((a, b) => a.order - b.order);
}
function renderNav() {
  if (!nav) return;
  nav.replaceChildren();
  getNavItems().forEach(item => {
    const link = make('a', item.key === 'contact' ? 'nav-cta' : '', item.label);
    link.href = `#${item.key}`;
    nav.append(link);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open'); nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));
}
function showPage(page) {
  const validPages = ['home', 'plans', 'flow', 'gallery', 'news', 'faq', 'contact', 'privacy', 'notice-detail'];
  const requested = String(page || '').replace(/^#/, '').split('?')[0];
  const isNoticeDetail = /^news-\d+$/.test(requested);
  const pageName = isNoticeDetail ? 'notice-detail' : (validPages.includes(requested) ? requested : 'home');
  document.querySelectorAll('[data-page]').forEach(section => { section.hidden = section.dataset.page !== pageName; });
  nav?.querySelectorAll('a').forEach(link => {
    const active = link.hash === `#${pageName}`;
    link.classList.toggle('is-current', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (!isNoticeDetail && location.hash !== `#${pageName}`) history.replaceState(null, '', `#${pageName}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (isNoticeDetail) loadNoticeDetail(Number(requested.slice(5)));
}
async function loadNoticeDetail(id) {
  const target = q('#notice-detail-content'); if (!target || !Number.isInteger(id) || id < 1) return;
  if (target.dataset.noticeId === String(id)) return;
  try { const response = await fetch('/api/notices'); const { notices = [] } = await response.json(); const notice = notices.find(item => Number(item.id) === id);
    target.replaceChildren(); if (!notice) { target.append(make('h1', '', 'お知らせが見つかりませんでした。')); return; }
    target.dataset.noticeId = String(id); target.append(make('time', '', (notice.published_at || '').slice(0, 10)), make('h1', '', notice.title), make('p', 'notice-detail-body', notice.body || ''));
  } catch { target.replaceChildren(make('p', '', 'お知らせを読み込めませんでした。')); }
}
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
});
window.addEventListener('hashchange', () => showPage(location.hash));

async function loadSite() {
  try {
    const response = await fetch('/api/site');
    if (!response.ok) throw new Error('サイト設定を読み込めませんでした。');
    const { content = {} } = await response.json();
    siteContent = content;
    setText('hero-title', content.hero_title);
    setText('hero-text', content.hero_text);
    setText('hero-note', content.hero_note);
    setText('hero-kicker', content.hero_kicker); setText('hero-cta-text', content.hero_cta_text);
    setText('concept-kicker', content.concept_kicker); setText('concept-intro', content.concept_intro); setText('plans-intro', content.plans_intro);
    setText('news-kicker', content.news_kicker); setText('gallery-kicker', content.gallery_kicker);
    setText('gallery-intro', content.gallery_intro); setText('flow-kicker', content.flow_kicker);
    setText('faq-kicker', content.faq_kicker); setText('contact-kicker', content.contact_kicker);
    setText('contact-button-text', content.contact_button_text);
    setText('concept-title', content.concept_title);
    setText('concept-text', content.concept_text);
    setText('contact-title', content.contact_title);
    setText('contact-text', content.contact_text);
    setText('contact-small', content.contact_small);
    setText('footer-text', content.footer_text);
    setText('plans-title', content.plans_title);
    setText('news-title', content.news_title);
    setText('gallery-title', content.gallery_title);
    setText('flow-title', content.flow_title);
    setText('site-brand-name', content.site_name);
    setText('footer-site-name', content.site_name);
    if (content.site_name) document.title = `${content.site_name} | ふたりらしい結婚式を`;
    const details = q('#contact-details');
    details?.replaceChildren();
    [['電話番号', content.phone], ['所在地', content.address]].forEach(([label, value]) => {
      if (!value) return;
      const row = make('p', 'contact-detail'); row.append(make('strong', '', label), make('span', '', value)); details.append(row);
    });
    if (details) details.hidden = !details.childElementCount;
    const social = q('#footer-social');
    social?.replaceChildren();
    const socialLinks = [
      { label: 'Instagram', url: content.instagram_url, visible: content.show_instagram_button !== 'false', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>' },
      { label: 'YouTube', url: content.youtube_url, visible: content.show_youtube_button !== 'false', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="m10 9 5 3-5 3z" fill="#fbf8f3"/></svg>' }
    ];
    socialLinks.forEach(({ label, url, visible, icon }) => {
      if (!visible || !/^https:\/\//i.test(url || '')) return;
      const link = make('a', 'social-button'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const symbol = make('span', 'social-icon'); symbol.innerHTML = icon; link.append(symbol, make('span', '', label)); social?.append(link);
    });
    if (social) social.hidden = !social.childElementCount;
    const lineButton = q('#floating-line-button');
    if (lineButton) {
      const showLine = content.show_line_button !== 'false' && /^https:\/\//i.test(content.line_url || '');
      lineButton.hidden = !showLine;
      if (showLine) lineButton.href = content.line_url;
    }
    if (content.hero_image_url && safeImage(content.hero_image_url)) {
      const art = q('.hero-art');
      if (art) { art.style.backgroundImage = `linear-gradient(0deg,rgba(50,38,32,.15),rgba(50,38,32,.05)),url("${content.hero_image_url.replace(/["\\]/g, '')}")`; art.style.backgroundSize = 'cover'; art.style.backgroundPosition = 'center'; }
    }
    renderHomeValues(parseArray(content.home_values_json));
    renderFlow(parseArray(content.flow_steps_json));
    renderFaq(parseArray(content.faq_items_json));
    const privacy = q('#privacy-content');
    if (privacy) privacy.textContent = content.privacy_text || '';
    renderNav();
    showPage(location.hash || '#home');
  } catch (error) { console.warn('サイト設定の読み込みに失敗しました', error); renderNav(); showPage(location.hash || '#home'); }
}
function renderHomeValues(items) {
  const box = q('.values'); if (!box) return; box.replaceChildren();
  items.forEach((item, index) => { const card = make('article'); card.append(make('span', '', String(index + 1).padStart(2, '0')), make('h3', '', item.title || ''), make('p', '', item.text || '')); box.append(card); });
}
function renderFlow(items) {
  const box = q('#flow-list'); if (!box) return; box.replaceChildren();
  items.forEach((item, index) => { const row = make('article'); row.append(make('span', '', `STEP ${String(index + 1).padStart(2, '0')}`)); const body = make('div'); body.append(make('h3', '', item.title || ''), make('p', '', item.text || '')); row.append(body); box.append(row); });
}
function renderFaq(items) {
  const box = q('#faq-list'); if (!box) return; box.replaceChildren();
  items.forEach(item => { const details = make('details', 'faq-item'); details.append(make('summary', '', item.question || '')); details.append(make('p', '', item.answer || '')); box.append(details); });
}
async function loadPlans() {
  const box = q('#plan-grid'); if (!box) return;
  try {
    const response = await fetch('/api/plans'); if (!response.ok) throw new Error();
    const { plans = [] } = await response.json(); box.replaceChildren();
    if (!plans.length) { box.append(make('p', 'loading-note', '現在公開中のプランはありません。')); return; }
    plans.forEach((plan, index) => {
      const card = make('article', 'plan-card');
      if (plan.image_url && safeImage(plan.image_url)) {
        const visual = make('button', 'plan-photo media-trigger'); visual.type = 'button'; visual.setAttribute('aria-label', `${plan.title}の画像を拡大`);
        const img = make('img'); img.src = plan.image_url; img.alt = plan.title; img.loading = 'lazy'; visual.append(img);
        visual.addEventListener('click', () => { const image = make('img', 'modal-image'); image.src = plan.image_url; image.alt = plan.title; openModal(image); }); card.append(visual);
      } else { const visual = make('div', `plan-visual plan-visual-${['a', 'b', 'c'][index % 3]}`); visual.append(make('span', '', String(index + 1).padStart(2, '0')), make('i', '', ['✿', '♡', '☼'][index % 3])); card.append(visual); }
      const body = make('div', 'plan-body'); body.append(make('p', 'plan-kicker', plan.category || 'WEDDING'), make('h3', '', plan.title), make('p', '', plan.description), make('p', 'plan-price', plan.price || '要相談'));
      const link = make('a', '', 'このプランを相談する ↗'); link.href = '#contact'; body.append(link); card.append(body); box.append(card);
    });
  } catch { box.replaceChildren(make('p', 'loading-note', 'プランを読み込めませんでした。')); }
}
async function loadNotices() {
  const box = q('#notice-list'); if (!box) return;
  try {
    const response = await fetch('/api/notices'); if (!response.ok) throw new Error();
    const { notices = [] } = await response.json(); box.replaceChildren();
    if (!notices.length) { box.append(make('p', 'loading-note', '現在お知らせはありません。')); return; }
    notices.forEach(notice => {
      const item = make('article', 'notice-item'); const link = make('button', 'notice-link'); link.type = 'button';
      link.append(make('time', '', (notice.published_at || '').slice(0, 10)), make('span', '', notice.title));
      link.addEventListener('click', () => { const detail = q('#notice-detail-content'); detail.dataset.noticeId = String(notice.id); detail.replaceChildren(make('time', '', (notice.published_at || '').slice(0, 10)), make('h1', '', notice.title), make('p', 'notice-detail-body', notice.body || '')); location.hash = `news-${notice.id}`; });
      item.append(link); box.append(item);
    });
  } catch { box.replaceChildren(make('p', 'loading-note', 'お知らせを読み込めませんでした。')); }
}
async function loadGallery() {
  const box = q('#gallery-grid'); if (!box) return;
  try {
    const response = await fetch('/api/gallery'); if (!response.ok) throw new Error();
    const { items = [] } = await response.json(); box.replaceChildren();
    if (!items.length) { box.append(make('p', 'loading-note', '写真は準備中です。')); return; }
    items.forEach(item => {
      const card = make('figure', 'gallery-item'); const button = make('button', 'gallery-media media-trigger'); button.type = 'button'; button.setAttribute('aria-label', `${item.title || '作品'}を拡大表示`);
      const embedUrl = videoEmbedUrl(item.image_url);
      if (embedUrl) { button.classList.add('video-preview'); button.append(make('span', 'video-play-icon', '▶'), make('span', 'video-preview-label', item.title || '動画を見る')); }
      else { const img = make('img'); img.src = item.image_url; img.alt = item.title || item.category || 'Wedding photo'; img.loading = 'lazy'; img.onerror = () => card.remove(); button.append(img); }
      button.addEventListener('click', () => { const content = make('div', 'gallery-modal-content'); if (embedUrl) { const frame = make('iframe', 'modal-video'); frame.src = `${embedUrl}?autoplay=1&rel=0`; frame.title = item.title || 'Wedding video'; frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; frame.allowFullscreen = true; content.append(frame); } else { const large = make('img', 'modal-image'); large.src = item.image_url; large.alt = item.title || 'Wedding photo'; content.append(large); } if (item.title) content.append(make('h2', '', item.title)); if (item.description) content.append(make('p', '', item.description)); openModal(content); });
      card.append(button); if (item.title || item.description) { const caption = make('figcaption', '', item.title || ''); if (item.description) caption.append(make('span', '', item.description)); card.append(caption); } box.append(card);
    });
  } catch { box.replaceChildren(make('p', 'loading-note', '写真を読み込めませんでした。')); }
}

loadSite(); loadPlans(); loadNotices(); loadGallery();
q('#contact-form')?.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); const status = q('#form-status');
  button.disabled = true; status.textContent = '送信しています…';
  try {
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || '送信できませんでした。');
    form.reset(); status.textContent = data.emailSent === false ? 'お問い合わせを受け付けました。管理者からの返信をお待ちください。' : 'お問い合わせを受け付けました。ありがとうございます。';
  } catch (error) { status.textContent = error.message || '送信に失敗しました。時間をおいて再度お試しください。'; }
  finally { button.disabled = false; }
});
