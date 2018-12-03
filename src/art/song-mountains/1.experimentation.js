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
  getValuesForBezierCurve,
} from '../../helpers/line.helpers';
import { normalize, range, compose } from '../../utils';
import { seed, perlin2 } from '../../vendor/noise';

import settings from '../settings';

seed(1);

/**
 *
 * STATIC SETTINGS
 *
 */
const MARGIN = 1;

// TODO: When this number drops below 300, the occlusion starts to fail a bit,
// you can see lines cutting into other curves :thinking-face:.
// I should fix this, since I should only need 250 samples per row for smooth
// curves, and a lower # will mean much faster rendering.
const SAMPLES_PER_ROW = 500;
const DISTANCE_BETWEEN_ROWS = 0.25;
const NUM_ROWS = 30;

// The avg. number of peaks per row depends on the `SAMPLES_PER_ROW`.
// That value, though, is really just "print resolution", and we shouldn't
// be changing it for cosmetic effect (unless we want to do a low-poly one or
// something).
// Our `PERLIN_MULTIPLIER` value ensures that we can tweak `SAMPLES_PER_ROW`
// without chaging the appearance of the design, only the # of dots that the
// plotter has to worry about.
const PERLIN_RANGE_PER_ROW = 10;

const PEAK_AMPLITUDE_MULTIPLIER = 0.35;

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
  pageHeight - MARGIN * 2 - rowIndex * distanceBetweenRows;

const getSampleCoordinates = ({
  value,
  sampleIndex,
  distanceBetweenSamples,
  rowOffset,
  rowHeight,
}) => [
  sampleIndex * distanceBetweenSamples + MARGIN,
  normalize(
    value,
    -1,
    1,
    -rowHeight * PEAK_AMPLITUDE_MULTIPLIER,
    rowHeight * PEAK_AMPLITUDE_MULTIPLIER
  ) + rowOffset,
];

const takeOcclusionIntoAccount = (line, previousLines, debug = false) => {
  if (previousLines.length === 0) {
    return line;
  }

  const { slope } = getSlopeAndInterceptForLine(line);

  // First case: This line segment is totally below at least 1 previous line
  // In this case, we want to return `null`. We don't want to render anything
  // for this line.
  const isTotallyBelow = previousLines.some(previousLine => {
    return previousLine[0][1] < line[0][1] && previousLine[1][1] < line[1][1];
  });

  if (debug && isTotallyBelow) {
  }

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

const getValue = (sampleIndex, rowIndex) => {
  // Calculate the noise value for this point in space.
  // We need to do linear interpolation, because while we might have 50 or
  // 500 or 5000 samples per row, we only want to use a standard perlin range
  // of 0 to PERLIN_RANGE_PER_ROW.
  const noiseX = normalize(
    sampleIndex,
    0,
    SAMPLES_PER_ROW,
    0,
    PERLIN_RANGE_PER_ROW
  );

  const noiseVal = perlin2(noiseX, rowIndex * 1.5);

  // If we were to just return `noiseVal`, we'd have mountains all over the
  // page. Instead, though, we want to dampen the effect of the randomization,
  // so that it starts subtle, peaks in the center, and then drops off at the
  // end. Like a bell curve.
  //
  // My not-the-smartest way to do this is to consider it as 2 bezier curves:
  /*

  For the first half, use a cubic bezier curve to produce a curve that eases
  in and out, to ramp from 0 to 1:
  o         ____o
          /
        |
  _____|
  o             o

  The second half will be the mirror image, starting high and dropping low.
  */

  const ratio = sampleIndex / SAMPLES_PER_ROW;
  const isInFirstHalf = ratio < 0.5;

  let bezierArgs = {};
  if (isInFirstHalf) {
    bezierArgs = {
      startPoint: [0, 0],
      controlPoint1: [1, 0],
      controlPoint2: [0, 1],
      endPoint: [1, 1],
      t: ratio * 2,
    };
  } else {
    bezierArgs = {
      startPoint: [0, 1],
      controlPoint1: [1, 1],
      controlPoint2: [0, 0],
      endPoint: [1, 0],
      t: normalize(ratio, 0.5, 1),
    };
  }

  const [, heightDampingAmount] = getValuesForBezierCurve(bezierArgs);

  return noiseVal * heightDampingAmount;
};

const flipEverySecondLine = lines => {
  return lines.map((line, index) => {
    if (index % 2 !== 0) {
      // WARNING ACK! THIS IS MUTATIVE AND BAD PRACTICE. DO NOT COPY OR YOU
      // WILL BE FIRED
      // A single line is an array of
      line.reverse();
    }

    return line;
  });
};

/**
 *
 *
 *
 *
 * MAIN SKETCH METHOD
 *
 *
 *
 *
 */
const sketch = async ({ width, height, context }) => {
  const ROW_HEIGHT = height * 0.5;

  return props => {
    let lines = [];

    // Generate some data!
    range(NUM_ROWS).forEach(rowIndex => {
      range(SAMPLES_PER_ROW).forEach(sampleIndex => {
        const value = getValue(sampleIndex, rowIndex);

        const rowOffset = getRowOffset(rowIndex, height);
        const distanceBetweenSamples = (width - MARGIN * 2) / SAMPLES_PER_ROW;

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

        const previousValue = getValue(sampleIndex - 1, rowIndex);
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
          rowIndex - 4,
          rowIndex - 5,
          rowIndex - 6,
        ].filter(index => index >= 0);

        const previousLines = previousRowIndices.map(previousRowIndex => {
          const previousRowOffset = getRowOffset(previousRowIndex, height);

          return [
            getSampleCoordinates({
              value: getValue(sampleIndex - 1, previousRowIndex),
              sampleIndex: sampleIndex - 1,
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight: ROW_HEIGHT,
            }),
            getSampleCoordinates({
              value: getValue(sampleIndex, previousRowIndex),
              sampleIndex: sampleIndex,
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight: ROW_HEIGHT,
            }),
          ];
        });

        const occludedLine = takeOcclusionIntoAccount(
          line,
          previousLines,
          rowIndex === 3
        );

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
