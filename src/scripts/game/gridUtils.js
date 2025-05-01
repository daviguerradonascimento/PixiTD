import * as PIXI from "pixi.js";
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const GRID_COLS = 10;
export const GRID_ROWS = 6;
export const GRID_SIZE = 64;

export function toIsometric(col, row) {
  const x = (col - row) * (TILE_WIDTH / 2);
  const y = (col + row) * (TILE_HEIGHT / 2);
  return { x, y };
}

export function screenToGrid(x, y, cols = GRID_COLS, rows = GRID_ROWS) {
  // Offset to match drawIsometricGrid
  const totalWidth = (cols + rows) * (TILE_WIDTH / 2);
  const offsetX = totalWidth / 2;

  // Convert screen/stage coordinates to local isometric grid coordinates
  const localX = x - offsetX;
  const localY = y;

  // Inverse isometric transform
  let col = Math.round((localX / (TILE_WIDTH / 2) + localY / (TILE_HEIGHT / 2)) / 2);
  const row = Math.round((localY / (TILE_HEIGHT / 2) - localX / (TILE_WIDTH / 2)) / 2);

  // Adjust col by subtracting 1
  col = col - 1;

  return { col, row };
}

export function getBlockedTiles(waypointGridCoords) {
  const blocked = [];
  if (!waypointGridCoords) return blocked;

  for (let i = 0; i < waypointGridCoords.length - 1; i++) {
    const [x1, y1] = waypointGridCoords[i];
    const [x2, y2] = waypointGridCoords[i + 1];
    if (x1 === x2) {
      const range = Array.from({ length: Math.abs(y2 - y1) + 1 }, (_, j) =>
        y1 < y2 ? y1 + j : y1 - j
      );
      range.forEach((y) => blocked.push([x1, y]));
    } else if (y1 === y2) {
      const range = Array.from({ length: Math.abs(x2 - x1) + 1 }, (_, j) =>
        x1 < x2 ? x1 + j : x1 - j
      );
      range.forEach((x) => blocked.push([x, y1]));
    }
  }
  return blocked;
}

export function drawIsometricGrid(stage, onClick, waypointGridCoords, cols = GRID_COLS, rows = GRID_ROWS) {
  const totalWidth = (cols + rows) * (TILE_WIDTH / 2);
  const offsetX = totalWidth / 2; // center grid horizontally

  const blockedTiles = getBlockedTiles(waypointGridCoords);

  // Draw all tiles
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const { x, y } = toIsometric(col, row);
      const tile = new PIXI.Graphics();

      const isPathTile = blockedTiles.some(([bx, by]) => bx === col && by === row);

      tile.fill(isPathTile ? 0xe0d3b8 : 0x7fd7c4);
      tile.moveTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y);
      tile.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
      tile.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.fill();

      tile.fill(isPathTile ? 0xc2b280 : 0x4cae9b, 0.45);
      tile.moveTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT * 0.75);
      tile.lineTo(x + offsetX + TILE_WIDTH * 0.25, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.fill();

      tile.fill(isPathTile ? 0xf5f0e6 : 0xb6fff7, 0.35);
      tile.moveTo(x + offsetX + TILE_WIDTH / 2, y);
      tile.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH * 0.75, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT * 0.25);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y);
      tile.fill();

      tile.setStrokeStyle(2, 0x222831, 0.5);
      tile.moveTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y);
      tile.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
      tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
      tile.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
      tile.stroke();

      tile.zIndex = y;
      tile.interactive = true;
      tile.hitArea = new PIXI.Polygon([
        x + offsetX, y + TILE_HEIGHT / 2,
        x + offsetX + TILE_WIDTH / 2, y,
        x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2,
        x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT,
      ]);
      tile.on("pointerdown", () => onClick(col, row));
      tile.zIndex = 1;
      stage.addChild(tile);
    }
  }
 
  drawGridSides(cols, rows, blockedTiles, offsetX, stage);
  
  

}

export function drawGridSides(cols, rows, blockedTiles, offsetX, stage) {
  const thickness = 18;

  // Bottom wall slices
  for (let col = 0; col < cols; col++) {
    const { x, y } = toIsometric(col, rows - 1);
    const isBlocked = blockedTiles.some(([bx, by]) => bx === col && by === rows - 1);

    // Match the path color logic from drawIsometricGrid
    const wallColor = isBlocked ? 0xe0d3b8 : 0x7fd7c4;
    const wallShadow = isBlocked ? 0xc2b280 : 0x4cae9b;

    // Main wall
    const side = new PIXI.Graphics();
    side.fill(wallColor);
    side.moveTo(x + offsetX, y + TILE_HEIGHT / 2);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
    side.fill();

    // Shadow/accent
    side.fill(wallShadow, 0.45);
    side.moveTo(x + offsetX, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness * 0.75);
    side.lineTo(x + offsetX + TILE_WIDTH * 0.25, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX, y + TILE_HEIGHT / 2 + thickness);
    side.fill();

    side.setStrokeStyle(2, 0x222831, 0.5);
    side.moveTo(x + offsetX, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
    side.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
    side.lineTo(x + offsetX, y + TILE_HEIGHT / 2 + thickness);
    side.stroke();

    stage.addChild(side);
  }

  // Right wall slices
  for (let row = 0; row < rows; row++) {
    const { x, y } = toIsometric(cols - 1, row);
    const isBlocked = blockedTiles.some(([bx, by]) => bx === cols - 1 && by === row);

    // Match the path color logic from drawIsometricGrid
    const wallColor = isBlocked ? 0xe0d3b8 : 0x7fd7c4;
    const wallShadow = isBlocked ? 0xc2b280 : 0x4cae9b;

    const side = new PIXI.Graphics();
    side.fill(wallColor);
    side.moveTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
    side.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
    side.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
    side.fill();

    // Shadow/accent
    side.fill(wallShadow, 0.45);
    side.moveTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH * 0.75, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness * 0.75);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.fill();

    side.setStrokeStyle(2, 0x222831, 0.5);
    side.moveTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2 + thickness);
    side.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
    side.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT + thickness);
    side.stroke();

    stage.addChild(side);
  }
}

export const gridConsts = {
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
}