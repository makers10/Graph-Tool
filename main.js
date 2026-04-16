import { Grapher } from './src/grapher';
import { UI } from './src/ui';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('viewport');
  const equationSection = document.getElementById('equation-section');
  const addBtn = document.getElementById('add-equation-btn');
  const gridRange = document.getElementById('grid-range');
  const showLabelsCheckbox = document.getElementById('show-labels');

  const grapher = new Grapher(canvas);

  const ui = new UI(equationSection, (equations) => {
    grapher.setEquations(equations);
  });

  // Event Listeners for UI interaction
  addBtn.addEventListener('click', () => {
    ui.addEquation();
  });

  gridRange.addEventListener('input', (e) => {
    const intensity = e.target.value / 255;
    grapher.updateSettings({ 
      gridColor: `rgba(255, 255, 255, ${intensity/3})`,
      axisColor: `rgba(255, 255, 255, ${intensity})`
    });
  });

  showLabelsCheckbox.addEventListener('change', (e) => {
    grapher.updateSettings({ showLabels: e.target.checked });
  });

  // Initial update
  grapher.setEquations(ui.equations);
});
