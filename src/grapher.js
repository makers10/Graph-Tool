import * as math from 'mathjs';

export class Grapher {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.equations = []; // { id, expression, color, isVisible, compiled }
    
    // Viewport state
    this.view = {
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2,
      scale: 50, // pixels per unit
      zoom: 1,
      minScale: 5,
      maxScale: 2000,
    };

    this.settings = {
      gridIntensity: 0.15,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      axisColor: 'rgba(255, 255, 255, 0.5)',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      labelColor: 'rgba(255, 255, 255, 0.4)',
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Re-center if needed, or maintain relative offset
    if (!this._hasResized) {
      this.view.offsetX = this.canvas.width / 2;
      this.view.offsetY = this.canvas.height / 2;
      this._hasResized = true;
    }
  }

  setEquations(equations) {
    this.equations = equations.map(eq => {
      try {
        return {
          ...eq,
          compiled: math.compile(eq.expression),
          error: null
        };
      } catch (err) {
        return { ...eq, compiled: null, error: err.message };
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
      const zoomFactor = 1.1;
      const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Coordinate before zoom
      const unitX = (mouseX - this.view.offsetX) / this.view.scale;
      const unitY = (mouseY - this.view.offsetY) / this.view.scale;

      const nextScale = this.view.scale * direction;
      if (nextScale < this.view.minScale || nextScale > this.view.maxScale) return;

      this.view.scale = nextScale;

      // Adjust offset to zoom relative to mouse
      this.view.offsetX = mouseX - unitX * this.view.scale;
      this.view.offsetY = mouseY - unitY * this.view.scale;
    }, { passive: false });
  }

  handleHover(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Map pixels to coordinate units
    const x = (mouseX - this.view.offsetX) / this.view.scale;
    const y = -(mouseY - this.view.offsetY) / this.view.scale;

    document.getElementById('x-coord').textContent = x.toFixed(3);
    document.getElementById('y-coord').textContent = y.toFixed(3);
  }

  drawGrid() {
    const { ctx, canvas, view, settings } = this;
    const { offsetX, offsetY, scale } = view;

    // Determine grid spacing based on scale
    let spacing = 1;
    while (spacing * scale < 30) spacing *= 2;
    while (spacing * scale > 150) spacing /= 2;

    ctx.beginPath();
    ctx.strokeStyle = settings.gridColor;
    ctx.lineWidth = 1;

    // Vertical lines
    const startX = (offsetX % (spacing * scale)) - spacing * scale;
    for (let x = startX; x < canvas.width + spacing * scale; x += spacing * scale) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }

    // Horizontal lines
    const startY = (offsetY % (spacing * scale)) - spacing * scale;
    for (let y = startY; y < canvas.height + spacing * scale; y += spacing * scale) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Draw Axes
    ctx.beginPath();
    ctx.strokeStyle = settings.axisColor;
    ctx.lineWidth = 2;
    // Y Axis
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    // X Axis
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.stroke();

    if (settings.showLabels) {
      ctx.fillStyle = settings.labelColor;
      ctx.font = '10px JetBrains Mono';
      // X labels
      for (let x = startX; x < canvas.width + spacing * scale; x += spacing * scale) {
        const val = (x - offsetX) / scale;
        if (Math.abs(val) > 0.1) {
          ctx.fillText(val.toFixed(spacing < 1 ? 2 : 0), x + 4, offsetY - 8);
        }
      }
      // Y labels
      for (let y = startY; y < canvas.height + spacing * scale; y += spacing * scale) {
        const val = -(y - offsetY) / scale;
        if (Math.abs(val) > 0.1) {
          ctx.fillText(val.toFixed(spacing < 1 ? 2 : 0), offsetX + 8, y - 4);
        }
      }
    }
  }

  drawEquations() {
    const { ctx, canvas, view } = this;
    const { offsetX, offsetY, scale } = view;

    this.equations.forEach(eq => {
      if (!eq.isVisible || !eq.compiled) return;

      ctx.beginPath();
      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';

      let first = true;
      const step = 2; // pixel step for smoothness vs performance

      for (let px = 0; px <= canvas.width; px += step) {
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
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawEquations();
    requestAnimationFrame(() => this.animate());
  }
}
