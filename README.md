# Plotter projects and stuff.

Description AWOL.

### Scripts

In addition to running a local dev environment with `yarn start`, I have several utility scripts that can be used to generate data for use within the environment.

1. `parse-image`

Given a (hopefully pretty tiny) image, it evaluates the HSL color values of every pixel, and returns a 2D array of that data. Saves as a JS object to disk, right next to where the image is (eg. `data/images/hello.jpg` produces `data/images/hello.js`).

Usage:
`yarn parse-image data/images/hello.jpg`
