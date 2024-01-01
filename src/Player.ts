import World from "./World"
import Controller from './Controller'
import { min, max, Point } from "./helpers"

type PlayerData = {
  id: string
  createdAt: string
  location: {
    x: number
    y: number
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

export default class Player {
  world: World
  id: string
  data: PlayerData
  controller: Controller

  constructor(world: World, playerId: string) {
    this.world = world
    this.id = playerId
    this.data = this.loadPlayerData()
    this.controller = new Controller(this)
  }
  animate(): void {
    this.world.game.animator.drawStack.push(() => {
      this.handleMovement()
      this.handleGravity()
      this.handleVelocity()
      this.handleFriction()
      this.handleCamera()
      this.drawPlayer()
    })
  }
  loadPlayerData(): PlayerData {
    const rawPlayerData = localStorage.getItem(`world#${this.world.id}#player#${this.id}`);
    if (rawPlayerData) return JSON.parse(rawPlayerData)
    this.createPlayerData()
    return this.loadPlayerData()
  }
  createPlayerData() {
    const newPlayerData: PlayerData = {
      id: this.id,
      createdAt: new Date().toISOString(),
      location: {
        x: 0,
        y: 0
      },
      movement: {
        left: false,
        right: false,
        jump: false
      },
      velocity: {
        x: 0,
        y: 0
      }
    }
    localStorage.setItem(`world#${this.world.id}#player#${this.id}`, JSON.stringify(newPlayerData))
  }
  toggleJump(toggle: boolean) {
    if (toggle) {
      this.data.movement.jump = true
    } else {
      this.data.movement.jump = false
    }
  }
  toggleLeft(toggle: boolean) {
    if (toggle) {
      this.data.movement.left = true
    } else {
      this.data.movement.left = false
    }
  }
  toggleRight(toggle: boolean) {
    if (toggle) {
      this.data.movement.right = true
    } else {
      this.data.movement.right = false
    }
  }
  handleMovement() {
    if (this.data.movement.jump) {
      if (this.data.location.y === -1) {
        this.data.location.y -= 0.01
        this.data.velocity.y = -0.75
      }
    }

    if (this.data.movement.left && !this.data.movement.right) {
      this.data.velocity.x = min(this.data.velocity.x - 0.075, -0.5)
    }
    if (!this.data.movement.left && this.data.movement.right) {
      this.data.velocity.x = max(this.data.velocity.x + 0.075, 0.5)
    }
  }
  handleGravity() {
    if (this.data.location.y < -1) {
      if (this.data.velocity.y <= 1) {
        this.data.velocity.y += 0.05
      }
    } else {
      this.data.velocity.y = 0
    }
  }
  handleVelocity() {
    this.data.location.y = max(this.data.location.y + this.data.velocity.y, -1)

    this.data.location.x += this.data.velocity.x
  }
  handleFriction() {
    switch (true) {
      case this.data.velocity.x > 0:
        this.data.velocity.x = min(0, this.data.velocity.x - 0.05)
        break;
      case this.data.velocity.x < 0:
        this.data.velocity.x = max(0, this.data.velocity.x + 0.05)
        break;
    }
  }
  get tileSize() {
    return this.world.game.settings.tileSize
  }
  get display() {
    return this.world.game.display
  }
  get visualAddress(): Point {
    return {
      x: this.data.location.x * this.tileSize,
      y: this.data.location.y * this.tileSize
    }
  }
  get cameraVisualAddress(): Point {
    return {
      x: this.visualAddress.x - this.display.canvas.width * 0.5,
      y: this.visualAddress.y - this.display.canvas.height * 0.5
    }
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
    this.display.context.fillText(JSON.stringify(this.data), this.data.location.x * this.tileSize, this.data.location.y * this.tileSize)
  }
  handleCamera() {
    this.display.transform({
      x: -this.visualAddress.x + (this.display.canvas.width * 0.5) - (this.tileSize * 0.5),
      y: -this.visualAddress.y + (this.display.canvas.height * 0.5) - (this.tileSize * 0.5)
    })

    this.display.clearPoint = this.cameraVisualAddress
  }
}
