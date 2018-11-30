//
import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';
import chunk from 'lodash/chunk';

import { loadAudioData } from '../../helpers/audio.helpers';
import { clipLinesWithMargin } from '../../helpers/line.helpers';
import { normalize, range } from '../../utils';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const getSampleCoordinates = ({
  sampleIndex,
  amplitude,
  distanceBetweenSamples,
  rowHeight,
}) => [
  sampleIndex * distanceBetweenSamples + MARGIN,
  normalize(amplitude, -128, 128, 0, rowHeight),
];

const getSegmentsForSample = ({
  amplitude,
  previousAmplitude,
  sampleIndex,
  numOfSamples,
  pageWidth,
  pageHeight,
  rowHeight,
  pointsPerSample,
  pointWidth,
}) => {
  const distanceBetweenSamples = pageWidth / numOfSamples;

  const sample = getSampleCoordinates({
    sampleIndex,
    amplitude,
    distanceBetweenSamples,
    rowHeight,
  });

  const previousSample = getSampleCoordinates({
    sampleIndex: sampleIndex - 1,
    amplitude: previousAmplitude,
    distanceBetweenSamples,
    rowHeight,
  });

  // We have two dots in space.
  // We want to get the angle between them
  const xDistance = distanceBetweenSamples;
  const yDistance = Math.abs(previousAmplitude - amplitude);

  const angle = Math.atan2(yDistance, xDistance);

  const segmentsForSample = [];
  range(pointsPerSample).forEach(i => {
    const percentageThroughSample = i / pointsPerSample;

    const x1 =
      previousSample[0] + percentageThroughSample * distanceBetweenSamples;
    const y1 = Math.tan(angle) / (x1 - previousSample[1]);

    console.log(y1, Math.tan(angle), x1, previousSample[1]);
    // if (i === 0) {
    //   console.log(Math.tan(angle), x1, previousSample[0]);
    // }

    const x2 = x1 + pointWidth * Math.cos(angle);
    const y2 = y1 + pointWidth * Math.sin(angle);

    segmentsForSample.push([[x1, y1], [x2, y2]]);

    // We want our line to be of length `pointWidth`.
    // That's our hypothenuse length.
    // We worked out the angle earlier, in radians, and now we can use that
    // to work out the X and Y values.

    const from =
      i === 0
        ? previousSample
        : segmentsForSample[segmentsForSample.length - 1][1];

    const deltaX = sample[0] - from[0];
    const deltaY = sample[1] - from[1];

    const x = sample[0] + deltaX * percentageThroughSample;
    const y = sample[1] + deltaY * percentageThroughSample;

    // segmentsForSample.push([[...from], [x, y]]);
  });

  return segmentsForSample;
};

const sketch = async ({ width, height, context }) => {
  const waveform = await loadAudioData(SONG_FILENAME);

  return props => {
    // from 0 to 100
    const samplesPerRow = 4;
    const distanceBetweenRows = 0.5;
    const numRows = 1;
    const pointWidth = 0.005;
    const pointGap = pointWidth * 2;
    const pointsPerSample = Math.floor(
      width / samplesPerRow / (pointWidth + pointGap)
    );

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

    chunk(allSamples.slice(100), samplesPerRow)
      .slice(0, numRows)
      .forEach((samples, chunkIndex) => {
        // Each row is `distanceBetweenRows` apart.
        // The first row is at the bottom of the page, and each one is higher
        // up, so we multiply by -1.
        // Each row gets a certain % of the page height to work with.
        // (doesn't have to add up to 100, rows can overlap.)
        const rowHeight = height * 0.5;
        const rowOffset = chunkIndex * distanceBetweenRows * -1;
        const numOfSamples = samples.length;

        let segmentsForChunk = [];

        samples.forEach((amplitude, sampleIndex) => {
          // For the very first sample in this chunk, we have nothing to
          // connect it to! It floats alone. So we can skip it.
          if (sampleIndex === 0) {
            return;
          }

          const previousAmplitude = samples[sampleIndex - 1];

          let segmentsForSample = getSegmentsForSample({
            amplitude,
            previousAmplitude,
            sampleIndex,
            numOfSamples,
            pageWidth: width,
            pageHeight: height,
            rowHeight,
            pointsPerSample,
            pointWidth,
            pointGap,
          });

          // Each row has assumed its Y values are relative to the row.
          // Transform them to be relative to the document
          const firstRowY = height * 0.65;
          segmentsForSample = segmentsForSample.map(segment => {
            segment[0][1] += firstRowY + rowOffset;
            segment[1][1] += firstRowY + rowOffset;
            return segment;
          });

          segmentsForChunk.push(...segmentsForSample);
        });

        lines.push(...segmentsForChunk);
      });

    lines = clipLinesWithMargin({ margin: MARGIN, width, height, lines });

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
