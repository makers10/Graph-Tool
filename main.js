import { Grapher } from './src/grapher';
import { UI, ParameterUI } from './src/ui';
import { Sonifier } from './src/sonifier';
import { PRESETS } from './src/presets';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('viewport');
  const equationSection = document.getElementById('equation-section');
  const addBtn = document.getElementById('add-equation-btn');
  const chaosBtn = document.getElementById('chaos-btn');
  const gridRange = document.getElementById('grid-range');
  const showLabelsCheckbox = document.getElementById('show-labels');
  const allowNegativeX = document.getElementById('allow-negative');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const partyBtn = document.getElementById('party-btn');
  const punBox = document.getElementById('pun-box');
  const follower = document.getElementById('cursor-follower');
  const paramSection = document.getElementById('parameter-list');
  const addParamBtn = document.getElementById('add-param-btn');
  const singingModeCheckbox = document.getElementById('singing-mode');
  const sparkleModeCheckbox = document.getElementById('sparkle-mode');
  const smartHighlightsCheckbox = document.getElementById('smart-highlights');
  const presetSelector = document.getElementById('preset-selector');
  const exportBtn = document.getElementById('export-btn');

  const puns = [
    "Why was the math book sad? It had too many problems.",
    "Parallel lines have so much in common. It’s a shame they’ll never meet.",
    "Are monsters good at math? Not unless you Count Dracula.",
    "I'll horizontal you... if you know what I mean. 😉",
    "Dear Math, please grow up and solve your own problems.",
    "I’m so good at algebra that I could replace your X and you wouldn’t even know Y.",
    "Why was the equal sign so humble? Because he knew he wasn't less than or greater than anyone else!",
    "Decimals have a point.",
    "Nature is composed of squiggles. I'm just here to watch them wiggle.",
  ];

  const grapher = new Grapher(canvas);
  
  let appInitialized = false;
  const saveStateToURL = () => {
    if (!appInitialized) return;
    const state = {
      eq: ui.equations.map(e => ({ expr: e.expression, vis: e.isVisible })),
      p: paramUi.parameters.map(p => ({ n: p.name, v: p.value, min: p.min, max: p.max, step: p.step }))
    };
    const url = new URL(window.location);
    url.searchParams.set('state', btoa(JSON.stringify(state)));
    window.history.replaceState({}, '', url);
  };

  const ui = new UI(equationSection, (equations) => {
    grapher.setEquations(equations);
    saveStateToURL();
    // Refresh pun when squiggle added
    punBox.innerHTML = `<b>Pun-ish Me:</b> ${puns[Math.floor(Math.random() * puns.length)]}`;
  });

  const paramUi = new ParameterUI(paramSection, (params) => {
    grapher.setParameters(params);
    saveStateToURL();
  });

  const sonifier = new Sonifier();
  grapher.onHover = (data) => {
    if (!data) {
      sonifier.stop();
      document.getElementById('x-coord').textContent = '0.000';
      document.getElementById('y-coord').textContent = '0.000';
    } else {
      sonifier.update(data.y);
      document.getElementById('x-coord').textContent = data.x.toFixed(3);
      document.getElementById('y-coord').textContent = data.y.toFixed(3);
    }
  };

  addParamBtn.addEventListener('click', () => paramUi.addParameter());
  
  // Populate Gallery
  PRESETS.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = preset.name;
    presetSelector.appendChild(option);
  });

  presetSelector.addEventListener('change', (e) => {
    const preset = PRESETS[e.target.value];
    if (preset) {
      ui.setEquations(preset.equations);
      paramUi.setParameters(preset.parameters);
    }
  });

  singingModeCheckbox.addEventListener('change', (e) => {
    sonifier.setEnabled(e.target.checked);
  });

  sparkleModeCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showSparkles: e.target.checked });
  });

  smartHighlightsCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showIntersections: e.target.checked });
  });

  exportBtn.addEventListener('click', () => {
    // Visual flash
    const flash = document.createElement('div');
    flash.className = 'camera-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);

    // Capture and download
    const dataUrl = grapher.capture();
    const link = document.createElement('a');
    link.download = `squiggle-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  });

  // Zoom
  zoomInBtn.addEventListener('click', () => grapher.zoomIn());
  zoomOutBtn.addEventListener('click', () => grapher.zoomOut());

  // Settings
  allowNegativeX.addEventListener('change', (e) => {
    grapher.updateSettings({ allowNegativeX: e.target.checked });
  });

  partyBtn.addEventListener('click', () => {
    const active = partyBtn.classList.toggle('active');
    partyBtn.textContent = active ? "🌈 Party Mode: ON" : "🌈 Party Mode: OFF";
    grapher.updateSettings({ partyMode: active });
    document.body.classList.toggle('party-mode-active', active);
  });

  // Follower
  window.addEventListener('mousemove', (e) => {
    follower.style.left = e.clientX + 'px';
    follower.style.top = e.clientY + 'px';
    follower.textContent = partyBtn.classList.contains('active') ? "🎉" : "✨";
  });

  // Standard buttons
  addBtn.addEventListener('click', () => ui.addEquation());
  chaosBtn.addEventListener('click', () => ui.addChaos());
  // Fix gridColor bug by initializing
  const initialGridVal = parseInt(gridRange.value);
  const initialOpacity = (100 - initialGridVal) / 100;
  grapher.updateSettings({
    gridColor: `rgba(255, 255, 255, ${initialOpacity * 0.15})`,
    axisColor: `rgba(255, 255, 255, ${initialOpacity * 0.3})`,
    labelColor: `rgba(255, 255, 255, ${initialOpacity * 0.4})`
  });

  gridRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const opacity = (100 - val) / 100;
    grapher.updateSettings({ 
      gridColor: `rgba(255, 255, 255, ${opacity * 0.15})`,
      axisColor: `rgba(255, 255, 255, ${opacity * 0.3})`,
      labelColor: `rgba(255, 255, 255, ${opacity * 0.4})`
    });
  });
  showLabelsCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showLabels: e.target.checked });
  });

  // Load state from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const stateParam = urlParams.get('state');
  if (stateParam) {
    try {
      const state = JSON.parse(atob(stateParam));
      if (state.eq) {
        ui.equations = state.eq.map((e, i) => ({
          id: crypto.randomUUID(),
          expression: e.expr || '',
          color: ui.colors[ui.colorIndex++ % ui.colors.length],
          isVisible: e.vis !== false,
          error: null
        }));
        ui.render(false);
      }
      if (state.p) {
        paramUi.parameters = state.p.map(p => ({
          id: crypto.randomUUID(),
          name: p.n || '',
          value: p.v || 0,
          min: p.min || -10,
          max: p.max || 10,
          step: p.step || 0.1
        }));
        paramUi.render(false);
      }
    } catch (e) {
      console.error('Invalid URL state', e);
    }
  }

  appInitialized = true;
  // Synchronous initial sync
  paramUi.notify();
  ui.notify();

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '=' || e.key === '+') {
      grapher.zoomIn();
    } else if (e.key === '-' || e.key === '_') {
      grapher.zoomOut();
    } else if (e.key.toLowerCase() === 'g') {
      grapher.updateSettings({ showGrid: !grapher.settings.showGrid });
    }
  });
});
