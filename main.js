import { Grapher } from './src/grapher';
import { UI } from './src/ui';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('viewport');
  const equationSection = document.getElementById('equation-section');
  const addBtn = document.getElementById('add-equation-btn');
  const chaosBtn = document.getElementById('chaos-btn');
  const gridRange = document.getElementById('grid-range');
  const showLabelsCheckbox = document.getElementById('show-labels');

  // Initialize Grapher
  const grapher = new Grapher(canvas);

  // Initialize UI with a callback that updates the grapher
  const ui = new UI(equationSection, (equations) => {
    grapher.setEquations(equations);
  });

  // Buttons and Controls
  addBtn.addEventListener('click', () => {
    ui.addEquation();
    // Playful feedback: slight jiggle? (already handled by CSS hover)
  });

  chaosBtn.addEventListener('click', () => {
    ui.addChaos();
  });

  gridRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const opacity = (100 - val) / 100; // "Invisibility cloak" logic
    
    grapher.updateSettings({ 
      gridColor: `rgba(255, 255, 255, ${opacity * 0.15})`,
      axisColor: `rgba(255, 255, 255, ${opacity * 0.3})`,
      labelColor: `rgba(255, 255, 255, ${opacity * 0.4})`
    });
  });

  showLabelsCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showLabels: e.target.checked });
  });

  // Small delay to ensure everything is ready before first render update
  setTimeout(() => {
    grapher.setEquations(ui.equations);
  }, 100);
});
