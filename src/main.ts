import './style.css'

const displayCanvas = document.createElement('canvas')

displayCanvas.classList.add('display')

displayCanvas.style.backgroundColor = 'darkred'

displayCanvas.height = window.innerHeight
displayCanvas.width = window.innerWidth

document.body.appendChild(displayCanvas)

onresize = (event) => {
  displayCanvas.width = event.target.innerWidth
  displayCanvas.height = event.target.innerHeight
};

const displayContext = displayCanvas.getContext('2d')

const gameId = 1
const playerId = 1
const mapId = 'default'

const game = localStorage.getItem(`game#${gameId}`);

if (game === null) {
  localStorage.setItem(`game#${gameId}`, JSON.stringify({
    creator: playerId
  }));

  location.reload();
}

const playerDataString = localStorage.getItem(`game#${gameId}#player#${playerId}`)

if (playerDataString === null) {
  localStorage.setItem(`game#${gameId}#player#${playerId}`, JSON.stringify({
    location: {
      x: 0,
      y: 0
    }
  }));

  location.reload();
}

const playerData = JSON.parse(playerDataString)

const renderDistance = 3

const chunkSize = 64
const tileSize = 32

const screenSize = chunkSize * tileSize

const defaultView = [1, 0, 0, 1, 0, 0];

const view = Array.from(defaultView);

const fetchChunkSiblings = (x, y) => {
  return [
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y }
  ]
}

const deduplicateChunksToRender = (chunks) => {
  const chunkSets = {}

  chunks.forEach((chunk) => {
    chunkSets[`${chunk.x}|${chunk.y}`] = true
  })

  return Object.keys(chunkSets).map((chunkSet) => {
    return { x: Number(chunkSet.split('|')[0]), y: Number(chunkSet.split('|')[1]) }
  })
}

const fetchChunksToRender = (chunk, renderDistance) => {
  let chunksToRender = [chunk]

  if (renderDistance > 0) {
    const siblings = fetchChunkSiblings(chunk.x, chunk.y)

    chunksToRender = [...chunksToRender, ...siblings]

    siblings.forEach((sibling) => {
      const relatives = fetchChunksToRender(sibling, renderDistance - 1)

      chunksToRender = [...chunksToRender, ...relatives]
    })

  }

  return deduplicateChunksToRender(chunksToRender)
}

const chunkData = new Map()
const chunkImages = new Map()

const draw = () => {
  const playerVisualAddress = {
    x: playerData.location.x * tileSize,
    y: playerData.location.y * tileSize
  }

  view[4] = -playerVisualAddress.x + (displayCanvas.width * 0.5) - (tileSize * 0.5);
  view[5] = -playerVisualAddress.y + (displayCanvas.height * 0.5) - (tileSize * 0.5);

  const cameraVisualAddress = {
    x: playerVisualAddress.x - displayCanvas.width * 0.5,
    y: playerVisualAddress.y - displayCanvas.height * 0.5
  }

  // set the origin of the screen context to the position of the player/canvas
  displayContext.setTransform(...view);

  displayContext.clearRect(cameraVisualAddress.x, cameraVisualAddress.y, displayCanvas.width, displayCanvas.height)

  const chunkX = Math.floor(playerData.location.x / chunkSize)
  const chunkY = Math.floor(playerData.location.y / chunkSize)

  const chunksToRender = fetchChunksToRender({ x: chunkX, y: chunkY }, renderDistance)

  chunksToRender.forEach((chunk) => {
    const chunkAddress = `${chunk.x}|${chunk.y}`

    if (chunkData.has(chunkAddress)) {
      // TODO: how to handle when the data exists, but has since been updated
    } else {
      const chunkDataString = localStorage.getItem(`game#${gameId}#map#${mapId}#${chunkAddress}`)

      // TODO: generate new data for chunks that are null
      chunkData.set(chunkAddress, JSON.parse(chunkDataString))
    }

    if (chunkImages.has(chunkAddress)) {

    } else {
      // TODO: maybe run this in a web worker?

      const chunkCanvas = new OffscreenCanvas(screenSize, screenSize);
      const chunkContext = chunkCanvas.getContext('2d')

      chunkContext.fillStyle = 'teal'
      chunkContext.fillRect(0, 0, screenSize, screenSize)
      chunkContext.fillStyle = 'orange'
      chunkContext.fillRect(1, 1, screenSize - 2, screenSize - 2)

      // TODO: draw the tiles to the canvas
      chunkImages.set(chunkAddress, chunkCanvas)
    }

    const chunkImage = chunkImages.get(chunkAddress)

    // draw the chunks onto the screen
    const chunkVisualAddress = {
      x: chunk.x * chunkSize * tileSize,
      y: chunk.y * chunkSize * tileSize
    }

    displayContext.drawImage(chunkImage, 0, 0, screenSize, screenSize, chunkVisualAddress.x, chunkVisualAddress.y, screenSize, screenSize)
  })

  const chunksToRenderString = chunksToRender.map((chunk) => `${chunk.x}|${chunk.y}`)

  Array.from(chunkData.keys()).forEach((chunkDataKey) => {
    if (!chunksToRenderString.includes(chunkDataKey)) {
      chunkData.delete(chunkDataKey)
    }
  })

  Array.from(chunkImages.keys()).forEach((chunkImageKey) => {
    if (!chunksToRenderString.includes(chunkImageKey)) {
      chunkData.delete(chunkImageKey)
    }
  })

  displayContext.fillStyle = 'green'
  displayContext.fillRect(playerVisualAddress.x, playerVisualAddress.y, tileSize, tileSize)
}

const stop = false;
let frameCount = 0;
let fps, fpsInterval, start, then, elapsed;

const startAnimating = (fps) => {
  fpsInterval = 1000 / fps;
  then = window.performance.now();
  start = then;
  animate();
}

const animate = (timestamp) => {
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

const controls = {
  up: (toggle) => {
    if (toggle) {
      playerData.location.y -= 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  down: (toggle) => {
    if (toggle) {
      playerData.location.y += 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  left: (toggle) => {
    if (toggle) {
      playerData.location.x -= 1
      console.info(playerData.location.x, playerData.location.y)
    }
  },
  right: (toggle) => {
    if (toggle) {
      playerData.location.x += 1
      console.info(playerData.location.x, playerData.location.y)
    }
  }
}

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
