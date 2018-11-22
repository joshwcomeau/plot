import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { clipLinesWithMargin } from './helpers/poly-line.helpers.js';

import imageHSLData from './data/images/city-architecture-2';

const settings = {
  dimensions: [8.5, 11],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in',
};

const sketch = ({ width, height, context }) => {
  // our paper size is 21cm x 29.7cm.
  // We have a 2D array of image pixel data which is 26x34.
  // We could normalize it, so that we split the available 21cm into 26
  // divisions, but we also have to factor margins in.
  const MARGIN = 0.5;

  const availableWidth = width - MARGIN * 2;
  const availableHeight = height - MARGIN * 2;

  const numOfRows = imageHSLData.length;
  const numOfCols = imageHSLData[0].length;

  const cellOuterWidth = availableWidth / numOfCols;
  const cellOuterHeight = availableHeight / numOfRows;

  // We want a bit of spacing between each cell.
  const CELL_INNER_MARGIN = cellOuterWidth * 0.1;

  const cellInnerWidth = cellOuterWidth - CELL_INNER_MARGIN * 2;
  const cellInnerHeight = cellOuterHeight - CELL_INNER_MARGIN * 2;

  // We want the image provided to be the same aspect ratio as our available
  // space. If it's not, we'll wind up with rectangles instead of squares.
  if (cellOuterWidth !== cellOuterHeight) {
    console.warn(
      'Uh oh - looks like the image provided is not at the same 3:4 ratio as the canvas.'
    );
  }

  return props => {
    // JUST FOR NOW, I'm gonna use context to fill some rects.
    // Will use a different approach later.
    imageHSLData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        context.fillStyle = `hsl(${cell.h}, ${cell.s}%, ${cell.l}%)`;
        context.fillRect(
          MARGIN + CELL_INNER_MARGIN + colIndex * cellOuterWidth,
          MARGIN + CELL_INNER_MARGIN + rowIndex * cellOuterHeight,
          cellInnerWidth,
          cellInnerHeight
        );
      });
    });
  };
};

canvasSketch(sketch, settings);
