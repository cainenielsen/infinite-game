import Player from "./Player"

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
  }
}
