import * as THREE from 'three'

import { PLAYER_CONFIG } from '@/constants/game'

export class RendererManager {
  private renderer!: THREE.WebGLRenderer
  private camera!: THREE.PerspectiveCamera

  constructor() {
    this.setupRenderer()
    this.setupCamera()
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

  public handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }
}
