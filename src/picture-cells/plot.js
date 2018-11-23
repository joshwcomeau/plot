import canvasSketch from 'canvas-sketch';
import { renderPolylines, exportPolylines } from 'canvas-sketch-util/penplot';

import { clipLinesWithMargin } from '../helpers/poly-line.helpers.js';
import { parseImage } from '../helpers/image.helpers.js';

import {getLinesForCell} from './lines';


const settings = {
  dimensions: [8.5, 11],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in',
};


const sketch = ({ width, height }) => {
  // our paper size is 21cm x 29.7cm.
  // We have a 2D array of image pixel data which is 26x34.
  // We could normalize it, so that we split the available 21cm into 26
  // divisions, but we also have to factor margins in.
  const MARGIN = 0.5;

  const availableWidth = width - MARGIN * 2;
  const availableHeight = height - MARGIN * 2;

  const useHueAsAngle = true;

  return parseImage('/src/data/images/mona-lisa.png').then(imageHSLData => {

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
      let lines = [];

      imageHSLData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const x = MARGIN + CELL_INNER_MARGIN + colIndex * cellOuterWidth;
          const y = MARGIN + CELL_INNER_MARGIN + rowIndex * cellOuterHeight;

          const cellLines = getLinesForCell({
            x,
            y,
            width: cellInnerWidth,
            height: cellInnerHeight,
            cell,
          });

          lines.push(...cellLines);
        });
      });

      return [
        renderPolylines(lines, props),
        exportPolylines(lines, settings)
      ];
    };
  });
};

canvasSketch(sketch, settings);
