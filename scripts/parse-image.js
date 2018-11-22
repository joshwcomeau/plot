const fs = require('fs');

const program = require('commander');

const { parseImage } = require('../helpers/image.helpers');

const fileExtensionRegex = /(.jpg|.jpeg|.png|.gif)$/i;

// if we invoke this program through the command line, use the command line arg
// and run it
program.parse(process.argv);

const inputPath = program.args[0];
const outputPath = inputPath.replace(fileExtensionRegex, '.js');

if (!inputPath) {
  throw new Error('No input file provided.');
}

parseImage(inputPath)
  .then(image => {
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
