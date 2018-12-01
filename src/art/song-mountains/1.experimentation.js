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

import settings from '../settings';

/**
 *
 * STATIC SETTINGS
 *
 */
const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const SAMPLES_PER_ROW = 200;
const DISTANCE_BETWEEN_ROWS = 0.25;
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
  sampleIndex,
  amplitude,
  distanceBetweenSamples,
  rowOffset,
  rowHeight,
}) => [
  sampleIndex * distanceBetweenSamples + MARGIN,
  normalize(amplitude, -128, 128, 0, rowHeight) + rowOffset,
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
  const waveform = await loadAudioData(SONG_FILENAME);

  return props => {
    let lines = [];

    // Our audio returns an array of "samples", under waveform.min.
    // A sample is just an amplitude value, between -128 and 128.
    //
    // We split the audio into chunks of samples, so that we can render
    // multiple rows.
    //
    // Each sample will be comprised of multiple "segments". A segment is
    // just a short line.
    //                           o  <- Sample (amplitude value)
    //                         /
    //                      /       <- 3 line segments connect this sample
    //                   /             to the previous one.
    //  o - - - - - - o
    //
    // We can't just draw a single line to connect samples because lines might
    // be occluded by earlier lines. If this line happens to be behind an
    // earlier row's line, we want to omit it.

    let firstNonZeroValueIndex;
    for (let i = 0; i < 200; i++) {
      if (waveform.min[i] !== 0) {
        firstNonZeroValueIndex = i;
        break;
      }
    }

    if (typeof firstNonZeroValueIndex !== 'number') {
      throw new Error('Sound is completely silent!');
    }

    const allSamples = waveform.min.slice(firstNonZeroValueIndex);

    const sampleRows = chunk(allSamples, SAMPLES_PER_ROW).slice(0, NUM_ROWS);

    sampleRows.forEach((samples, rowIndex) => {
      // Each row is `DISTANCE_BETWEEN_ROWS` apart.
      // The first row is at the bottom of the page, and each one is higher
      // up, so we multiply by -1.
      // Each row gets a certain % of the page height to work with.
      // (doesn't have to add up to 100, rows can overlap.)
      const rowHeight = height * 0.25;
      const rowOffset = getRowOffset(rowIndex, height);
      const numOfSamples = samples.length;
      const distanceBetweenSamples = width / numOfSamples;

      samples.forEach((amplitude, sampleIndex) => {
        if (sampleIndex === 0) {
          return;
        }

        let samplePoint = getSampleCoordinates({
          sampleIndex,
          amplitude,
          distanceBetweenSamples,
          rowOffset,
          rowHeight,
        });

        const previousAmplitude = samples[sampleIndex - 1];
        const previousSamplePoint = getSampleCoordinates({
          sampleIndex: sampleIndex - 1,
          amplitude: previousAmplitude,
          distanceBetweenSamples,
          rowOffset,
          rowHeight,
        });

        let line = [previousSamplePoint, samplePoint];

        // Take the 3 most recent rows into account
        const previousRows = [
          sampleRows[rowIndex - 1],
          sampleRows[rowIndex - 2],
          sampleRows[rowIndex - 3],
        ].filter(row => !!row);

        const previousLines = previousRows.map((row, index) => {
          // We need to remember this row's offset.
          // If this is index 0, this is 1 row earlier.
          // If this is index 1, this is 2 rows earlier, etc.
          // So we can just add 1 to the index, to figure out how many rows
          // back this was.
          const numOfRowsBack = index + 1;

          const previousRowOffset = getRowOffset(
            rowIndex - numOfRowsBack,
            height
          );

          return [
            getSampleCoordinates({
              sampleIndex: sampleIndex - 1,
              amplitude: row[sampleIndex - 1],
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight,
            }),
            getSampleCoordinates({
              sampleIndex: sampleIndex,
              amplitude: row[sampleIndex],
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight,
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
