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
} from '../../helpers/line.helpers';
import { normalize, range } from '../../utils';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const SAMPLES_PER_ROW = 50;
const DISTANCE_BETWEEN_ROWS = 0.5;
const NUM_ROWS = 1;

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

      let rowPolyline = [];

      samples.forEach((amplitude, sampleIndex) => {
        const samplePoint = getSampleCoordinates({
          sampleIndex,
          amplitude,
          distanceBetweenSamples,
          rowOffset,
          rowHeight,
        });

        const previousAmplitude = samples[sampleIndex - 1];
        const previousSamplePoint =
          typeof previousAmplitude === 'number'
            ? getSampleCoordinates({
                sampleIndex: sampleIndex - 1,
                amplitude: previousAmplitude,
                distanceBetweenSamples,
                rowOffset,
                rowHeight,
              })
            : undefined;

        rowPolyline.push(samplePoint);

        // Look at previous rows
        let rowIndexPointer = rowIndex - 1;
        const maxNumToCheck = 3;
        const stopAt = rowIndexPointer - maxNumToCheck;

        while (rowIndexPointer > stopAt && rowIndexPointer >= 0) {
          const rowToCompare = samplesInRows[rowIndexPointer];
          const previousRowOffset = getRowOffset(rowIndexPointer, height);

          const previousRowSampleLine = [
            getSampleCoordinates({
              sampleIndex: sampleIndex - 1,
              amplitude: previousAmplitude,
              distanceBetweenSamples,
              rowOffset: previousRowOffset,
              rowHeight,
            }),
          ];

          rowIndexPointer--;
        }

        return;

        // TODO: Forget about segments, instead use `checkIntersection` to see
        // if this line (from previousSample to sample) intersect with any
        // of the lines in previous rows (maybe check 3-4 back?).
        // We can also just check if the Y value for sample is under the Y
        // values of previous rows (it might make sense to do this as a
        // separate pass, after coming up with the original lines?)
      });

      lines.push(rowPolyline);
    });

    console.log(lines);

    lines = clipLinesWithMargin({ margin: MARGIN, width, height, lines });

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
