import * as THREE from "three";

export interface GridPosition {
  x: number;
  z: number;
}

export interface MousePosition {
  x: number;
  y: number;
}

export class Node {
  public gCost: number = 0;
  public hCost: number = 0;
  public parent: Node | null = null;

  constructor(public x: number, public z: number, public walkable: boolean) {}

  get fCost(): number {
    return this.gCost + this.hCost;
  }
}

export interface MovementControls {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
}

export interface DragState {
  isDragging: boolean;
  dragStartPosition: MousePosition;
  dragStartTime: number;
  previousMousePosition: MousePosition;
  dragDistance: number;
}

export interface GameState {
  isFullscreen: boolean;
  isPointerLocked: boolean;
  isMoving: boolean;
  targetRotationY: number;
  velocity: THREE.Vector3;
  moveTarget: THREE.Vector3;
  currentPath: THREE.Vector3[];
}
