import * as THREE from 'three'

import { PLAYER_CONFIG } from '@/constants/game'
import { Node } from '@/types'

import { GridSystem } from './gridSystem'

export class PathFinder {
  constructor(private gridSystem: GridSystem) {}

  public findPath(startPos: THREE.Vector3, targetPos: THREE.Vector3): THREE.Vector3[] | null {
    // Get nearest walkable positions if current positions are not walkable
    const nearestStartPos = this.getNearestWalkablePosition(startPos)
    const nearestTargetPos = this.getNearestWalkablePosition(targetPos)

    if (!nearestStartPos || !nearestTargetPos) {
      return null // No walkable position found within search radius
    }

    // If start position was unwalkable, add it to the beginning of the path
    const prePath: THREE.Vector3[] = []
    if (!startPos.equals(nearestStartPos)) {
      prePath.push(startPos)
    }

    // First try direct path from nearest walkable positions
    if (this.isDirectPathClear(nearestStartPos, nearestTargetPos)) {
      return [...prePath, nearestStartPos, nearestTargetPos]
    }

    // If direct path fails, try A* pathfinding
    const path = this.findAStarPath(nearestStartPos, nearestTargetPos)
    if (!path) return null

    // Simplify the found path and combine with prePath
    const simplifiedPath = this.simplifyPath(path)
    return [...prePath, ...simplifiedPath]
  }

  private isDirectPathClear(start: THREE.Vector3, end: THREE.Vector3): boolean {
    const distance = start.distanceTo(end)
    const STEP_SIZE = 0.2
    const steps = Math.ceil(distance / STEP_SIZE)
    const direction = new THREE.Vector3().subVectors(end, start).normalize()

    for (let i = 1; i < steps; i++) {
      const point = new THREE.Vector3().copy(start).add(direction.clone().multiplyScalar(STEP_SIZE * i))

      if (!this.gridSystem.isPositionWalkable(point.x, point.z, PLAYER_CONFIG.RADIUS + PLAYER_CONFIG.SAFETY_BUFFER)) {
        return false
      }
    }

    return true
  }

  private findAStarPath(startPos: THREE.Vector3, targetPos: THREE.Vector3): THREE.Vector3[] | null {
    const startGrid = this.gridSystem.worldToGrid(startPos.x, startPos.z)
    const targetGrid = this.gridSystem.worldToGrid(targetPos.x, targetPos.z)

    const startNode = this.gridSystem.getNode(startGrid.x, startGrid.z)
    const targetNode = this.gridSystem.getNode(targetGrid.x, targetGrid.z)

    if (!startNode?.walkable || !targetNode?.walkable) {
      return null
    }

    this.gridSystem.resetNodes()

    const openSet: Node[] = [startNode]
    const closedSet = new Set<Node>()

    while (openSet.length > 0) {
      const currentNode = this.getLowestFCostNode(openSet)
      openSet.splice(openSet.indexOf(currentNode), 1)
      closedSet.add(currentNode)

      if (currentNode === targetNode) {
        return this.retracePath(startNode, targetNode)
      }

      for (const neighbor of this.getNeighbors(currentNode)) {
        if (!neighbor.walkable || closedSet.has(neighbor)) continue

        const newMovementCost = currentNode.gCost + this.getDistance(currentNode, neighbor)
        if (newMovementCost < neighbor.gCost || !openSet.includes(neighbor)) {
          neighbor.gCost = newMovementCost
          neighbor.hCost = this.getDistance(neighbor, targetNode)
          neighbor.parent = currentNode

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor)
          }
        }
      }
    }

    return null
  }

  private getNearestWalkablePosition(position: THREE.Vector3): THREE.Vector3 | null {
    // If the current position is already walkable, return it
    if (
      this.gridSystem.isPositionWalkable(position.x, position.z, PLAYER_CONFIG.RADIUS + PLAYER_CONFIG.SAFETY_BUFFER)
    ) {
      return position.clone()
    }

    // Convert to grid coordinates
    const gridPos = this.gridSystem.worldToGrid(position.x, position.z)
    const searchRadius = 5 // Adjust this value based on your needs

    let nearestNode: Node = null!
    let minDistance = Infinity

    // Search in expanding squares around the position
    for (let r = 1; r <= searchRadius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          // Only check positions on the current square perimeter
          if (Math.abs(dx) < r && Math.abs(dz) < r) continue

          const checkX = gridPos.x + dx
          const checkZ = gridPos.z + dz
          const node = this.gridSystem.getNode(checkX, checkZ)

          if (node?.walkable) {
            const worldPos = this.gridSystem.gridToWorld(checkX, checkZ)
            const distance = new THREE.Vector3(worldPos.x, position.y, worldPos.z).distanceTo(position)

            if (distance < minDistance) {
              minDistance = distance
              nearestNode = node
            }
          }
        }
      }

      // If we found a walkable position in this radius, no need to search further
      if (nearestNode !== null) {
        const worldPos = this.gridSystem.gridToWorld(nearestNode.x, nearestNode.z)
        return new THREE.Vector3(worldPos.x, position.y, worldPos.z)
      }
    }

    return null
  }

  private getLowestFCostNode(nodes: Node[]): Node {
    return nodes.reduce(
      (lowest, node) =>
        node.fCost < lowest.fCost || (node.fCost === lowest.fCost && node.hCost < lowest.hCost) ? node : lowest,
      nodes[0],
    )
  }

  private getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = []
    const directions = [
      { x: 0, z: 1 },
      { x: 1, z: 0 },
      { x: 0, z: -1 },
      { x: -1, z: 0 },
      { x: 1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: -1 },
      { x: -1, z: 1 },
    ]

    for (const dir of directions) {
      const newX = node.x + dir.x
      const newZ = node.z + dir.z

      const neighbor = this.gridSystem.getNode(newX, newZ)
      if (neighbor?.walkable) {
        if (Math.abs(dir.x) === 1 && Math.abs(dir.z) === 1) {
          const horizontalNode = this.gridSystem.getNode(newX, node.z)
          const verticalNode = this.gridSystem.getNode(node.x, newZ)

          if (!horizontalNode?.walkable || !verticalNode?.walkable) continue
        }
        neighbors.push(neighbor)
      }
    }

    return neighbors
  }

  private getDistance(nodeA: Node, nodeB: Node): number {
    const distX = Math.abs(nodeA.x - nodeB.x)
    const distZ = Math.abs(nodeA.z - nodeB.z)

    if (distX > distZ) {
      return 14 * distZ + 10 * (distX - distZ)
    }
    return 14 * distX + 10 * (distZ - distX)
  }

  private retracePath(startNode: Node, endNode: Node): THREE.Vector3[] {
    const path: THREE.Vector3[] = []
    let currentNode: Node | null = endNode

    while (!!currentNode && currentNode !== startNode) {
      const worldPos = this.gridSystem.gridToWorld(currentNode.x, currentNode.z)
      path.push(new THREE.Vector3(worldPos.x, PLAYER_CONFIG.HEIGHT, worldPos.z))
      currentNode = currentNode.parent
    }

    return path.reverse()
  }

  private simplifyPath(path: THREE.Vector3[]): THREE.Vector3[] {
    if (path.length <= 2) return path

    const result: THREE.Vector3[] = [path[0]]
    let currentPoint = path[0]

    while (currentPoint !== path[path.length - 1]) {
      let furthestReachable: THREE.Vector3 | null = null
      let maxDistance = 0

      for (let i = path.length - 1; i > path.indexOf(currentPoint); i--) {
        const target = path[i]
        if (this.isDirectPathClear(currentPoint, target)) {
          const distance = currentPoint.distanceTo(target)
          if (distance > maxDistance) {
            maxDistance = distance
            furthestReachable = target
          }
        }
      }

      if (!furthestReachable) {
        const nextIndex = path.indexOf(currentPoint) + 1
        if (nextIndex >= path.length) break
        furthestReachable = path[nextIndex]
      }

      if (furthestReachable !== result[result.length - 1]) {
        result.push(furthestReachable)
      }
      currentPoint = furthestReachable
    }

    return result
  }
}
