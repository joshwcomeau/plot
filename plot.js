import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { clipLinesWithMargin } from './helpers/poly-line.helpers.js';
import {
  normalize,
  random,
  range,
  roundTo,
  convertDegreesToRadians,
} from './utils';

import imageHSLData from './data/images/mona-lisa.js';

const settings = {
  dimensions: [8.5, 11],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'in',
  // animate: true,
  // duration: 1,
};

const getLinesForCell = ({
  x,
  y,
  width,
  height,
  lightness,
  angle = 45,
  initialOffset = 0,
}) => {
  const angleRadians = convertDegreesToRadians(angle);
  // For now, and only for now, I'm gonna assume we want 10 lines per box.
  // In reality, I'll need a `while` loop to work out when the lines have gone
  // too far. Because the angle is variable, it's not actually that trivial
  // (at least, for me) to know how many lines are needed?
  const numOfLines = 100;

  // `lightness` is a number from 0-100, where 100 is white and 0 is black.
  // The lighter it is, the more space we want between lines.
  // Because our unit is inches, a reasonable width/height is ~0.2 inches.
  // So, let's assume that for absolute black, we want 0.001 space between the
  // lines. For absolute white, make it 0.05.
  const minSpacing = 0.02;
  const maxSpacing = 0.1;
  const spacing = normalize(lightness, 0, 100, minSpacing, maxSpacing);

  let lines = range(numOfLines).map(i => {
    // Our line will start from x: 0, with the `y` depending on index and
    // spacing.
    /*
         _____________________
        |      /
        |    /
        |  /
      > |/_______
        |
        |
        |
    */
    const totalSpacing = spacing + i * spacing + initialOffset;

    const startPointX = x;
    const startPointY = y + totalSpacing;

    // For the endPoint, we need to use some trigonometry! We know the angle,
    // as well as the 'opposite' line. We need to get the adjacent line to know
    // what the final `x` is.
    const endPointX = x + totalSpacing / Math.atan(angleRadians);
    const endPointY = y;

    return [[startPointX, startPointY], [endPointX, endPointY]];
  });

  const box = [x, y, x + width, y + height];
  lines = clipPolylinesToBox(lines, box);

  // lines.push([
  //   [x, y],
  //   [x + width, y],
  //   [x + width, y + height],
  //   [x, y + height],
  //   [x, y],
  // ]);

  return lines;
};

const sketch = ({ width, height }) => {
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

  const useHueAsAngle = true;

  return props => {
    let lines = [];

    imageHSLData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = MARGIN + CELL_INNER_MARGIN + colIndex * cellOuterWidth;
        const y = MARGIN + CELL_INNER_MARGIN + rowIndex * cellOuterHeight;

        const angle = useHueAsAngle ? cell.h : 45;
        const initialOffset = -Math.random();

        const cellLines = getLinesForCell({
          x,
          y,
          width: cellInnerWidth,
          height: cellInnerHeight,
          lightness: cell.l,
          angle,
          initialOffset,
        });

        lines.push(...cellLines);
      });
    });

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
