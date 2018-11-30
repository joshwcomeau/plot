// @flow
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { lerp } = require('canvas-sketch-util/math');
const convertUnits = require('convert-units');

import { range } from '../utils';

export const getDistanceBetweenPoints = (p1, p2) => {
  const deltaX = p2[0] - p1[0];
  const deltaY = p2[1] - p1[1];

  return Math.sqrt(deltaX ** 2 + deltaY ** 2);
};

export const clipLinesWithMargin = ({
  margin,
  width,
  height,
  lines,
  withBorder,
}) => {
  // Clip all the lines to a margin
  const box = [margin, margin, width - margin, height - margin];
  let newLines = clipPolylinesToBox(lines, box);

  if (withBorder) {
    newLines = [...newLines, [box[0], box[1]]];
  }

  return newLines;
};

/**
 * Given two points, p1 and p2, create an array of tiny dashes that span between
 * them.
 *
 * NOTE: the dashes include the first point, but exclude the last point:
 *
 * __   __   __   __   .
 * ^                   ^
 * P1                  P2
 *
 * This is so that dashed lines can be chained together without doubling the
 * dash on the connecting point.
 *
 * @typedef {[number, number]} Point
 *
 * @param {Point} p1 - the start point
 * @param {Point} p2 - the end point
 * @param {number} numOfDashes - How many dashes to render
 * @param {number} dashLength - how long should each dash be? For a dotted line,
 *                              supply a really small value.
 */
export const createDashedLine = ({ p1, p2, numOfDashes, dashLength }) => {
  const distanceBetweenPoints = getDistanceBetweenPoints(p1, p2);

  return range(numOfDashes).map(dashIndex => {
    const ratio = dashIndex / numOfDashes;
    const pointStart = [
      lerp(p1[0], p2[0], ratio), // x
      lerp(p1[1], p2[1], ratio), // y
    ];

    const dashLengthRatio = dashLength / distanceBetweenPoints;
    const pointEnd = [
      lerp(p1[0], p2[0], ratio + dashLengthRatio), // x
      lerp(p1[1], p2[1], ratio + dashLengthRatio), // y
    ];

    return [pointStart, pointEnd];
  });
};

export const getSlopeAndInterceptForLine = ([[x1, y1], [x2, y2]]) => {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  const slope = deltaY / deltaX;
  const intercept = y1 - slope * x1;

  return { slope, intercept };
};

export const findIntersectionBetweenTwoLines = (line1, line2) => {
  // We need to work out the slope-intercept form (y = ax + b) for each line
  // provided.
};
