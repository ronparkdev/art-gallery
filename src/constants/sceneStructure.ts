// src/constants/sceneStructure.ts

export const SCENE_STRUCTURE = {
  // 주 갤러리 공간 크기
  SPACE: {
    WIDTH: 30,
    LENGTH: 30,
    HEIGHT: 4.5,
  },

  // 벽 구조
  WALLS: {
    // 외벽 (시계방향으로 정의)
    OUTER: [
      {
        position: { x: -15, z: 0 }, // 왼쪽 벽
        dimensions: { width: 0.3, length: 30 },
      },
      {
        position: { x: 0, z: -15 }, // 앞쪽 벽
        dimensions: { width: 30, length: 0.3 },
      },
      {
        position: { x: 15, z: 0 }, // 오른쪽 벽
        dimensions: { width: 0.3, length: 30 },
      },
      {
        position: { x: 0, z: 15 }, // 뒤쪽 벽
        dimensions: { width: 30, length: 0.3 },
      },
    ],
    // 내벽
    INNER: [
      {
        position: { x: -7.5, z: -5 }, // 수평 내벽 1
        dimensions: { width: 15, length: 0.3 },
      },
      {
        position: { x: 7.5, z: 5 }, // 수평 내벽 2
        dimensions: { width: 15, length: 0.3 },
      },
      {
        position: { x: -5, z: 0 }, // 수직 내벽 1
        dimensions: { width: 0.3, length: 10 },
      },
      {
        position: { x: 5, z: 0 }, // 수직 내벽 2
        dimensions: { width: 0.3, length: 10 },
      },
    ],
  },

  // 천장 구조
  CEILING: {
    GRID: {
      SIZE: 3, // 각 그리드 셀의 크기
      PANEL_GAP: 0.2, // 패널 사이의 간격
    },
    HEIGHT: 2, // 천장 프레임의 높이
  },

  // 바닥 구조
  FLOOR: {
    GRID: {
      SIZE: 2, // 타일 크기
      DIVISIONS: 15, // 중심에서 한쪽으로의 타일 분할 수
    },
  },

  // 작품 배치
  ARTWORKS: {
    DIMENSIONS: {
      WIDTH: 2,
      HEIGHT: 2.5,
      WALL_OFFSET: 0.065, // 벽으로부터의 거리
    },
    DISPLAY_HEIGHT: 2, // 바닥으로부터의 높이
    ITEMS: [
      // 전면 벽 작품들
      {
        position: { x: -12, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: -8, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: -4, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: 4, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: 8, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: 12, z: -14.8 },
        direction: 'front',
        imageUrl: 'textures/art3.jpg',
      },

      // 후면 벽 작품들
      {
        position: { x: -12, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: -8, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: -4, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: 4, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: 8, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: 12, z: 14.8 },
        direction: 'back',
        imageUrl: 'textures/art1.jpg',
      },

      // 좌측 벽 작품들
      {
        position: { x: -14.8, z: -12 },
        direction: 'left',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: -14.8, z: -8 },
        direction: 'left',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: -14.8, z: 0 },
        direction: 'left',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: -14.8, z: 4 },
        direction: 'left',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: -14.8, z: 8 },
        direction: 'left',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: -14.8, z: 12 },
        direction: 'left',
        imageUrl: 'textures/art3.jpg',
      },

      // 우측 벽 작품들
      {
        position: { x: 14.8, z: -12 },
        direction: 'right',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: 14.8, z: -8 },
        direction: 'right',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: 14.8, z: -4 },
        direction: 'right',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: 14.8, z: 0 },
        direction: 'right',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: 14.8, z: 8 },
        direction: 'right',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: 14.8, z: 12 },
        direction: 'right',
        imageUrl: 'textures/art1.jpg',
      },

      // 내부 벽 작품들 - 왼쪽 수직벽
      {
        position: { x: -5.15, z: -2 },
        direction: 'right',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: -5.15, z: 2 },
        direction: 'right',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: -4.85, z: -2 },
        direction: 'left',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: -4.85, z: 2 },
        direction: 'left',
        imageUrl: 'textures/art1.jpg',
      },

      // 내부 벽 작품들 - 오른쪽 수직벽
      {
        position: { x: 5.15, z: -2 },
        direction: 'left',
        imageUrl: 'textures/art2.jpg',
      },
      {
        position: { x: 5.15, z: 2 },
        direction: 'left',
        imageUrl: 'textures/art3.jpg',
      },
      {
        position: { x: 4.85, z: -2 },
        direction: 'right',
        imageUrl: 'textures/art1.jpg',
      },
      {
        position: { x: 4.85, z: 2 },
        direction: 'right',
        imageUrl: 'textures/art2.jpg',
      },
    ],
  },

  // 벤치 배치
  BENCHES: {
    DIMENSIONS: {
      WIDTH: 2,
      DEPTH: 0.6,
      HEIGHT: 0.4,
      SEAT_HEIGHT: 0.15,
    },
    ITEMS: [
      {
        position: { x: 0, z: -10 },
        rotation: 0, // 정면 방향
      },
      {
        position: { x: 0, z: 10 },
        rotation: Math.PI, // 후면 방향
      },
      {
        position: { x: -10, z: 0 },
        rotation: Math.PI / 2, // 왼쪽 방향
      },
      {
        position: { x: 10, z: 0 },
        rotation: -Math.PI / 2, // 오른쪽 방향
      },
    ],
  },
} as const
