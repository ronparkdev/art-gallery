import * as THREE from 'three'

import { PLAYER_CONFIG, GRID_WIDTH, GRID_HEIGHT, GRID_SIZE } from '@/constants/game'
import { Node, GridPosition } from '@/types'

export class GridSystem {
  private grid: Node[][] = []
  private walls: THREE.Mesh[] = []

  public initializeGrid(walls: THREE.Mesh[]): void {
    this.walls = walls
    const TOTAL_RADIUS = PLAYER_CONFIG.RADIUS + PLAYER_CONFIG.SAFETY_BUFFER

    for (let x = 0; x < GRID_WIDTH; x++) {
      this.grid[x] = []
      for (let z = 0; z < GRID_HEIGHT; z++) {
        const worldPos = this.gridToWorld(x, z)
        const corners = this.getGridCellCorners(worldPos)
        const walkable = corners.every(point => this.isPositionWalkable(point.x, point.z, TOTAL_RADIUS))
        this.grid[x][z] = new Node(x, z, walkable)
      }
    }
  }

  private getGridCellCorners(worldPos: GridPosition): GridPosition[] {
    return [
      { x: worldPos.x - GRID_SIZE / 2, z: worldPos.z - GRID_SIZE / 2 },
      { x: worldPos.x - GRID_SIZE / 2, z: worldPos.z + GRID_SIZE / 2 },
      { x: worldPos.x + GRID_SIZE / 2, z: worldPos.z - GRID_SIZE / 2 },
      { x: worldPos.x + GRID_SIZE / 2, z: worldPos.z + GRID_SIZE / 2 },
      { x: worldPos.x, z: worldPos.z },
    ]
  }

  public worldToGrid(x: number, z: number): GridPosition {
    return {
      x: Math.floor((x + 15) / GRID_SIZE),
      z: Math.floor((z + 15) / GRID_SIZE),
    }
  }

  public gridToWorld(gridX: number, gridZ: number): GridPosition {
    return {
      x: gridX * GRID_SIZE - 15,
      z: gridZ * GRID_SIZE - 15,
    }
  }

  public isPositionWalkable(x: number, z: number, radius: number): boolean {
    const position = new THREE.Vector3(x, PLAYER_CONFIG.HEIGHT, z)
    const playerBox = new THREE.Box3()
    playerBox.min.set(position.x - radius, position.y - 1, position.z - radius)
    playerBox.max.set(position.x + radius, position.y + 1, position.z + radius)

    return !this.walls.some(wall => {
      const wallBox = new THREE.Box3().setFromObject(wall)
      return playerBox.intersectsBox(wallBox)
    })
  }

  public getNode(x: number, z: number): Node | null {
    if (x >= 0 && x < GRID_WIDTH && z >= 0 && z < GRID_HEIGHT) {
      return this.grid[x][z]
    }
    return null
  }

  public resetNodes(): void {
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let z = 0; z < GRID_HEIGHT; z++) {
        this.grid[x][z].gCost = 0
        this.grid[x][z].hCost = 0
        this.grid[x][z].parent = null
      }
    }
  }
}
