import Player from './Player'
import { Point } from './helpers'

const keyMap = new Map()

const jumpHandler = {
  keydown: (player: Player) => {
    player.toggleJump(true)
  },
  keyup: (player: Player) => {
    player.toggleJump(false)
  }
}

keyMap.set('KeyW', jumpHandler)
keyMap.set('Space', jumpHandler)

const leftHandler = {
  keydown: (player: Player) => {
    player.toggleLeft(true)
  },
  keyup: (player: Player) => {
    player.toggleLeft(false)
  }
}

keyMap.set('KeyA', leftHandler)

const rightHandler = {
  keydown: (player: Player) => {
    player.toggleRight(true)
  },
  keyup: (player: Player) => {
    player.toggleRight(false)
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
      const location = getCursorPosition(canvas, event)
      this.placeTile(location)
    })
  }
  placeTile(location: Point) {
    const chunk = {
      x: Math.floor(location.x / this.player.world.game.chunkSize),
      y: Math.floor(location.y / this.player.world.game.chunkSize)
    }

    const oldDataString = localStorage.getItem(`world#${this.player.world.id}#chunk#${chunk.x}|${chunk.y}`)

    if (!oldDataString) return

    const oldData = JSON.parse(oldDataString)

    console.info(oldData)

    const oldTiles = oldData.tiles

    const newTiles = oldTiles

    newTiles[Math.abs(location.x)][Math.abs(location.y)] = { id: 'dirt' }

    const newData = {
      ...oldData,
      tiles: newTiles
    }

    console.info('adding tile')

    localStorage.setItem(`world#${this.player.world.id}#chunk#${chunk.x}|${chunk.y}`, JSON.stringify(newData))

    this.player.world.chunkMedia.delete(`${chunk.x}|${chunk.y}`)
  }
}
