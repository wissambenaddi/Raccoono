class PersonalitySlider extends HTMLElement {
  connectedCallback() {
    this.range = this.querySelector('input[type="range"]');
    this.cards = Array.from(this.querySelectorAll('[data-profile]'));
    if (!this.range || !this.cards.length) return;
    this.range.addEventListener('input', () => this.update());
    this.update();
  }

  update() {
    const index = Number(this.range.value);
    this.cards.forEach((card, cardIndex) => {
      card.hidden = cardIndex !== index;
      card.setAttribute('aria-hidden', cardIndex !== index ? 'true' : 'false');
    });
    this.range.setAttribute('aria-valuetext', this.cards[index]?.dataset.title || '');
  }
}

customElements.define('personality-slider', PersonalitySlider);
