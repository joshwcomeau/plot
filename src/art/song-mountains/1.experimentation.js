//
import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';
import { checkIntersection } from 'line-intersect';
import chunk from 'lodash/chunk';

import { loadAudioData } from '../../helpers/audio.helpers';
import {
  createDashedLine,
  clipLinesWithMargin,
  groupPolylines,
  getSlopeAndInterceptForLine,
} from '../../helpers/line.helpers';
import { normalize, range, compose } from '../../utils';
import { seed, simplex2 } from '../../vendor/noise';

import settings from '../settings';

seed(Math.random());

/**
 *
 * STATIC SETTINGS
 *
 */
const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const SAMPLES_PER_ROW = 200;
const DISTANCE_BETWEEN_ROWS = 1;
const NUM_ROWS = 20;

/**
 *
 * UTILITY / HELPER METHODS
 *
 */
const getRowOffset = (
  rowIndex,
  pageHeight,
  distanceBetweenRows = DISTANCE_BETWEEN_ROWS
) =>
  // TODO: This should be MARGIN * 2 isntead of 4.
  // FInd out why lines are so far below the offset!
  pageHeight - 4 - rowIndex * distanceBetweenRows;

const getSampleCoordinates = ({
  value,
  sampleIndex,
  distanceBetweenSamples,
  rowOffset,
  rowHeight,
}) => [
  sampleIndex * distanceBetweenSamples + MARGIN,
  normalize(value, -1, 1, -rowHeight * 0.1, rowHeight * 0.1) + rowOffset,
];

const takeOcclusionIntoAccount = (line, previousLines) => {
  if (previousLines.length === 0) {
    return line;
  }

  const { slope } = getSlopeAndInterceptForLine(line);

  // First case: This line segment is totally below at least 1 previous line
  // In this case, we want to return `null`. We don't want to render anything
  // for this line.
  const isTotallyBelow = previousLines.some(previousLine => {
    return previousLine[0] < line[0] && previousLine[1] < line[1];
  });

  if (isTotallyBelow) {
    return null;
  }

  // Next case: the line is partially occluded.
  // In the case that our line goes from not-occluded to occluded, we expect to
  // see a line with a slope above our current line's
  // if the slope is negative, we care about the _latest_ intersection:
  /*

  \    /
   \ /                < negative slope in front of our line
    \                   If there are multiple, the larger `x` intersection
     \                  value wins


        /
  ----/               < positive slope in front of our line
    /                   If there are multiple, the smaller `x` intersection
  /                     value wins.

  */

  let becomeOccludedAt = null;
  let breakFreeAt = null;
  previousLines.forEach(previousLine => {
    const { type, point } = checkIntersection(
      line[0][0],
      line[0][1],
      line[1][0],
      line[1][1],
      previousLine[0][0],
      previousLine[0][1],
      previousLine[1][0],
      previousLine[1][1]
    );

    if (type === 'intersecting') {
      const { slope: previousSlope } = getSlopeAndInterceptForLine(
        previousLine
      );

      // If our current slope is greater than the previous slope, it means
      // that our line is currently occluded and breaking free.
      // If the current slope is < the previous, it means our line is currently
      // free, but is about to dip behind the previous line.
      const isBecomingOccludedByThisLine = slope > previousSlope;
      const isBreakingFreeFromThisLine = !isBecomingOccludedByThisLine;

      if (isBecomingOccludedByThisLine) {
        if (!becomeOccludedAt || becomeOccludedAt.x > point.x) {
          becomeOccludedAt = [point.x, point.y];
        }
      } else if (isBreakingFreeFromThisLine) {
        if (!breakFreeAt || breakFreeAt.x < point.x) {
          breakFreeAt = [point.x, point.y];
        }
      }
    }
  });

  let start = line[0];
  let end = line[1];

  if (becomeOccludedAt) {
    end = becomeOccludedAt;
  }

  if (breakFreeAt) {
    start = breakFreeAt;
  }

  return [start, end];
};

/**
 *
 * MAIN SKETCH METHOD
 *
 */
const sketch = async ({ width, height, context }) => {
  const ROW_HEIGHT = height * 0.5;

  return props => {
    let lines = [];

    // Generate some data!
    range(NUM_ROWS).forEach(rowIndex => {
      range(SAMPLES_PER_ROW).forEach(sampleIndex => {
        const value = simplex2(sampleIndex, rowIndex);

        const rowOffset = getRowOffset(rowIndex, height);
        const distanceBetweenSamples = width / SAMPLES_PER_ROW;

        if (sampleIndex === 0) {
          return;
        }

        let samplePoint = getSampleCoordinates({
          sampleIndex,
          value,
          distanceBetweenSamples,
          rowOffset,
          rowHeight: ROW_HEIGHT,
        });

        const previousValue = simplex2(sampleIndex - 1, rowIndex);
        const previousSamplePoint = getSampleCoordinates({
          sampleIndex: sampleIndex - 1,
          value: previousValue,
          distanceBetweenSamples,
          rowOffset,
          rowHeight: ROW_HEIGHT,
        });

        let line = [previousSamplePoint, samplePoint];

        // Take the 3 most recent rows into account
        const previousRowIndices = [
          rowIndex - 1,
          rowIndex - 2,
          rowIndex - 3,
        ].filter(index => index >= 0);

        const previousLines = previousRowIndices.map(previousRowIndex => {
          const previousRowOffset = getRowOffset(previousRowIndex, height);

          return [
            getSampleCoordinates({
              value: simplex2(sampleIndex - 1, previousRowIndex),
              sampleIndex: sampleIndex - 1,
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight: ROW_HEIGHT,
            }),
            getSampleCoordinates({
              value: simplex2(sampleIndex, previousRowIndex),
              sampleIndex: sampleIndex,
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight: ROW_HEIGHT,
            }),
          ];
        });

        const occludedLine = takeOcclusionIntoAccount(line, previousLines);

        lines.push(occludedLine);
      });
    });

    lines = lines.filter(line => !!line);

    const linePrep = compose(
      groupPolylines,
      clipLinesWithMargin
    );

    lines = linePrep({ lines, margin: MARGIN, width, height });

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
