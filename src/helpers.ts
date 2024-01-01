export interface Point {
  x: number,
  y: number
}

export const min = (val: number, minVal: number) => {
  if (val > minVal) {
    return val
  } else return minVal
}

export const max = (val: number, maxVal: number) => {
  if (val < maxVal) {
    return val
  } else return maxVal
}

export const defaultCanvasMatrixValues = [1, 0, 0, 1, 0, 0];

export const defaultCanvasMatrix = new DOMMatrix(defaultCanvasMatrixValues);
