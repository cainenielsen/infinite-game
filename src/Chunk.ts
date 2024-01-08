import { Point, Entity } from './helpers'
import World from './World'

export interface TileData extends Entity {
  id: string
}

export type ChunkData = {
  tiles: TileData[]
}

export default class Chunk {
  id: string
  world: World
  position: Point
  data: ChunkData | null
  canvas: OffscreenCanvas
  context: OffscreenCanvasRenderingContext2D

  constructor(world: World, position: Point) {
    this.id = crypto.randomUUID()
    this.world = world
    this.position = position
    this.data = null
    this.canvas = new OffscreenCanvas(this.chunkCanvasSize, this.chunkCanvasSize)
    this.context = this.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

    this.context.translate(-this.visualAddress.x, -this.visualAddress.y)

    this.loadData()

    this.drawChunk()
  }
  get chunkAddress() {
    return `${this.position.x}|${this.position.y}`
  }
  get chunkCanvasSize() {
    return this.world.chunkCanvasSize
  }
  get tileSize() {
    return this.world.game.settings.tileSize
  }
  get visualAddress() {
    return {
      x: this.position.x * this.chunkCanvasSize,
      y: this.position.y * this.chunkCanvasSize
    }
  }
  generate() {
    const newChunkData = {
      tiles: []
    } as ChunkData

    localStorage.setItem(`world#${this.world.id}#chunk#${this.chunkAddress}`, JSON.stringify(newChunkData))
  }
  loadData() {
    const rawChunkData = localStorage.getItem(`world#${this.world.id}#chunk#${this.chunkAddress}`)
    if (rawChunkData) {
      this.data = JSON.parse(rawChunkData)
      return
    }

    this.generate()
    this.loadData()
  }
  drawChunk() {
    // console.info(this)
    this.clear()
    this.drawBackground()
    this.drawTiles()
    this.drawDebugText()
  }
  clear() {
    this.context.clearRect(this.visualAddress.x, this.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
  }
  drawBackground() {
    if (this.position.y >= 0) {
      this.context.fillStyle = '#784212' // brown
    } else {
      this.context.fillStyle = '#85C1E9' // blue
    }

    this.context.fillRect(1 + this.visualAddress.x, 1 + this.visualAddress.y, this.chunkCanvasSize - 2, this.chunkCanvasSize - 2)
  }
  drawTiles() {
    if (!this.data) return
    this.data.tiles.forEach((tile) => {
      if (tile) {

        this.context.fillStyle = 'red'
        this.context.fillRect(tile.position.x * this.tileSize, tile.position.y * this.tileSize, tile.size.width * this.tileSize, tile.size.height * this.tileSize)
      }
    })
  }
  drawDebugText() {
    this.context.fillStyle = 'black'
    this.context.fillText(JSON.stringify(this.position), this.tileSize + this.visualAddress.x, this.chunkCanvasSize * 0.5 + this.visualAddress.y)
    this.context.fillText(JSON.stringify(this.visualAddress), this.tileSize + this.visualAddress.x, this.chunkCanvasSize * 0.5 + this.tileSize + this.visualAddress.y)
    this.context.fillText(JSON.stringify(this.data), this.tileSize + this.visualAddress.x, this.chunkCanvasSize * 0.5 + this.tileSize * 2 + this.visualAddress.y)
  }
}
