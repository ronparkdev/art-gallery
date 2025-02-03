import * as THREE from 'three'

import { PLAYER_CONFIG } from '@/constants/game'
import { GameState } from '@/types'

import { GridSystem } from './gridSystem'
import { InputManager } from './inputManager'
import { PathFinder } from './pathFinding'

export class MovementManager {
  private moveStartTime: number = 0

  constructor(
    private camera: THREE.PerspectiveCamera,
    private gameState: GameState,
    private pathFinder: PathFinder,
    private gridSystem: GridSystem,
    private inputManager: InputManager,
  ) {}

  public handleMove(targetPoint: THREE.Vector3): void {
    if (!this.gameState.isMoving) {
      this.gameState.moveTarget.copy(targetPoint)
      this.gameState.moveTarget.y = this.camera.position.y

      this.gameState.currentPath = this.pathFinder.findPath(this.camera.position, this.gameState.moveTarget) || []

      if (this.gameState.currentPath.length > 0) {
        this.gameState.isMoving = true
        this.moveStartTime = performance.now()
      }
    }
  }

  public updateMovement(deltaTime: number): void {
    if (this.gameState.isMoving) {
      this.updatePathMovement(deltaTime)
    } else {
      this.updateDirectMovement(deltaTime)
    }
  }

  private updatePathMovement(deltaTime: number): void {
    const elapsedTime = (performance.now() - this.moveStartTime) / 1000
    const currentTarget = this.gameState.currentPath[0]
    const distance = this.camera.position.distanceTo(currentTarget)

    // Calculate direction and rotation
    const direction = new THREE.Vector3().subVectors(currentTarget, this.camera.position).normalize()
    const targetAngle = Math.atan2(-direction.x, -direction.z)

    // Get current rotation in range [0, 2PI]
    let currentRotation = this.camera.rotation.y % (2 * Math.PI)
    if (currentRotation < 0) currentRotation += 2 * Math.PI

    // Get target rotation in range [0, 2PI]
    let normalizedTargetAngle = targetAngle
    if (normalizedTargetAngle < 0) normalizedTargetAngle += 2 * Math.PI

    // Calculate rotation difference
    let rotationDiff = normalizedTargetAngle - currentRotation

    // Ensure we take the shortest path
    if (rotationDiff > Math.PI) {
      rotationDiff -= 2 * Math.PI
    } else if (rotationDiff < -Math.PI) {
      rotationDiff += 2 * Math.PI
    }

    // Linear acceleration for rotation
    const rotationProgress = Math.min(elapsedTime / PLAYER_CONFIG.ROTATION_ACCELERATION_DURATION, 1)
    const rotationSpeed = PLAYER_CONFIG.ROTATION_SPEED * rotationProgress * deltaTime

    // Apply rotation
    this.gameState.targetRotationY = this.camera.rotation.y + rotationDiff * rotationSpeed

    if (distance > 0.1) {
      // Time-based movement speed
      const movementProgress = Math.min(elapsedTime / PLAYER_CONFIG.MOVEMENT_ACCELERATION_DURATION, 1)
      const easeInOutQuad =
        movementProgress < 0.5
          ? 2 * movementProgress * movementProgress
          : 1 - Math.pow(-2 * movementProgress + 2, 2) / 2

      const speed = PLAYER_CONFIG.MOVEMENT_SPEED * easeInOutQuad * deltaTime
      const movement = direction.multiplyScalar(speed)
      const newPosition = this.camera.position.clone().add(movement)

      if (this.gridSystem.isPositionWalkable(newPosition.x, newPosition.z, PLAYER_CONFIG.RADIUS)) {
        this.camera.position.copy(newPosition)
      } else {
        this.gameState.currentPath.shift()
      }
    } else {
      this.gameState.currentPath.shift()
      if (this.gameState.currentPath.length === 0) {
        this.gameState.isMoving = false
      }
    }
  }

  private updateDirectMovement(deltaTime: number): void {
    const controls = this.inputManager.getMovementControls()
    this.gameState.velocity.set(0, 0, 0)

    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    const forward = direction.clone()
    const right = new THREE.Vector3(-direction.z, 0, direction.x)

    const BASE_SPEED = PLAYER_CONFIG.MOVEMENT_SPEED
    const speed = BASE_SPEED * deltaTime

    // 조이스틱 컨트롤
    if (controls.joystickVector && (controls.joystickVector.x !== 0 || controls.joystickVector.y !== 0)) {
      const forwardSpeed = -controls.joystickVector.y * speed
      const rightSpeed = controls.joystickVector.x * speed

      this.gameState.velocity.add(forward.clone().multiplyScalar(forwardSpeed))
      this.gameState.velocity.add(right.clone().multiplyScalar(rightSpeed))
    }
    // 키보드 컨트롤
    else if (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight) {
      if (controls.moveForward) this.gameState.velocity.add(forward.clone().multiplyScalar(speed))
      if (controls.moveBackward) this.gameState.velocity.sub(forward.clone().multiplyScalar(speed))
      if (controls.moveLeft) this.gameState.velocity.sub(right.clone().multiplyScalar(speed))
      if (controls.moveRight) this.gameState.velocity.add(right.clone().multiplyScalar(speed))
    }

    // 대각선 이동 시 속도 정규화
    if (this.gameState.velocity.length() > speed) {
      this.gameState.velocity.normalize().multiplyScalar(speed)
    }

    const nextPosition = this.camera.position.clone().add(this.gameState.velocity)
    if (this.gridSystem.isPositionWalkable(nextPosition.x, nextPosition.z, PLAYER_CONFIG.RADIUS)) {
      this.camera.position.add(this.gameState.velocity)
    }
  }

  public handleRotation(deltaRotation: number): void {
    this.gameState.targetRotationY -= deltaRotation
  }

  public updateRotation(): void {
    this.camera.rotation.y = this.gameState.targetRotationY
  }
}
