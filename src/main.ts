// import styles
import './style.css'
import { setupDisplay, loadGameData, loadPlayerData } from './steps'
import { fetchChunksToRender } from './chunks'
import { startAnimating } from './animation'

const { displayCanvas, displayContext } = setupDisplay()

// some hard coded default properties
// TODO: make these dynamic
const gameId = 1
const playerId = 1
const mapId = 'default'

const chunkSize = 24
export const tileSize = 24

const screenSize = chunkSize * tileSize

// how many siblings to render
const renderDistance = 3

// thew default matrix
const defaultView = [1, 0, 0, 1, 0, 0];

const view = Array.from(defaultView);

export interface Point {
  x: number,
  y: number
}

const gameData = loadGameData(gameId, playerId)
const playerData = loadPlayerData(gameId, playerId)

const min = (val: number, minVal: number) => {
  if (val > minVal) {
    return val
  } else return minVal
}

const max = (val: number, maxVal: number) => {
  if (val < maxVal) {
    return val
  } else return maxVal
}

const handleMovement = () => {
  if (playerData.movement.left && !playerData.movement.right) {
    playerData.velocity.x = min(playerData.velocity.x - 0.075, -0.5)
  }
  if (!playerData.movement.left && playerData.movement.right) {
    playerData.velocity.x = max(playerData.velocity.x + 0.075, 0.5)
  }
}

const handleGravity = () => {
  if (playerData.location.y < -1) {
    if (playerData.velocity.y <= 1) {
      playerData.velocity.y += 0.05
    }
  } else {
    playerData.velocity.y = 0
  }
}

const handleVertical = () => {
  playerData.location.y = max(playerData.location.y + playerData.velocity.y, -1)
}

const handleHorizontal = () => {
  playerData.location.x += playerData.velocity.x
}

const handleVelocity = () => {
  handleVertical()
  handleHorizontal()
}

const handleFriction = () => {
  switch (true) {
    case playerData.velocity.x > 0:
      playerData.velocity.x = min(0, playerData.velocity.x - 0.05)
      break;
    case playerData.velocity.x < 0:
      playerData.velocity.x = max(0, playerData.velocity.x + 0.05)
      break;
  }
}

const handlePhysics = () => {
  handleMovement()

  handleGravity()

  handleVelocity()

  handleFriction()
}

// at 60 frames a second, draw
const draw = () => {

  handlePhysics()

  // the players coords multiplied by the tile size
  const playerVisualAddress: Point = {
    x: playerData.location.x * tileSize,
    y: playerData.location.y * tileSize
  }

  // update the view matrix to center on the player
  view[4] = -playerVisualAddress.x + (displayCanvas.width * 0.5) - (tileSize * 0.5);
  view[5] = -playerVisualAddress.y + (displayCanvas.height * 0.5) - (tileSize * 0.5);

  // determine the top left position of the camera based on the player
  const cameraVisualAddress: Point = {
    x: playerVisualAddress.x - displayCanvas.width * 0.5,
    y: playerVisualAddress.y - displayCanvas.height * 0.5
  }

  // set the origin of the screen context to the position of the player/canvas
  displayContext.setTransform(...view);

  // clear the screen, preventing bleeding
  displayContext.clearRect(cameraVisualAddress.x, cameraVisualAddress.y, displayCanvas.width, displayCanvas.height)

  // get the current chunk the player is in
  const chunkX = Math.floor(playerData.location.x / chunkSize)
  const chunkY = Math.floor(playerData.location.y / chunkSize)

  // use the above method to find the right chunks to render for the player
  const chunksToRender = fetchChunksToRender({ x: chunkX, y: chunkY }, renderDistance)

  type TileData = {
    id: string
  }

  type ChunkData = {
    tiles: TileData[][]
  }

  const allChunkData = new Map()

  const getChunkData = (chunkAddress: string): ChunkData => {
    if (allChunkData.has(chunkAddress)) {
      return allChunkData.get(chunkAddress)
    }

    const rawChunkData = localStorage.getItem(`game#${gameId}#map#${mapId}#chunk#${chunkAddress}`)

    if (rawChunkData) {
      allChunkData.set(chunkAddress, JSON.parse(rawChunkData))
      return getChunkData(chunkAddress)
    }

    const newChunkData = {
      tiles: [[]]
    } as ChunkData

    localStorage.setItem(`game#${gameId}#map#${mapId}#chunk#${chunkAddress}`, JSON.stringify(newChunkData))
    return getChunkData(chunkAddress)
  }

  // globally store our game data in memory
  const chunkImages = new Map()

  const drawTilesOnChunk = (chunkContext: OffscreenCanvasRenderingContext2D, tiles: TileData[][]) => {
    tiles.forEach((row: TileData[], rowIndex: number) => {
      row.forEach((tile: TileData, colIndex: number) => {
        if (tile) {
          chunkContext.fillStyle = 'red'
          chunkContext.fillRect(rowIndex, colIndex, tileSize, tileSize)
        }
      })
    })
  }

  chunksToRender.forEach((chunk) => {
    const chunkAddress = `${chunk.x}|${chunk.y}`

    const chunkData = getChunkData(chunkAddress)

    // handle drawing the tiles for each chunk
    // TODO: maybe run this in a web worker?
    if (!chunkImages.has(chunkAddress)) {
      const chunkCanvas = new OffscreenCanvas(screenSize, screenSize);
      const chunkContext = chunkCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D

      chunkContext.fillStyle = 'green'
      chunkContext.fillRect(0, 0, screenSize, screenSize)

      if (chunk.y >= 0) {
        chunkContext.fillStyle = '#784212' // brown
      } else {
        chunkContext.fillStyle = '#85C1E9' // blue
      }
      chunkContext.fillRect(1, 1, screenSize - 2, screenSize - 2)

      chunkContext.fillStyle = 'black'
      chunkContext.fillText(JSON.stringify(chunkData), tileSize, screenSize * 0.5)

      drawTilesOnChunk(chunkContext, chunkData.tiles)

      chunkImages.set(chunkAddress, chunkCanvas)
    }

    const chunkImage = chunkImages.get(chunkAddress)

    // draw the chunks onto the screen
    const chunkVisualAddress: Point = {
      x: chunk.x * chunkSize * tileSize,
      y: chunk.y * chunkSize * tileSize
    }

    // draw the chunk on the screen offset to the player
    displayContext.drawImage(chunkImage, 0, 0, screenSize, screenSize, chunkVisualAddress.x, chunkVisualAddress.y, screenSize, screenSize)
  })

  const chunksToRenderString = chunksToRender.map((chunk) => `${chunk.x}|${chunk.y}`)

  // remove chunk images that are not being used
  Array.from(chunkImages.keys()).forEach((chunkImageKey) => {
    if (!chunksToRenderString.includes(chunkImageKey)) {
      chunkImages.delete(chunkImageKey)
    }
  })

  // draw a player icon on the screen
  displayContext.fillStyle = 'green'
  displayContext.fillRect(playerVisualAddress.x, playerVisualAddress.y, tileSize, tileSize)
}

startAnimating(() => {
  draw()
});

// handling player controls
const controls = {
  up: (toggle: boolean) => {
    if (!toggle) {
      playerData.location.y -= 0.01
      playerData.velocity.y = -0.75
    }
  },
  down: (toggle: boolean) => {
    if (toggle) {
      // playerData.location.y += 1
    }
  },
  left: (toggle: boolean) => {
    if (toggle) {
      playerData.movement.left = false
    } else {
      playerData.movement.left = true
    }
  },
  right: (toggle: boolean) => {
    if (toggle) {
      playerData.movement.right = false
    } else {
      playerData.movement.right = true
    }
  }
}

// supported keys
const keys = {
  KeyW: {
    keyup: {
      handler: () => {
        controls.up(true)
      }
    },
    keydown: {
      handler: () => {
        controls.up(false)
      }
    }
  },
  KeyA: {
    keyup: {
      handler: () => {
        controls.left(true)
      }
    },
    keydown: {
      handler: () => {
        controls.left(false)
      }
    }
  },
  KeyS: {
    keyup: {
      handler: () => {
        controls.down(true)
      }
    },
    keydown: {
      handler: () => {
        controls.down(false)
      }
    }
  },
  KeyD: {
    keyup: {
      handler: () => {
        controls.right(true)
      }
    },
    keydown: {
      handler: () => {
        controls.right(false)
      }
    }
  },
  Space: {
    keyup: {
      handler: () => {
        controls.up(true)
      }
    },
    keydown: {
      handler: () => {
        controls.up(false)
      }
    }
  }
}

// listen for key events
onkeydown = (event) => {
  if (keys[event?.code]?.keydown?.handler) {
    keys[event.code].keydown.handler()
  }
};

onkeyup = (event) => {
  if (keys[event?.code]?.keyup?.handler) {
    keys[event.code].keyup.handler()
  }
};
