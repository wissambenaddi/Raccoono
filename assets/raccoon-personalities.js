(() => {
  const mountedSections = new WeakMap();

  const normalizeText = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

  const getProfileContent = (profile) => {
    if (!(profile instanceof HTMLElement)) {
      return { name: '', quote: '', description: '' };
    }

    return {
      name: normalizeText(profile.querySelector('[data-profile-name]')?.textContent),
      quote: normalizeText(profile.querySelector('[data-profile-quote]')?.textContent),
      description: normalizeText(profile.querySelector('[data-profile-description]')?.textContent)
    };
  };

  const mountPersonalities = (section) => {
    if (!(section instanceof HTMLElement) || mountedSections.has(section)) return;

    const range = section.querySelector('[data-personality-range]');
    const profiles = Array.from(section.querySelectorAll('[data-personality-profile]'));
    const activeName = section.querySelector('[data-personality-active-name]');
    const liveRegion = section.querySelector('[data-personality-live]');

    if (!(range instanceof HTMLInputElement) || profiles.length === 0) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const selectProfile = (requestedIndex, announce = true) => {
      const numericIndex = Number.parseInt(String(requestedIndex), 10);
      const safeIndex = Number.isFinite(numericIndex)
        ? Math.min(Math.max(numericIndex, 0), profiles.length - 1)
        : 0;
      const selectedProfile = profiles[safeIndex];
      const content = getProfileContent(selectedProfile);

      range.value = String(safeIndex);
      range.setAttribute('aria-valuetext', content.name);

      profiles.forEach((profile, index) => {
        const active = index === safeIndex;
        profile.dataset.active = active ? 'true' : 'false';

        if (active) {
          profile.setAttribute('aria-current', 'true');
        } else {
          profile.removeAttribute('aria-current');
        }
      });

      if (activeName instanceof HTMLElement) {
        activeName.textContent = content.name;
      }

      if (announce && liveRegion instanceof HTMLElement) {
        liveRegion.textContent = [content.name, content.quote, content.description].filter(Boolean).join('. ');
      }
    };

    const handleInput = () => {
      selectProfile(range.value);
    };

    const handleKeydown = (event) => {
      if (event.key === 'Home') {
        event.preventDefault();
        selectProfile(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        selectProfile(profiles.length - 1);
      }
    };

    range.addEventListener('input', handleInput, { signal });
    range.addEventListener('change', handleInput, { signal });
    range.addEventListener('keydown', handleKeydown, { signal });

    section.classList.add('is-enhanced');
    selectProfile(0, false);
    mountedSections.set(section, { controller, selectProfile });
  };

  const unmountPersonalities = (section) => {
    const mounted = mountedSections.get(section);
    if (!mounted) return;

    mounted.controller.abort();
    section.classList.remove('is-enhanced');
    mountedSections.delete(section);
  };

  const mountAll = (root = document) => {
    if (root instanceof HTMLElement && root.matches('[data-personalities-section]')) {
      mountPersonalities(root);
    }

    root.querySelectorAll?.('[data-personalities-section]').forEach(mountPersonalities);
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

  document.addEventListener('shopify:block:select', (event) => {
    if (!(event.target instanceof HTMLElement)) return;

    const profile = event.target.matches('[data-personality-profile]')
      ? event.target
      : event.target.querySelector('[data-personality-profile]');
    const section = profile?.closest('[data-personalities-section]');

    if (!(profile instanceof HTMLElement) || !(section instanceof HTMLElement)) return;

    const mounted = mountedSections.get(section);
    if (!mounted) return;

    mounted.selectProfile(profile.dataset.profileIndex);
  });
})();
