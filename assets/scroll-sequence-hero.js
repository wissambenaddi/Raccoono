(() => {
  const mountedSections = new WeakMap();
  const sectionSelector = '[data-scroll-sequence-hero]';
  const mobileQuery = window.matchMedia('(max-width: 46.8125rem)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const createFrameUrl = (firstFrameUrl, frameNumber) => {
    const paddedFrame = String(frameNumber).padStart(3, '0');
    return firstFrameUrl.replace(/001(?=\.(?:avif|webp)(?:[?#]|$))/i, paddedFrame);
  };

  const mountSequence = (section) => {
    if (!(section instanceof HTMLElement) || mountedSections.has(section)) return;

    const stage = section.querySelector('[data-sequence-stage]');
    const canvas = section.querySelector('[data-sequence-canvas]');
    const fallback = section.querySelector('[data-sequence-fallback]');
    const toggle = section.querySelector('[data-sequence-toggle]');
    const toggleLabel = section.querySelector('[data-sequence-toggle-label]');

    if (!(stage instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    const controller = new AbortController();
    const signal = controller.signal;
    const enabled = section.dataset.enabled === 'true';
    const pauseWhenHidden = section.dataset.pauseWhenHidden !== 'false';
    const durationMs = clamp(Number(section.dataset.loopDuration) || 9000, 8000, 12000);

    const state = {
      currentIndex: 0,
      drawnIndex: -1,
      frameCount: 1,
      firstFrameUrl: '',
      frames: new Map(),
      observer: null,
      rafId: 0,
      idleId: 0,
      preloadGeneration: 0,
      startedAt: 0,
      elapsedMs: 0,
      visible: !('IntersectionObserver' in window),
      documentVisible: !document.hidden,
      userPaused: false
    };

    const configureSource = () => {
      const mobile = mobileQuery.matches;
      const firstFrameUrl = mobile
        ? section.dataset.mobileFirstUrl
        : section.dataset.desktopFirstUrl;
      const frameCount = Number.parseInt(
        mobile ? section.dataset.mobileFrames : section.dataset.desktopFrames,
        10
      );

      state.firstFrameUrl = firstFrameUrl || '';
      state.frameCount = Number.isFinite(frameCount) ? Math.max(frameCount, 1) : 1;
      state.currentIndex = 0;
      state.drawnIndex = -1;
      state.elapsedMs = 0;
      state.startedAt = 0;
      state.frames.clear();
      state.preloadGeneration += 1;
      section.classList.remove('is-sequence-ready');
      canvas.setAttribute('aria-hidden', 'true');
      fallback?.removeAttribute('aria-hidden');
    };

    const resizeCanvas = () => {
      const bounds = stage.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(Math.round(bounds.width * pixelRatio), 1);
      const height = Math.max(Math.round(bounds.height * pixelRatio), 1);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const drawImageCover = (image, index) => {
      if (!(image instanceof HTMLImageElement) || image.naturalWidth === 0) return;

      resizeCanvas();

      const scale = Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const offsetX = (canvas.width - width) / 2;
      const offsetY = (canvas.height - height) / 2;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, offsetX, offsetY, width, height);
      state.drawnIndex = index;
      section.classList.add('is-sequence-ready');
      canvas.removeAttribute('aria-hidden');
      fallback?.setAttribute('aria-hidden', 'true');
    };

    const loadFrame = (index) => {
      const safeIndex = clamp(index, 0, state.frameCount - 1);
      const existing = state.frames.get(safeIndex);
      if (existing) return existing.promise;

      const image = new Image();
      image.decoding = 'async';

      const record = {
        image,
        status: 'loading',
        promise: null
      };

      record.promise = new Promise((resolve) => {
        image.addEventListener(
          'load',
          () => {
            record.status = 'ready';
            resolve(image);
          },
          { once: true }
        );
        image.addEventListener(
          'error',
          () => {
            record.status = 'error';
            resolve(null);
          },
          { once: true }
        );
      });

      state.frames.set(safeIndex, record);
      image.src = createFrameUrl(state.firstFrameUrl, safeIndex + 1);
      return record.promise;
    };

    const drawNearestReadyFrame = (targetIndex) => {
      let nearest = null;

      state.frames.forEach((record, index) => {
        if (record.status !== 'ready') return;

        const directDistance = Math.abs(index - targetIndex);
        const loopDistance = state.frameCount - directDistance;
        const distance = Math.min(directDistance, loopDistance);

        if (!nearest || distance < nearest.distance) {
          nearest = { index, distance, image: record.image };
        }
      });

      if (nearest) drawImageCover(nearest.image, nearest.index);
    };

    const requestFrame = (index) => {
      const safeIndex = clamp(index, 0, state.frameCount - 1);
      state.currentIndex = safeIndex;

      const record = state.frames.get(safeIndex);
      if (record?.status === 'ready') {
        if (state.drawnIndex !== safeIndex) drawImageCover(record.image, safeIndex);
        return;
      }

      drawNearestReadyFrame(safeIndex);
      loadFrame(safeIndex).then((image) => {
        if (image && state.currentIndex === safeIndex) {
          drawImageCover(image, safeIndex);
        }
      });
    };

    const cancelIdleTask = () => {
      if (!state.idleId) return;

      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(state.idleId);
      } else {
        window.clearTimeout(state.idleId);
      }

      state.idleId = 0;
    };

    const scheduleIdleTask = (callback) => {
      if ('requestIdleCallback' in window) {
        state.idleId = window.requestIdleCallback(callback, { timeout: 450 });
      } else {
        state.idleId = window.setTimeout(callback, 60);
      }
    };

    const beginProgressivePreload = () => {
      cancelIdleTask();

      const generation = state.preloadGeneration;
      const order = Array.from({ length: state.frameCount }, (_, index) => index).sort(
        (first, second) => {
          const firstDistance = Math.min(
            Math.abs(first - state.currentIndex),
            state.frameCount - Math.abs(first - state.currentIndex)
          );
          const secondDistance = Math.min(
            Math.abs(second - state.currentIndex),
            state.frameCount - Math.abs(second - state.currentIndex)
          );
          return firstDistance - secondDistance;
        }
      );
      let cursor = 0;

      const loadNext = () => {
        if (generation !== state.preloadGeneration || cursor >= order.length) return;

        const index = order[cursor];
        cursor += 1;

        scheduleIdleTask(() => {
          state.idleId = 0;
          loadFrame(index).finally(loadNext);
        });
      };

      loadNext();
    };

    const shouldPlay = () =>
      enabled &&
      !motionQuery.matches &&
      !state.userPaused &&
      state.documentVisible &&
      (!pauseWhenHidden || state.visible);

    const stopLoop = () => {
      if (state.rafId) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      }

      if (state.startedAt) {
        state.elapsedMs = (performance.now() - state.startedAt) % durationMs;
        state.startedAt = 0;
      }
    };

    const tick = (timestamp) => {
      state.rafId = 0;
      if (!shouldPlay()) return;

      if (!state.startedAt) {
        state.startedAt = timestamp - state.elapsedMs;
      }

      const elapsed = (timestamp - state.startedAt) % durationMs;
      const progress = elapsed / durationMs;
      const frameIndex = Math.min(
        Math.floor(progress * state.frameCount),
        state.frameCount - 1
      );

      requestFrame(frameIndex);
      state.rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!shouldPlay() || state.rafId) return;
      state.rafId = window.requestAnimationFrame(tick);
    };

    const syncPlayback = () => {
      if (shouldPlay()) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const updateToggle = () => {
      if (!(toggle instanceof HTMLButtonElement)) return;

      const paused = state.userPaused;
      const label = paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel;

      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', label || '');
      section.classList.toggle('is-user-paused', paused);

      if (toggleLabel instanceof HTMLElement) {
        toggleLabel.textContent = label || '';
      }
    };

    const activateAnimatedMode = () => {
      section.classList.remove('is-static');

      if ('IntersectionObserver' in window && !state.observer) {
        state.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              state.visible = entry.isIntersecting;

              if (entry.isIntersecting) {
                beginProgressivePreload();
              }

              syncPlayback();
            });
          },
          { rootMargin: '50% 0px 50% 0px', threshold: 0.01 }
        );
      }

      if (state.observer) {
        state.observer.observe(section);
      } else {
        state.visible = true;
        beginProgressivePreload();
      }

      loadFrame(0).then((image) => {
        if (image && state.drawnIndex < 0) drawImageCover(image, 0);
        syncPlayback();
      });
    };

    const activateStaticMode = () => {
      state.observer?.disconnect();
      stopLoop();
      section.classList.add('is-static');

      const reducedFrame = section.dataset.reducedFrame || 'fallback';
      if (!enabled || reducedFrame === 'fallback') {
        section.classList.remove('is-sequence-ready');
        canvas.setAttribute('aria-hidden', 'true');
        fallback?.removeAttribute('aria-hidden');
        return;
      }

      const index =
        reducedFrame === 'last'
          ? state.frameCount - 1
          : Math.round((state.frameCount - 1) / 2);

      loadFrame(index).then((image) => {
        if (image) drawImageCover(image, index);
      });
    };

    const refreshMode = () => {
      cancelIdleTask();
      state.preloadGeneration += 1;

      if (enabled && !motionQuery.matches) {
        activateAnimatedMode();
      } else {
        activateStaticMode();
      }
    };

    const handleSourceChange = () => {
      stopLoop();
      configureSource();
      refreshMode();
    };

    const handleResize = () => {
      if (state.drawnIndex < 0) return;

      const record = state.frames.get(state.drawnIndex);
      if (record?.status === 'ready') {
        drawImageCover(record.image, state.drawnIndex);
      }
    };

    const handleVisibilityChange = () => {
      state.documentVisible = !document.hidden;
      syncPlayback();
    };

    configureSource();
    updateToggle();
    refreshMode();

    window.addEventListener('resize', handleResize, { passive: true, signal });
    document.addEventListener('visibilitychange', handleVisibilityChange, { signal });
    mobileQuery.addEventListener('change', handleSourceChange, { signal });
    motionQuery.addEventListener('change', refreshMode, { signal });

    if (toggle instanceof HTMLButtonElement) {
      toggle.addEventListener(
        'click',
        () => {
          state.userPaused = !state.userPaused;
          updateToggle();
          syncPlayback();
        },
        { signal }
      );
    }

    mountedSections.set(section, {
      controller,
      destroy: () => {
        state.observer?.disconnect();
        cancelIdleTask();
        stopLoop();
      }
    });
  };

  const unmountSequence = (section) => {
    const mounted = mountedSections.get(section);
    if (!mounted) return;

    mounted.destroy();
    mounted.controller.abort();
    mountedSections.delete(section);
  };

  const mountAll = (root = document) => {
    if (root instanceof HTMLElement && root.matches(sectionSelector)) {
      mountSequence(root);
    }

    root.querySelectorAll?.(sectionSelector).forEach(mountSequence);
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

    const section = event.target.matches(sectionSelector)
      ? event.target
      : event.target.querySelector(sectionSelector);

    if (section instanceof HTMLElement) unmountSequence(section);
  });
})();
