const canvasSketch = require('canvas-sketch');
const { renderPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

import { clipLinesWithMargin } from './helpers/poly-line.helpers.js';

const settings = {
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const sketch = ({ width, height }) => {
  // List of polylines for our pen plot
  let lines = [];

  // Draw some circles expanding outward
  const steps = 7;
  const count = 300;
  const spacing = Math.min(width, height) * 0.01;
  const radius = Math.min(width, height) * 0.01;

  for (let j = 0; j < count; j++) {
    const r = radius + j * spacing;
    const circle = [];
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(1, steps - 1);
      const angle = Math.PI * 2 * t;
      circle.push([
        width / 2 + Math.cos(angle) * r,
        height / 2 + Math.sin(angle) * r,
      ]);
    }
    lines.push(circle);
  }

  lines = clipLinesWithMargin({
    margin: 1,
    width,
    height,
    lines,
    withBorder: true,
  });

  lines = clipPolylinesToBox(lines, [
    width * 0.25,
    height * 0.25,
    width * 0.4,
    height * 0.6,
  ]);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  return props => renderPolylines(lines, props);
};

canvasSketch(sketch, settings);
