export class UI {
  constructor(container, onUpdate) {
    if (!container) throw new Error('Squiggle container not found! 😱');
    this.container = container;
    this.onUpdate = onUpdate;
    this.equations = [];
    this.colors = [
      '#f472b6', // Pink
      '#22d3ee', // Cyan
      '#4ade80', // green
      '#fbbf24', // yellow
      '#c084fc', // purple
      '#60a5fa', // blue
    ];

    this.chaosFunctions = [
      'sin(x * 2) * cos(x / 2) * 5',
      'tan(sin(x)) * 3',
      'abs(sin(x)) * 10 * sin(x * 5)',
      'x^2 / 10 * sin(x)',
      'sin(x^2) * 5',
      'sin(x) + sin(2x) + sin(3x)',
      '5 * sin(x/2) + 2 * cos(x*3)',
      'x * sin(x)',
    ];

    this.init();
  }

  init() {
    if (this.equations.length === 0) {
      this.addEquation('sin(x) * 5');
      this.addEquation('abs(x) / 2');
    }
  }

  addEquation(expression = 'sin(x)') {
    const id = Math.random().toString(36).substring(2, 9);
    const color = this.colors[this.equations.length % this.colors.length];
    this.equations.push({ id, expression, color, isVisible: true, error: null });
    this.render();
  }

  addChaos() {
    const randomFunc = this.chaosFunctions[Math.floor(Math.random() * this.chaosFunctions.length)];
    this.addEquation(randomFunc);
  }

  removeEquation(id) {
    this.equations = this.equations.filter(eq => eq.id !== id);
    this.render();
  }

  updateEquation(id, expression) {
    const eq = this.equations.find(e => e.id === id);
    if (eq) {
      eq.expression = expression;
      this.notify();
    }
  }

  setErrors(errors) {
    this.equations.forEach(eq => {
      eq.error = errors[eq.id] || null;
    });
    this.render(false);
  }

  notify() {
    if (this.onUpdate) this.onUpdate([...this.equations]);
  }

  render(shouldNotify = true) {
    this.container.innerHTML = '';
    
    this.equations.forEach(eq => {
      const item = document.createElement('div');
      item.className = 'equation-item';
      item.style.borderLeft = `3px solid ${eq.color}`;
      
      item.innerHTML = `
        <div class="equation-input-row" style="display: flex; align-items: center; gap: 10px;">
          <input type="text" class="equation-input" placeholder="Warp space here..." value="${eq.expression}" spellcheck="false" />
          <button class="remove-btn" title="Delete this squiggle" style="background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        ${eq.error ? `<div class="error-msg" style="color: ${eq.color}; opacity: 0.8; font-size: 11px; margin-top: 4px;">${eq.error}</div>` : ''}
      `;

      const input = item.querySelector('.equation-input');
      input.addEventListener('input', (e) => this.updateEquation(eq.id, e.target.value));

      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => this.removeEquation(eq.id));

      this.container.appendChild(item);
    });

    if (shouldNotify) this.notify();
  }
}

export class ParameterUI {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.parameters = [
      { id: 'a', name: 'a', value: 1, min: -10, max: 10, step: 0.1 },
      { id: 'b', name: 'b', value: 5, min: 0.1, max: 20, step: 0.1 }
    ];
    this.init();
  }

  init() {
    this.render();
  }

  addParameter() {
    const id = Math.random().toString(36).substring(2, 9);
    const names = 'cdefghjklmnpqrstuwxyz'.split('');
    const usedNames = this.parameters.map(p => p.name);
    const nextName = names.find(n => !usedNames.includes(n)) || 'v';
    
    this.parameters.push({
      id,
      name: nextName,
      value: 1,
      min: -10,
      max: 10,
      step: 0.1
    });
    this.render();
  }

  removeParameter(id) {
    this.parameters = this.parameters.filter(p => p.id !== id);
    this.render();
  }

  updateParameter(id, key, value) {
    const param = this.parameters.find(p => p.id === id);
    if (param) {
      param[key] = value;
      this.render(key !== 'value'); // Don't re-render entire list if only value changed (to avoid losing focus/smoothness)
      this.notify();
    }
  }

  notify() {
    const paramMap = {};
    this.parameters.forEach(p => {
      paramMap[p.name] = parseFloat(p.value);
    });
    if (this.onUpdate) this.onUpdate(paramMap);
  }

  render(fullRender = true) {
    if (fullRender) {
      this.container.innerHTML = '';
      this.parameters.forEach(p => {
        const item = document.createElement('div');
        item.className = 'parameter-item';
        item.dataset.id = p.id;
        
        item.innerHTML = `
          <input type="text" class="param-name" value="${p.name}" maxlength="2" spellcheck="false" />
          <input type="range" class="param-slider" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" />
          <span class="param-value">${p.value}</span>
          <button class="remove-mini-btn" title="Remove variable">×</button>
        `;

        const nameInput = item.querySelector('.param-name');
        nameInput.addEventListener('change', (e) => this.updateParameter(p.id, 'name', e.target.value));

        const slider = item.querySelector('.param-slider');
        const valueDisplay = item.querySelector('.param-value');
        
        slider.addEventListener('input', (e) => {
          const val = e.target.value;
          valueDisplay.textContent = val;
          this.updateParameter(p.id, 'value', val);
        });

        const removeBtn = item.querySelector('.remove-mini-btn');
        removeBtn.addEventListener('click', () => this.removeParameter(p.id));

        this.container.appendChild(item);
      });
    }
    
    this.notify();
  }
}
