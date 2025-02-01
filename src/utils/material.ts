import * as THREE from 'three'

export class MaterialUtils {
  static createWallMaterial(texture: THREE.Texture): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      metalness: 0.0,
      roughness: 1.0,
      envMapIntensity: 1.0,
      normalScale: new THREE.Vector2(1, 1),
      aoMapIntensity: 1.0,
    })
  }

  static createMarbleMaterial(texture: THREE.Texture): THREE.MeshPhongMaterial {
    return new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 100,
    })
  }
}
