import { Grapher } from './src/grapher';
import { UI, ParameterUI } from './src/ui';

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
  const ui = new UI(equationSection, (equations) => {
    grapher.setEquations(equations);
    // Refresh pun when squiggle added
    punBox.innerHTML = `<b>Pun-ish Me:</b> ${puns[Math.floor(Math.random() * puns.length)]}`;
  });

  const paramUi = new ParameterUI(paramSection, (params) => {
    grapher.setParameters(params);
  });

  addParamBtn.addEventListener('click', () => paramUi.addParameter());

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

  setTimeout(() => grapher.setEquations(ui.equations), 100);
});
