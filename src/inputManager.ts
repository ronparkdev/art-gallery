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
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
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
      // 포인터가 락된 상태에서는 movementX/Y 사용
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

    // Show target indicator only when not in fullscreen and not dragging (or drag just started)
    if (
      !this.gameState.isFullscreen &&
      (!this.dragState.isDragging ||
        this.dragState.dragDistance < DRAG_THRESHOLD)
    ) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
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

  public getMovementControls(): MovementControls {
    return this.controls;
  }

  public getDragState(): DragState {
    return this.dragState;
  }
}
