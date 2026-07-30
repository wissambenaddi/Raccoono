(() => {
  class RaccoonoProductPage extends HTMLElement {
    connectedCallback() {
      if (this.abortController) return;

      this.abortController = new AbortController();
      this.signal = this.abortController.signal;
      this.variantSelect = this.querySelector('[data-variant-select]');
      this.gallery = this.querySelector('[data-product-gallery]');
      this.variantData = this.readVariantData();

      this.addEventListener('click', this.handleClick.bind(this), { signal: this.signal });
      this.addEventListener('change', this.handleChange.bind(this), { signal: this.signal });
      this.addEventListener('keydown', this.handleKeydown.bind(this), { signal: this.signal });

      const productForm = this.querySelector('form[action*="/cart/add"]');
      productForm?.addEventListener('submit', this.handleSubmit.bind(this), { signal: this.signal });

      this.syncGalleryCounter();
      this.updateOptionAvailability();
    }

    disconnectedCallback() {
      this.abortController?.abort();
      this.abortController = null;
    }

    readVariantData() {
      const dataElement = this.querySelector('[data-product-variants]');
      if (!dataElement) return [];

      try {
        return JSON.parse(dataElement.textContent);
      } catch (error) {
        return [];
      }
    }

    handleClick(event) {
      const thumbnail = event.target.closest('[data-gallery-thumbnail]');
      if (thumbnail && this.contains(thumbnail)) {
        this.selectMedia(thumbnail.dataset.mediaId);
        return;
      }

      if (event.target.closest('[data-gallery-previous]')) {
        this.stepGallery(-1);
        return;
      }

      if (event.target.closest('[data-gallery-next]')) {
        this.stepGallery(1);
        return;
      }

      const decreaseButton = event.target.closest('[data-quantity-decrease]');
      const increaseButton = event.target.closest('[data-quantity-increase]');
      if (decreaseButton || increaseButton) {
        this.changeQuantity(increaseButton ? 1 : -1);
      }
    }

    handleChange(event) {
      if (event.target.matches('[data-option-value]')) {
        this.handleOptionChange(event.target);
        return;
      }

      if (event.target.matches('[data-variant-select]')) {
        const variant = this.variantData.find((item) => String(item.id) === event.target.value);
        if (variant) this.updateVariant(variant);
      }
    }

    handleKeydown(event) {
      const thumbnail = event.target.closest('[data-gallery-thumbnail]');
      if (!thumbnail) return;

      const thumbnails = this.getThumbnails();
      const currentIndex = thumbnails.indexOf(thumbnail);
      if (currentIndex < 0) return;

      let nextIndex = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % thumbnails.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = thumbnails.length - 1;
      }

      if (nextIndex === null) return;
      event.preventDefault();
      const nextThumbnail = thumbnails[nextIndex];
      this.selectMedia(nextThumbnail.dataset.mediaId, true);
    }

    handleSubmit() {
      const button = this.querySelector('[data-add-to-cart]');
      if (!button || button.disabled) return;

      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
    }

    handleOptionChange(input) {
      const productUrl = input.dataset.productUrl;
      if (productUrl) {
        window.location.assign(productUrl);
        return;
      }

      const fieldset = input.closest('[data-product-option]');
      const selectedLabel = fieldset?.querySelector('[data-selected-option-value]');
      if (selectedLabel) selectedLabel.textContent = input.value;

      const selectedInputs = this.getSelectedOptionInputs();
      const selectedOptions = selectedInputs.map((optionInput) => optionInput.value);
      const variant = this.variantData.find(
        (item) =>
          item.options.length === selectedOptions.length &&
          item.options.every((optionValue, index) => optionValue === selectedOptions[index])
      );

      if (variant) {
        this.updateVariant(variant);
        return;
      }

      const optionValueIds = selectedInputs.map((optionInput) => optionInput.dataset.optionValueId).filter(Boolean);
      if (optionValueIds.length === selectedInputs.length && optionValueIds.length > 0) {
        const url = new URL(this.dataset.productUrl, window.location.origin);
        url.searchParams.set('option_values', optionValueIds.join(','));
        window.location.assign(url.toString());
        return;
      }

      this.updateUnavailableState();
    }

    getSelectedOptionInputs() {
      return Array.from(this.querySelectorAll('[data-product-option]'))
        .sort((first, second) => Number(first.dataset.optionPosition) - Number(second.dataset.optionPosition))
        .map((fieldset) => fieldset.querySelector('[data-option-value]:checked'))
        .filter(Boolean);
    }

    updateVariant(variant) {
      if (this.variantSelect) this.variantSelect.value = String(variant.id);

      this.updatePrice(variant);
      this.updateAvailability(variant);
      this.updateSku(variant);
      this.updateAddButton(variant);
      this.updateOptionAvailability();
      this.updateUrl(variant);

      if (variant.featuredMediaId) this.selectMedia(String(variant.featuredMediaId));

      this.dispatchEvent(
        new CustomEvent('raccoono:variant:change', {
          bubbles: true,
          detail: { variant }
        })
      );
    }

    updatePrice(variant) {
      const price = this.querySelector('[data-product-price]');
      if (!price) return;

      const currentPrice = price.querySelector('[data-current-price]');
      const comparePrice = price.querySelector('[data-compare-price]');
      const compareLabel = price.querySelector('[data-compare-label]');

      if (currentPrice) currentPrice.textContent = variant.price;
      if (comparePrice) {
        comparePrice.textContent = variant.compareAtPrice || '';
        comparePrice.hidden = !variant.compareAtPrice;
      }
      if (compareLabel) compareLabel.hidden = !variant.compareAtPrice;
      price.classList.toggle('price--sale', Boolean(variant.compareAtPrice));

      const unitPrice = this.querySelector('[data-unit-price]');
      if (!unitPrice) return;

      if (variant.unitPrice && variant.unitReferenceUnit) {
        const referenceValue = Number(variant.unitReferenceValue) === 1 ? '' : variant.unitReferenceValue;
        unitPrice.textContent = `${variant.unitPrice} / ${referenceValue || ''}${variant.unitReferenceUnit}`;
        unitPrice.hidden = false;
      } else {
        unitPrice.textContent = '';
        unitPrice.hidden = true;
      }
    }

    updateAvailability(variant) {
      const availability = this.querySelector('[data-product-availability]');
      const text = availability?.querySelector('[data-availability-text]');
      if (!availability || !text) return;

      const isLowStock =
        variant.available &&
        variant.inventoryManaged &&
        variant.inventoryPolicy !== 'continue' &&
        variant.inventoryQuantity > 0 &&
        variant.inventoryQuantity <= 5;

      availability.classList.remove('is-available', 'is-low', 'is-unavailable');
      if (!variant.available) {
        availability.classList.add('is-unavailable');
        text.textContent = availability.dataset.labelSoldOut;
      } else if (isLowStock) {
        availability.classList.add('is-low');
        text.textContent = availability.dataset.labelLowStock;
      } else {
        availability.classList.add('is-available');
        text.textContent = availability.dataset.labelInStock;
      }
    }

    updateSku(variant) {
      const sku = this.querySelector('[data-product-sku]');
      const value = sku?.querySelector('[data-sku-value]');
      if (!sku || !value) return;

      value.textContent = variant.sku || '';
      sku.hidden = !variant.sku;
    }

    updateAddButton(variant) {
      const button = this.querySelector('[data-add-to-cart]');
      const text = button?.querySelector('[data-add-to-cart-text]');
      if (!button || !text) return;

      button.disabled = !variant.available;
      text.textContent = variant.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
    }

    updateUnavailableState() {
      const availability = this.querySelector('[data-product-availability]');
      const availabilityText = availability?.querySelector('[data-availability-text]');
      const button = this.querySelector('[data-add-to-cart]');
      const buttonText = button?.querySelector('[data-add-to-cart-text]');

      availability?.classList.remove('is-available', 'is-low');
      availability?.classList.add('is-unavailable');
      if (availabilityText) availabilityText.textContent = availability.dataset.labelUnavailable;
      if (button) button.disabled = true;
      if (buttonText) buttonText.textContent = button.dataset.labelUnavailable;
    }

    updateOptionAvailability() {
      if (this.variantData.length === 0 || this.variantData.length >= 250) return;

      const selectedInputs = this.getSelectedOptionInputs();
      const selectedOptions = selectedInputs.map((input) => input.value);
      const fieldsets = Array.from(this.querySelectorAll('[data-product-option]')).sort(
        (first, second) => Number(first.dataset.optionPosition) - Number(second.dataset.optionPosition)
      );

      fieldsets.forEach((fieldset, optionIndex) => {
        fieldset.querySelectorAll('[data-option-value]').forEach((input) => {
          if (input.checked) {
            input.disabled = false;
            return;
          }

          const candidateOptions = [...selectedOptions];
          candidateOptions[optionIndex] = input.value;
          const isAvailable = this.variantData.some(
            (variant) =>
              variant.available &&
              variant.options.length === candidateOptions.length &&
              variant.options.every((optionValue, index) => optionValue === candidateOptions[index])
          );
          input.disabled = !isAvailable;
        });
      });
    }

    updateUrl(variant) {
      if (!window.history?.replaceState) return;

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    changeQuantity(delta) {
      const input = this.querySelector('[data-quantity-input]');
      if (!input) return;

      const minimum = Number(input.min) || 1;
      const maximum = input.max ? Number(input.max) : Number.POSITIVE_INFINITY;
      const current = Number(input.value) || minimum;
      const next = Math.min(maximum, Math.max(minimum, current + delta));
      input.value = String(next);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    getThumbnails() {
      return Array.from(this.querySelectorAll('[data-gallery-thumbnail]'));
    }

    stepGallery(direction) {
      const thumbnails = this.getThumbnails();
      if (thumbnails.length === 0) return;

      const activeIndex = thumbnails.findIndex((thumbnail) => thumbnail.getAttribute('aria-selected') === 'true');
      const nextIndex = (activeIndex + direction + thumbnails.length) % thumbnails.length;
      this.selectMedia(thumbnails[nextIndex].dataset.mediaId);
    }

    selectMedia(mediaId, focusThumbnail = false) {
      if (!mediaId) return;

      const panels = Array.from(this.querySelectorAll('[data-product-media]'));
      const thumbnails = this.getThumbnails();
      const selectedPanel = panels.find((panel) => panel.dataset.mediaId === String(mediaId));
      const selectedThumbnail = thumbnails.find((thumbnail) => thumbnail.dataset.mediaId === String(mediaId));
      if (!selectedPanel) return;

      panels.forEach((panel) => {
        const isSelected = panel === selectedPanel;
        panel.hidden = !isSelected;
        panel.classList.toggle('is-active', isSelected);
        if (!isSelected) panel.querySelectorAll('video').forEach((video) => video.pause());
      });

      thumbnails.forEach((thumbnail) => {
        const isSelected = thumbnail === selectedThumbnail;
        thumbnail.classList.toggle('is-active', isSelected);
        thumbnail.setAttribute('aria-selected', String(isSelected));
        thumbnail.tabIndex = isSelected ? 0 : -1;
      });

      if (selectedThumbnail) {
        selectedThumbnail.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center'
        });
        if (focusThumbnail) selectedThumbnail.focus();
      }

      this.syncGalleryCounter();
    }

    syncGalleryCounter() {
      const thumbnails = this.getThumbnails();
      const current = this.querySelector('[data-gallery-current]');
      if (!current || thumbnails.length === 0) return;

      const activeIndex = thumbnails.findIndex((thumbnail) => thumbnail.getAttribute('aria-selected') === 'true');
      current.textContent = String(Math.max(activeIndex, 0) + 1);
    }
  }

  class RaccoonoProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this.abortController || this.querySelector('.product-recommendations__section')) return;

      const url = this.dataset.recommendationsUrl;
      if (!url) return;

      this.abortController = new AbortController();
      fetch(url, { signal: this.abortController.signal })
        .then((response) => (response.ok ? response.text() : ''))
        .then((html) => {
          if (!html) return;

          const documentFragment = new DOMParser().parseFromString(html, 'text/html');
          const recommendations = documentFragment.querySelector('product-recommendations');
          if (recommendations?.innerHTML.trim()) this.innerHTML = recommendations.innerHTML;
        })
        .catch((error) => {
          if (error.name !== 'AbortError') this.remove();
        });
    }

    disconnectedCallback() {
      this.abortController?.abort();
      this.abortController = null;
    }
  }

  if (!customElements.get('product-page')) {
    customElements.define('product-page', RaccoonoProductPage);
  }

  if (!customElements.get('product-recommendations')) {
    customElements.define('product-recommendations', RaccoonoProductRecommendations);
  }
})();
