/**
 * Parses an image, returning an array of HSL data for every pixel in the image,
 * in a 2D array.
 */
import fs from 'fs';

import ImageParser from 'image-parser';
import Color from 'color';

import { roundTo } from '../utils';

export const parseImage = (path, logOutput = false) => {
  const imageBuffer = fs.readFileSync(path);
  let img = new ImageParser(imageBuffer);

  return new Promise((resolve, reject) => {
    img.parse(err => {
      if (err) {
        if (logOutput) {
          console.error(err);
        }

        reject(err);
      }

      const width = img.width();
      const pixels = img.pixels();

      // The ImageParser API returns a 1D array of RGB values.
      // We want to convert this into a 2D array of HSL values.
      const data = pixels.reduce((acc, pixel, index) => {
        const [h, s, l] = Color({
          r: pixel.r,
          g: pixel.g,
          b: pixel.b,
        }).hsl().color;

        const color = {
          h: roundTo(h, 1),
          s: roundTo(s, 1),
          l: roundTo(l, 1),
        };

        const rowNum = Math.floor(index / width);
        // const colNum = index % width;

        if (acc.length < rowNum + 1) {
          acc.push([]);
        }

        acc[rowNum].push(color);

        return acc;
      }, []);

      if (logOutput) {
        console.log(data);
      }

      resolve(data);
      return;
    });
  });
};
