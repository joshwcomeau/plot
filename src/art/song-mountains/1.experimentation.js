//
import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { loadAudioData } from '../../helpers/audio.helpers';
import { normalize } from '../../utils';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const sketch = async ({ width, height, context }) => {
  const waveform = await loadAudioData(SONG_FILENAME);

  return props => {
    let lines = [];

    const initialPosition = [0, height / 2];

    // from 0 to 100
    const sliceStart = 0;
    const sliceEnd = 100;
    const numOfPoints = sliceEnd - sliceStart;
    waveform.min.slice(sliceStart, sliceEnd).forEach((val, x) => {
      const actualX = (x / numOfPoints) * width;
      const actualY = normalize(val, -128, 128, 0, height);

      const lastLine = lines[lines.length - 1];
      const lastPosition = lastLine ? lastLine[1] : initialPosition;

      lines.push([lastPosition, [actualX, actualY]]);
    });

    console.log(lines);

    const box = [MARGIN, MARGIN, width - MARGIN, height - MARGIN];
    lines = clipPolylinesToBox(lines, box);

    return renderPolylines(lines, props);
  };
};

canvasSketch(sketch, settings);
