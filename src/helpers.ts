export interface Point {
  x: number,
  y: number
}

export interface Dimension {
  height: number,
  width: number
}

export interface Entity {
  position: Point,
  size: Dimension
}

export const min = (val: number, minVal: number) => {
  return val < minVal ? minVal : val
}

export const max = (val: number, maxVal: number) => {
  return val > maxVal ? maxVal : val
}

export const defaultCanvasMatrixValues = [1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number];
