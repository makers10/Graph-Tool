import { Grapher } from './src/grapher';
import { UI } from './src/ui';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('viewport');
  const equationSection = document.getElementById('equation-section');
  const addBtn = document.getElementById('add-equation-btn');
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
  });

  gridRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const opacity = val / 100;
    
    grapher.updateSettings({ 
      gridColor: `rgba(255, 255, 255, ${opacity * 0.1})`,
      axisColor: `rgba(255, 255, 255, ${opacity * 0.4})`,
      labelColor: `rgba(255, 255, 255, ${opacity * 0.5})`
    });
  });

  showLabelsCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showLabels: e.target.checked });
  });

  // Small delay to ensure everything is ready before first render update
  setTimeout(() => {
    grapher.setEquations(ui.equations);
  }, 50);
});
