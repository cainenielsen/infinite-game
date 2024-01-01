import Game from './Game'

export default class Animator {
  id: string
  game: Game
  drawStack: unknown[]
  frameCount: number
  start?: number
  then?: number
  elapsed?: number
  fps: number
  sinceStart?: number
  currentFps?: number

  constructor(game: Game) {
    this.id = crypto.randomUUID()
    this.game = game
    this.drawStack = []
    this.frameCount = 0
    this.start = undefined
    this.then = undefined
    this.elapsed = undefined
    this.sinceStart = undefined
    this.currentFps = undefined
    this.fps = 60

    requestAnimationFrame((timestamp) => {
      this.step(timestamp)
    })
  }
  get fpsInterval() {
    return 1000 / this.fps
  }
  step(timestamp: number) {
    if (!this.then) this.then = timestamp
    if (!this.start) this.start = this.then

    this.elapsed = timestamp - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.then = timestamp - (this.elapsed % this.fpsInterval);

      this.draw()

      this.sinceStart = timestamp - this.start;
      this.currentFps = Math.round(1000 / (this.sinceStart / ++this.frameCount) * 100) / 100;
    }

    requestAnimationFrame((timestamp) => {
      this.step(timestamp)
    })
  }
  draw() {
    this.drawStack.forEach((drawing) => {
      if (typeof drawing === 'function') drawing()
    })
  }
}
