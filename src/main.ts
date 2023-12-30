// import styles
import './style.css'

// create a new canvas element
const displayCanvas = document.createElement('canvas')

displayCanvas.style.backgroundColor = 'darkred'

// set the display canvas to the size of the browser window
displayCanvas.height = window.innerHeight
displayCanvas.width = window.innerWidth

// add the display canvas to the body
document.body.appendChild(displayCanvas)

// subscribe to window resize events and keep the display
// canvas the same size as the screen
onresize = (event: UIEvent) => {
  const target = event.target as Window
  displayCanvas.width = target.innerWidth
  displayCanvas.height = target.innerHeight
};

// get the context for the display canvas
const displayContext = displayCanvas.getContext('2d') as CanvasRenderingContext2D

// some hard coded default properties
// TODO: make these dynamic
const gameId = 1
const playerId = 1
const mapId = 'default'

// based on the properties above, load the game data from the db
const game = localStorage.getItem(`game#${gameId}`);

// if a game by that id does not exist, create one and reload the window
if (game === null) {
  localStorage.setItem(`game#${gameId}`, JSON.stringify({
    creator: playerId
  }));

  location.reload();
}

// fetch the player data from the db
const playerDataString = localStorage.getItem(`game#${gameId}#player#${playerId}`)

// if a player does not exist, create it at 0,0 in the db and reload
if (playerDataString === null) {
  localStorage.setItem(`game#${gameId}#player#${playerId}`, JSON.stringify({
    location: {
      x: 0,
      y: 0
    }
  }));

  location.reload();
}

const playerData = JSON.parse(playerDataString as string)

const chunkSize = 64
const tileSize = 64

const screenSize = chunkSize * tileSize

// how many siblings to render
const renderDistance = 3

// thew default matrix
const defaultView = [1, 0, 0, 1, 0, 0];

const view = Array.from(defaultView) as DOMMatrix2DInit;

interface Point {
  x: number,
  y: number
}

// used to fetch coordinates that are siblings of the provided coordinate
const fetchChunkSiblings = ({ x, y }: Point) => {
  return [
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y }
  ]
}

interface Chunk extends Point {

}

// deduplicate coordinates in an array
const deduplicateChunksToRender = (chunks: Chunk[]) => {
  const chunkSets = {}

  chunks.forEach((chunk) => {
    chunkSets[`${chunk.x}|${chunk.y}`] = true
  })

  return Object.keys(chunkSets).map((chunkSet) => {
    return { x: Number(chunkSet.split('|')[0]), y: Number(chunkSet.split('|')[1]) }
  })
}

// fetch chunk coordinates that should be rendered based on a render distance
const fetchChunksToRender = (chunk: Chunk, renderDistance: number) => {
  let chunksToRender = [chunk]

  if (renderDistance > 0) {
    const siblings = fetchChunkSiblings({ x: chunk.x, y: chunk.y })

    chunksToRender = [...chunksToRender, ...siblings]

    siblings.forEach((sibling) => {
      const relatives = fetchChunksToRender(sibling, renderDistance - 1)

      chunksToRender = [...chunksToRender, ...relatives]
    })

  }

  return deduplicateChunksToRender(chunksToRender)
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
      const chunkDataString = localStorage.getItem(`game#${gameId}#map#${mapId}#${chunkAddress}`)

      // TODO: generate new data for chunks that are null
      chunkData.set(chunkAddress, JSON.parse(chunkDataString))
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

const stop = false;
let frameCount = 0;
let fpsInterval: number, start: number, then: number, elapsed;

// kick off an animation with specific conditions
const startAnimating = (fps: number) => {
  fpsInterval = 1000 / fps;
  then = window.performance.now();
  start = then;
  animate(then);
}

// the animation loop
const animate = (timestamp: number) => {
  if (stop) return

  requestAnimationFrame(animate);

  elapsed = timestamp - then;

  if (elapsed > fpsInterval) {
    then = timestamp - (elapsed % fpsInterval);

    draw()

    const sinceStart = timestamp - start;
    const currentFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;

    // console.info(currentFps)
  }
}

startAnimating(60);

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
