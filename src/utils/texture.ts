import * as THREE from 'three'

export class TextureUtils {
  static async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        texture => resolve(texture),
        undefined,
        error => reject(error),
      )
    })
  }

  static setupWallTexture(texture: THREE.Texture, repeatCount: number = 2): void {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeatCount, repeatCount)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
  }
}
