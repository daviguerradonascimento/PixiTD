import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH } from "./gridUtils";

function toIsometric(col, row) {
  const x = (col - row) * (GRID_SIZE / 2);
  const y = (col + row) * (GRID_SIZE / 4);
  return { x, y };
}

export class ProceduralLevelGenerator {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    this.waypoints = [];
    this.gridWaypoints = [];
  }

  generateLevel() {
    // Initialize grid with empty tiles
    this.grid = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(0));

    // Generate a path using a Breadth-First Search algorithm
    let startX = Math.floor(Math.random() * this.cols);
    let startY = Math.floor(Math.random() * this.rows);
    let endX = Math.floor(Math.random() * this.cols);
    let endY = Math.floor(Math.random() * this.rows);

    const startEdge = Math.floor(Math.random() * 4);
    switch (startEdge) {
      case 0: // Top edge
        startX = Math.floor(Math.random() * this.cols);
        startY = 0;
        break;
      case 1: // Right edge
        startX = this.cols - 1;
        startY = Math.floor(Math.random() * this.rows);
        break;
      case 2: // Bottom edge
        startX = Math.floor(Math.random() * this.cols);
        startY = this.rows - 1;
        break;
      case 3: // Left edge
        startX = 0;
        startY = Math.floor(Math.random() * this.rows);
        break;
    }

    // Randomly choose an edge for the end point, ensuring it's different from the start
    let endEdge;
    do {
      endEdge = Math.floor(Math.random() * 4);
    } while (endEdge === startEdge);

    switch (endEdge) {
      case 0: // Top edge
        endX = Math.floor(Math.random() * this.cols);
        endY = 0;
        break;
      case 1: // Right edge
        endX = this.cols - 1;
        endY = Math.floor(Math.random() * this.rows);
        break;
      case 2: // Bottom edge
        endX = Math.floor(Math.random() * this.cols);
        endY = this.rows - 1;
        break;
      case 3: // Left edge
        endX = 0;
        endY = Math.floor(Math.random() * this.rows);
        break;
    }

    // Ensure start and end are not the same
    while (startX === endX && startY === endY) {
      endX = Math.floor(Math.random() * this.cols);
      endY = Math.floor(Math.random() * this.rows);
    }

    // --- NEW: Generate random intermediate waypoints ---
    const numWaypoints = Math.floor(Math.random() * 2) + 2; // 2 or 3 waypoints
    const waypoints = [];
    for (let i = 0; i < numWaypoints; i++) {
      let wx, wy;
      let tries = 0;
      do {
        wx = Math.floor(Math.random() * this.cols);
        wy = Math.floor(Math.random() * this.rows);
        tries++;
        // Avoid start/end and duplicate waypoints
      } while (
        ((wx === startX && wy === startY) || (wx === endX && wy === endY) ||
        waypoints.some(([x, y]) => x === wx && y === wy)) && tries < 10
      );
      waypoints.push([wx, wy]);
    }

    // Build the full path: start → waypoints... → end
    const points = [[startX, startY], ...waypoints, [endX, endY]];
    let path = [];
    for (let i = 0; i < points.length - 1; i++) {
      const segment = this.getPath(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
      // Avoid duplicating the connecting point
      if (i > 0 && segment.length > 0) segment.shift();
      path = path.concat(segment);
    }

    // Mark path tiles on the grid
    path.forEach(([x, y]) => {
      this.grid[y][x] = 1;
    });

    this.gridWaypoints = path;
    this.waypoints = path.map(([x, y]) => toIsometric(x, y));

    return this.grid;
  }

  getPath(startX, startY, endX, endY) {
    const queue = [[startX, startY, [[startX, startY]]]]; // [x, y, path]
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const [x, y, path] = queue.shift();

      if (x === endX && y === endY) {
        return path;
      }

      const possibleMoves = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      for (const move of possibleMoves) {
        const newX = x + move.dx;
        const newY = y + move.dy;

        if (
          newX >= 0 &&
          newX < this.cols &&
          newY >= 0 &&
          newY < this.rows &&
          !visited.has(`${newX},${newY}`)
        ) {
          visited.add(`${newX},${newY}`);
          const newPath = [...path, [newX, newY]];
          queue.push([newX, newY, newPath]);
        }
      }
    }

    return []; // No path found
  }

  getWaypoints() {
    const offsetX = ((this.cols + this.rows) * (GRID_SIZE / 2)) / 2;

    return this.waypoints.map(waypoint => ({
      x: waypoint.x + offsetX + (TILE_HEIGHT / 2),
      y: waypoint.y + (TILE_HEIGHT / 4)
    }));
  }

  getGridWaypoints() {
    return this.gridWaypoints;
  }
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