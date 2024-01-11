import Player, { PlayerInput } from './Player'
import Game from './Game'
import { Point } from './helpers'
import Chunk from './Chunk'
import { getLocalPoints } from './collision'

type WorldData = {
  id: string
  createdAt: string
  creator: string
  difficulty: number
}

export default class World {
  game: Game
  id: string
  data: WorldData
  player: Player | null
  activeChunks: Map<string, Chunk>

  constructor(game: Game, worldId: string) {
    this.game = game
    this.id = worldId
    this.data = this.loadWorldData()
    this.activeChunks = new Map()
    this.player = null

  }
  get chunkCanvasSize() {
    return this.game.chunkSize * this.tileSize
  }
  get tileSize() {
    return this.game.settings.tileSize
  }
  loadPlayerData(): PlayerInput {
    const rawPlayerData = localStorage.getItem(`world#${this.id}#player#${this.game.playerId}`);
    if (rawPlayerData) return JSON.parse(rawPlayerData)
    const newPlayerData = {
      createdAt: new Date().toISOString(),
      position: {
        x: 0,
        y: 0
      },
      size: {
        height: 1,
        width: 1
      },
      velocity: {
        x: 0,
        y: 0
      },
      movement: {
        left: false,
        right: false,
        jump: false
      }
    }
    localStorage.setItem(`world#${this.id}#player#${this.game.playerId}`, JSON.stringify(newPlayerData))
    return newPlayerData
  }
  launch() {
    const playerData = this.loadPlayerData()

    this.game.animator.drawStack.push(() => {
      const playerContainingChunk = this.getHomePoint(playerData.position)

      this.getLocalChunks(playerContainingChunk, this.game.settings.renderDistance)

      Array.from(this.activeChunks.values()).forEach((chunk) => {
        this.game.display.context.fillStyle = 'black'
        this.game.display.context.fillRect(chunk.visualAddress.x, chunk.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
        this.game.display.context.drawImage(chunk.canvas, 0, 0, this.chunkCanvasSize, this.chunkCanvasSize, chunk.visualAddress.x, chunk.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
      })
    })

    this.player = new Player(this, this.game.playerId, playerData)
  }
  setDefaultData() {
    const newWorldData: WorldData = {
      id: this.id,
      createdAt: new Date().toISOString(),
      creator: this.game.playerId,
      difficulty: 1
    }
    localStorage.setItem(`world#${this.id}`, JSON.stringify(newWorldData))
    this.data = newWorldData
  }
  loadWorldData() {
    const rawWorldData = localStorage.getItem(`world#${this.id}`);
    if (rawWorldData) return JSON.parse(rawWorldData)
  }
  getHomePoint(playerPoint: Point): Point {
    return {
      x: Math.floor(playerPoint.x / this.game.chunkSize),
      y: Math.floor(playerPoint.y / this.game.chunkSize)
    }
  }
  getLocalChunks(point: Point, renderDistance: number): void {
    const localPoints = getLocalPoints(point, renderDistance)

    localPoints.forEach((point) => {
      const chunkAddress = `${point.x}|${point.y}`
      if (!this.activeChunks.has(chunkAddress)) {
        this.activeChunks.set(chunkAddress, new Chunk(this, point))
      }
    })
  }
}
