import * as THREE from 'three'

import { PLAYER_CONFIG } from '@/constants/game'
import { SceneManager } from '@/scene/sceneManager'
import { GameState } from '@/types'

import { GridSystem } from './gridSystem'
import { InputManager } from './inputManager'
import { PathFinder } from './pathFinding'

export class GameController {
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private sceneManager: SceneManager
  private gridSystem: GridSystem
  private pathFinder: PathFinder
  private inputManager: InputManager

  private lastFrameTime: number = 0
  private moveStartTime: number = 0

  private gameState: GameState = {
    isFullscreen: false,
    isPointerLocked: false,
    isMoving: false,
    targetRotationY: 0,
    velocity: new THREE.Vector3(),
    moveTarget: new THREE.Vector3(),
    currentPath: [],
  }

  constructor() {
    this.setupRenderer()
    this.setupCamera()
    this.sceneManager = new SceneManager()
    this.gridSystem = new GridSystem()
    this.pathFinder = new PathFinder(this.gridSystem)
    // Initialize input manager with correct parameter order
    this.inputManager = new InputManager(
      this.camera,
      this.sceneManager,
      (newPosition: THREE.Vector3) => this.handleMove(newPosition),
      (rotation: number) => this.handleRotation(rotation),
      this.gameState,
    )

    this.setupEventListeners()
    this.animate(performance.now())

    this.sceneManager.initializeScene().then(() => {
      this.gridSystem.initializeGrid(this.sceneManager.getWalls())
    })
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    document.body.appendChild(this.renderer.domElement)
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, PLAYER_CONFIG.HEIGHT, 13)
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this))
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this))
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this))
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this))
    document.addEventListener('msfullscreenchange', this.handleFullscreenChange.bind(this))

    document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this))
    document.addEventListener('mozpointerlockchange', this.handlePointerLockChange.bind(this))
    document.addEventListener('webkitpointerlockchange', this.handlePointerLockChange.bind(this))

    this.setupFullscreenButton()
  }

  private setupFullscreenButton(): void {
    const fullscreenBtn = document.getElementById('fullscreen-btn')
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.gameState.isFullscreen = !this.gameState.isFullscreen
        this.updateFullscreenState()
      })
    }
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private handleFullscreenChange(): void {
    this.gameState.isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    )

    const fullscreenBtn = document.getElementById('fullscreen-btn')
    if (fullscreenBtn) {
      fullscreenBtn.textContent = this.gameState.isFullscreen ? 'Exit Full View' : 'Full View'
    }

    if (this.gameState.isFullscreen && !this.gameState.isPointerLocked) {
      this.requestPointerLock()
    } else if (!this.gameState.isFullscreen && this.gameState.isPointerLocked) {
      this.exitPointerLock()
    }

    if (!this.gameState.isFullscreen) {
      this.camera.rotation.y = 0
      this.gameState.targetRotationY = 0
    }
  }

  private handlePointerLockChange(): void {
    this.gameState.isPointerLocked = !!(
      document.pointerLockElement === document.documentElement ||
      (document as any).mozPointerLockElement === document.documentElement ||
      (document as any).webkitPointerLockElement === document.documentElement
    )
  }

  private requestPointerLock(): void {
    const element = document.documentElement
    ;(
      element.requestPointerLock ||
      (element as any).mozRequestPointerLock ||
      (element as any).webkitRequestPointerLock
    ).call(element)
  }

  private exitPointerLock(): void {
    ;(document.exitPointerLock || (document as any).mozExitPointerLock || (document as any).webkitExitPointerLock).call(
      document,
    )
  }

  private updateFullscreenState(): void {
    if (this.gameState.isFullscreen) {
      const element = document.documentElement
      ;(
        element.requestFullscreen ||
        (element as any).mozRequestFullScreen ||
        (element as any).webkitRequestFullscreen ||
        (element as any).msRequestFullscreen
      ).call(element)
    } else {
      ;(
        document.exitFullscreen ||
        (document as any).mozCancelFullScreen ||
        (document as any).webkitExitFullscreen ||
        (document as any).msExitFullscreen
      ).call(document)
    }
  }

  private handleMove(targetPoint: THREE.Vector3): void {
    if (!this.gameState.isMoving) {
      this.gameState.moveTarget.copy(targetPoint)
      this.gameState.moveTarget.y = this.camera.position.y

      this.gameState.currentPath = this.pathFinder.findPath(this.camera.position, this.gameState.moveTarget) || []

      if (this.gameState.currentPath.length > 0) {
        this.gameState.isMoving = true
        this.moveStartTime = performance.now() // 움직임 시작 시간 저장
      }
    }
  }

  private handleRotation(deltaRotation: number): void {
    this.gameState.targetRotationY -= deltaRotation
  }

  private updateMovement(deltaTime: number): void {
    if (this.gameState.isMoving && this.gameState.currentPath.length > 0) {
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

    if (!this.gameState.isMoving) {
      const controls = this.inputManager.getMovementControls()
      this.gameState.velocity.set(0, 0, 0)

      if (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight) {
        const direction = new THREE.Vector3()
        this.camera.getWorldDirection(direction)
        const forward = direction.clone()
        const right = new THREE.Vector3(-direction.z, 0, direction.x)

        const BASE_SPEED = PLAYER_CONFIG.MOVEMENT_SPEED
        const speed = BASE_SPEED * deltaTime

        // 조이스틱 벡터값을 사용하여 이동 속도 조절
        if (controls.joystickVector) {
          // 전후 이동
          const forwardSpeed = -controls.joystickVector.y * speed
          this.gameState.velocity.add(forward.multiplyScalar(forwardSpeed))

          // 좌우 이동
          const rightSpeed = controls.joystickVector.x * speed
          this.gameState.velocity.add(right.multiplyScalar(rightSpeed))
        } else {
          // 키보드 컨트롤을 위한 기존 로직 유지
          if (controls.moveForward) this.gameState.velocity.add(forward.multiplyScalar(speed))
          if (controls.moveBackward) this.gameState.velocity.sub(forward.multiplyScalar(speed))
          if (controls.moveLeft) this.gameState.velocity.sub(right.multiplyScalar(speed))
          if (controls.moveRight) this.gameState.velocity.add(right.multiplyScalar(speed))
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
    }
  }

  private updateRotation(): void {
    this.camera.rotation.y = this.gameState.targetRotationY
  }

  private animate = (currentTime: number): void => {
    requestAnimationFrame(this.animate)

    // Calculate delta time in seconds
    const deltaTime = Math.min(0.1, this.lastFrameTime ? (currentTime - this.lastFrameTime) / 1000 : 1 / 60)
    this.lastFrameTime = currentTime

    this.updateMovement(deltaTime)
    this.updateRotation()
    this.renderer.render(this.sceneManager.getScene(), this.camera)
  }
}
