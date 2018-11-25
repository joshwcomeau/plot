/**
 * A collection of helpers / utils for picture-cells variants.
 */

const getCellAtCoordinate = (rowIndex, colIndex, data) => {
  const hasRow = typeof data[rowIndex] !== 'undefined';

  if (hasRow) {
    return data[rowIndex][colIndex];
  }
};

export const getNeighbors = (rowIndex, colIndex, data) => {
  // Given a cell at [rowIndex, colIndex], find the 8 neighboring cells.
  const neighborIndices = [
    [rowIndex - 1, colIndex - 1],
    [rowIndex - 1, colIndex],
    [rowIndex - 1, colIndex + 1],
    [rowIndex, colIndex - 1],
    [rowIndex, colIndex + 1],
    [rowIndex + 1, colIndex - 1],
    [rowIndex + 1, colIndex],
    [rowIndex + 1, colIndex + 1],
  ];

  return neighborIndices
    .map(([neighborRowIndex, neighborColIndex]) => {
      const cell = getCellAtCoordinate(
        neighborRowIndex,
        neighborColIndex,
        data
      );

      if (cell) {
        return { cell, rowIndex: neighborRowIndex, colIndex: neighborColIndex };
      }
    })
    .filter(cell => cell);
};
