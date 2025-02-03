import * as THREE from 'three'

import { DRAG_THRESHOLD, CLICK_TIMEOUT } from '@/constants/game'
import { SceneManager } from '@/scene/sceneManager'
import { MovementControls, DragState, GameState } from '@/types'
import { VirtualJoystick } from '@/utils/virtualJoystick'

export class InputManager {
  private controls: MovementControls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
  }

  private joystickVector = {
    x: 0,
    y: 0,
  }

  private dragState: DragState = {
    isDragging: false,
    dragStartPosition: { x: 0, y: 0 },
    dragStartTime: 0,
    previousMousePosition: { x: 0, y: 0 },
    dragDistance: 0,
  }

  private isMobile: boolean
  private joystick: VirtualJoystick | null = null
  private rotationTouchId: number | null = null
  private lastTouchX: number = 0
  private joystickRect: DOMRect | null = null

  constructor(
    private camera: THREE.Camera,
    private sceneManager: SceneManager,
    private onMove: (newPosition: THREE.Vector3) => void,
    private onRotate: (rotation: number) => void,
    private gameState: GameState,
  ) {
    this.isMobile = this.checkIfMobile()
    this.setupInputHandlers()
  }

  private checkIfMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  private setupInputHandlers(): void {
    if (this.isMobile) {
      this.setupMobileControls()
    } else {
      this.setupDesktopControls()
    }

    window.addEventListener('resize', () => {
      if (this.isMobile) {
        this.updateJoystickVisibility()
      }
    })
  }

  private setupMobileControls(): void {
    // 조이스틱 초기화
    this.joystick = new VirtualJoystick((x: number, y: number) => {
      this.joystickVector.x = x
      this.joystickVector.y = y

      this.controls.moveForward = y < -0.1
      this.controls.moveBackward = y > 0.1
      this.controls.moveLeft = x < -0.1
      this.controls.moveRight = x > 0.1
    })

    this.updateJoystickVisibility()

    // 터치 이벤트 핸들링
    document.addEventListener('touchstart', (e: TouchEvent) => {
      if (this.joystick) {
        const joystickElement = this.joystick.getElement()
        this.joystickRect = joystickElement.getBoundingClientRect()
      }

      // 새로운 터치가 조이스틱 영역에 있는지 확인
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]
        if (!this.isInJoystickArea(touch.clientX, touch.clientY)) {
          // 조이스틱 영역 밖의 터치이고, 아직 회전 터치가 없다면
          if (this.rotationTouchId === null) {
            this.rotationTouchId = touch.identifier
            this.lastTouchX = touch.clientX
          }
        }
      }
    })

    document.addEventListener('touchmove', (e: TouchEvent) => {
      // 현재의 모든 터치를 순회
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]

        // 회전 터치 업데이트
        if (touch.identifier === this.rotationTouchId) {
          const deltaX = touch.clientX - this.lastTouchX
          this.onRotate(deltaX * -0.01)
          this.lastTouchX = touch.clientX
        }
      }
    })

    document.addEventListener('touchend', (e: TouchEvent) => {
      // 종료된 터치들 중에 회전 터치가 있는지 확인
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.identifier === this.rotationTouchId) {
          this.rotationTouchId = null
          break
        }
      }
    })

    document.addEventListener('touchcancel', (e: TouchEvent) => {
      // touchend와 동일한 처리
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        if (touch.identifier === this.rotationTouchId) {
          this.rotationTouchId = null
          break
        }
      }
    })
  }

  private isInJoystickArea(x: number, y: number): boolean {
    if (!this.joystickRect) return false

    const padding = 50
    return (
      x >= this.joystickRect.left - padding &&
      x <= this.joystickRect.right + padding &&
      y >= this.joystickRect.top - padding &&
      y <= this.joystickRect.bottom + padding
    )
  }

  private setupDesktopControls(): void {
    // Keyboard controls
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))

    // Mouse controls
    document.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
  }

  private updateJoystickVisibility(): void {
    if (this.joystick) {
      if (this.gameState.isFullscreen) {
        this.joystick.hide()
      } else {
        this.joystick.show()
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controls.moveForward = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.controls.moveBackward = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.controls.moveLeft = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.controls.moveRight = true
        break
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.controls.moveForward = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.controls.moveBackward = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.controls.moveLeft = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.controls.moveRight = false
        break
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.gameState.isFullscreen) {
      this.dragState = {
        isDragging: true,
        dragDistance: 0,
        dragStartTime: Date.now(),
        dragStartPosition: { x: event.clientX, y: event.clientY },
        previousMousePosition: { x: event.clientX, y: event.clientY },
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const dragDuration = Date.now() - this.dragState.dragStartTime

    if (this.dragState.isDragging && this.dragState.dragDistance < DRAG_THRESHOLD && dragDuration < CLICK_TIMEOUT) {
      this.handleClick(event)
    }

    this.dragState.isDragging = false
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.gameState.isFullscreen && this.gameState.isPointerLocked) {
      this.onRotate((event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0) * 0.002)
    } else if (this.gameState.isFullscreen) {
      this.onRotate(-(event.clientX / window.innerWidth - 0.5) * Math.PI * 2)
    } else if (this.dragState.isDragging) {
      const deltaMove = {
        x: event.clientX - this.dragState.previousMousePosition.x,
        y: event.clientY - this.dragState.previousMousePosition.y,
      }

      this.dragState.dragDistance += Math.sqrt(deltaMove.x * deltaMove.x + deltaMove.y * deltaMove.y)

      if (this.dragState.dragDistance > DRAG_THRESHOLD) {
        this.onRotate(deltaMove.x * -0.01)
      }

      this.dragState.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    this.updateTargetIndicator(event.clientX, event.clientY)
  }

  private handleClick(event: MouseEvent): void {
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    )

    raycaster.setFromCamera(mouse, this.camera)
    const intersects = raycaster.intersectObject(this.sceneManager.getFloor())

    if (intersects.length > 0) {
      const targetPoint = intersects[0].point
      this.onMove(targetPoint)
    }
  }

  private updateTargetIndicator(clientX: number, clientY: number): void {
    // Show target indicator only when not in fullscreen and not dragging (or drag just started)
    if (!this.gameState.isFullscreen && (!this.dragState.isDragging || this.dragState.dragDistance < DRAG_THRESHOLD)) {
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)

      raycaster.setFromCamera(mouse, this.camera)
      const intersects = raycaster.intersectObject(this.sceneManager.getFloor())

      if (intersects.length > 0) {
        const point = intersects[0].point
        this.sceneManager.updateTargetIndicator(point)
      } else {
        this.sceneManager.updateTargetIndicator(null)
      }
    } else {
      // Hide indicator in fullscreen mode or while dragging
      this.sceneManager.updateTargetIndicator(null)
    }
  }

  public getMovementControls(): MovementControls & { joystickVector?: { x: number; y: number } } {
    return {
      ...this.controls,
      joystickVector: this.joystickVector, // 조이스틱 벡터값도 함께 전달
    }
  }

  public getDragState(): DragState {
    return this.dragState
  }
}
