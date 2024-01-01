import Display from './Display'
import World from './World'
import Animator from './Animator'

type SettingsData = {
  tileSize: number,
  renderDistance: number
}

export default class Game {
  id: string
  animator: Animator
  display: Display
  worlds: Record<string, World>
  playerId: string
  chunkSize: number
  settings: SettingsData

  constructor(playerId: string) {
    this.id = crypto.randomUUID()
    this.animator = new Animator(this)
    this.display = new Display(this)
    this.worlds = {}
    this.playerId = playerId
    this.chunkSize = 48
    this.settings = this.loadSettingsData()
    this.loadWorlds()

    this.animator.drawStack.push(() => {
      this.display.clear()
    })
  }
  loadSettingsData(): SettingsData {
    const rawPlayerData = localStorage.getItem('game#settings');
    if (rawPlayerData) return JSON.parse(rawPlayerData)
    this.createSettingsData()
    return this.loadSettingsData()
  }
  createSettingsData() {
    const newSettingsData: SettingsData = {
      tileSize: 4,
      renderDistance: 3
    }
    localStorage.setItem('game#settings', JSON.stringify(newSettingsData))
  }
  quit() {
    window.close()
  }
  loadWorlds() {
    for (const key in localStorage) {
      if (key.startsWith('world#')) {
        this.worlds[key] = new World(this, key)
      }
    }
  }
  createWorld() {
    const newWorldId = crypto.randomUUID()
    const newWorld = new World(this, newWorldId)

    newWorld.setDefaultData()
    this.worlds[newWorldId] = newWorld
  }
  deleteWorld(worldIdToDelete: string) {
    localStorage.deleteItem(`world#${worldIdToDelete}`)
    delete this.worlds[worldIdToDelete]
  }
  launchWorld(worldIdToLaunch: string) {
    this.worlds[worldIdToLaunch].launch()
  }
}
