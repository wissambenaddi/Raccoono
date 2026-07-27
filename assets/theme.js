class RaccoonoTheme {
  constructor() {
    this.bindDrawers();
    this.bindDetails();
    this.bindAutoSubmit();
    this.bindScrollHeader();
  }

  bindDrawers(root = document) {
    root.querySelectorAll('[data-drawer-open]').forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => this.openDrawer(button.dataset.drawerOpen));
    });
    root.querySelectorAll('[data-drawer-close]').forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => this.closeDrawer(button.closest('[data-drawer]')));
    });
    root.querySelectorAll('[data-drawer]').forEach((drawer) => {
      if (drawer.dataset.bound) return;
      drawer.dataset.bound = 'true';
      drawer.addEventListener('click', (event) => {
        if (event.target === drawer) this.closeDrawer(drawer);
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeDrawer(document.querySelector('[data-drawer].is-open'));
    });
  }

  openDrawer(id) {
    const drawer = document.getElementById(id);
    if (!drawer) return;
    drawer.dataset.returnFocus = document.activeElement.id || '';
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    drawer.querySelector('button, a, input, select')?.focus();
  }

  closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    const target = document.getElementById(drawer.dataset.returnFocus);
    target?.focus();
  }

  bindDetails(root = document) {
    root.querySelectorAll('[data-single-open] details').forEach((detail) => {
      if (detail.dataset.bound) return;
      detail.dataset.bound = 'true';
      detail.addEventListener('toggle', () => {
        if (!detail.open) return;
        detail.parentElement.querySelectorAll('details[open]').forEach((other) => {
          if (other !== detail) other.open = false;
        });
      });
    });
  }

  bindAutoSubmit(root = document) {
    root.querySelectorAll('[data-auto-submit]').forEach((select) => {
      if (select.dataset.bound) return;
      select.dataset.bound = 'true';
      select.addEventListener('change', () => select.form?.requestSubmit());
    });
  }

  bindScrollHeader() {
    const header = document.querySelector('[data-site-header]');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  announce(message) {
    const region = document.querySelector('[data-live-region]');
    if (region) region.textContent = message;
  }
}

window.Raccoono = new RaccoonoTheme();
document.addEventListener('shopify:section:load', (event) => {
  window.Raccoono.bindDrawers(event.target);
  window.Raccoono.bindDetails(event.target);
  window.Raccoono.bindAutoSubmit(event.target);
});
