(() => {
  const mountedHeaders = new WeakMap();

  const getFocusableElements = (container) =>
    Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('hidden'));

  const mountHeader = (section) => {
    if (!(section instanceof HTMLElement) || mountedHeaders.has(section)) return;

    const menu = section.querySelector('[data-mobile-menu]');
    if (!(menu instanceof HTMLDetailsElement)) return;

    const controller = new AbortController();
    const signal = controller.signal;
    const toggle = menu.querySelector('summary');
    const drawer = menu.querySelector('.mobile-menu__drawer');
    const closeButton = menu.querySelector('[data-menu-close]');
    const closeArea = menu.querySelector('[data-menu-close-area]');

    const closeMenu = () => {
      menu.open = false;
      document.documentElement.classList.remove('menu-open');
      if (toggle instanceof HTMLElement) toggle.focus();
    };

    menu.addEventListener(
      'toggle',
      () => {
        document.documentElement.classList.toggle('menu-open', menu.open);

        if (menu.open && drawer instanceof HTMLElement) {
          const focusable = getFocusableElements(drawer);
          window.requestAnimationFrame(() => focusable[0]?.focus());
        }
      },
      { signal }
    );

    closeButton?.addEventListener('click', closeMenu, { signal });
    closeArea?.addEventListener('click', closeMenu, { signal });

    menu.addEventListener(
      'keydown',
      (event) => {
        if (!menu.open) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
          return;
        }

        if (event.key !== 'Tab' || !(drawer instanceof HTMLElement)) return;

        const focusable = getFocusableElements(drawer);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      },
      { signal }
    );

    mountedHeaders.set(section, controller);
  };

  const unmountHeader = (section) => {
    const controller = mountedHeaders.get(section);
    if (!controller) return;

    controller.abort();
    document.documentElement.classList.remove('menu-open');
    mountedHeaders.delete(section);
  };

  const mountAllHeaders = (root = document) => {
    root.querySelectorAll('[data-header-section]').forEach(mountHeader);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAllHeaders(), { once: true });
  } else {
    mountAllHeaders();
  }

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof HTMLElement) mountAllHeaders(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    const header = event.target.matches('[data-header-section]')
      ? event.target
      : event.target.querySelector('[data-header-section]');

    if (header instanceof HTMLElement) unmountHeader(header);
  });
})();
