import Game from './Game'
import { defaultCanvasMatrixValues, Point } from './helpers'

export default class Display {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  transformOffset: Point
  clearPoint: Point
  game: Game

  constructor(game: Game) {
    this.game = game

    // create a new canvas element
    this.canvas = document.createElement('canvas')

    this.canvas.style.backgroundColor = 'grey'

    // set the display canvas to the size of the browser window
    this.canvas.height = window.innerHeight
    this.canvas.width = window.innerWidth

    // add the display canvas to the body
    document.body.appendChild(this.canvas)

    // subscribe to window resize events and keep the display
    // canvas the same size as the screen
    onresize = (event: UIEvent) => {
      const target = event.target as Window
      this.canvas.width = target.innerWidth
      this.canvas.height = target.innerHeight
    };

    // get the context for the display canvas
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D

    // set a default transform offset
    this.transformOffset = {
      x: 0,
      y: 0
    }

    // set a default clear point
    this.clearPoint = {
      x: 0,
      y: 0
    }
  }
  transform(offset: Point) {
    this.transformOffset = offset

    const canvasMatrixValues = defaultCanvasMatrixValues

    canvasMatrixValues[4] = offset.x;
    canvasMatrixValues[5] = offset.y;

    this.game.display.context.setTransform(...canvasMatrixValues);
  }
  clear() {
    this.context.clearRect(this.clearPoint.x, this.clearPoint.y, this.canvas.width, this.canvas.height)
  }
}
