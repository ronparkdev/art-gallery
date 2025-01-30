export const GRID_SIZE = 0.5; // Size of each grid cell
export const GRID_WIDTH = Math.ceil(30 / GRID_SIZE); // Total grid width
export const GRID_HEIGHT = Math.ceil(30 / GRID_SIZE); // Total grid height
export const DRAG_THRESHOLD = 5;
export const CLICK_TIMEOUT = 200; // milliseconds

export const PLAYER_CONFIG = {
  HEIGHT: 1.7,
  RADIUS: 0.3,
  SAFETY_BUFFER: 0.3,
  MOVEMENT_SPEED: 0.1,
  ROTATION_SPEED: 0.1,
};

export const WALL_CONFIG = {
  DEFAULT_HEIGHT: 4,
  COLOR: 0xffffff,
  THICKNESS: 0.3,
};

export const ARTWORK_CONFIG = {
  WIDTH: 2,
  HEIGHT: 2,
  COLOR: 0xff0000,
  WALL_OFFSET: 0.152,
  VERTICAL_POSITION: 2,
};
