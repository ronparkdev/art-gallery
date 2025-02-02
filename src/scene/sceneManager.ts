import * as THREE from 'three'

import { SCENE_STRUCTURE } from '@/constants/sceneStructure'
import { GeometryUtils } from '@/utils/geometry'
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
  }

  public async initializeScene(): Promise<void> {
    try {
      await this.loadTextures()
      this.setupLighting()
      await this.setupFloor()
      this.setupWalls()
      this.setupCeiling()
      this.setupArtworks()
      this.setupBenches()
      this.setupTargetIndicator()
    } catch (error) {
      console.error('Error initializing scene:', error)
    }
  }

  private async loadTextures(): Promise<void> {
    try {
      this.wallTexture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}textures/wall.jpg`)
      TextureUtils.setupWallTexture(this.wallTexture)
    } catch (error) {
      console.error('Failed to load wall texture:', error)
    }
  }

  private setupLighting(): void {
    // 기본 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf6e3cc, 3)
    this.scene.add(hemisphereLight)

    // 스폿라이트 설정
    const spotLight = new THREE.SpotLight(0xffffff, 1.2)
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    this.scene.add(spotLight)
  }

  private async setupFloor(): Promise<void> {
    this.floor = new THREE.Group()
    const { SIZE, DIVISIONS } = SCENE_STRUCTURE.FLOOR.GRID

    try {
      const marbleTexture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}textures/floor.jpg`)
      marbleTexture.wrapS = THREE.RepeatWrapping
      marbleTexture.wrapT = THREE.RepeatWrapping
      marbleTexture.repeat.set(1, 1)

      for (let x = -DIVISIONS; x < DIVISIONS; x++) {
        for (let z = -DIVISIONS; z < DIVISIONS; z++) {
          const tileGeometry = new THREE.PlaneGeometry(SIZE, SIZE)
          const tileMaterial = MaterialUtils.createMarbleMaterial(marbleTexture)
          const tile = new THREE.Mesh(tileGeometry, tileMaterial)

          tile.rotation.x = -Math.PI / 2
          tile.position.set(x * SIZE + SIZE / 2, 0, z * SIZE + SIZE / 2)

          this.floor.add(tile)
        }
      }
      this.scene.add(this.floor)
    } catch (error) {
      console.error('Failed to setup floor:', error)
    }
  }

  private setupWalls(): void {
    // 외벽 생성
    SCENE_STRUCTURE.WALLS.OUTER.forEach(wall => {
      this.createWall(
        wall.position.x,
        wall.position.z,
        wall.dimensions.width,
        wall.dimensions.length,
        SCENE_STRUCTURE.SPACE.HEIGHT,
      )
    })

    // 내벽 생성
    SCENE_STRUCTURE.WALLS.INNER.forEach(wall => {
      this.createWall(
        wall.position.x,
        wall.position.z,
        wall.dimensions.width,
        wall.dimensions.length,
        SCENE_STRUCTURE.SPACE.HEIGHT,
      )
    })
  }

  private setupCeiling(): void {
    const { SIZE, PANEL_GAP } = SCENE_STRUCTURE.CEILING.GRID
    const ceilingHeight = SCENE_STRUCTURE.CEILING.HEIGHT
    const spaceWidth = SCENE_STRUCTURE.SPACE.WIDTH
    const totalSegments = Math.ceil(spaceWidth / SIZE)

    const ceilingGroup = new THREE.Group()

    // Panel material
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30,
    })

    // Frame material
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: 0xdedede,
    })

    // 패널 생성
    for (let x = 0; x < totalSegments; x++) {
      for (let z = 0; z < totalSegments; z++) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(SIZE - PANEL_GAP, SIZE - PANEL_GAP), panelMaterial)

        panel.position.set(
          (x - totalSegments / 2) * SIZE + SIZE / 2,
          SCENE_STRUCTURE.SPACE.HEIGHT + ceilingHeight / 2,
          (z - totalSegments / 2) * SIZE + SIZE / 2,
        )
        panel.rotation.x = Math.PI / 2

        ceilingGroup.add(panel)
      }
    }

    // 수평 격자 프레임 생성
    for (let i = 0; i <= totalSegments; i++) {
      const horizontalFrame = new THREE.Mesh(new THREE.BoxGeometry(spaceWidth, ceilingHeight, 0.4), frameMaterial)
      horizontalFrame.position.set(0, SCENE_STRUCTURE.SPACE.HEIGHT + ceilingHeight / 2, (i - totalSegments / 2) * SIZE)
      ceilingGroup.add(horizontalFrame)
    }

    // 수직 격자 프레임 생성
    for (let i = 0; i <= totalSegments; i++) {
      const verticalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, ceilingHeight, spaceWidth), frameMaterial)
      verticalFrame.position.set((i - totalSegments / 2) * SIZE, SCENE_STRUCTURE.SPACE.HEIGHT + ceilingHeight / 2, 0)
      ceilingGroup.add(verticalFrame)
    }

    this.scene.add(ceilingGroup)
  }

  private async setupArtworks(): Promise<void> {
    const { ITEMS, DIMENSIONS, DISPLAY_HEIGHT } = SCENE_STRUCTURE.ARTWORKS

    // 기본 캔버스 재질 (회색)
    const defaultCanvasMaterial = new THREE.MeshPhongMaterial({
      color: 0xefefef,
      side: THREE.DoubleSide,
    })

    // 프레임 재질
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
    })

    for (const artwork of ITEMS) {
      const artworkGroup = new THREE.Group()

      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(DIMENSIONS.WIDTH + 0.2, DIMENSIONS.HEIGHT + 0.2, 0.1),
        frameMaterial,
      )

      // Canvas - 기본적으로 회색으로 초기화
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(DIMENSIONS.WIDTH, DIMENSIONS.HEIGHT),
        defaultCanvasMaterial.clone(), // 각 캔버스마다 새로운 재질 인스턴스 사용
      )
      canvas.position.z = 0.051

      artworkGroup.add(frame, canvas)

      // Position and rotate artwork
      artworkGroup.position.set(artwork.position.x, DISPLAY_HEIGHT, artwork.position.z)

      // Set rotation based on direction
      switch (artwork.direction) {
        case 'front':
          artworkGroup.position.z += DIMENSIONS.WALL_OFFSET
          break
        case 'back':
          artworkGroup.position.z -= DIMENSIONS.WALL_OFFSET
          artworkGroup.rotation.y = Math.PI
          break
        case 'left':
          artworkGroup.position.x += DIMENSIONS.WALL_OFFSET
          artworkGroup.rotation.y = Math.PI / 2
          break
        case 'right':
          artworkGroup.position.x -= DIMENSIONS.WALL_OFFSET
          artworkGroup.rotation.y = -Math.PI / 2
      }

      this.scene.add(artworkGroup)
      this.artworks.push(artworkGroup)

      void (async () => {
        // 텍스처 로딩 시도
        try {
          const texture = await TextureUtils.loadTexture(`${import.meta.env.BASE_URL}${artwork.imageUrl}`)
          const texturedMaterial = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
          })
          canvas.material = texturedMaterial
        } catch (error) {
          console.warn(`Failed to load artwork texture: ${artwork.imageUrl}`, error)
          // 로딩 실패 시 기본 회색 재질 유지
        }
      })()
    }
  }

  private setupBenches(): void {
    const { ITEMS, DIMENSIONS } = SCENE_STRUCTURE.BENCHES

    ITEMS.forEach(bench => {
      const benchGroup = new THREE.Group()

      // Create seat
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(DIMENSIONS.WIDTH, DIMENSIONS.SEAT_HEIGHT, DIMENSIONS.DEPTH),
        new THREE.MeshPhongMaterial({ color: 0x4a4a4a }),
      )
      seat.position.y = DIMENSIONS.HEIGHT - DIMENSIONS.SEAT_HEIGHT / 2

      // Create legs
      const legGeometry = new THREE.BoxGeometry(0.1, DIMENSIONS.HEIGHT, DIMENSIONS.DEPTH)
      const legMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a })

      const leg1 = new THREE.Mesh(legGeometry, legMaterial)
      const leg2 = new THREE.Mesh(legGeometry, legMaterial)

      leg1.position.set(-DIMENSIONS.WIDTH / 2 + 0.1, DIMENSIONS.HEIGHT / 2, 0)
      leg2.position.set(DIMENSIONS.WIDTH / 2 - 0.1, DIMENSIONS.HEIGHT / 2, 0)

      benchGroup.add(seat, leg1, leg2)
      benchGroup.position.set(bench.position.x, 0, bench.position.z)
      benchGroup.rotation.y = bench.rotation

      this.scene.add(benchGroup)
    })
  }

  private createWall(x: number, z: number, width: number, length: number, height: number): THREE.Mesh {
    const wallGeometry = new THREE.BoxGeometry(width, height, length)
    GeometryUtils.optimizeUVMapping(wallGeometry, width, height, length)

    const wallMaterial = MaterialUtils.createWallMaterial(this.wallTexture)
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)

    wall.position.set(x, height / 2, z)
    wall.castShadow = true
    wall.receiveShadow = true

    this.scene.add(wall)
    this.walls.push(wall)

    return wall
  }

  private setupTargetIndicator(): void {
    const indicatorGeometry = new THREE.RingGeometry(0.3, 0.4, 32)
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })

    this.targetIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    this.targetIndicator.rotation.x = -Math.PI / 2
    this.targetIndicator.visible = false
    this.scene.add(this.targetIndicator)
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

  public updateTargetIndicator(position: THREE.Vector3 | null): void {
    if (position) {
      this.targetIndicator.position.set(position.x, 0.01, position.z)
      this.targetIndicator.visible = true
    } else {
      this.targetIndicator.visible = false
    }
  }
}
