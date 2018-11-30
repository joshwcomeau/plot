import {
  createDashedLine,
  getDistanceBetweenPoints,
  getSlopeAndInterceptForLine,
  findIntersectionBetweenTwoLines,
} from './line.helpers';

describe('line.helpers', () => {
  describe('getDistanceBetweenPoints', () => {
    it('calculates the hypothenuse', () => {
      const p1 = [0, 0];
      const p2 = [3, 4];

      const expectedOutput = 5;
      const actualOutput = getDistanceBetweenPoints(p1, p2);

      expect(actualOutput).toEqual(expectedOutput);
    });

    it('starts from non-zero', () => {
      const p1 = [5, 5];
      const p2 = [8, 9];

      const expectedOutput = 5;
      const actualOutput = getDistanceBetweenPoints(p1, p2);

      expect(actualOutput).toEqual(expectedOutput);
    });
  });
  describe('createDashedLine', () => {
    it('creates a small horizontal 4-dotted line', () => {
      const p1 = [0, 0];
      const p2 = [5, 0];
      const numOfDashes = 5;
      const dashLength = 0.01;

      const actualOutput = createDashedLine({
        p1,
        p2,
        numOfDashes,
        dashLength,
      });
      const expectedOutput = [
        [[0, 0], [0.01, 0]],
        [[1, 0], [1.01, 0]],
        [[2, 0], [2.0100000000000002, 0]], // yayyyyy javascript
        [[3, 0], [3.01, 0]],
        [[4, 0], [4.01, 0]],
      ];

      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('getSlopeAndInterceptForLine', () => {
    it('calculates the slope/intercept for an offset line', () => {
      const p1 = [0, 2];
      const p2 = [2, 4];

      const expectedSolution = { slope: 1, intercept: 2 };
      const actualSolution = getSlopeAndInterceptForLine([p1, p2]);

      expect(actualSolution).toEqual(expectedSolution);
    });

    it('calculates the slope/intercept for a steep line', () => {
      const p1 = [-1, -5];
      const p2 = [1, 5];

      const expectedSolution = { slope: 5, intercept: 0 };
      const actualSolution = getSlopeAndInterceptForLine([p1, p2]);

      expect(actualSolution).toEqual(expectedSolution);
    });

    it('calculates the slope/intercept for a parallel-to-X line', () => {
      const p1 = [0, 4];
      const p2 = [2, 4];

      const expectedSolution = { slope: 0, intercept: 4 };
      const actualSolution = getSlopeAndInterceptForLine([p1, p2]);

      expect(actualSolution).toEqual(expectedSolution);
    });
  });

  describe('findIntersectionBetweenTwoLines', () => {
    it('works on simple lines', () => {
      const line1 = [[0, 0], [1, 1]]; // y = x
      const line2 = [[0, 1], [4, 3]]; // y = 0.5x + 1

      const expectedSolution = 2;
      const actualSolution = findIntersectionBetweenTwoLines(line1, line2);

      expect(actualSolution).toEqual(expectedSolution);
    });
  });
});
