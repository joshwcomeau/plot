//
import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';
import chunk from 'lodash/chunk';

import { loadAudioData } from '../../helpers/audio.helpers';
import { normalize, range } from '../../utils';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const getSegmentsForSample = ({
  amplitude,
  previousAmplitude,
  sampleIndex,
  numOfSamples,
  pageWidth,
  pageHeight,
  rowHeight,
  pointsPerSample,
}) => {
  const distanceBetweenSamples = pageWidth / numOfSamples;
  const toX = sampleIndex * distanceBetweenSamples + MARGIN;
  const toY = normalize(amplitude, -128, 128, 0, rowHeight);
  const to = [toX, toY];

  const previousSample = [
    (sampleIndex - 1) * distanceBetweenSamples + MARGIN,
    normalize(previousAmplitude, -128, 128, 0, rowHeight),
  ];

  const segmentsForSample = [];
  range(pointsPerSample).forEach(i => {
    const percentageThroughSample = i / pointsPerSample;

    const from =
      i === 0
        ? previousSample
        : segmentsForSample[segmentsForSample.length - 1];

    const deltaX = to[0] - from[0];
    const deltaY = to[1] - from[1];

    const x = to[0] + deltaX * percentageThroughSample;
    const y = to[1] + deltaY * percentageThroughSample;

    segmentsForSample.push([[...from], [x, y]]);
  });

  return segmentsForSample;
};

const sketch = async ({ width, height, context }) => {
  const waveform = await loadAudioData(SONG_FILENAME);

  return props => {
    // from 0 to 100
    const samplesPerRow = 100;
    const distanceBetweenRows = 0.5;
    const numRows = 20;
    const pointWidth = 0.005;
    const pointGap = 0.015;
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

    chunk(waveform.min, samplesPerRow)
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
          });

          // Each row has assumed its Y values are relative to the row.
          // Transform them to be relative to the document
          const firstRowY = height * 0.65;
          segmentsForSample = segmentsForSample.map(segment => {
            // TODO: use rowOffset
            segment[0][1] += firstRowY + rowOffset;
            segment[1][1] += firstRowY + rowOffset;
            return segment;
          });

          segmentsForChunk.push(...segmentsForSample);
        });

        lines.push(...segmentsForChunk);
      });

    const box = [MARGIN, MARGIN, width - MARGIN, height - MARGIN];
    lines = clipPolylinesToBox(lines, box);

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
