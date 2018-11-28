import { createDashedLine } from './line.helpers';

describe('line.helpers', () => {
  describe('createDashedLine', () => {
    it('creates a small horizontal 4-dotted line', () => {
      const p1 = [0, 0];
      const p2 = [5, 0];
      const numOfDots = 5;
      const lineWidth = 0.01;

      const actualOutput = createDashedLine({ p1, p2, numOfDots });
      const expectedOutput = [
        [[0, 0], [0.01, 0]],
        [[1, 0], [1.01, 0]],
        [[2, 0], [2.01, 0]],
        [[3, 0], [3.01, 0]],
        [[4, 0], [4.01, 0]],
      ];

      expect(actualOutput).toEqual(expectedOutput);
    });
  });
});
