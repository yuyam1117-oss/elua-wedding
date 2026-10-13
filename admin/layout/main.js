/* Elua Wedding admin layout: responsive sidebar and mobile drawer. */
(() => {
  const layout = document.getElementById('admin-layout');
  const sidebar = document.getElementById('admin-sidebar');
  const toggle = document.getElementById('menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!layout || !sidebar || !toggle || !backdrop) return;

  const setMenuOpen = (open) => {
    layout.classList.toggle('sidebar-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '管理メニューを閉じる' : '管理メニューを開く');
    document.body.classList.toggle('admin-menu-open', open);
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(!layout.classList.contains('sidebar-open'));
  });
  backdrop.addEventListener('click', () => setMenuOpen(false));
  sidebar.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => setMenuOpen(false));
  });
  document.addEventListener('admin:tab-change', () => setMenuOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenuOpen(false);
  });
})();