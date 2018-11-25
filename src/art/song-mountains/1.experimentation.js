//
import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';

import { loadAudioData } from '../../helpers/audio.helpers';

import settings from '../settings';

const SONG_FILENAME = 'fox-stevenson-radar.dat';
const MARGIN = 0.5;

const sketch = async ({ width, height, context }) => {
  const waveform = await loadAudioData(SONG_FILENAME);

  return props => {
    let lines = [];

    // const box = [MARGIN, MARGIN, width - MARGIN, height - MARGIN];
    // lines = clipPolylinesToBox(lines, box);

    // return renderPolylines(lines, props);
    const interpolateHeight = total_height => {
      const amplitude = 256;
      return size => total_height - ((size + 128) * total_height) / amplitude;
    };

    const y = interpolateHeight(height);

    const ctx = context;
    ctx.beginPath();

    // from 0 to 100
    const numOfPoints = waveform.max.length;
    waveform.min.forEach((val, x) => {
      const actualX = (x / numOfPoints) * width;
      // console.log(actualX);
      ctx.lineTo(actualX + MARGIN, y(val) + MARGIN);
    });

    // // then looping back from 100 to 0
    // waveform.max.reverse().forEach((val, x) => {
    //   x = waveform.offset_length - x + 0.5;
    //   console.log(x);
    //   ctx.lineTo(x, y(val) + 0.5);
    // });

    ctx.closePath();
    ctx.lineWidth = 0.01;
    ctx.stroke();
    // ctx.fillStyle = '#FF0000';
    // ctx.fill();

    return ctx;
  };
};

canvasSketch(sketch, settings);
