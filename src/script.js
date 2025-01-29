let camera, scene, renderer;
let isFullscreen = false;
let moveForward = false,
  moveBackward = false,
  moveLeft = false,
  moveRight = false;
let velocity = new THREE.Vector3();
let walls = [];
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
let dragStartTime = 0;
let previousMousePosition = { x: 0, y: 0 };
let dragDistance = 0;
let targetRotationY = 0;
let cameraDirection = new THREE.Vector3();
let isMoving = false;
let moveTarget = new THREE.Vector3();
let targetIndicator;
let currentPath = [];
let grid = [];
const GRID_SIZE = 0.5; // Size of each grid cell
const GRID_WIDTH = Math.ceil(30 / GRID_SIZE); // Total grid width
const GRID_HEIGHT = Math.ceil(30 / GRID_SIZE); // Total grid height
const DRAG_THRESHOLD = 5;
const CLICK_TIMEOUT = 200; // milliseconds
let isPointerLocked = false;

// Node class for A* pathfinding
class Node {
  constructor(x, z, walkable) {
    this.x = x;
    this.z = z;
    this.walkable = walkable;
    this.gCost = 0;
    this.hCost = 0;
    this.parent = null;
  }

  get fCost() {
    return this.gCost + this.hCost;
  }
}

function worldToGrid(x, z) {
  return {
    x: Math.floor((x + 15) / GRID_SIZE),
    z: Math.floor((z + 15) / GRID_SIZE),
  };
}

function gridToWorld(gridX, gridZ) {
  return {
    x: gridX * GRID_SIZE - 15,
    z: gridZ * GRID_SIZE - 15,
  };
}

function initGrid() {
  // 그리드 초기화시 캐릭터 크기를 고려한 여유 공간 체크
  const SAFETY_BUFFER = 0.3; // 추가 여유 공간
  const TOTAL_RADIUS = 0.3 + SAFETY_BUFFER; // 캐릭터 반지름 + 여유 공간

  for (let x = 0; x < GRID_WIDTH; x++) {
    grid[x] = [];
    for (let z = 0; z < GRID_HEIGHT; z++) {
      const worldPos = gridToWorld(x, z);

      // 해당 그리드 셀의 모서리들도 체크
      const corners = [
        { x: worldPos.x - GRID_SIZE / 2, z: worldPos.z - GRID_SIZE / 2 },
        { x: worldPos.x - GRID_SIZE / 2, z: worldPos.z + GRID_SIZE / 2 },
        { x: worldPos.x + GRID_SIZE / 2, z: worldPos.z - GRID_SIZE / 2 },
        { x: worldPos.x + GRID_SIZE / 2, z: worldPos.z + GRID_SIZE / 2 },
        { x: worldPos.x, z: worldPos.z }, // 중심점
      ];

      // 모든 체크포인트가 walkable해야 해당 그리드가 walkable
      const walkable = corners.every((point) =>
        isPositionWalkable(point.x, point.z, TOTAL_RADIUS)
      );

      grid[x][z] = new Node(x, z, walkable);
    }
  }
}

function isPositionWalkable(x, z, radius) {
  const position = new THREE.Vector3(x, 1.7, z);
  const playerBox = new THREE.Box3();
  playerBox.min.set(position.x - radius, position.y - 1, position.z - radius);
  playerBox.max.set(position.x + radius, position.y + 1, position.z + radius);

  for (let wall of walls) {
    const wallBox = new THREE.Box3().setFromObject(wall);
    if (playerBox.intersectsBox(wallBox)) {
      return false;
    }
  }
  return true;
}

// A* 관련 코드 제거하고 새로운 경로 찾기 시스템 구현
function getWallCorners(wall) {
  const box = new THREE.Box3().setFromObject(wall);
  return [
    new THREE.Vector3(box.min.x, wall.position.y, box.min.z),
    new THREE.Vector3(box.min.x, wall.position.y, box.max.z),
    new THREE.Vector3(box.max.x, wall.position.y, box.min.z),
    new THREE.Vector3(box.max.x, wall.position.y, box.max.z),
  ];
}

function isDirectPathClear(start, target) {
  const direction = new THREE.Vector3().subVectors(target, start);
  const distance = direction.length();
  const STEP_SIZE = 0.1;
  const steps = Math.ceil(distance / STEP_SIZE);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = new THREE.Vector3().lerpVectors(start, target, t);
    if (!isWalkable(point.x, point.z)) {
      return false;
    }
  }
  return true;
}

function isPointBetween(point, start, end) {
  const EPSILON = 0.5; // 허용 오차

  const d1 = point.distanceTo(start);
  const d2 = point.distanceTo(end);
  const d3 = start.distanceTo(end);

  // 두 점 사이의 거리와 경유점을 통한 거리가 비슷한지 확인
  return Math.abs(d1 + d2 - d3) < EPSILON;
}

function findPath(startPos, targetPos) {
  // 1. 먼저 직선 경로 시도
  if (isDirectPathClear(startPos, targetPos)) {
    return [startPos, targetPos];
  }

  // 2. 직선 경로가 불가능한 경우 A* 경로 찾기
  const aStarPath = findAStarPath(startPos, targetPos);
  if (!aStarPath) return null;

  // 3. 직선화 수행
  return simplifyPath(aStarPath);
}

function getNeighbors(node) {
  const neighbors = [];
  // 8방향 이동 (상하좌우 + 대각선)
  const directions = [
    { x: 0, z: 1 }, // 상
    { x: 1, z: 0 }, // 우
    { x: 0, z: -1 }, // 하
    { x: -1, z: 0 }, // 좌
    { x: 1, z: 1 }, // 우상
    { x: 1, z: -1 }, // 우하
    { x: -1, z: -1 }, // 좌하
    { x: -1, z: 1 }, // 좌상
  ];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newZ = node.z + dir.z;

    if (newX >= 0 && newX < GRID_WIDTH && newZ >= 0 && newZ < GRID_HEIGHT) {
      // 대각선 이동시 양쪽 노드가 모두 walkable해야 함
      if (Math.abs(dir.x) === 1 && Math.abs(dir.z) === 1) {
        const horizontalNode = grid[newX][node.z];
        const verticalNode = grid[node.x][newZ];

        if (!horizontalNode.walkable || !verticalNode.walkable) {
          continue;
        }
      }

      const neighbor = grid[newX][newZ];
      if (neighbor.walkable) {
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}

function getDistance(nodeA, nodeB) {
  const distX = Math.abs(nodeA.x - nodeB.x);
  const distZ = Math.abs(nodeA.z - nodeB.z);

  // 대각선 이동은 14 (√2 * 10), 직선 이동은 10
  if (distX > distZ) {
    return 14 * distZ + 10 * (distX - distZ);
  }
  return 14 * distX + 10 * (distZ - distX);
}

function findAStarPath(startPos, targetPos) {
  const startGrid = worldToGrid(startPos.x, startPos.z);
  const targetGrid = worldToGrid(targetPos.x, targetPos.z);

  if (
    !grid[startGrid.x] ||
    !grid[startGrid.x][startGrid.z] ||
    !grid[targetGrid.x] ||
    !grid[targetGrid.x][targetGrid.z]
  ) {
    return null;
  }

  const startNode = grid[startGrid.x][startGrid.z];
  const targetNode = grid[targetGrid.x][targetGrid.z];

  if (!startNode.walkable || !targetNode.walkable) {
    return null;
  }

  // A* 알고리즘으로 경로 찾기 (기존 코드)
  const openSet = [startNode];
  const closedSet = new Set();

  // Reset node values
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let z = 0; z < GRID_HEIGHT; z++) {
      grid[x][z].gCost = 0;
      grid[x][z].hCost = 0;
      grid[x][z].parent = null;
    }
  }

  while (openSet.length > 0) {
    let currentNode = openSet[0];
    for (let i = 1; i < openSet.length; i++) {
      if (
        openSet[i].fCost < currentNode.fCost ||
        (openSet[i].fCost === currentNode.fCost &&
          openSet[i].hCost < currentNode.hCost)
      ) {
        currentNode = openSet[i];
      }
    }

    openSet.splice(openSet.indexOf(currentNode), 1);
    closedSet.add(currentNode);

    if (currentNode === targetNode) {
      return retracePath(startNode, targetNode);
    }

    for (const neighbor of getNeighbors(currentNode)) {
      if (!neighbor.walkable || closedSet.has(neighbor)) continue;

      const newMovementCost =
        currentNode.gCost + getDistance(currentNode, neighbor);
      if (newMovementCost < neighbor.gCost || !openSet.includes(neighbor)) {
        neighbor.gCost = newMovementCost;
        neighbor.hCost = getDistance(neighbor, targetNode);
        neighbor.parent = currentNode;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null;
}

function simplifyPath(path) {
  if (path.length <= 2) return path;

  const result = [path[0]];
  let currentPoint = path[0];

  while (currentPoint !== path[path.length - 1]) {
    let furthestReachable = null;
    let maxDistance = 0;

    // 현재 위치에서 도달 가능한 가장 먼 점 찾기
    for (let i = path.length - 1; i > path.indexOf(currentPoint); i--) {
      const target = path[i];
      if (isDirectPathClear(currentPoint, target)) {
        const distance = currentPoint.distanceTo(target);
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestReachable = target;
        }
      }
    }

    if (!furthestReachable) {
      // 다음 점으로 이동
      const nextIndex = path.indexOf(currentPoint) + 1;
      if (nextIndex >= path.length) break;
      furthestReachable = path[nextIndex];
    }

    if (furthestReachable !== result[result.length - 1]) {
      result.push(furthestReachable);
    }
    currentPoint = furthestReachable;
  }

  return result;
}

function isWalkable(x, z) {
  return isPositionWalkable(x, z, 0.3 + 0.3); // character radius + safety buffer
}

// 두 점 사이의 직선 경로가 유효한지 확인
function isDirectPathClear(start, end) {
  const distance = start.distanceTo(end);
  const STEP_SIZE = 0.2; // 더 작은 간격으로 체크
  const STEPS = Math.ceil(distance / STEP_SIZE);
  const direction = new THREE.Vector3().subVectors(end, start).normalize();

  for (let i = 1; i < STEPS; i++) {
    const point = new THREE.Vector3()
      .copy(start)
      .add(direction.clone().multiplyScalar(STEP_SIZE * i));

    if (!isWalkable(point.x, point.z)) {
      return false;
    }
  }

  return true;
}

function retracePath(startNode, endNode) {
  const path = [];
  let currentNode = endNode;

  while (currentNode !== startNode) {
    const worldPos = gridToWorld(currentNode.x, currentNode.z);
    path.push(new THREE.Vector3(worldPos.x, 1.7, worldPos.z));
    currentNode = currentNode.parent;
  }

  path.reverse();
  return path;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.7, 13);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Ceiling
  const ceiling = floor.clone();
  ceiling.position.y = 4;
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);

  // Target indicator
  const indicatorGeometry = new THREE.RingGeometry(0.3, 0.4, 32);
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  targetIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  targetIndicator.rotation.x = -Math.PI / 2;
  targetIndicator.visible = false;
  scene.add(targetIndicator);

  // Create walls
  function createWall(x, z, width, depth, height = 4) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, height / 2, z);
    scene.add(wall);
    walls.push(wall);
    return wall;
  }

  // Gallery wall structure
  createWall(-15, 0, 0.3, 30); // Left wall
  createWall(15, 0, 0.3, 30); // Right wall
  createWall(0, -15, 30, 0.3); // Front wall
  createWall(0, 15, 30, 0.3); // Back wall
  createWall(-7.5, -5, 15, 0.3); // Horizontal wall 1
  createWall(7.5, 5, 15, 0.3); // Horizontal wall 2
  createWall(-5, 0, 0.3, 10); // Vertical wall 1
  createWall(5, 0, 0.3, 10); // Vertical wall 2

  // Initialize navigation grid
  initGrid();

  // Add artwork
  function addArtwork(x, z, wallDirection) {
    const artGeometry = new THREE.PlaneGeometry(2, 2);
    const artMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
    });
    const art = new THREE.Mesh(artGeometry, artMaterial);

    const offset = 0.152;

    switch (wallDirection) {
      case "front":
        art.position.set(x, 2, z + offset);
        art.rotation.y = 0;
        break;
      case "back":
        art.position.set(x, 2, z - offset);
        art.rotation.y = Math.PI;
        break;
      case "left":
        art.position.set(x - offset, 2, z);
        art.rotation.y = Math.PI / 2;
        break;
      case "right":
        art.position.set(x + offset, 2, z);
        art.rotation.y = -Math.PI / 2;
        break;
    }

    scene.add(art);
  }

  // Place artwork
  addArtwork(-14.8, -10, "left");
  addArtwork(-14.8, -5, "left");
  addArtwork(-14.8, 0, "left");
  addArtwork(-14.8, 5, "left");
  addArtwork(14.8, -10, "right");
  addArtwork(14.8, -5, "right");
  addArtwork(14.8, 0, "right");
  addArtwork(14.8, 5, "right");
  addArtwork(-5, -14.8, "front");
  addArtwork(5, -14.8, "front");
  addArtwork(-5, 14.8, "back");
  addArtwork(5, 14.8, "back");

  // Event listeners
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onWindowResize);

  document.getElementById("fullscreen-btn").addEventListener("click", () => {
    isFullscreen = !isFullscreen;
    document.getElementById("fullscreen-btn").textContent = isFullscreen
      ? "Exit Full View"
      : "Full View";
    if (isFullscreen) {
      // 풀스크린 요청
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      // 풀스크린 해제
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  });

  // init 함수에 추가할 이벤트 리스너들
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("msfullscreenchange", handleFullscreenChange);

  // 풀스크린 변경 핸들러 함수
  function handleFullscreenChange() {
    isFullscreen =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;

    document.getElementById("fullscreen-btn").textContent = isFullscreen
      ? "Exit Full View"
      : "Full View";

    if (isFullscreen && !isPointerLocked) {
      // 풀스크린 시작시 포인터 락 요청
      const element = document.documentElement;
      element.requestPointerLock =
        element.requestPointerLock ||
        element.mozRequestPointerLock ||
        element.webkitRequestPointerLock;
      element.requestPointerLock();
    } else if (!isFullscreen && isPointerLocked) {
      // 풀스크린 종료시 포인터 락 해제
      document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
      document.exitPointerLock();
    }

    if (!isFullscreen) {
      camera.rotation.y = 0;
      targetRotationY = 0;
    }
  }

  // init 함수에 추가할 포인터 락 이벤트 리스너
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  document.addEventListener("mozpointerlockchange", handlePointerLockChange);
  document.addEventListener("webkitpointerlockchange", handlePointerLockChange);

  // 포인터 락 상태 변경 핸들러
  function handlePointerLockChange() {
    isPointerLocked =
      document.pointerLockElement === document.documentElement ||
      document.mozPointerLockElement === document.documentElement ||
      document.webkitPointerLockElement === document.documentElement;
  }
}

function onKeyDown(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = true;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = true;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;
    case "Escape":
      if (isFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false;
      break;
    case "ArrowDown":
    case "KeyS":
      moveBackward = false;
      break;
    case "ArrowLeft":
    case "KeyA":
      moveLeft = false;
      break;
    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;
  }
}

function onMouseDown(event) {
  if (!isFullscreen) {
    isDragging = true;
    dragDistance = 0;
    dragStartTime = Date.now();
    dragStartPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }
}

function onMouseUp(event) {
  const dragDuration = Date.now() - dragStartTime;
  // Only trigger click if:
  // 1. The drag distance is small
  // 2. The drag duration is short
  // 3. We were actually dragging (prevents click-through)
  if (
    isDragging &&
    dragDistance < DRAG_THRESHOLD &&
    dragDuration < CLICK_TIMEOUT
  ) {
    onClick(event);
  }
  isDragging = false;
}

function onMouseMove(event) {
  if (isFullscreen && isPointerLocked) {
    // 포인터가 락된 상태에서는 movementX/Y 사용
    targetRotationY -=
      (event.movementX || event.mozMovementX || event.webkitMovementX || 0) *
      0.002;
  } else if (isFullscreen) {
    targetRotationY = (event.clientX / window.innerWidth - 0.5) * Math.PI * 2;
  } else if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };

    dragDistance += Math.sqrt(
      deltaMove.x * deltaMove.x + deltaMove.y * deltaMove.y
    );

    // Only rotate camera if we've exceeded the drag threshold
    if (dragDistance > DRAG_THRESHOLD) {
      targetRotationY += deltaMove.x * 0.01;
    }

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  // Only show target indicator if we're not dragging
  if (!isFullscreen && (!isDragging || dragDistance < DRAG_THRESHOLD)) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.children[2]); // floor

    if (intersects.length > 0) {
      const point = intersects[0].point;
      targetIndicator.position.set(point.x, 0.01, point.z);
      targetIndicator.visible = true;
    } else {
      targetIndicator.visible = false;
    }
  }
}

function onClick(event) {
  if (!isFullscreen && (!isDragging || dragDistance < DRAG_THRESHOLD)) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.children[2]); // floor

    if (intersects.length > 0 && !isMoving) {
      const targetPoint = intersects[0].point;
      moveTarget.copy(targetPoint);
      moveTarget.y = camera.position.y;

      currentPath = findPath(camera.position, moveTarget);
      if (currentPath) {
        isMoving = true;
      }
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function animate() {
  requestAnimationFrame(animate);

  if (isMoving && currentPath.length > 0) {
    const currentTarget = currentPath[0];
    const distance = camera.position.distanceTo(currentTarget);

    if (distance > 0.1) {
      // 거리에 비례한 이동 속도 (더 멀수록 더 빠르게, 최대 속도 제한)
      const speed = Math.min(distance * 0.1, 0.2);
      const direction = new THREE.Vector3()
        .subVectors(currentTarget, camera.position)
        .normalize();

      const movement = direction.multiplyScalar(speed);
      const newPosition = camera.position.clone().add(movement);

      if (isWalkable(newPosition.x, newPosition.z)) {
        camera.position.copy(newPosition);
      } else {
        // 충돌이 발생하면 현재 목표점 스킵
        currentPath.shift();
      }
    } else {
      currentPath.shift();
      if (currentPath.length === 0) {
        isMoving = false;
      }
    }
  }

  if (!isMoving) {
    velocity.x = 0;
    velocity.z = 0;

    if (moveForward || moveBackward || moveLeft || moveRight) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const forward = direction.clone();
      const right = new THREE.Vector3(-direction.z, 0, direction.x);

      if (moveForward) velocity.add(forward.multiplyScalar(0.1));
      if (moveBackward) velocity.add(forward.multiplyScalar(-0.1));
      if (moveLeft) velocity.add(right.multiplyScalar(-0.1));
      if (moveRight) velocity.add(right.multiplyScalar(0.1));

      if (velocity.length() > 0.1) {
        velocity.normalize().multiplyScalar(0.1);
      }

      const nextPosition = camera.position.clone().add(velocity);
      if (isWalkable(nextPosition.x, nextPosition.z)) {
        camera.position.add(velocity);
      }
    }
  }

  camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.1;
  renderer.render(scene, camera);
}

init();
animate();
