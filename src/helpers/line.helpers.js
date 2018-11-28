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
