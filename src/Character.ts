import World from "./World"
import Physics from "./Physics"
import { min, max, Point } from "./helpers"
import type { Collision } from "./collision"

export interface CharacterInput {
  createdAt: string
  position: {
    x: number
    y: number
  }
  size: {
    height: number
    width: number
  }
  movement: {
    left: boolean
    right: boolean
    jump: boolean
  },
  velocity: {
    x: number
    y: number
  }
}

export default class Character {
  id: string
  createdAt: string
  position: {
    x: number
    y: number
  }
  size: {
    height: number
    width: number
  }
  velocity: {
    x: number
    y: number
  }
  movement: {
    left: boolean
    right: boolean
    jump: boolean
  }
  collisions: Collision[]
  world: World
  physics: Physics

  constructor(world: World, id: string, input: CharacterInput) {
    this.id = id || crypto.randomUUID()
    this.world = world
    this.createdAt = input.createdAt || new Date().toISOString()
    this.position = input.position || { x: 0, y: 0 }
    this.size = input.size || { height: 1, width: 1 }
    this.velocity = input.velocity || { x: 0, y: 0 }
    this.movement = input.movement || { left: false, right: false, jump: false }
    this.collisions = []
    this.physics = new Physics(this)

    this.world.game.animator.drawStack.push(() => {
      this.handleMovement()
      this.handleFriction()
      this.draw()
    })
  }
  handleMovement() {
    if (this.movement.jump) {
      const bottomCollisions = this.collisions.filter(({ side }) => side === 'bottom')
      const topCollisions = this.collisions.filter(({ side }) => side === 'top')
      if (bottomCollisions.length && !topCollisions.length) {
        this.position.y -= 0.01
        this.velocity.y = -0.75
      }
    }

    if (this.movement.left && !this.movement.right) {
      this.velocity.x = min(this.velocity.x - 0.075, -0.5)
    }
    if (!this.movement.left && this.movement.right) {
      this.velocity.x = max(this.velocity.x + 0.075, 0.5)
    }
  }
  handleFriction() {
    switch (true) {
      case this.velocity.x > 0:
        this.velocity.x = min(0, this.velocity.x - 0.05)
        break;
      case this.velocity.x < 0:
        this.velocity.x = max(0, this.velocity.x + 0.05)
        break;
    }
  }
  draw() {
    this.display.context.fillStyle = 'blue'

    this.display.context.fillRect(
      this.visualAddress.x,
      this.visualAddress.y,
      this.tileSize,
      this.tileSize
    )

    this.display.context.fillStyle = 'black'
    this.display.context.fillText(JSON.stringify(this.position), this.position.x * this.tileSize, this.position.y * this.tileSize)
  }
  get visualAddress(): Point {
    return {
      x: this.position.x * this.world.tileSize,
      y: this.position.y * this.world.tileSize
    }
  }
  get display() {
    return this.world.game.display
  }
  get tileSize() {
    return this.world.game.settings.tileSize
  }
}
