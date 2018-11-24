import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { normalize, range, convertDegreesToRadians } from '../../utils';

import plot from './plot';

////// TWEAKS - modify these to change the art effect
const TWEAKS = {
  // Should the cell's `hue` be used to control what angle the lines are drawn?
  useHueAsAngle: true,
  // Should each cell's lines be offset by a random amount?
  randomizeOffset: false,
  // Should a border be drawn around each cell?
  useBorder: false,
};

const DEFAULT_ANGLE = 45;
const DEFAULT_OFFSET = 0;

////// RENDERER - This controls the drawing. Called once per cell in the image.
const cellRenderer = ({ x, y, width, height, cell }) => {
  const angle = TWEAKS.useHueAsAngle ? cell.h : DEFAULT_ANGLE;

  // TODO: I should use seeded random values?
  const initialOffset = TWEAKS.randomizeOffset
    ? -Math.random()
    : DEFAULT_OFFSET;

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
  const spacing = normalize(cell.l, 0, 100, minSpacing, maxSpacing);

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
