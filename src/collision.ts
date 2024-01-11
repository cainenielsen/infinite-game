import { Point, Entity } from "./helpers";

enum CollisionSide {
  None = 'none',
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

export type Collision = {
  subjects: [Entity, Entity],
  side: CollisionSide
  container?: Entity
  contained?: Entity
}

export interface CollisionResult {
  colliding: boolean
  containing: boolean
  collision?: Collision
  container?: Entity
  contained?: Entity
}

export const detectCollision = (entity1: Entity, entity2: Entity): CollisionResult => {
  const { position: { x: x1, y: y1 }, size: { height: height1, width: width1 } } = entity1
  const { position: { x: x2, y: y2 }, size: { height: height2, width: width2 } } = entity2

  const colliding =
    x1 <= x2 + width2 &&
    x1 + width1 >= x2 &&
    y1 <= y2 + height2 &&
    y1 + height1 >= y2

  if (colliding) {
    const overlapX = Math.min(x1 + width1, x2 + width2) - Math.max(x1, x2);
    const overlapY = Math.min(y1 + height1, y2 + height2) - Math.max(y1, y2);

    if (overlapX < overlapY) {
      if (x1 < x2) {
        return { colliding, collision: { subjects: [entity1, entity2], side: CollisionSide.Right }, containing: false };
      } else {
        return { colliding, collision: { subjects: [entity1, entity2], side: CollisionSide.Left }, containing: false };
      }
    } else if (y1 < y2) {
      return { colliding, collision: { subjects: [entity1, entity2], side: CollisionSide.Bottom }, containing: false };
    } else {
      return { colliding, collision: { subjects: [entity1, entity2], side: CollisionSide.Top }, containing: false };
    }
  }

  // Check if rect1 is fully inside rect2
  const isInside =
    x1 >= x2 &&
    y1 >= y2 &&
    x1 + width1 <= x2 + width2 &&
    y1 + height1 <= y2 + height2;

  return {
    colliding: false,
    containing: isInside,
    contained: isInside ? entity1 : undefined,
    container: isInside ? entity2 : undefined
  };
}

export const getSiblingPoints = ({ x, y }: Point): Point[] => {
  return [
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y }
  ]
}

export const dedupePoints = (points: Point[]): Point[] => {
  const uniquePointMap: Record<string, boolean> = {}
  const uniquePoints = []
  for (const point of points) {
    const key = `${point.x}|${point.y}`;

    if (!uniquePointMap[key]) {
      uniquePointMap[key] = true;
      uniquePoints.push(point);
    }
  }

  return uniquePoints
}

export const getLocalPoints = (point: Point, renderDistance: number): Point[] => {
  let localPoints = [point]

  if (renderDistance > 0) {
    const siblings = getSiblingPoints(point)

    localPoints = [...localPoints, ...siblings]

    siblings.forEach((sibling) => {
      const relatives = getLocalPoints(sibling, renderDistance - 1)

      localPoints = [...localPoints, ...relatives]
    })
  }

  return dedupePoints(localPoints)
}
