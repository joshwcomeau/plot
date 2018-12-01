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
} from '../../helpers/line.helpers';
import { normalize, range, compose } from '../../utils';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const SAMPLES_PER_ROW = 50;
const DISTANCE_BETWEEN_ROWS = 0.5;
const NUM_ROWS = 2;

const getRowOffset = (
  rowIndex,
  pageHeight,
  distanceBetweenRows = DISTANCE_BETWEEN_ROWS
) =>
  // TODO: This should be MARGIN * 2. FInd out why lines are so far below
  // the offset!
  pageHeight - MARGIN * 7 - rowIndex * distanceBetweenRows;

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

    const samplesInRows = chunk(allSamples, SAMPLES_PER_ROW).slice(0, NUM_ROWS);

    samplesInRows.forEach((samples, rowIndex) => {
      // Each row is `DISTANCE_BETWEEN_ROWS` apart.
      // The first row is at the bottom of the page, and each one is higher
      // up, so we multiply by -1.
      // Each row gets a certain % of the page height to work with.
      // (doesn't have to add up to 100, rows can overlap.)
      const rowHeight = height * 0.5;
      const rowOffset = getRowOffset(rowIndex, height);
      const numOfSamples = samples.length;
      const distanceBetweenSamples = width / numOfSamples;

      let rowLines = [];

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

        // Look at previous rows
        let rowIndexPointer = rowIndex - 1;
        const maxNumToCheck = 3;
        const stopAt = rowIndexPointer - maxNumToCheck;

        let earliestIntersection = null;

        while (
          rowIndexPointer > stopAt &&
          rowIndexPointer >= 0 &&
          sampleIndex > 0
        ) {
          const rowToCompare = samplesInRows[rowIndexPointer];
          const rowToCompareOffset = getRowOffset(rowIndexPointer, height);

          const otherRowSampleLine = [
            getSampleCoordinates({
              sampleIndex: sampleIndex - 1,
              amplitude: rowToCompare[sampleIndex - 1],
              distanceBetweenSamples,
              rowOffset: rowToCompareOffset,
              rowHeight,
            }),
            getSampleCoordinates({
              sampleIndex: sampleIndex,
              amplitude: rowToCompare[sampleIndex],
              distanceBetweenSamples,
              rowOffset: rowToCompareOffset,
              rowHeight,
            }),
          ];

          const currentRowSampleLine = [previousSamplePoint, samplePoint];

          const { type, point } = checkIntersection(
            currentRowSampleLine[0][0],
            currentRowSampleLine[0][1],
            currentRowSampleLine[1][0],
            currentRowSampleLine[1][1],
            otherRowSampleLine[0][0],
            otherRowSampleLine[0][1],
            otherRowSampleLine[1][0],
            otherRowSampleLine[1][1]
          );

          if (type !== 'none') {
            // TODO: check if this point is actually earlier, by looking at
            // point.x
            earliestIntersection = point;
          }

          rowIndexPointer--;
        }

        if (earliestIntersection) {
          samplePoint = [earliestIntersection.x, earliestIntersection.y];
        }

        rowLines.push([previousSamplePoint, samplePoint]);

        return;
      });

      lines.push(...rowLines);
    });

    const linePrep = lines =>
      groupPolylines(
        clipLinesWithMargin({
          lines,
          margin: MARGIN,
          width,
          height,
        })
      );

    console.log('lines', lines);
    console.log('line', lines[0]);
    console.log('point', lines[0][0]);

    console.log('before group', lines);
    lines = linePrep(lines);
    console.log('after group', lines);

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
