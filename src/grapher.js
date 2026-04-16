import * as math from 'mathjs';

export class Grapher {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.equations = []; 
    
    // Viewport state
    this.view = {
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2,
      scale: 60, // pixels per unit
      minScale: 10,
      maxScale: 5000,
    };

    this.settings = {
      gridOpacity: 0.4,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      axisColor: 'rgba(255, 255, 255, 0.25)',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      labelColor: 'rgba(255, 255, 255, 0.3)',
    };

    this.init();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInteractions();
  }

  init() {
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    if (!this._hasResized) {
      this.view.offsetX = window.innerWidth / 2;
      this.view.offsetY = window.innerHeight / 2;
      this._hasResized = true;
    }
  }

  setEquations(equations) {
    this.equations = equations.map(eq => {
      try {
        if (!eq.expression.trim()) return { ...eq, compiled: null, error: null };
        return {
          ...eq,
          compiled: math.compile(eq.expression),
          error: null
        };
      } catch (err) {
        return { ...eq, compiled: null, error: 'Invalid expression' };
      }
    });
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  setupInteractions() {
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        this.view.offsetX += dx;
        this.view.offsetY += dy;
        lastPos = { x: e.clientX, y: e.clientY };
      }
      this.handleHover(e);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.15;
      const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const unitX = (mouseX - this.view.offsetX) / this.view.scale;
      const unitY = (mouseY - this.view.offsetY) / this.view.scale;

      const nextScale = this.view.scale * direction;
      if (nextScale < this.view.minScale || nextScale > this.view.maxScale) return;

      this.view.scale = nextScale;
      this.view.offsetX = mouseX - unitX * this.view.scale;
      this.view.offsetY = mouseY - unitY * this.view.scale;
    }, { passive: false });
  }

  handleHover(e) {
    const x = (e.clientX - this.view.offsetX) / this.view.scale;
    const y = -(e.clientY - this.view.offsetY) / this.view.scale;

    document.getElementById('x-coord').textContent = x.toFixed(3);
    document.getElementById('y-coord').textContent = y.toFixed(3);
  }

  drawGrid() {
    const { ctx, view, settings } = this;
    const { offsetX, offsetY, scale } = view;
    const width = window.innerWidth;
    const height = window.innerHeight;

    let spacing = 1;
    if (scale > 200) spacing = 0.5;
    if (scale > 500) spacing = 0.1;
    if (scale < 30) spacing = 2;
    if (scale < 15) spacing = 5;

    ctx.beginPath();
    ctx.strokeStyle = settings.gridColor;
    ctx.lineWidth = 1;

    const startX = (offsetX % (spacing * scale)) - spacing * scale;
    for (let x = startX; x < width + spacing * scale; x += spacing * scale) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const startY = (offsetY % (spacing * scale)) - spacing * scale;
    for (let y = startY; y < height + spacing * scale; y += spacing * scale) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = settings.axisColor;
    ctx.lineWidth = 1.5;
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, height);
    ctx.moveTo(0, offsetY);
    ctx.lineTo(width, offsetY);
    ctx.stroke();

    if (settings.showLabels) {
      ctx.fillStyle = settings.labelColor;
      ctx.font = '500 11px "JetBrains Mono"';
      ctx.textAlign = 'center';
      
      const labelSpacing = spacing * (scale < 50 ? 2 : 1);
      
      // X labels
      for (let x = startX; x < width + spacing * scale; x += labelSpacing * scale) {
        const val = (x - offsetX) / scale;
        if (Math.abs(val) > 0.001) {
          ctx.fillText(val.toFixed(spacing < 1 ? 1 : 0), x, offsetY + 18);
        }
      }
      // Y labels
      ctx.textAlign = 'right';
      for (let y = startY; y < height + spacing * scale; y += labelSpacing * scale) {
        const val = -(y - offsetY) / scale;
        if (Math.abs(val) > 0.001) {
          ctx.fillText(val.toFixed(spacing < 1 ? 1 : 0), offsetX - 12, y + 4);
        }
      }
    }
  }

  drawEquations() {
    const { ctx, view } = this;
    const { offsetX, offsetY, scale } = view;
    const width = window.innerWidth;

    this.equations.forEach(eq => {
      if (!eq.isVisible || !eq.compiled) return;

      // Draw Main Line
      ctx.beginPath();
      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Line Glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = eq.color;

      let first = true;
      const step = 2; 

      for (let px = 0; px <= width; px += step) {
        const x = (px - offsetX) / scale;
        try {
          const y = eq.compiled.evaluate({ x });
          const py = offsetY - (y * scale);

          if (isNaN(py) || !isFinite(py)) {
            first = true;
            continue;
          }

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } catch (e) {
          first = true;
        }
      }
      ctx.stroke();
      
      // Reset shadow for next equation or elements
      ctx.shadowBlur = 0;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.drawGrid();
    this.drawEquations();
    requestAnimationFrame(() => this.animate());
  }
}
