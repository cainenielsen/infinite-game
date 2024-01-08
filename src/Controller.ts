import Player from './Player'
import { Point } from './helpers'
import { ChunkData } from './Chunk'

const keyMap = new Map()

const jumpHandler = {
  keydown: (player: Player) => {
    player.movement.jump = true
  },
  keyup: (player: Player) => {
    player.movement.jump = false
  }
}

keyMap.set('KeyW', jumpHandler)
keyMap.set('Space', jumpHandler)

const leftHandler = {
  keydown: (player: Player) => {
    player.movement.left = true
  },
  keyup: (player: Player) => {
    player.movement.left = false
  }
}

keyMap.set('KeyA', leftHandler)

const rightHandler = {
  keydown: (player: Player) => {
    player.movement.right = true
  },
  keyup: (player: Player) => {
    player.movement.right = false
  }
}

keyMap.set('KeyD', rightHandler)

export default class Controller {
  id: string
  player: Player

  constructor(player: Player) {
    this.id = crypto.randomUUID()
    this.player = player

    onkeydown = ({ code }: KeyboardEvent) => {
      const handler = keyMap.get(code)
      if (handler) handler.keydown(player)
    };

    onkeyup = ({ code }: KeyboardEvent) => {
      const handler = keyMap.get(code)
      if (handler) handler.keyup(player)
    };

    const canvas = this.player.world.game.display.canvas

    const getCursorPosition = (canvas: HTMLCanvasElement, event: MouseEvent): Point => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor((event.clientX - rect.left + this.player.world.game.display.clearPoint.x) / this.player.tileSize)
      const y = Math.floor((event.clientY - rect.top + this.player.world.game.display.clearPoint.y) / this.player.tileSize)
      return { x, y }
    }

    canvas.addEventListener('mousedown', (event) => {
      const position = getCursorPosition(canvas, event)
      this.placeTile(position)
    })
  }
  placeTile(position: Point) {
    const chunk = {
      x: Math.floor(position.x / this.player.world.game.chunkSize),
      y: Math.floor(position.y / this.player.world.game.chunkSize)
    }

    const oldDataString = localStorage.getItem(`world#${this.player.world.id}#chunk#${chunk.x}|${chunk.y}`)

    if (!oldDataString) return

    const oldData = JSON.parse(oldDataString) as ChunkData

    const oldTiles = oldData.tiles

    if (oldTiles.find((tile) => tile.position.x === position.x && tile.position.y === position.y)) {
      return
    }

    const newTiles = oldTiles

    newTiles.push({
      id: crypto.randomUUID(),
      position: {
        x: position.x,
        y: position.y
      },
      size: {
        height: 1,
        width: 1
      }
    })

    const newData = {
      ...oldData,
      tiles: newTiles
    }

    localStorage.setItem(`world#${this.player.world.id}#chunk#${chunk.x}|${chunk.y}`, JSON.stringify(newData))

    this.player.world.activeChunks.delete(`${chunk.x}|${chunk.y}`)
  }
}
