import './style.css'
import Game from './Game'

const playerId = 'example-player-id'

const game = new Game(playerId)

if (!Object.keys(game.worlds).length) {
  game.createWorld()
}

const worldToLaunch = Object.keys(game.worlds)[0]

game.launchWorld(worldToLaunch)
