export class UI {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.equations = [];
    this.colors = [
      '#6366f1', // Indigo
      '#ef4444', // Red
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#06b6d4', // Cyan
    ];

    this.init();
  }

  init() {
    // Start with one equation
    this.addEquation('sin(x)');
    this.addEquation('x^2');
    this.render();
  }

  addEquation(expression = '') {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const color = this.colors[this.equations.length % this.colors.length];
    this.equations.push({ id, expression, color, isVisible: true });
    this.render();
    this.notify();
  }

  removeEquation(id) {
    this.equations = this.equations.filter(eq => eq.id !== id);
    this.render();
    this.notify();
  }

  updateEquation(id, expression) {
    const eq = this.equations.find(e => e.id === id);
    if (eq) {
      eq.expression = expression;
      this.notify();
    }
  }

  notify() {
    if (this.onUpdate) this.onUpdate(this.equations);
  }

  render() {
    this.container.innerHTML = '';
    this.equations.forEach(eq => {
      const item = document.createElement('div');
      item.className = 'equation-item';
      item.innerHTML = `
        <div class="equation-input-row">
          <div class="color-indicator" style="background-color: ${eq.color};"></div>
          <input type="text" class="equation-input" placeholder="y = ..." value="${eq.expression}" />
          <button class="remove-btn" title="Remove">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;

      const input = item.querySelector('.equation-input');
      input.addEventListener('input', (e) => this.updateEquation(eq.id, e.target.value));

      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => this.removeEquation(eq.id));

      this.container.appendChild(item);
    });
  }
}
