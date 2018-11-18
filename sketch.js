import canvasSketch from 'canvas-sketch';
import { renderPolylines } from 'canvas-sketch-util/penplot';
import { clipPolylinesToBox } from 'canvas-sketch-util/geometry';
import newArray from 'new-array';
import triangulate from 'delaunay-triangulate';
import Voronoi from 'voronoi';

import { random } from './utils';

const settings = {
  dimensions: 'A4',
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'cm',
};

const convertPointsForVoronoi = points => {
  return points.map(([x, y]) => ({ x, y }));
};

const sketch = ({ width, height }) => {
  const pointCount = 200;
  const margin = 2;

  const positions = Array(pointCount)
    .fill()
    .map(() => {
      // Margin from print edge in centimeters
      const margin = 2;
      // Return a random 2D point inset by this margin
      return [random(margin, width - margin), random(margin, height - margin)];
    });

  const boundingBox = {
    xl: 0,
    xr: width,
    yt: 0,
    yb: height,
  };

  const voronoi = new Voronoi();
  const voronoiDiagram = voronoi.compute(
    convertPointsForVoronoi(positions),
    boundingBox
  );

  const voronoiPositions = voronoiDiagram.edges
    .filter(edge => edge.lSite && edge.rSite)
    .map(edge => [[edge.lSite.x, edge.lSite.y], [edge.rSite.x, edge.rSite.y]]);

  const cells = triangulate(positions);

  let lines = cells.map(cell => {
    // Get vertices for this cell
    const triangle = cell.map(i => positions[i]);
    // Close the path
    triangle.push(triangle[0]);
    return triangle;
  });

  console.log(lines);

  // Clip all the lines to a margin
  const box = [margin, margin, width - margin, height - margin];
  lines = clipPolylinesToBox(voronoiPositions, box);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  console.log([...voronoiPositions, ...lines]);
  return props => renderPolylines(voronoiPositions, props);
};

canvasSketch(sketch, settings);
