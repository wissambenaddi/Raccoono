class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('[data-cart-panel]');
    this.content = this.querySelector('[data-cart-content]');
    this.addEventListener('click', (event) => this.handleClick(event));
    document.addEventListener('cart:add', () => this.refresh(true));
    document.addEventListener('cart:refresh', () => this.refresh(false));
  }

  async handleClick(event) {
    const quantity = event.target.closest('[data-cart-quantity]');
    const remove = event.target.closest('[data-cart-remove]');
    if (!quantity && !remove) return;
    event.preventDefault();
    const line = Number((quantity || remove).dataset.line);
    let nextQuantity = 0;
    if (quantity) {
      const input = this.querySelector(`[data-line-input="${line}"]`);
      nextQuantity = Math.max(0, Number(input.value) + Number(quantity.dataset.delta));
    }
    await this.change(line, nextQuantity);
  }

  async change(line, quantity) {
    this.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity })
      });
      if (!response.ok) throw new Error('Cart update failed');
      await this.refresh(false);
      window.Raccoono.announce(this.dataset.updatedMessage);
    } catch (error) {
      window.Raccoono.announce(this.dataset.errorMessage);
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  async refresh(openAfter) {
    const response = await fetch(window.Shopify.routes.root + 'cart.js', {
      headers: { Accept: 'application/json' }
    });
    const cart = await response.json();
    this.render(cart);
    document.querySelectorAll('[data-cart-count]').forEach((count) => {
      count.textContent = cart.item_count;
      count.hidden = cart.item_count === 0;
    });
    if (openAfter && this.dataset.openAfterAdd === 'true') window.Raccoono.openDrawer(this.id);
  }

  render(cart) {
    if (!cart.items.length) {
      this.content.innerHTML = `<div class="cart-empty"><p>${this.dataset.emptyMessage}</p><a class="button" href="${this.dataset.continueUrl}">${this.dataset.continueMessage}</a></div>`;
      return;
    }
    const items = cart.items.map((item, index) => {
      const image = item.image ? `<img src="${item.image.replace(/(\.[a-z]+)(\?.*)?$/i, '_200x$1$2')}" alt="${this.escape(item.product_title)}" width="96" height="96">` : '';
      const variant = item.variant_title ? `<p class="cart-item__variant">${this.escape(item.variant_title)}</p>` : '';
      return `<article class="cart-item">
        <a class="cart-item__image" href="${item.url}">${image}</a>
        <div class="cart-item__content">
          <a href="${item.url}"><strong>${this.escape(item.product_title)}</strong></a>${variant}
          <span>${this.money(item.final_line_price)}</span>
          <div class="quantity">
            <button type="button" data-cart-quantity data-line="${index + 1}" data-delta="-1" aria-label="${this.dataset.decreaseMessage}">−</button>
            <input data-line-input="${index + 1}" value="${item.quantity}" inputmode="numeric" aria-label="${this.dataset.quantityMessage}" readonly>
            <button type="button" data-cart-quantity data-line="${index + 1}" data-delta="1" aria-label="${this.dataset.increaseMessage}">+</button>
            <button class="cart-item__remove" type="button" data-cart-remove data-line="${index + 1}">${this.dataset.removeMessage}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    const threshold = Number(this.dataset.threshold);
    const progress = threshold > 0 ? Math.min(100, cart.total_price / threshold * 100) : 100;
    const remaining = Math.max(0, threshold - cart.total_price);
    const shipping = threshold > 0 ? `<div class="shipping-progress"><p>${remaining === 0 ? this.dataset.shippingUnlocked : this.dataset.shippingRemaining.replace('[amount]', this.money(remaining))}</p><span><i style="width:${progress}%"></i></span></div>` : '';
    this.content.innerHTML = `<div class="cart-items">${items}</div>${shipping}<div class="cart-footer"><div class="cart-subtotal"><strong>${this.dataset.subtotalMessage}</strong><strong>${this.money(cart.total_price)}</strong></div><p class="muted">${this.dataset.taxMessage}</p><a class="button" href="${this.dataset.checkoutUrl}">${this.dataset.checkoutMessage}</a><a href="${this.dataset.cartUrl}">${this.dataset.viewCartMessage}</a></div>`;
  }

  money(cents) {
    return new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: this.dataset.currency }).format(cents / 100);
  }

  escape(value) {
    const element = document.createElement('div');
    element.textContent = value || '';
    return element.innerHTML;
  }
}

customElements.define('cart-drawer', CartDrawer);
