import * as THREE from "three";

export const GALLERY_CONFIG = {
  WALL: {
    COLOR: 0xf5f5f5, // 따뜻한 화이트
    HEIGHT: 4.5, // 더 높은 천장
    THICKNESS: 0.3,
  },
  FLOOR: {
    TILE_SIZE: 2,
    PRIMARY_COLOR: 0xe8e8e8,
    SECONDARY_COLOR: 0xd8d8d8,
  },
  ARTWORK: {
    WIDTH: 2,
    HEIGHT: 2.5,
    VERTICAL_POSITION: 2,
    WALL_OFFSET: 0.15,
    FRAME_COLOR: 0xffffff,
  },
  LIGHTING: {
    AMBIENT_INTENSITY: 0.4,
    SPOT_INTENSITY: 1.2,
    SPOT_ANGLE: Math.PI / 6,
    SPOT_PENUMBRA: 0.3,
  },
};

export class SceneManager {
  private scene: THREE.Scene;
  private floor!: THREE.Group;
  private walls: THREE.Mesh[] = [];
  private artworks: THREE.Group[] = [];
  private targetIndicator: THREE.Mesh;
  private wallTexture: THREE.Texture;

  constructor() {
    // TextureLoader 인스턴스 생성 및 텍스처 로드
    const textureLoader = new THREE.TextureLoader();
    this.wallTexture = textureLoader.load(
      `${import.meta.env.BASE_URL}textures/wall.jpg`,
      (texture) => {
        // 텍스처 반복 설정
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2); // 텍스처 반복 횟수 조정

        // 텍스처 품질 설정
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
      }
    );

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.setupEnhancedLighting();
    this.setupLuxuryStructure();
    this.setupWalls();
    this.setupArtwork();
    this.setupDecorations();
    this.targetIndicator = this.createTargetIndicator();
  }

  private setupEnhancedLighting(): void {
    // 부드러운 주변광
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      GALLERY_CONFIG.LIGHTING.AMBIENT_INTENSITY
    );
    this.scene.add(ambientLight);

    // 따뜻한 전체 조명
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf6e3cc, 3);
    this.scene.add(hemisphereLight);

    // 작품별 스포트라이트 설정을 위한 기본 설정
    this.setupSpotLights();
  }

  private setupSpotLights(): void {
    // 작품 위치에 따른 스포트라이트 배치
    const spotLightPositions = [
      { x: -14.8, y: 4, z: -10 },
      { x: -14.8, y: 4, z: -5 },
      { x: -14.8, y: 4, z: 0 },
      { x: -14.8, y: 4, z: 5 },
      { x: 14.8, y: 4, z: -10 },
      { x: 14.8, y: 4, z: -5 },
      { x: 14.8, y: 4, z: 0 },
      { x: 14.8, y: 4, z: 5 },
    ];

    spotLightPositions.forEach((pos) => {
      const spotLight = new THREE.SpotLight(
        0xffffff,
        GALLERY_CONFIG.LIGHTING.SPOT_INTENSITY,
        10,
        GALLERY_CONFIG.LIGHTING.SPOT_ANGLE,
        GALLERY_CONFIG.LIGHTING.SPOT_PENUMBRA
      );
      spotLight.position.set(pos.x, pos.y, pos.z);

      // 그림자 설정
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;

      this.scene.add(spotLight);
    });
  }

  private setupLuxuryStructure(): void {
    this.floor = this.createMarbleFloor();
    this.scene.add(this.floor);

    // 천장 그리드 생성
    const gridSize = 3; // 그리드 하나의 크기
    const totalWidth = 30;
    const totalSegments = totalWidth / gridSize;

    // 프레임 재질
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: 0xdedede, // 회색 프레임
    });

    // 패널 재질
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30,
    });

    const ceilingGroup = new THREE.Group();

    const ceilingHeight = 2;

    // 패널 생성
    for (let x = 0; x < totalSegments; x++) {
      for (let z = 0; z < totalSegments; z++) {
        const panelGeometry = new THREE.PlaneGeometry(
          gridSize - 0.2,
          gridSize - 0.2
        );
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);

        panel.position.set(
          (x - totalSegments / 2) * gridSize + gridSize / 2,
          GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2,
          (z - totalSegments / 2) * gridSize + gridSize / 2
        );
        panel.rotation.x = Math.PI / 2;

        ceilingGroup.add(panel);
      }
    }

    // 그리드 프레임 생성
    for (let i = 0; i <= totalSegments; i++) {
      // 가로 프레임
      const horizontalFrame = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth, ceilingHeight, 0.4),
        frameMaterial
      );
      horizontalFrame.position.set(
        0,
        GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2,
        (i - totalSegments / 2) * gridSize
      );
      ceilingGroup.add(horizontalFrame);

      // 세로 프레임
      const verticalFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, ceilingHeight, totalWidth),
        frameMaterial
      );
      verticalFrame.position.set(
        (i - totalSegments / 2) * gridSize,
        GALLERY_CONFIG.WALL.HEIGHT + ceilingHeight / 2,
        0
      );
      ceilingGroup.add(verticalFrame);
    }

    this.scene.add(ceilingGroup);
  }

  private setupWalls(): void {
    // Gallery wall structure
    this.createWall(-15, 0, GALLERY_CONFIG.WALL.THICKNESS, 30); // Left wall
    this.createWall(15, 0, GALLERY_CONFIG.WALL.THICKNESS, 30); // Right wall
    this.createWall(0, -15, 30, GALLERY_CONFIG.WALL.THICKNESS); // Front wall
    this.createWall(0, 15, 30, GALLERY_CONFIG.WALL.THICKNESS); // Back wall

    // Inner walls
    this.createWall(-7.5, -5, 15, GALLERY_CONFIG.WALL.THICKNESS); // Horizontal wall 1
    this.createWall(7.5, 5, 15, GALLERY_CONFIG.WALL.THICKNESS); // Horizontal wall 2
    this.createWall(-5, 0, GALLERY_CONFIG.WALL.THICKNESS, 10); // Vertical wall 1
    this.createWall(5, 0, GALLERY_CONFIG.WALL.THICKNESS, 10); // Vertical wall 2
  }

  private createMarbleFloor(): THREE.Group {
    const floorGroup = new THREE.Group();
    const tileSize = GALLERY_CONFIG.FLOOR.TILE_SIZE;
    const tilesPerSide = 30 / tileSize;

    const textureLoader = new THREE.TextureLoader();
    const marbleTexture = textureLoader.load(
      `${import.meta.env.BASE_URL}textures/floor.jpg`
    );

    marbleTexture.wrapS = THREE.RepeatWrapping;
    marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(1, 1);

    for (let x = 0; x < tilesPerSide; x++) {
      for (let z = 0; z < tilesPerSide; z++) {
        const tileGeometry = new THREE.PlaneGeometry(tileSize, tileSize);
        const tileMaterial = new THREE.MeshPhongMaterial({
          map: marbleTexture,
          shininess: 100,
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(
          (x - tilesPerSide / 2) * tileSize + tileSize / 2,
          0,
          (z - tilesPerSide / 2) * tileSize + tileSize / 2
        );

        floorGroup.add(tile);
      }
    }

    return floorGroup;
  }

  private createWall(
    x: number,
    z: number,
    width1: number,
    width2: number,
    height = GALLERY_CONFIG.WALL.HEIGHT
  ): THREE.Mesh {
    // 벽 geometry 생성
    const wallGeometry = new THREE.BoxGeometry(width1, height, width2);

    // UV 매핑 최적화
    const uvAttribute = wallGeometry.attributes.uv;

    for (let i = 0; i < uvAttribute.count; i++) {
      const vertexIndex = Math.floor(i / 4); // 각 면은 4개의 vertex로 구성
      const faceIndex = Math.floor(vertexIndex); // 어떤 면인지 판단

      let u = uvAttribute.getX(i);
      let v = uvAttribute.getY(i);

      // 면에 따라 다른 스케일 적용
      if (faceIndex < 2) {
        // 앞/뒤 면
        // 높이와 너비 비율 유지
        u *= width2; // 곱하기 사용
        v *= height;
      } else if (faceIndex < 4) {
        // 위/아래 면
        u *= width1;
        v *= width2;
      } else {
        // 좌/우 면
        // 높이와 깊이 비율 유지
        u *= width1; // 곱하기 사용
        v *= height;
      }

      // 텍스쳐 타일링을 위한 스케일 조정
      const TILING_FACTOR = 0.2; // 텍스쳐 반복 횟수 조정
      u *= TILING_FACTOR;
      v *= TILING_FACTOR;

      uvAttribute.setXY(i, u, v);
    }

    // Second UV set for aoMap
    wallGeometry.setAttribute("uv2", wallGeometry.attributes.uv.clone());

    // Material 생성
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: this.wallTexture,
      side: THREE.DoubleSide,

      // PBR 속성
      metalness: 0.0,
      roughness: 1.0,
      envMapIntensity: 1.0,

      // 텍스쳐 강도 조정
      normalScale: new THREE.Vector2(1, 1),
      aoMapIntensity: 1.0,
    });

    // 모든 텍스쳐에 대해 반복 설정
    Object.values([this.wallTexture]).forEach((texture) => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    });

    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, height / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;

    this.scene.add(wall);
    this.walls.push(wall);

    return wall;
  }

  private setupArtwork(): void {
    const artLocations = [
      // { x: -14.8, z: -10, direction: "left", imgPath: "textures/art1.jpg" },
      // { x: -14.8, z: -5, direction: "left", imgPath: "textures/art1.jpg" },
      // { x: -14.8, z: 0, direction: "left", imgPath: "textures/art1.jpg" },
      // { x: -14.8, z: 5, direction: "left", imgPath: "textures/art1.jpg" },
      // { x: 14.8, z: -10, direction: "right", imgPath: "textures/art1.jpg" },
      // { x: 14.8, z: -5, direction: "right", imgPath: "textures/art1.jpg" },
      // { x: 14.8, z: 0, direction: "right", imgPath: "textures/art1.jpg" },
      // { x: 14.8, z: 5, direction: "right" , imgPath: "textures/art1.jpg"},
      { x: -5, z: -14.8, direction: "front", imgPath: "textures/art1.jpg" },
      { x: 5, z: -14.8, direction: "front", imgPath: "textures/art2.jpg" },
      { x: -5, z: 14.8, direction: "back", imgPath: "textures/art3.jpg" },
      { x: 5, z: 14.8, direction: "back", imgPath: "textures/art1.jpg" },
    ];

    artLocations.forEach((loc) => {
      this.addArtwork(
        loc.x,
        loc.z,
        loc.direction as "front" | "back" | "left" | "right",
        loc.imgPath
      );
    });
  }
  // loadTexture 함수 추가
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  private async addArtwork(
    x: number,
    z: number,
    wallDirection: "front" | "back" | "left" | "right",
    imgPath: string
  ): Promise<void> {
    const artworkGroup = new THREE.Group();

    // 프레임 생성
    const frameGeometry = new THREE.BoxGeometry(
      GALLERY_CONFIG.ARTWORK.WIDTH + 0.2,
      GALLERY_CONFIG.ARTWORK.HEIGHT + 0.2,
      0.1
    );
    const frameMaterial = new THREE.MeshPhongMaterial({
      color: GALLERY_CONFIG.ARTWORK.FRAME_COLOR,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);

    // 캔버스 생성
    const canvasGeometry = new THREE.PlaneGeometry(1, 1); // 초기 크기를 1x1로 설정
    const canvasMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, // 흰색으로 설정
      side: THREE.DoubleSide,
    });
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
    canvas.position.z = 0.051;

    // 이미지 텍스처 로드 및 적용
    try {
      const texture = await this.loadTexture(
        `${import.meta.env.BASE_URL}${imgPath}`
      );

      canvasMaterial.map = texture;
      canvasMaterial.needsUpdate = true;

      canvasGeometry.scale(
        GALLERY_CONFIG.ARTWORK.WIDTH,
        GALLERY_CONFIG.ARTWORK.HEIGHT,
        1
      );
    } catch (error) {
      console.error("Error loading texture:", error);
    }

    artworkGroup.add(frame);
    artworkGroup.add(canvas);

    // 위치 및 방향 설정
    const position = new THREE.Vector3(
      x,
      GALLERY_CONFIG.ARTWORK.VERTICAL_POSITION,
      z
    );
    switch (wallDirection) {
      case "front":
        position.z += GALLERY_CONFIG.ARTWORK.WALL_OFFSET;
        break;
      case "back":
        position.z -= GALLERY_CONFIG.ARTWORK.WALL_OFFSET;
        artworkGroup.rotation.y = Math.PI;
        break;
      case "left":
        position.x -= GALLERY_CONFIG.ARTWORK.WALL_OFFSET;
        artworkGroup.rotation.y = Math.PI / 2;
        break;
      case "right":
        position.x += GALLERY_CONFIG.ARTWORK.WALL_OFFSET;
        artworkGroup.rotation.y = -Math.PI / 2;
        break;
    }

    artworkGroup.position.copy(position);
    this.scene.add(artworkGroup);
    this.artworks.push(artworkGroup);
  }

  private setupDecorations(): void {
    // 벤치 추가
    this.addBenches();

    // 안내 표지판 추가
    this.addInfoSigns();
  }

  private addBenches(): void {
    const benchPositions = [
      { x: 0, z: -10 },
      { x: 0, z: 10 },
      { x: -10, z: 0 },
      { x: 10, z: 0 },
    ];

    benchPositions.forEach((pos) => {
      const bench = this.createBench();
      bench.position.set(pos.x, 0.3, pos.z);
      this.scene.add(bench);
    });
  }

  private createBench(): THREE.Group {
    const benchGroup = new THREE.Group();

    // 벤치 좌석
    const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
    const seatMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a,
    });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = 0.15;

    // 벤치 다리
    const legGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.6);
    const leg1 = new THREE.Mesh(legGeometry, seatMaterial);
    const leg2 = new THREE.Mesh(legGeometry, seatMaterial);
    leg1.position.set(-0.9, 0, 0);
    leg2.position.set(0.9, 0, 0);

    benchGroup.add(seat);
    benchGroup.add(leg1);
    benchGroup.add(leg2);

    return benchGroup;
  }

  private addInfoSigns(): void {
    const signPositions = [
      { x: -13, z: -13 },
      { x: 13, z: -13 },
      { x: -13, z: 13 },
      { x: 13, z: 13 },
    ];

    signPositions.forEach((pos) => {
      const sign = this.createInfoSign();
      sign.position.set(pos.x, 0, pos.z);
      this.scene.add(sign);
    });
  }

  private createInfoSign(): THREE.Group {
    const signGroup = new THREE.Group();

    // 표지판 기둥
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
    const poleMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 0.75;

    // 표지판 판
    const signGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    const signMaterial = new THREE.MeshPhongMaterial({
      color: 0x2c3e50,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.y = 1.3;

    signGroup.add(pole);
    signGroup.add(sign);

    return signGroup;
  }

  private createTargetIndicator(): THREE.Mesh {
    const indicatorGeometry = new THREE.RingGeometry(0.3, 0.4, 32);
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.rotation.x = -Math.PI / 2;
    indicator.visible = false;
    this.scene.add(indicator);
    return indicator;
  }

  // 공개 메서드들
  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFloor(): THREE.Group {
    return this.floor;
  }

  public getWalls(): THREE.Mesh[] {
    return this.walls;
  }

  public getArtworks(): THREE.Group[] {
    return this.artworks;
  }

  public getTargetIndicator(): THREE.Mesh {
    return this.targetIndicator;
  }

  public updateTargetIndicator(position: THREE.Vector3 | null): void {
    if (position) {
      this.targetIndicator.position.set(position.x, 0.01, position.z);
      this.targetIndicator.visible = true;
    } else {
      this.targetIndicator.visible = false;
    }
  }
}
