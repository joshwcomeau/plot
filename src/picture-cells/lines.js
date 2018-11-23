import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import {
    normalize,
    range,
    convertDegreesToRadians,
  } from '../utils';

// Toggle me to use the cell's `hue` over the angle
const useHueAsAngle = false;
// Toggle me to add a bit of randomness to the line offset of each cell,
// This means that two cells with the  same HSL values won't look identical.
const randomizeOffset = false;

export const getLinesForCell = ({
    x,
    y,
    width,
    height,
    cell
  }) => {
    const angle = useHueAsAngle ? cell.h : 45;
    // TODO: I should use seeded random values?
    const initialOffset = randomizeOffset ? -Math.random() : 0;

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

    // lines.push([
    //   [x, y],
    //   [x + width, y],
    //   [x + width, y + height],
    //   [x, y + height],
    //   [x, y],
    // ]);

    return lines;
  };
