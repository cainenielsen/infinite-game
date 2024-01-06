import Player from './Player'
import Game from './Game'
import { Point } from './helpers'
import Chunk from './Chunk'

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
  launch() {
    this.player = new Player(this, this.game.playerId)

    this.game.animator.drawStack.push(() => {
      if (!this.player) return

      const playerContainingChunk = this.getHomePoint(this.player)

      this.getLocalChunks(playerContainingChunk, this.game.settings.renderDistance)

      Array.from(this.activeChunks.values()).forEach((chunk) => {
        this.game.display.context.fillStyle = 'black'
        this.game.display.context.fillRect(chunk.visualAddress.x, chunk.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
        this.game.display.context.drawImage(chunk.canvas, 0, 0, this.chunkCanvasSize, this.chunkCanvasSize, chunk.visualAddress.x, chunk.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
      })
    })

    this.player.animate()
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
  getHomePoint(player: Player): Point {
    return {
      x: Math.floor(player.data.location.x / this.game.chunkSize),
      y: Math.floor(player.data.location.y / this.game.chunkSize)
    }
  }
  getSiblingPoints({ x, y }: Point): Point[] {
    return [
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y },
      { x: x + 1, y }
    ]
  }
  dedupePoints(points: Point[]): Point[] {
    const uniquePointMap: Record<string, boolean> = {}
    const uniquePoints = []
    for (const point of points) {
      const key = `${point.x}|${point.y}`;

      if (!uniquePointMap[key]) {
        uniquePointMap[key] = true;
        uniquePoints.push(point);
      }
    }

    return uniquePoints
  }
  getLocalPoints(point: Point, renderDistance: number): Point[] {
    let localPoints = [point]

    if (renderDistance > 0) {
      const siblings = this.getSiblingPoints(point)

      localPoints = [...localPoints, ...siblings]

      siblings.forEach((sibling) => {
        const relatives = this.getLocalPoints(sibling, renderDistance - 1)

        localPoints = [...localPoints, ...relatives]
      })
    }

    return this.dedupePoints(localPoints)
  }
  getLocalChunks(point: Point, renderDistance: number): void {
    const localPoints = this.getLocalPoints(point, renderDistance)

    localPoints.forEach((point) => {
      const chunkAddress = `${point.x}|${point.y}`
      if (!this.activeChunks.has(chunkAddress)) {
        this.activeChunks.set(chunkAddress, new Chunk(this, point))
      }
    })
  }
}
