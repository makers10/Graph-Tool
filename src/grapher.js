import * as math from 'mathjs';

export class Grapher {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.equations = []; 
    this.time = 0;
    
    // Viewport state
    this.view = {
      offsetX: canvas.width / 2,
      offsetY: canvas.height / 2,
      scale: 60,
      minScale: 5,
      maxScale: 20000,
    };

    this.settings = {
      gridOpacity: 0.3,
      showGrid: true,
      showAxes: true,
      showLabels: true,
      allowNegativeX: false, // Default: Wave starts at origin (0,0)
      partyMode: false,
      gridColor: 'rgba(255, 255, 255, 0.045)',
      axisColor: 'rgba(255, 255, 255, 0.2)',
      labelColor: 'rgba(255, 255, 255, 0.25)',
      showSparkles: true,
      showIntersections: true,
    };

    this.particles = [];
    this.hoverState = { x: 0, y: 0, activePoint: null };
    this.params = {};
    this.init();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInteractions();
    this.onHover = null;
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
      this.view.offsetX = window.innerWidth / 4; // Shift (0,0) to be more visible from left
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
        return { ...eq, compiled: null, error: 'Wobbly Math!' };
      }
    });

    // Sync particles
    const activeIds = this.equations.map(e => e.id);
    this.particles = this.particles.filter(p => activeIds.includes(p.id));
    
    this.equations.forEach(eq => {
      if (!this.particles.find(p => p.id === eq.id)) {
        this.particles.push({
          id: eq.id,
          x: this.settings.allowNegativeX ? -10 : 0,
          trail: []
        });
      }
    });

    this.calculateCriticalPoints();
  }

  calculateCriticalPoints() {
    const { offsetX, scale } = this.view;
    const width = window.innerWidth;
    
    // Determine dynamic range based on viewport
    const minX = -offsetX / scale;
    const maxX = (width - offsetX) / scale;
    
    const rangeMin = this.settings.allowNegativeX ? minX : Math.max(0, minX);
    const rangeMax = maxX;
    const step = Math.max(0.01, (rangeMax - rangeMin) / 400); // Dynamic step based on zoom

    this.equations.forEach(eq => {
      eq.criticalPoints = [];
      if (!eq.compiled || !eq.isVisible) return;

      let lastY = null;
      let lastSlope = null;

      if (eq.error) return;

      for (let x = rangeMin; x <= rangeMax; x += step) {
        try {
          const scope = { x, t: this.time, ...this.params };
          const y = eq.compiled.evaluate(scope);

          if (lastY !== null) {
            // Root detection
            if (lastY * y <= 0) {
              eq.criticalPoints.push({ x: x - step / 2, y: 0, type: 'Root' });
            }

            // Extrema detection
            const slope = (y - lastY) / step;
            if (lastSlope !== null && lastSlope * slope <= 0) {
              eq.criticalPoints.push({ x: x - step / 2, y: lastY, type: 'Extrema' });
            }
            lastSlope = slope;
          }
          lastY = y;
        } catch (e) {
          eq.error = e.message;
          break;
        }
      }
    });
  }

  setParameters(params) {
    this.params = params;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  zoomIn() { this.adjustZoom(1.5); }
  zoomOut() { this.adjustZoom(1 / 1.5); }

  adjustZoom(factor) {
    const nextScale = this.view.scale * factor;
    if (nextScale < this.view.minScale || nextScale > this.view.maxScale) return;
    
    // Zoom towards center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const unitX = (centerX - this.view.offsetX) / this.view.scale;
    const unitY = (centerY - this.view.offsetY) / this.view.scale;

    this.view.scale = nextScale;
    this.view.offsetX = centerX - unitX * this.view.scale;
    this.view.offsetY = centerY - unitY * this.view.scale;
  }

  setupInteractions() {
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    const startDrag = (x, y) => {
      isDragging = true;
      lastPos = { x, y };
    };

    const doDrag = (x, y) => {
      if (isDragging) {
        const dx = x - lastPos.x;
        const dy = y - lastPos.y;
        this.view.offsetX += dx;
        this.view.offsetY += dy;
        lastPos = { x, y };
      }
    };

    const endDrag = () => {
      isDragging = false;
      initialPinchDistance = null;
    };

    this.canvas.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));

    window.addEventListener('mousemove', (e) => {
      doDrag(e.clientX, e.clientY);
      this.handleHover(e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.onHover) this.onHover(null);
    });

    window.addEventListener('mouseup', endDrag);

    // Touch support
    let initialPinchDistance = null;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        doDrag(e.touches[0].clientX, e.touches[0].clientY);
        this.handleHover(e.touches[0]);
      } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        e.preventDefault(); // Prevent scrolling while zooming
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const zoomFactor = distance / initialPinchDistance;
        
        // Use midpoint for zoom center
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const nextScale = this.view.scale * zoomFactor;
        if (nextScale >= this.view.minScale && nextScale <= this.view.maxScale) {
          const unitX = (centerX - this.view.offsetX) / this.view.scale;
          const unitY = (centerY - this.view.offsetY) / this.view.scale;
          
          this.view.scale = nextScale;
          this.view.offsetX = centerX - unitX * this.view.scale;
          this.view.offsetY = centerY - unitY * this.view.scale;
        }
        
        initialPinchDistance = distance;
      }
    }, { passive: false });

    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.25;
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

    this.hoverState.x = x;
    this.hoverState.y = y;
    this.hoverState.activePoint = null;

    // Detect nearby critical points
    const threshold = 15 / this.view.scale; // 15 pixels radius
    this.equations.forEach(eq => {
      if (!eq.criticalPoints) return;
      eq.criticalPoints.forEach(pt => {
        const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
        if (dist < threshold) {
          this.hoverState.activePoint = { ...pt, color: eq.color };
        }
      });
    });

    if (this.onHover) {
      this.onHover({ x, y, activePoint: this.hoverState.activePoint });
    }
  }

  drawGrid() {
    const { ctx, view, settings } = this;
    if (!settings.showGrid) return;
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
      if (!settings.allowNegativeX && x < offsetX - 1) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const startY = (offsetY % (spacing * scale)) - spacing * scale;
    for (let y = startY; y < height + spacing * scale; y += spacing * scale) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    if (settings.showAxes) {
      ctx.beginPath();
      ctx.strokeStyle = settings.axisColor;
      ctx.lineWidth = 2.5;
      // Negative X clip visual
      if (!settings.allowNegativeX) {
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX, height);
        ctx.moveTo(offsetX, offsetY);
        ctx.lineTo(width, offsetY);
      } else {
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX, height);
        ctx.moveTo(0, offsetY);
        ctx.lineTo(width, offsetY);
      }
      ctx.stroke();
    }

    if (settings.showLabels) {
      ctx.fillStyle = settings.labelColor;
      ctx.font = '700 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      const labelSpacing = spacing * (scale < 50 ? 2 : 1);
      
      for (let x = startX; x < width + spacing * scale; x += labelSpacing * scale) {
        const val = (x - offsetX) / scale;
        if (!settings.allowNegativeX && val < -0.01) continue;
        if (Math.abs(val) > 0.001) {
          ctx.fillText(val.toFixed(spacing < 1 ? 1 : 0), x, offsetY + 24);
        }
      }
      ctx.textAlign = 'right';
      for (let y = startY; y < height + spacing * scale; y += labelSpacing * scale) {
        const val = -(y - offsetY) / scale;
        if (Math.abs(val) > 0.001) {
          ctx.fillText(val.toFixed(spacing < 1 ? 1 : 0), offsetX - 16, y + 4);
        }
      }
      // Draw (0,0)
      ctx.fillText("0", offsetX - 8, offsetY + 24);
    }
  }

  drawEquations() {
    const { ctx, view, time, settings } = this;
    const { offsetX, offsetY, scale } = view;
    const width = window.innerWidth;

    this.equations.forEach(eq => {
      if (!eq.isVisible || !eq.compiled || eq.error) return;

      const color = settings.partyMode ? `hsl(${(time * 50) % 360}, 100%, 60%)` : eq.color;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.shadowBlur = settings.partyMode ? 25 : 15;
      ctx.shadowColor = color;

      let first = true;
      const step = 2; 

      for (let px = 0; px <= width; px += step) {
        let x = (px - offsetX) / scale;
        
        // Origin Start Logic: only draw x >= 0 if not allowed negative
        if (!settings.allowNegativeX && x < 0) {
          first = true;
          continue;
        }

        try {
          const scope = { x, t: time, ...this.params };
          const y = eq.compiled.evaluate(scope);
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
          eq.error = e.message;
          break;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  drawParticles() {
    if (!this.settings.showSparkles) return;
    const { ctx, view, time, equations, params, settings } = this;
    const { offsetX, offsetY, scale } = view;

    this.particles.forEach(p => {
      const eq = equations.find(e => e.id === p.id);
      if (!eq || !eq.compiled || !eq.isVisible) return;

      const color = settings.partyMode ? `hsl(${(time * 100) % 360}, 100%, 70%)` : eq.color;

      // Update position
      const speed = 0.05 * (60 / scale); // Calm speed adjusted by zoom
      p.x += speed;

      // Reset if off-screen (mathematically)
      const maxX = (window.innerWidth - offsetX) / scale;
      const minX = settings.allowNegativeX ? -offsetX / scale : 0;
      if (p.x > maxX) p.x = minX;
      if (p.x < minX) p.x = maxX;

      if (eq.error) return;
      
      try {
        const scope = { x: p.x, t: time, ...params };
        const y = eq.compiled.evaluate(scope);
        const px = offsetX + (p.x * scale);
        const py = offsetY - (y * scale);

        // Add to trail
        p.trail.unshift({ px, py, time: Date.now() });
        if (p.trail.length > 20) p.trail.pop();

        // Draw trail
        p.trail.forEach((point, i) => {
          const age = (Date.now() - point.time) / 1000;
          const alpha = Math.max(0, 1 - age * 2);
          const size = Math.max(0, (20 - i) / 2);

          if (alpha <= 0) return;

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.arc(point.px, point.py, size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw head sparkle
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Lens flare effect
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.moveTo(px - 15, py);
        ctx.lineTo(px + 15, py);
        ctx.moveTo(px, py - 15);
        ctx.lineTo(px, py + 15);
        ctx.stroke();

        ctx.shadowBlur = 0;
      } catch (e) {
        eq.error = e.message;
      }
    });

    ctx.globalAlpha = 1;
  }

  drawHighlights() {
    const { ctx, view, hoverState, settings } = this;
    const { offsetX, offsetY, scale } = view;

    if (hoverState.activePoint && settings.showIntersections) {
      const pt = hoverState.activePoint;
      const px = offsetX + pt.x * scale;
      const py = offsetY - pt.y * scale;

      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = pt.color;
      ctx.stroke();

      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = '800 12px "Outfit"';
      ctx.textAlign = 'left';
      ctx.fillText(`${pt.type}: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`, px + 15, py - 15);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  animate() {
    this.time += 0.05;
    
    // Use window inner dimensions for clearing to avoid DPR scaling mismatch
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    if (this.settings.partyMode) {
      this.ctx.fillStyle = `rgba(${(Math.sin(this.time) + 1) * 20}, 0, ${(Math.cos(this.time) + 1) * 20}, 0.1)`;
      this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    this.drawGrid();
    this.drawEquations();
    this.drawParticles();
    this.drawHighlights();
    
    // Periodically recalculate critical points to account for 't' or parameter changes
    if (Math.floor(this.time * 10) % 20 === 0) {
      this.calculateCriticalPoints();
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  capture() {
    // Generate a high-quality capture
    const tempCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Save current context
    const mainCtx = this.ctx;
    this.ctx = tempCtx;
    this.ctx.scale(dpr, dpr);

    // Draw background
    this.ctx.fillStyle = '#0c0c14'; // Theme background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw content
    this.drawGrid();
    this.drawEquations();
    this.drawParticles();

    // Restore main context
    this.ctx = mainCtx;

    return tempCanvas.toDataURL('image/png');
  }
}
