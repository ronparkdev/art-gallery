// src/scene/SceneManager.ts
import * as THREE from 'three'

import { GALLERY_CONFIG } from '@/constants/gallery'
import { DecorationUtils } from '@/utils/decoration'
import { GeometryUtils } from '@/utils/geometry'
import { LightingUtils } from '@/utils/lighting'
import { MaterialUtils } from '@/utils/material'
import { TextureUtils } from '@/utils/texture'

export class SceneManager {
  private scene: THREE.Scene
  private floor!: THREE.Group
  private walls: THREE.Mesh[] = []
  private artworks: THREE.Group[] = []
  private targetIndicator!: THREE.Mesh
  private wallTexture!: THREE.Texture

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    // Initialize wall texture
    this.setupEnhancedLighting()
    this.setupLuxuryStructure()
    this.setupWalls()
    this.setupArtwork()
    this.setupDecorations()
    this.targetIndicator = this.createTargetIndicator()
  }

  private setupEnhancedLighting(): void {
    LightingUtils.setupBasicLighting(this.scene, GALLERY_CONFIG)
    this.setupSpotLights()
  }

  private setupSpotLights(): void {
    const spotLightPositions = [
      { x: -14.8, y: 4, z: -10 },
      { x: -14.8, y: 4, z: -5 },
      { x: -14.8, y: 4, z: 0 },
      { x: -14.8, y: 4, z: 5 },
      { x: 14.8, y: 4, z: -10 },
      { x: 14.8, y: 4, z: -5 },
      { x: 14.8, y: 4, z: 0 },
      { x: 14.8, y: 4, z: 5 },
    ]

    spotLightPositions.forEach(pos => {
      const spotLight = LightingUtils.createSpotLight(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        GALLERY_CONFIG.LIGHTING.SPOT_INTENSITY,
        GALLERY_CONFIG.LIGHTING.SPOT_ANGLE,
        GALLERY_CONFIG.LIGHTING.SPOT_PENUMBRA,
      )

      // Add target
      const targetObject = new THREE.Object3D()
      targetObject.position.set(pos.x * 0.5, 0, pos.z)
      this.scene.add(targetObject)
      spotLight.target = targetObject

      this.scene.add(spotLight)
    })
  }

  private async setupLuxuryStructure(): Promise<void> {
    this.floor = await this.createMarbleFloor()
    this.scene.add(this.floor)
    this.createCeilingGrid()
  }

  private async createMarbleFloor(): Promise<THREE.Group> {
    const floorGroup = new THREE.Group()
    const tileSize = GALLERY_CONFIG.FLOOR.TILE_SIZE
    const tilesPerSide = 30 / tileSize

    try {
      const marbleTexture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}textures/floor.jpg`)
      marbleTexture.wrapS = THREE.RepeatWrapping
      marbleTexture.wrapT = THREE.RepeatWrapping
      marbleTexture.repeat.set(1, 1)

      for (let x = 0; x < tilesPerSide; x++) {
        for (let z = 0; z < tilesPerSide; z++) {
          const tileGeometry = new THREE.PlaneGeometry(tileSize, tileSize)
          const tileMaterial = MaterialUtils.createMarbleMaterial(marbleTexture)
          const tile = new THREE.Mesh(tileGeometry, tileMaterial)

          tile.rotation.x = -Math.PI / 2
          tile.position.set(
            (x - tilesPerSide / 2) * tileSize + tileSize / 2,
            0,
            (z - tilesPerSide / 2) * tileSize + tileSize / 2,
          )

          floorGroup.add(tile)
        }
      }
    } catch (error) {
      console.error('Failed to load marble texture:', error)
    }

    return floorGroup
  }

  private createCeilingGrid(): void {
    const gridSize = 3
    const totalWidth = 30
    const totalSegments = totalWidth / gridSize
    const ceilingHeight = 2

    const ceilingGroup = new THREE.Group()

    // Frame materials
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0xdedede })
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30,
    })

    // Create panels
    for (let x = 0; x < totalSegments; x++) {
      for (let z = 0; z < totalSegments; z++) {
        const panel = this.createCeilingPanel(gridSize, panelMaterial, x, z, totalSegments, ceilingHeight)
        ceilingGroup.add(panel)
      }
    }

    // Create frames
    this.createCeilingFrames(ceilingGroup, totalSegments, gridSize, totalWidth, ceilingHeight, frameMaterial)

    this.scene.add(ceilingGroup)
  }

  private createCeilingPanel(
    gridSize: number,
    material: THREE.Material,
    x: number,
    z: number,
    totalSegments: number,
    ceilingHeight: number,
  ): THREE.Mesh {
    const panelGeometry = new THREE.PlaneGeometry(gridSize - 0.2, gridSize - 0.2)
    const panel = new THREE.Mesh(panelGeometry, material)

    panel.position.set(
      (x - totalSegments / 2) * gridSize + gridSize / 2,
      GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2,
      (z - totalSegments / 2) * gridSize + gridSize / 2,
    )
    panel.rotation.x = Math.PI / 2

    return panel
  }

  private createCeilingFrames(
    group: THREE.Group,
    totalSegments: number,
    gridSize: number,
    totalWidth: number,
    ceilingHeight: number,
    material: THREE.Material,
  ): void {
    for (let i = 0; i <= totalSegments; i++) {
      const horizontalFrame = new THREE.Mesh(new THREE.BoxGeometry(totalWidth, ceilingHeight, 0.4), material)
      horizontalFrame.position.set(
        0,
        GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2,
        (i - totalSegments / 2) * gridSize,
      )
      group.add(horizontalFrame)

      const verticalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, ceilingHeight, totalWidth), material)
      verticalFrame.position.set((i - totalSegments / 2) * gridSize, GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2, 0)
      group.add(verticalFrame)
    }
  }

  private async setupWalls(): Promise<void> {
    try {
      this.wallTexture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}textures/wall.jpg`)
      TextureUtils.setupWallTexture(this.wallTexture)
    } catch (error) {
      console.error('Failed to load wall texture:', error)
    }

    // Gallery wall structure
    this.createWall(-15, 0, GALLERY_CONFIG.WALL.THICKNESS, 30) // Left wall
    this.createWall(15, 0, GALLERY_CONFIG.WALL.THICKNESS, 30) // Right wall
    this.createWall(0, -15, 30, GALLERY_CONFIG.WALL.THICKNESS) // Front wall
    this.createWall(0, 15, 30, GALLERY_CONFIG.WALL.THICKNESS) // Back wall

    // Inner walls
    this.createWall(-7.5, -5, 15, GALLERY_CONFIG.WALL.THICKNESS) // Horizontal wall 1
    this.createWall(7.5, 5, 15, GALLERY_CONFIG.WALL.THICKNESS) // Horizontal wall 2
    this.createWall(-5, 0, GALLERY_CONFIG.WALL.THICKNESS, 10) // Vertical wall 1
    this.createWall(5, 0, GALLERY_CONFIG.WALL.THICKNESS, 10) // Vertical wall 2
  }

  private createWall(
    x: number,
    z: number,
    width1: number,
    width2: number,
    height = GALLERY_CONFIG.WALL.HEIGHT,
  ): THREE.Mesh {
    const wallGeometry = new THREE.BoxGeometry(width1, height, width2)
    GeometryUtils.optimizeUVMapping(wallGeometry, width1, height, width2)

    const wallMaterial = MaterialUtils.createWallMaterial(this.wallTexture)
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)

    wall.position.set(x, height / 2, z)
    wall.castShadow = true
    wall.receiveShadow = true

    this.scene.add(wall)
    this.walls.push(wall)

    return wall
  }

  private setupArtwork(): void {
    const artLocations = [
      { x: -5, z: -14.8, direction: 'front', imgPath: 'textures/art1.jpg' },
      { x: 5, z: -14.8, direction: 'front', imgPath: 'textures/art2.jpg' },
      { x: -5, z: 14.8, direction: 'back', imgPath: 'textures/art3.jpg' },
      { x: 5, z: 14.8, direction: 'back', imgPath: 'textures/art1.jpg' },
    ]

    artLocations.forEach(loc => {
      this.addArtwork(loc.x, loc.z, loc.direction as 'front' | 'back' | 'left' | 'right', loc.imgPath)
    })
  }

  private async addArtwork(
    x: number,
    z: number,
    wallDirection: 'front' | 'back' | 'left' | 'right',
    imgPath: string,
  ): Promise<void> {
    const artworkGroup = new THREE.Group()

    // Frame creation
    const frameGeometry = new THREE.BoxGeometry(
      GALLERY_CONFIG.ARTWORK.WIDTH + 0.2,
      GALLERY_CONFIG.ARTWORK.HEIGHT + 0.2,
      0.1,
    )
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: GALLERY_CONFIG.ARTWORK.FRAME_COLOR,
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)

    // Canvas creation
    const canvasGeometry = new THREE.PlaneGeometry(1, 1)
    const canvasMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    })
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial)
    canvas.position.z = 0.051

    try {
      const texture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}${imgPath}`)
      canvasMaterial.map = texture
      canvasMaterial.needsUpdate = true

      canvasGeometry.scale(GALLERY_CONFIG.ARTWORK.WIDTH, GALLERY_CONFIG.ARTWORK.HEIGHT, 1)
    } catch (error) {
      console.error('Error loading texture:', error)
    }

    artworkGroup.add(frame, canvas)

    const position = new THREE.Vector3(x, GALLERY_CONFIG.ARTWORK.VERTICAL_POSITION, z)

    switch (wallDirection) {
      case 'front':
        position.z += GALLERY_CONFIG.ARTWORK.WALL_OFFSET
        break
      case 'back':
        position.z -= GALLERY_CONFIG.ARTWORK.WALL_OFFSET
        artworkGroup.rotation.y = Math.PI
        break
      case 'left':
        position.x -= GALLERY_CONFIG.ARTWORK.WALL_OFFSET
        artworkGroup.rotation.y = Math.PI / 2
        break
      case 'right':
        position.x += GALLERY_CONFIG.ARTWORK.WALL_OFFSET
        artworkGroup.rotation.y = -Math.PI / 2
        break
    }

    artworkGroup.position.copy(position)
    this.scene.add(artworkGroup)
    this.artworks.push(artworkGroup)
  }

  private setupDecorations(): void {
    this.addBenches()
    this.addInfoSigns()
  }

  private addBenches(): void {
    const benchPositions = [
      { x: 0, z: -10 },
      { x: 0, z: 10 },
      { x: -10, z: 0 },
      { x: 10, z: 0 },
    ]

    benchPositions.forEach(pos => {
      const bench = DecorationUtils.createBench()
      bench.position.set(pos.x, 0.3, pos.z)
      this.scene.add(bench)
    })
  }

  private addInfoSigns(): void {
    const signPositions = [
      { x: -13, z: -13 },
      { x: 13, z: -13 },
      { x: -13, z: 13 },
      { x: 13, z: 13 },
    ]

    signPositions.forEach(pos => {
      const sign = DecorationUtils.createInfoSign()
      sign.position.set(pos.x, 0, pos.z)
      this.scene.add(sign)
    })
  }

  private createTargetIndicator(): THREE.Mesh {
    const indicatorGeometry = new THREE.RingGeometry(0.3, 0.4, 32)
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    indicator.rotation.x = -Math.PI / 2
    indicator.visible = false
    this.scene.add(indicator)
    return indicator
  }

  // Public methods
  public getScene(): THREE.Scene {
    return this.scene
  }

  public getFloor(): THREE.Group {
    return this.floor
  }

  public getWalls(): THREE.Mesh[] {
    return this.walls
  }

  public getArtworks(): THREE.Group[] {
    return this.artworks
  }

  public getTargetIndicator(): THREE.Mesh {
    return this.targetIndicator
  }

  public updateTargetIndicator(position: THREE.Vector3 | null): void {
    if (position) {
      this.targetIndicator.position.set(position.x, 0.01, position.z)
      this.targetIndicator.visible = true
    } else {
      this.targetIndicator.visible = false
    }
  }
}
