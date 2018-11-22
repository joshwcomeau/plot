const fs = require('fs');
const program = require('commander');

const { parseImage } = require('../helpers/image.helpers');

const fileExtensionRegex = /(.jpg|.jpeg|.png|.gif)$/i;

program.parse(process.argv);

const inputPath = program.args[0];
const outputPath = inputPath.replace(fileExtensionRegex, '.js');

if (!inputPath) {
  throw new Error('No input file provided.');
}

parseImage(inputPath)
  .then(image => {
    // We want to produce a JS file that exports a default object containing
    // all the data. This is mildly preferable to JSON, because it's easier to
    // work with.
    const stringifiedOutput = `export default ${JSON.stringify(
      image,
      null,
      2
    )};`;

    fs.writeFileSync(outputPath, stringifiedOutput);
  })
  .catch(error => {
    console.error('Could not parse image:');
    console.error(error);
  });
