import Game from './Game'
import { defaultCanvasMatrix, Point } from './helpers'

export default class Display {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  transformOffset: Point
  clearPoint: Point
  game: Game

  constructor(game: Game) {
    this.game = game
    this.canvas = document.createElement('canvas')
    this.canvas.style.backgroundColor = 'darkred'
    this.canvas.height = window.innerHeight
    this.canvas.width = window.innerWidth
    onresize = (event: UIEvent) => {
      const target = event.target as Window
      this.canvas.width = target.innerWidth
      this.canvas.height = target.innerHeight
    };

    document.body.appendChild(this.canvas)

    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D

    this.transformOffset = {
      x: 0,
      y: 0
    }

    this.clearPoint = {
      x: 0,
      y: 0
    }
  }
  transform(offset: Point) {
    this.transformOffset = offset

    const offsetMatrix = defaultCanvasMatrix

    offsetMatrix.d = offset.x;
    offsetMatrix.e = offset.y;

    this.game.display.context.setTransform(offsetMatrix);
  }
  clear() {
    console.info('cleared')
    this.context.clearRect(this.clearPoint.x, this.clearPoint.y, this.canvas.width, this.canvas.height)
  }
}
