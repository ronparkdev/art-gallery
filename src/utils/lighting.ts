import * as THREE from 'three'

export class LightingUtils {
  static createSpotLight(position: THREE.Vector3, intensity: number, angle: number, penumbra: number): THREE.SpotLight {
    const spotLight = new THREE.SpotLight(0xffffff, intensity, 300, angle, penumbra)
    spotLight.position.copy(position)

    // Shadow settings
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024

    return spotLight
  }

  static setupBasicLighting(scene: THREE.Scene, config: any): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, config.LIGHTING.AMBIENT_INTENSITY)
    scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf6e3cc, 3)
    scene.add(hemisphereLight)
  }
}
