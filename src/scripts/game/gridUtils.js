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

export function screenToGrid(x, y) {
  const col = Math.floor((x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2);
  const row = Math.floor((y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2);
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

export function drawIsometricGrid(stage, onClick, waypointGridCoords) {
   const totalWidth = (GRID_COLS + GRID_ROWS) * (TILE_WIDTH / 2);
    const offsetX = totalWidth / 2; // center grid horizontally
    
    const blockedTiles = getBlockedTiles(waypointGridCoords); // Path tiles are blocked
  
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const { x, y } = toIsometric(col, row);
        const tile = new PIXI.Graphics();
        
        tile.setStrokeStyle(1, 0xdddddd, 1);
  
        // Determine whether this tile is part of the path or grass
        const isPathTile = blockedTiles.some(([bx, by]) => bx === col && by === row);
        if (isPathTile) {
          tile.fill(0x7f6e4e); // Earth color for path
        } else {
          tile.fill(0x228B22); // Grass color for other tiles
        }
        
        tile.moveTo(x + offsetX, y + TILE_HEIGHT / 2);
        tile.lineTo(x + offsetX + TILE_WIDTH / 2, y);
        tile.lineTo(x + offsetX + TILE_WIDTH, y + TILE_HEIGHT / 2);
        tile.lineTo(x + offsetX + TILE_WIDTH / 2, y + TILE_HEIGHT);
        tile.lineTo(x + offsetX, y + TILE_HEIGHT / 2);
  
        tile.stroke();
        tile.fill();
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
};

export const gridConsts = {
  TILE_WIDTH,
  TILE_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
}