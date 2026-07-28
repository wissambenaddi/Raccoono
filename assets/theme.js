(() => {
  const sectionControllers = new WeakMap();
  const sectionSelector = '[id^="shopify-section-"]';
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const getSectionId = (section) => {
    if (!(section instanceof HTMLElement)) return '';
    return section.dataset.sectionId || section.id.replace('shopify-section-', '');
  };

  const mountSection = (section) => {
    if (!(section instanceof HTMLElement) || sectionControllers.has(section)) return;

    const controller = new AbortController();
    sectionControllers.set(section, controller);

    section.dispatchEvent(
      new CustomEvent('raccoono:section:mount', {
        bubbles: true,
        detail: {
          sectionId: getSectionId(section),
          signal: controller.signal
        }
      })
    );
  };

  const unmountSection = (section) => {
    if (!(section instanceof HTMLElement)) return;

    const controller = sectionControllers.get(section);
    if (!controller) return;

    section.dispatchEvent(
      new CustomEvent('raccoono:section:unmount', {
        bubbles: true,
        detail: {
          sectionId: getSectionId(section)
        }
      })
    );

    controller.abort();
    sectionControllers.delete(section);
  };

  const updateMotionPreference = () => {
    document.documentElement.dataset.reducedMotion = motionQuery.matches ? 'true' : 'false';
  };

  const announce = (message) => {
    const liveRegion = document.getElementById('RaccoonoLiveRegion');
    if (!liveRegion || typeof message !== 'string') return;

    liveRegion.textContent = '';
    window.requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  };

  const initializeTheme = () => {
    document.querySelectorAll(sectionSelector).forEach(mountSection);
    updateMotionPreference();

    document.dispatchEvent(
      new CustomEvent('raccoono:ready', {
        detail: {
          reducedMotion: motionQuery.matches
        }
      })
    );
  };

  document.addEventListener('shopify:section:load', (event) => {
    mountSection(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    unmountSection(event.target);
  });

  document.addEventListener('raccoono:announce', (event) => {
    announce(event.detail?.message);
  });

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', updateMotionPreference);
  } else {
    motionQuery.addListener(updateMotionPreference);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme, { once: true });
  } else {
    initializeTheme();
  }
})();
