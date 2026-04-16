export class UI {
  constructor(container, onUpdate) {
    if (!container) throw new Error('UI container not found');
    this.container = container;
    this.onUpdate = onUpdate;
    this.equations = [];
    this.colors = [
      '#818cf8', // Indigo
      '#f43f5e', // Rose
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#a78bfa', // Purple
    ];

    this.init();
  }

  init() {
    // Start with default equations if empty
    if (this.equations.length === 0) {
      this.addEquation('sin(x)');
      this.addEquation('2 * cos(x/2)');
      this.addEquation('x^2 / 10');
    }
  }

  addEquation(expression = '') {
    const id = Math.random().toString(36).substring(2, 9);
    const color = this.colors[this.equations.length % this.colors.length];
    this.equations.push({ id, expression, color, isVisible: true, error: null });
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

  // Allow external updates (e.g., from Grapher reporting errors)
  setErrors(errors) {
    this.equations.forEach(eq => {
      eq.error = errors[eq.id] || null;
    });
    this.render(false); // Render without notifying back
  }

  notify() {
    if (this.onUpdate) this.onUpdate([...this.equations]);
  }

  render(shouldNotify = true) {
    this.container.innerHTML = '';
    
    this.equations.forEach(eq => {
      const item = document.createElement('div');
      item.className = 'equation-item';
      item.style.borderLeft = `4px solid ${eq.color}`;
      
      item.innerHTML = `
        <div class="equation-input-row">
          <input type="text" class="equation-input" placeholder="y = f(x)" value="${eq.expression}" spellcheck="false" />
          <button class="remove-btn" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        ${eq.error ? `<div class="error-msg">${eq.error}</div>` : ''}
      `;

      const input = item.querySelector('.equation-input');
      input.addEventListener('input', (e) => {
        this.updateEquation(eq.id, e.target.value);
      });

      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => this.removeEquation(eq.id));

      this.container.appendChild(item);
    });

    if (shouldNotify) this.notify();
  }
}
