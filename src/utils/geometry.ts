import * as THREE from 'three'

export class GeometryUtils {
  static optimizeUVMapping(
    geometry: THREE.BoxGeometry,
    width: number,
    height: number,
    depth: number,
    tilingFactor: number = 0.2,
  ): void {
    const uvAttribute = geometry.attributes.uv

    for (let i = 0; i < uvAttribute.count; i++) {
      const vertexIndex = Math.floor(i / 4)
      const faceIndex = Math.floor(vertexIndex)

      let u = uvAttribute.getX(i)
      let v = uvAttribute.getY(i)

      if (faceIndex < 2) {
        u *= depth
        v *= height
      } else if (faceIndex < 4) {
        u *= width
        v *= depth
      } else {
        u *= width
        v *= height
      }

      u *= tilingFactor
      v *= tilingFactor

      uvAttribute.setXY(i, u, v)
    }

    // Second UV set for aoMap
    geometry.setAttribute('uv2', geometry.attributes.uv.clone())
  }
}
