import type { Point } from './main'

interface Chunk extends Point {

}

// used to fetch coordinates that are siblings of the provided coordinate
export const fetchChunkSiblings = ({ x, y }: Chunk) => {
  return [
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y }
  ]
}


// deduplicate coordinates in an array
export const deduplicateChunksToRender = (chunks: Chunk[]) => {
  const chunkSets = {}

  chunks.forEach((chunk) => {
    chunkSets[`${chunk.x}|${chunk.y}`] = true
  })

  return Object.keys(chunkSets).map((chunkSet) => {
    return { x: Number(chunkSet.split('|')[0]), y: Number(chunkSet.split('|')[1]) }
  })
}

// fetch chunk coordinates that should be rendered based on a render distance
export const fetchChunksToRender = (chunk: Chunk, renderDistance: number) => {
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
