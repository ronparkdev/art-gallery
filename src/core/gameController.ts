import * as THREE from 'three'

import { SceneManager } from '@/scene/sceneManager'
import { GameState } from '@/types'

import { GridSystem } from './gridSystem'
import { InputManager } from './inputManager'
import { MovementManager } from './movementManager'
import { PathFinder } from './pathFinding'
import { RendererManager } from './rendererManager'
import { ViewStateManager } from './viewStateManager'

export class GameController {
  private rendererManager: RendererManager
  private viewStateManager: ViewStateManager
  private movementManager: MovementManager
  private sceneManager: SceneManager
  private gridSystem: GridSystem
  private pathFinder: PathFinder
  private inputManager: InputManager
  private lastFrameTime: number = 0
  private gameState: GameState

  constructor() {
    this.gameState = {
      isFullscreen: false,
      isPointerLocked: false,
      isMoving: false,
      targetRotationY: 0,
      velocity: new THREE.Vector3(),
      moveTarget: new THREE.Vector3(),
      currentPath: [],
    }

    this.rendererManager = new RendererManager()
    this.viewStateManager = new ViewStateManager(this.gameState)
    this.sceneManager = new SceneManager()
    this.gridSystem = new GridSystem()
    this.pathFinder = new PathFinder(this.gridSystem)

    this.inputManager = new InputManager(
      this.rendererManager.getCamera(),
      this.sceneManager,
      (newPosition: THREE.Vector3) => this.movementManager.handleMove(newPosition),
      (rotation: number) => this.movementManager.handleRotation(rotation),
      this.gameState,
    )

    this.movementManager = new MovementManager(
      this.rendererManager.getCamera(),
      this.gameState,
      this.pathFinder,
      this.gridSystem,
      this.inputManager,
    )

    this.setupEventListeners()
    this.animate(performance.now())

    this.sceneManager.initializeScene().then(() => {
      this.gridSystem.initializeGrid(this.sceneManager.getWalls())
    })
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.rendererManager.handleResize())
    document.addEventListener('fullscreenchange', () => this.viewStateManager.handleFullscreenChange())
    document.addEventListener('pointerlockchange', () => this.viewStateManager.handlePointerLockChange())
    this.setupFullscreenButton()
  }

  private setupFullscreenButton(): void {
    const fullscreenBtn = document.getElementById('fullscreen-btn')
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.gameState.isFullscreen = !this.gameState.isFullscreen
        this.viewStateManager.updateFullscreenState()
      })
    }
  }

  private animate = (currentTime: number): void => {
    requestAnimationFrame(this.animate)
    const deltaTime = Math.min(0.1, this.lastFrameTime ? (currentTime - this.lastFrameTime) / 1000 : 1 / 60)
    this.lastFrameTime = currentTime

    this.movementManager.updateMovement(deltaTime)
    this.movementManager.updateRotation()
    this.rendererManager.getRenderer().render(this.sceneManager.getScene(), this.rendererManager.getCamera())
  }
}
