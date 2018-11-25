import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { random } from '../../utils';
import { getNeighbors } from './helpers';

import plot from './plot';

////// TWEAKS - modify these to change the art effect
const TWEAKS = {
  useBorder: false,
};

////// RENDERER - This controls the drawing. Called once per cell in the image.
const cellRenderer = ({
  x,
  y,
  width,
  height,
  cell,
  rowIndex,
  colIndex,
  data,
}) => {
  let lines = [];
  const neighbors = getNeighbors(rowIndex, colIndex, data);

  let darkestNeighbor = neighbors[0];
  neighbors.forEach(neighbor => {
    if (neighbor.cell.l < darkestNeighbor.cell.l) {
      darkestNeighbor = neighbor;
    }
  });

  const lineStartX = x + width / 2;
  const lineStartY = y + height / 2;
  let lineEndX;
  let lineEndY;

  const heightOffset = height * 2 * Math.random();
  const widthOffset = width * 2 * Math.random();

  if (darkestNeighbor.rowIndex > rowIndex) {
    lineEndX = lineStartX + heightOffset;
  } else if (darkestNeighbor.rowIndex < rowIndex) {
    lineEndX = lineStartX - heightOffset;
  } else {
    lineEndX = lineStartX;
  }

  if (darkestNeighbor.colIndex > colIndex) {
    lineEndY = lineStartY + widthOffset;
  } else if (darkestNeighbor.colIndex < colIndex) {
    lineEndY = lineStartY - widthOffset;
  } else {
    lineEndY = lineStartY;
  }

  lines.push([[lineStartX, lineStartY], [lineEndX, lineEndY]]);

  if (TWEAKS.useBorder) {
    lines.push([
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
      [x, y],
    ]);
  }

  return lines;
};

////// PLOT - this passes our cell renderer to the shared plotting function.
plot(cellRenderer);
