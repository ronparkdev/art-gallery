import * as THREE from "three";
import { MovementControls, DragState, GameState } from "./types";
import { DRAG_THRESHOLD, CLICK_TIMEOUT } from "./constants";
import { SceneManager } from "./sceneManager";

export class InputManager {
  private controls: MovementControls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
  };

  private dragState: DragState = {
    isDragging: false,
    dragStartPosition: { x: 0, y: 0 },
    dragStartTime: 0,
    previousMousePosition: { x: 0, y: 0 },
    dragDistance: 0,
  };

  // 멀티터치 처리를 위한 상태
  private touchState = {
    initialDistance: 0,
    lastTouchRotation: 0,
  };

  constructor(
    private camera: THREE.Camera,
    private sceneManager: SceneManager,
    private onMove: (newPosition: THREE.Vector3) => void,
    private onRotate: (rotation: number) => void,
    private gameState: GameState
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 기존 마우스/키보드 이벤트
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // 터치 이벤트 추가
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });
    document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.controls.moveForward = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.controls.moveBackward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.controls.moveLeft = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.controls.moveRight = true;
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.controls.moveForward = false;
        break;
      case "ArrowDown":
      case "KeyS":
        this.controls.moveBackward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.controls.moveLeft = false;
        break;
      case "ArrowRight":
      case "KeyD":
        this.controls.moveRight = false;
        break;
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
      };
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const dragDuration = Date.now() - this.dragState.dragStartTime;

    if (
      this.dragState.isDragging &&
      this.dragState.dragDistance < DRAG_THRESHOLD &&
      dragDuration < CLICK_TIMEOUT
    ) {
      this.handleClick(event);
    }

    this.dragState.isDragging = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.gameState.isFullscreen && this.gameState.isPointerLocked) {
      this.onRotate(
        (event.movementX ||
          (event as any).mozMovementX ||
          (event as any).webkitMovementX ||
          0) * 0.002
      );
    } else if (this.gameState.isFullscreen) {
      this.onRotate(-(event.clientX / window.innerWidth - 0.5) * Math.PI * 2);
    } else if (this.dragState.isDragging) {
      const deltaMove = {
        x: event.clientX - this.dragState.previousMousePosition.x,
        y: event.clientY - this.dragState.previousMousePosition.y,
      };

      this.dragState.dragDistance += Math.sqrt(
        deltaMove.x * deltaMove.x + deltaMove.y * deltaMove.y
      );

      if (this.dragState.dragDistance > DRAG_THRESHOLD) {
        this.onRotate(deltaMove.x * -0.01);
      }

      this.dragState.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    this.updateTargetIndicator(event.clientX, event.clientY);
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    if (!this.gameState.isFullscreen) {
      const touch = event.touches[0];
      this.dragState = {
        isDragging: true,
        dragDistance: 0,
        dragStartTime: Date.now(),
        dragStartPosition: { x: touch.clientX, y: touch.clientY },
        previousMousePosition: { x: touch.clientX, y: touch.clientY },
      };

      // 멀티터치 상태 저장
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.touchState.initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        this.touchState.lastTouchRotation = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const dragDuration = Date.now() - this.dragState.dragStartTime;

    if (
      this.dragState.isDragging &&
      this.dragState.dragDistance < DRAG_THRESHOLD &&
      dragDuration < CLICK_TIMEOUT
    ) {
      // 터치 끝난 위치로 이동 처리
      const touch = event.changedTouches[0];
      this.handleTouchClick(touch);
    }

    this.dragState.isDragging = false;
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1) {
      // 싱글 터치: 드래그로 회전
      const touch = event.touches[0];

      if (this.gameState.isFullscreen) {
        this.onRotate(-(touch.clientX / window.innerWidth - 0.5) * Math.PI * 2);
      } else if (this.dragState.isDragging) {
        const deltaMove = {
          x: touch.clientX - this.dragState.previousMousePosition.x,
          y: touch.clientY - this.dragState.previousMousePosition.y,
        };

        this.dragState.dragDistance += Math.sqrt(
          deltaMove.x * deltaMove.x + deltaMove.y * deltaMove.y
        );

        if (this.dragState.dragDistance > DRAG_THRESHOLD) {
          this.onRotate(deltaMove.x * -0.01);
        }

        this.dragState.previousMousePosition = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }

      this.updateTargetIndicator(touch.clientX, touch.clientY);
    } else if (event.touches.length === 2) {
      // 멀티터치: 핀치 줌과 회전 처리
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      // 핀치 줌 거리 계산
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // 회전 각도 계산
      const currentRotation = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );

      const rotationDelta = currentRotation - this.touchState.lastTouchRotation;
      this.touchState.lastTouchRotation = currentRotation;

      // 회전 적용
      this.onRotate(rotationDelta);
    }
  }

  private handleTouchClick(touch: Touch): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (touch.clientX / window.innerWidth) * 2 - 1,
      -(touch.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObject(this.sceneManager.getFloor());

    if (intersects.length > 0) {
      const targetPoint = intersects[0].point;
      this.onMove(targetPoint);
    }
  }

  private handleClick(event: MouseEvent): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObject(this.sceneManager.getFloor());

    if (intersects.length > 0) {
      const targetPoint = intersects[0].point;
      this.onMove(targetPoint);
    }
  }

  private updateTargetIndicator(clientX: number, clientY: number): void {
    // Show target indicator only when not in fullscreen and not dragging (or drag just started)
    if (
      !this.gameState.isFullscreen &&
      (!this.dragState.isDragging ||
        this.dragState.dragDistance < DRAG_THRESHOLD)
    ) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(
        this.sceneManager.getFloor()
      );

      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.sceneManager.updateTargetIndicator(point);
      } else {
        this.sceneManager.updateTargetIndicator(null);
      }
    } else {
      // Hide indicator in fullscreen mode or while dragging
      this.sceneManager.updateTargetIndicator(null);
    }
  }

  public getMovementControls(): MovementControls {
    return this.controls;
  }

  public getDragState(): DragState {
    return this.dragState;
  }
}
