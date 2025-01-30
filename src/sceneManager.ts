import * as THREE from "three";
import { WALL_CONFIG, ARTWORK_CONFIG } from "./constants";

export class SceneManager {
  private scene: THREE.Scene;
  private floor: THREE.Mesh = new THREE.Mesh();
  private walls: THREE.Mesh[] = [];
  private targetIndicator: THREE.Mesh;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.setupLighting();
    this.setupBasicStructure();
    this.setupWalls();
    this.setupArtwork();
    this.targetIndicator = this.createTargetIndicator();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
  }

  private setupBasicStructure(): void {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.scene.add(this.floor);

    // Ceiling
    const ceiling = this.floor.clone();
    ceiling.position.y = 4;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);
  }

  private createWall(
    x: number,
    z: number,
    width: number,
    depth: number,
    height = WALL_CONFIG.DEFAULT_HEIGHT
  ): THREE.Mesh {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: WALL_CONFIG.COLOR,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, height / 2, z);
    this.scene.add(wall);
    this.walls.push(wall);
    return wall;
  }

  private setupWalls(): void {
    // Gallery wall structure
    this.createWall(-15, 0, WALL_CONFIG.THICKNESS, 30); // Left wall
    this.createWall(15, 0, WALL_CONFIG.THICKNESS, 30); // Right wall
    this.createWall(0, -15, 30, WALL_CONFIG.THICKNESS); // Front wall
    this.createWall(0, 15, 30, WALL_CONFIG.THICKNESS); // Back wall
    this.createWall(-7.5, -5, 15, WALL_CONFIG.THICKNESS); // Horizontal wall 1
    this.createWall(7.5, 5, 15, WALL_CONFIG.THICKNESS); // Horizontal wall 2
    this.createWall(-5, 0, WALL_CONFIG.THICKNESS, 10); // Vertical wall 1
    this.createWall(5, 0, WALL_CONFIG.THICKNESS, 10); // Vertical wall 2
  }

  private addArtwork(
    x: number,
    z: number,
    wallDirection: "front" | "back" | "left" | "right"
  ): void {
    const artGeometry = new THREE.PlaneGeometry(
      ARTWORK_CONFIG.WIDTH,
      ARTWORK_CONFIG.HEIGHT
    );
    const artMaterial = new THREE.MeshPhongMaterial({
      color: ARTWORK_CONFIG.COLOR,
      side: THREE.DoubleSide,
    });
    const art = new THREE.Mesh(artGeometry, artMaterial);

    switch (wallDirection) {
      case "front":
        art.position.set(
          x,
          ARTWORK_CONFIG.VERTICAL_POSITION,
          z + ARTWORK_CONFIG.WALL_OFFSET
        );
        art.rotation.y = 0;
        break;
      case "back":
        art.position.set(
          x,
          ARTWORK_CONFIG.VERTICAL_POSITION,
          z - ARTWORK_CONFIG.WALL_OFFSET
        );
        art.rotation.y = Math.PI;
        break;
      case "left":
        art.position.set(
          x - ARTWORK_CONFIG.WALL_OFFSET,
          ARTWORK_CONFIG.VERTICAL_POSITION,
          z
        );
        art.rotation.y = Math.PI / 2;
        break;
      case "right":
        art.position.set(
          x + ARTWORK_CONFIG.WALL_OFFSET,
          ARTWORK_CONFIG.VERTICAL_POSITION,
          z
        );
        art.rotation.y = -Math.PI / 2;
        break;
    }

    this.scene.add(art);
  }

  private setupArtwork(): void {
    // Place artwork on walls
    this.addArtwork(-14.8, -10, "left");
    this.addArtwork(-14.8, -5, "left");
    this.addArtwork(-14.8, 0, "left");
    this.addArtwork(-14.8, 5, "left");
    this.addArtwork(14.8, -10, "right");
    this.addArtwork(14.8, -5, "right");
    this.addArtwork(14.8, 0, "right");
    this.addArtwork(14.8, 5, "right");
    this.addArtwork(-5, -14.8, "front");
    this.addArtwork(5, -14.8, "front");
    this.addArtwork(-5, 14.8, "back");
    this.addArtwork(5, 14.8, "back");
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

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getFloor(): THREE.Mesh {
    return this.floor;
  }

  public getWalls(): THREE.Mesh[] {
    return this.walls;
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
