import { tileSize } from './main'

export const setupDisplay = () => {
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

  return { displayCanvas, displayContext }
}

export const loadGameData = (gameId: number, playerId: number) => {
  // based on the properties above, load the game data from the db
  const rawGameData = localStorage.getItem(`game#${gameId}`);

  // if a game by that id does not exist, create one and reload the window
  if (rawGameData === null) {
    localStorage.setItem(`game#${gameId}`, JSON.stringify({
      creator: playerId
    }));

    return location.reload();
  }
  return JSON.parse(rawGameData)
}

export const loadPlayerData = (gameId: number, playerId: number) => {
  // fetch the player data from the db
  const rawPlayerData = localStorage.getItem(`game#${gameId}#player#${playerId}`)

  // if a player does not exist, create it at 0,0 in the db and reload
  if (rawPlayerData === null) {
    localStorage.setItem(`game#${gameId}#player#${playerId}`, JSON.stringify({
      location: {
        x: 0,
        y: -1
      },
      velocity: {
        x: 0,
        y: 0
      },
      movement: {
        left: false,
        right: false
      }
    }));

    return location.reload();
  }
  return JSON.parse(rawPlayerData)
}
