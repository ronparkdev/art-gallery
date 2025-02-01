import * as THREE from 'three'

export class DecorationUtils {
  static createBench(): THREE.Group {
    const benchGroup = new THREE.Group()
    const material = new THREE.MeshPhongMaterial({ color: 0x4a4a4a })

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), material)
    seat.position.y = 0.15

    // Legs
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.6), material)
    const leg2 = leg1.clone()
    leg1.position.set(-0.9, 0, 0)
    leg2.position.set(0.9, 0, 0)

    benchGroup.add(seat, leg1, leg2)
    return benchGroup
  }

  static createInfoSign(): THREE.Group {
    const signGroup = new THREE.Group()

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.5),
      new THREE.MeshPhongMaterial({ color: 0x4a4a4a }),
    )
    pole.position.y = 0.75

    // Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), new THREE.MeshPhongMaterial({ color: 0x2c3e50 }))
    sign.position.y = 1.3

    signGroup.add(pole, sign)
    return signGroup
  }
}
