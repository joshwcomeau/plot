/**
 * Parses an image, returning an array of HSL data for every pixel in the image,
 * in a 2D array.
 */
import fs from 'fs';

import Color from 'color';
import chunk from 'lodash/chunk';
import PNGReader from '../vendor/png';

import { roundTo } from '../utils';

/**
 * NOTE: The current version of this function only supports png.
 * An older version of this function supported jpg/gif, but only ran in Node,
 * not in the browser.
 * Checkout b9ae1b0b7cb27eda44a9e33c3acc4a1267631f45 for more info.
 */
export const parseImage = path =>
  fetch(path)
    .then(response => response.arrayBuffer())
    .then(
      rawImageData =>
        new Promise((resolve, reject) => {
          const reader = new PNGReader(rawImageData);

          reader.parse((err, png) => {
            if (err) {
              reject(err);
            }

            const { width, pixels } = png;

            /*
              PNGReader returns a 1D array of RGB values:

                [12, 246, 132, 41, 175, 255]
                 R    G    B   R    G    B
                 \ pixel1 /     \ pixel2 /

              I want to transform that into an array of objects describing
              HSL values, into a 2D array representing the dimensions of the
              image:

                [
                  // Row 1:
                  [
                    { h: 112, s: 26, l: 67 },
                    { h: 255, s: 98, l: 20 },
                  ],
                  // Row 2:
                  [
                    { h: 241, s: 0, l: 100 },
                    { h: 124, s: 98, l: 37 },
                  ],
                ]
            */
            const groupedPixels = chunk(pixels, 3);

            const data = groupedPixels.reduce((acc, [r, g, b], index) => {
              const [h, s, l] = Color({ r, g, b }).hsl().color;

              const color = {
                h: roundTo(h, 1),
                s: roundTo(s, 1),
                l: roundTo(l, 1),
              };

              const rowNum = Math.floor(index / width);

              // If this is the first pixel
              if (acc.length < rowNum + 1) {
                acc.push([]);
              }

              acc[rowNum].push(color);

              return acc;
            }, []);

            resolve(data);
          });
        })
    );
