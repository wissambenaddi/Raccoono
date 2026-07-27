class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.submit = this.querySelector('[type="submit"]');
    this.form?.addEventListener('submit', (event) => this.onSubmit(event));
    this.querySelectorAll('[data-option-select]').forEach((select) => select.addEventListener('change', () => this.onVariantChange()));
  }

  onVariantChange() {
    const variants = JSON.parse(this.querySelector('[data-product-variants]').textContent);
    const selected = Array.from(this.querySelectorAll('[data-option-select]')).map((select) => select.value);
    const variant = variants.find((item) => item.options.every((option, index) => option === selected[index]));
    const idInput = this.querySelector('[name="id"]');
    if (!variant || !idInput) return;
    idInput.value = variant.id;
    this.submit.disabled = !variant.available;
    this.submit.querySelector('span').textContent = variant.available ? this.dataset.addLabel : this.dataset.soldOutLabel;
    const price = this.querySelector('[data-product-price]');
    if (price) price.textContent = new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: this.dataset.currency }).format(variant.price / 100);
    history.replaceState({}, '', `${this.dataset.url}?variant=${variant.id}`);
  }

  async onSubmit(event) {
    event.preventDefault();
    if (this.submit.disabled) return;
    this.submit.disabled = true;
    this.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(this.form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.description);
      document.dispatchEvent(new CustomEvent('cart:add', { detail: result }));
      window.Raccoono.announce(this.dataset.successMessage);
    } catch (error) {
      const errorNode = this.querySelector('[data-product-error]');
      if (errorNode) {
        errorNode.textContent = error.message || this.dataset.errorMessage;
        errorNode.hidden = false;
      }
      window.Raccoono.announce(error.message || this.dataset.errorMessage);
    } finally {
      this.submit.disabled = false;
      this.removeAttribute('aria-busy');
    }
  }
}

customElements.define('product-form', ProductForm);

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-quick-add]');
  if (!form) return;
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.description);
    document.dispatchEvent(new CustomEvent('cart:add', { detail: result }));
  } catch (error) {
    window.Raccoono.announce(error.message);
  } finally {
    button.disabled = false;
  }
});
