import Player from './Player'
import Game from './Game'
import { Point } from './helpers'

type WorldData = {
  id: string
  createdAt: string
  creator: string
  difficulty: number
}

type ChunkMedia = {
  data: ChunkData,
  image?: OffscreenCanvas
}

type ChunkData = {
  tiles: TileData[][]
}

type TileData = {
  id: string
}

export default class World {
  game: Game
  id: string
  data: WorldData
  player: Player | null
  activeChunks: Point[]
  chunkMedia: Map<string, ChunkMedia>

  constructor(game: Game, worldId: string) {
    this.game = game
    this.id = worldId
    this.data = this.loadWorldData()
    this.activeChunks = []
    this.chunkMedia = new Map()
    this.player = null

  }
  launch() {
    this.player = new Player(this, this.game.playerId)

    this.game.animator.drawStack.push(() => {

      if (!this.player) return

      this.activeChunks = this.getChunksToRender(this.getChunkContainingPlayer(this.player), this.game.settings.renderDistance)
      this.activeChunks.forEach((chunk) => this.loadChunkData(chunk))
      this.chunkMedia.forEach((chunkMedia, chunkMediaKey) => this.drawChunk(chunkMedia, chunkMediaKey))
      this.chunkMedia.forEach((chunkMedia, chunkMediaKey) => this.cleanChunkMedia(chunkMedia, chunkMediaKey))
      this.chunkMedia.forEach((chunkMedia, chunkMediaKey) => this.displayChunk(chunkMedia, chunkMediaKey))
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
  getChunkContainingPlayer(player: Player): Point {
    return {
      x: Math.floor(player.data.location.x / this.game.chunkSize),
      y: Math.floor(player.data.location.y / this.game.chunkSize)
    }
  }
  get chunkCanvasSize() {
    return this.game.chunkSize * this.tileSize
  }
  get tileSize() {
    return this.game.settings.tileSize
  }
  getChunksToRender(chunk: Point, renderDistance: number): Point[] {
    let chunksToRender = [chunk]

    if (renderDistance > 0) {
      const siblings = this.fetchChunkSiblings({ x: chunk.x, y: chunk.y })

      chunksToRender = [...chunksToRender, ...siblings]

      siblings.forEach((sibling) => {
        const relatives = this.getChunksToRender(sibling, renderDistance - 1)

        chunksToRender = [...chunksToRender, ...relatives]
      })

    }

    return this.deduplicateChunkPoints(chunksToRender)
  }
  fetchChunkSiblings({ x, y }: Point): Point[] {
    return [
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y },
      { x: x + 1, y }
    ]
  }
  deduplicateChunkPoints(chunks: Point[]): Point[] {
    const chunkSets = {} as Record<string, boolean>

    chunks.forEach((chunk) => {
      chunkSets[`${chunk.x}|${chunk.y}`] = true
    })

    return Object.keys(chunkSets).map((chunkSet) => {
      return { x: Number(chunkSet.split('|')[0]), y: Number(chunkSet.split('|')[1]) }
    })
  }
  loadChunkData(chunk: Point): void {
    const chunkAddress = `${chunk.x}|${chunk.y}`

    if (this.chunkMedia.has(chunkAddress)) return

    const rawChunkData = localStorage.getItem(`game#${this.game.id}#map#${this.id}#chunk#${chunkAddress}`)

    if (rawChunkData) {
      const chunkData = JSON.parse(rawChunkData) as ChunkData
      this.chunkMedia.set(chunkAddress, { data: chunkData })
      return
    }

    const newChunkData = {
      tiles: [[]]
    } as ChunkData

    localStorage.setItem(`game#${this.game.id}#map#${this.id}#chunk#${chunkAddress}`, JSON.stringify(newChunkData))

    this.loadChunkData(chunk)
  }
  drawTilesOnChunk(tiles: TileData[][]): void {
    tiles.forEach((row: TileData[], rowIndex: number) => {
      row.forEach((tile: TileData, colIndex: number) => {
        if (tile) {
          this.game.display.context.fillStyle = 'red'
          this.game.display.context.fillRect(rowIndex, colIndex, this.tileSize, this.tileSize)
        }
      })
    })
  }
  drawChunk(chunkMedia: ChunkMedia, chunkMediaKey: string): void {
    if (chunkMedia.image) return

    const chunk = {
      x: Number(chunkMediaKey.split('|')[0]),
      y: Number(chunkMediaKey.split('|')[1])
    }

    const chunkCanvas = new OffscreenCanvas(this.chunkCanvasSize, this.chunkCanvasSize)
    const chunkContext = chunkCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D

    // chunkContext.fillStyle = 'yellow'
    // chunkContext.fillRect(0, 0, this.chunkCanvasSize, this.chunkCanvasSize)

    if (chunk.y >= 0) {
      chunkContext.fillStyle = '#784212' // brown
    } else {
      chunkContext.fillStyle = '#85C1E9' // blue
    }

    chunkContext.fillRect(1, 1, this.chunkCanvasSize - 2, this.chunkCanvasSize - 2)

    chunkContext.fillStyle = 'black'
    chunkContext.fillText(JSON.stringify(chunkMedia.data), this.tileSize, this.chunkCanvasSize * 0.5)

    this.drawTilesOnChunk(chunkMedia.data.tiles)

    this.chunkMedia.set(chunkMediaKey, { ...chunkMedia, image: chunkCanvas })

  }
  cleanChunkMedia(_chunkMedia: ChunkMedia, chunkMediaKey: string): void {
    const chunksToRenderString = this.activeChunks.map((chunk) => `${chunk.x}|${chunk.y}`)

      if (!chunksToRenderString.includes(chunkMediaKey)) {
        this.chunkMedia.delete(chunkMediaKey)
      }
  }
  displayChunk(chunkMedia: ChunkMedia, chunkMediaKey: string): void {
    if (!chunkMedia.image) return

    const chunk = {
      x: Number(chunkMediaKey.split('|')[0]),
      y: Number(chunkMediaKey.split('|')[1])
    }

    const chunkVisualAddress: Point = {
      x: chunk.x * this.chunkCanvasSize,
      y: chunk.y * this.chunkCanvasSize
    }

    this.game.display.context.drawImage(chunkMedia.image, 0, 0, this.chunkCanvasSize, this.chunkCanvasSize, chunkVisualAddress.x, chunkVisualAddress.y, this.chunkCanvasSize, this.chunkCanvasSize)
  }
}
