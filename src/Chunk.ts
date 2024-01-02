import { Point, defaultCanvasMatrixValues } from './helpers'
import World from './World'

type TileData = {
  id: string
  location: Point
}

type ChunkData = {
  tiles: TileData[]
}

export default class Chunk {
  id: string
  world: World
  location: Point
  data: ChunkData | null
  canvas: OffscreenCanvas
  context: OffscreenCanvasRenderingContext2D

  constructor(world: World, location: Point) {
    this.id = crypto.randomUUID()
    this.world = world
    this.location = location
    this.data = null
    this.canvas = new OffscreenCanvas(this.chunkCanvasSize, this.chunkCanvasSize)
    this.context = this.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

    const chunkOffsetMatrixValues = defaultCanvasMatrixValues

    chunkOffsetMatrixValues[4] = this.location.x * this.chunkCanvasSize;
    chunkOffsetMatrixValues[5] = this.location.y * this.chunkCanvasSize;

    this.context.setTransform(...chunkOffsetMatrixValues)

    this.loadData()

    this.drawChunk()
  }
  get chunkAddress() {
    return `${this.location.x}|${this.location.y}`
  }
  get chunkCanvasSize() {
    return this.world.game.chunkSize * this.tileSize
  }
  get tileSize() {
    return this.world.game.settings.tileSize
  }
  get visualAddress() {
    return {
      x: this.location.x * this.chunkCanvasSize,
      y: this.location.y * this.chunkCanvasSize
    }
  }
  generate() {
    const chunkSizeArray = new Array(this.world.game.chunkSize)

    const newChunkData = {
      tiles: chunkSizeArray.fill(chunkSizeArray)
    } as ChunkData

    localStorage.setItem(`world#${this.world.id}#chunk#${this.chunkAddress}`, JSON.stringify(newChunkData))

    this.loadData()
  }
  loadData() {
    const rawChunkData = localStorage.getItem(`world#${this.world.id}#chunk#${this.chunkAddress}`)
    if (rawChunkData) this.data = JSON.parse(rawChunkData)
  }
  drawChunk() {
    this.clear()
    this.drawBackground()
    this.drawTiles()
    this.drawDebugText()
  }
  clear() {
    this.context.clearRect(this.visualAddress.x, this.visualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
  }
  drawBackground() {
    if (this.location.y >= 0) {
      this.context.fillStyle = '#784212' // brown
    } else {
      this.context.fillStyle = '#85C1E9' // blue
    }

    this.context.fillRect(1, 1, this.chunkCanvasSize - 2, this.chunkCanvasSize - 2)
  }
  drawTiles() {
    if (!this.data) return
    this.data.tiles.forEach((tile) => {
      if (tile) {
        this.context.fillStyle = 'red'
        this.context.fillRect(tile.location.x, tile.location.y, this.tileSize, this.tileSize)
      }
    })
  }
  drawDebugText() {
    this.context.fillStyle = 'black'
    this.context.fillText(JSON.stringify(this.location), this.tileSize, this.chunkCanvasSize * 0.5)
    this.context.fillText(JSON.stringify(this.data), this.tileSize, this.chunkCanvasSize * 0.5 + this.tileSize)
  }
}
