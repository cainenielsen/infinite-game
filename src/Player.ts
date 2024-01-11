import World from "./World"
import Controller from './Controller'
import { Point } from "./helpers"
import Character, { CharacterInput } from "./Character"

export interface PlayerInput extends CharacterInput {

}

export default class Player extends Character {
  controller: Controller

  constructor(world: World, playerId: string, playerInput: PlayerInput) {
    super(world, playerId, playerInput)
    this.controller = new Controller(this)
    this.world.game.animator.drawStack.push(() => {
      super.draw = () => {}
      this.handleCamera()
      this.drawPlayer()
    })
  }
  get cameraVisualAddress(): Point {
    return {
      x: this.visualAddress.x - this.display.canvas.width * 0.5 + this.tileSize * 0.5,
      y: this.visualAddress.y - this.display.canvas.height * 0.5 + this.tileSize * 0.5
    }
  }
  handleCamera() {
    this.display.transform({
      x: -this.visualAddress.x + (this.display.canvas.width * 0.5) - (this.tileSize * 0.5),
      y: -this.visualAddress.y + (this.display.canvas.height * 0.5) - (this.tileSize * 0.5)
    })

    this.display.clearPoint = this.cameraVisualAddress
  }
  drawPlayer() {
    this.display.context.fillStyle = 'green'

    this.display.context.fillRect(
      this.visualAddress.x,
      this.visualAddress.y,
      this.tileSize,
      this.tileSize
    )

    this.display.context.fillStyle = 'black'
    this.display.context.fillText(JSON.stringify(this.position), this.position.x * this.tileSize, this.position.y * this.tileSize)
  }
}
