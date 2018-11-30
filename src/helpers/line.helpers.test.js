import { createDashedLine, getDistanceBetweenPoints } from './line.helpers';

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
});
