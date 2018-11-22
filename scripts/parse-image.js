/**
 * Parses an image, returning an array of HSL data for every pixel in the image,
 * in a 2D array.
 */
const fs = require('fs');

const ImageParser = require('image-parser');
const program = require('commander');
const Color = require('color');

const run = (path, logOutput) => {
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
        const color = { h, s, l };

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

// if we invoke this program through the command line, use the command line arg
// and run it
program.parse(process.argv);

if (program.args) {
  run(program.args[0], true);
}

module.exports = run;
