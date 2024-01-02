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
  activeChunks: Chunk[]

  constructor(game: Game, worldId: string) {
    this.game = game
    this.id = worldId
    this.data = this.loadWorldData()
    this.activeChunks = []
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

      const playerContainingChunk = this.getPlayerContainingChunk(this.player)

      const localChunks = this.getLocalChunks(playerContainingChunk)

      localChunks.forEach((chunk) => {
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
  getPlayerContainingChunk(player: Player): Chunk {
    const chunkAddress = {
      x: Math.floor(player.data.location.x / this.game.chunkSize),
      y: Math.floor(player.data.location.y / this.game.chunkSize)
    }

    return new Chunk(this, chunkAddress)
  }
  getChunkSiblings(chunk: Chunk, renderDistance: number): Chunk {
    const sublings = [chunk]

    if (renderDistance > 0) {

    }
  }
  getLocalChunks(chunk: Chunk): Chunk[] {
    return getChunkSiblings(chunk) 
  }
}
