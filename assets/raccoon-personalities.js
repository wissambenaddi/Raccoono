(() => {
  const mountedSections = new WeakMap();

  const mountPersonalities = (section) => {
    if (!(section instanceof HTMLElement) || mountedSections.has(section)) return;

    const triggers = Array.from(section.querySelectorAll('[data-personality-trigger]'));
    const options = Array.from(section.querySelectorAll('[data-personality-option]'));
    const panel = section.querySelector('[data-personality-panel]');
    const name = section.querySelector('[data-personality-name]');
    const description = section.querySelector('[data-personality-description]');
    const progress = section.querySelector('[data-personality-progress]');

    if (
      triggers.length === 0 ||
      !(panel instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(description instanceof HTMLElement)
    ) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const selectPersonality = (selectedIndex, moveFocus = false) => {
      const normalizedIndex = (selectedIndex + triggers.length) % triggers.length;

      triggers.forEach((trigger, index) => {
        const active = index === normalizedIndex;
        trigger.setAttribute('aria-selected', active ? 'true' : 'false');
        trigger.setAttribute('tabindex', active ? '0' : '-1');
        options[index]?.classList.toggle('is-active', active);
      });

      const activeTrigger = triggers[normalizedIndex];
      name.textContent = activeTrigger.dataset.profileName || '';
      description.textContent = activeTrigger.dataset.profileDescription || '';
      panel.setAttribute('aria-labelledby', activeTrigger.id);

      if (progress instanceof HTMLElement) {
        progress.style.setProperty('--active-index', String(normalizedIndex));
      }

      if (moveFocus) activeTrigger.focus();
    };

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => selectPersonality(index), { signal });
      trigger.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            selectPersonality(index + 1, true);
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            selectPersonality(index - 1, true);
          } else if (event.key === 'Home') {
            event.preventDefault();
            selectPersonality(0, true);
          } else if (event.key === 'End') {
            event.preventDefault();
            selectPersonality(triggers.length - 1, true);
          }
        },
        { signal }
      );
    });

    section.classList.add('is-enhanced');
    selectPersonality(0);
    mountedSections.set(section, controller);
  };

  const unmountPersonalities = (section) => {
    const controller = mountedSections.get(section);
    if (!controller) return;

    controller.abort();
    section.classList.remove('is-enhanced');
    mountedSections.delete(section);
  };

  const mountAll = (root = document) => {
    root.querySelectorAll('[data-personalities-section]').forEach(mountPersonalities);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAll(), { once: true });
  } else {
    mountAll();
  }

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target instanceof HTMLElement) mountAll(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    const section = event.target.matches('[data-personalities-section]')
      ? event.target
      : event.target.querySelector('[data-personalities-section]');

    if (section instanceof HTMLElement) unmountPersonalities(section);
  });
})();
