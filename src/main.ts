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

const gameData = loadGameData(gameId, playerId)
const playerData = loadPlayerData(gameId, playerId)

const chunkSize = 64
const tileSize = 64

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

// globally store our game data in memory
const chunkData = new Map()
const chunkImages = new Map()

// at 60 frames a second, draw
const draw = () => {

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

  chunksToRender.forEach((chunk) => {
    const chunkAddress = `${chunk.x}|${chunk.y}`

    // handle loading or building the chunk data from the db
    if (chunkData.has(chunkAddress)) {
      // TODO: how to handle when the data exists, but has since been updated
    } else {
      const rawChunkData = localStorage.getItem(`game#${gameId}#map#${mapId}#${chunkAddress}`)

      // TODO: generate new data for chunks that are null
      if (rawChunkData) {
        chunkData.set(chunkAddress, JSON.parse(rawChunkData))
      }
    }

    // handle drawing the tiles for each chunk
    if (chunkImages.has(chunkAddress)) {

    } else {
      // TODO: maybe run this in a web worker?

      const chunkCanvas = new OffscreenCanvas(screenSize, screenSize);
      const chunkContext = chunkCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D

      chunkContext.fillStyle = 'teal'
      chunkContext.fillRect(0, 0, screenSize, screenSize)
      chunkContext.fillStyle = 'orange'
      chunkContext.fillRect(1, 1, screenSize - 2, screenSize - 2)

      // TODO: draw the tiles to the canvas
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

  // remove chunk data that is not being used
  Array.from(chunkData.keys()).forEach((chunkDataKey) => {
    if (!chunksToRenderString.includes(chunkDataKey)) {
      chunkData.delete(chunkDataKey)
    }
  })

  // remove chunk images that are not being used
  Array.from(chunkImages.keys()).forEach((chunkImageKey) => {
    if (!chunksToRenderString.includes(chunkImageKey)) {
      chunkData.delete(chunkImageKey)
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
    if (toggle) {
      playerData.location.y -= 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  down: (toggle: boolean) => {
    if (toggle) {
      playerData.location.y += 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  left: (toggle: boolean) => {
    if (toggle) {
      playerData.location.x -= 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  right: (toggle: boolean) => {
    if (toggle) {
      playerData.location.x += 1
      console.info(playerData.location.x, playerData.location.y)
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
