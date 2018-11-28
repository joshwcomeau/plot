// @flow
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const convertUnits = require('convert-units');

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

  console.log(newLines);
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
 * @param {number} lineWidth - how long should each dash be? For a dotted line,
 *                             supply a really small value.
 */
export const createDashedLine = ({ p1, p2, numOfDashes, lineWidth }) => {
  // TODO
};
