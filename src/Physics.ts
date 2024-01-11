import { getLocalPoints, detectCollision, CollisionResult, Collision } from './collision'
import Character from './Character'
import { TileData } from './Chunk'
import { min, max, Point, Entity } from "./helpers"

class Matter {
  physics: Physics

  constructor(physics: Physics) {
    this.physics = physics
    this.physics.character.world.game.animator.drawStack.push(() => {
      this.character.collisions = this.detectCollisions({
        position: this.character.position,
        size: this.character.size
      })
    })
  }
  get character() {
    return this.physics.character
  }
  detectCollisions(entity: Entity): Collision[] {
    const characterTileAddress = {
      x: Math.round(entity.position.x),
      y: Math.round(entity.position.y)
    }

    const localPoints = getLocalPoints(characterTileAddress, 5)

    this.drawCollisionBound(localPoints)

    const potentialCollisions = [] as TileData[]

    localPoints.forEach((point) => {
      const parentChunkAddress = {
        x: Math.floor(point.x / this.character.world.game.chunkSize),
        y: Math.floor(point.y / this.character.world.game.chunkSize)
      }

      const parentChunk = this.character.world.activeChunks.get(`${parentChunkAddress.x}|${parentChunkAddress.y}`)

      if (!parentChunk?.data) return

      const tileAtLocation = parentChunk.data.tiles.find((tile) => tile.position.x === point.x && tile.position.y === point.y)

      if (tileAtLocation) {
        this.drawPotentialCollision(tileAtLocation.position)
        potentialCollisions.push(tileAtLocation)
      }
    })

    const collisions = [] as Collision[]

    potentialCollisions.forEach((pCollision: TileData) => {
      const collisionResult = detectCollision(entity, pCollision)

      if (collisionResult.colliding && collisionResult.collision) {
        collisions.push(collisionResult.collision)
      }

      this.drawCollision(pCollision.position, collisionResult)
    })

    return collisions
  }
  drawCollision({ x, y }: Point, collisionResult: CollisionResult): void {
    if (collisionResult.colliding && collisionResult.collision) {
      this.character.world.game.display.context.fillStyle = 'green'
      this.character.world.game.display.context.globalAlpha = 0.5;

      this.character.world.game.display.context.fillRect(
        x * this.character.world.tileSize,
        y * this.character.world.tileSize,
        this.character.world.tileSize,
        this.character.world.tileSize
      )

      this.character.world.game.display.context.globalAlpha = 1;
      this.character.world.game.display.context.fillStyle = 'white'

      this.character.world.game.display.context.fillText(
        collisionResult.collision.side,
        x * this.character.world.tileSize,
        y * this.character.world.tileSize + this.character.world.tileSize * 0.5
      )
    }

  }
  drawPotentialCollision({ x, y }: Point): void {
    this.character.world.game.display.context.fillStyle = 'yellow'
    this.character.world.game.display.context.globalAlpha = 0.5;

    this.character.world.game.display.context.fillRect(
      x * this.character.world.tileSize,
      y * this.character.world.tileSize,
      this.character.world.tileSize,
      this.character.world.tileSize
    )

    this.character.world.game.display.context.globalAlpha = 1;
  }
  drawCollisionBound(point: Point[]): void {
    point.forEach(({ x, y }) => {
      this.character.world.game.display.context.fillStyle = 'purple'
      this.character.world.game.display.context.globalAlpha = 0.5;

      this.character.world.game.display.context.fillRect(
        x * this.character.world.tileSize,
        y * this.character.world.tileSize,
        this.character.world.tileSize,
        this.character.world.tileSize
      )

      this.character.world.game.display.context.globalAlpha = 1;
    })
  }
}

class Gravity {
  physics: Physics

  constructor(physics: Physics) {
    this.physics = physics
    this.physics.character.world.game.animator.drawStack.push(() => {
      const bottomCollisions = this.character.collisions.filter(({ side }) => side === 'bottom')

      if (!bottomCollisions.length) {
        if (this.character.velocity.y <= 1) {
          this.character.velocity.y += 0.05
        }
      }
    })
  }
  get character() {
    return this.physics.character
  }
}

class Friction {
  physics: Physics

  constructor(physics: Physics) {
    this.physics = physics
    this.physics.character.world.game.animator.drawStack.push(() => {

    })
  }
  get character() {
    return this.physics.character
  }
}

class Velocity {
  physics: Physics

  constructor(physics: Physics) {
    this.physics = physics
    this.physics.character.world.game.animator.drawStack.push(() => {
      this.handleVelocity()
    })
  }
  get character() {
    return this.physics.character
  }
  handleVelocity() {
    let upcomingPositionX = this.character.position.x + this.character.velocity.x

    let upcomingPositionY = this.character.position.y + this.character.velocity.y

    const collisions = this.physics.matter.detectCollisions({
      position: {
        x: upcomingPositionX,
        y: upcomingPositionY
      },
      size: this.character.size
    })

    const leftCollisions = collisions.filter(({ side }) => side === 'left')
    const rightCollisions = collisions.filter(({ side }) => side === 'right')
    const topCollisions = collisions.filter(({ side }) => side === 'top')
    const bottomCollisions = collisions.filter(({ side }) => side === 'bottom')

    if (this.character.velocity.x > 0) {
      if (rightCollisions.length) {
        upcomingPositionX = Math.ceil(this.character.position.x)
        this.character.velocity.x = 0
      }
    }

    if (this.character.velocity.x < 0) {
      if (leftCollisions.length) {
        upcomingPositionX = Math.floor(this.character.position.x)
        this.character.velocity.x = 0
      }
    }

    if (this.character.velocity.y > 0) {
      if (bottomCollisions.length) {
        upcomingPositionY = Math.ceil(this.character.position.y)
        this.character.velocity.y = 0
      }
    }

    if (this.character.velocity.y < 0) {
      if (topCollisions.length) {
        upcomingPositionY = Math.floor(this.character.position.y)
        this.character.velocity.y = 0
      }
    }



    this.character.position = {
      x: upcomingPositionX,
      y: upcomingPositionY
    }
  }
}

export default class Physics {
  character: Character
  matter: Matter
  gravity: Gravity
  friction: Friction
  velocity: Velocity

  constructor(character: Character) {
    this.character = character
    this.matter = new Matter(this)
    this.gravity = new Gravity(this)
    this.friction = new Friction(this)
    this.velocity = new Velocity(this)
  }
}
