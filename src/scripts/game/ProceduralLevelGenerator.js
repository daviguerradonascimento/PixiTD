import { GRID_COLS, GRID_ROWS } from "./gridUtils";

export class ProceduralLevelGenerator {
  constructor(width = GRID_COLS, height = GRID_ROWS) {
    this.width = width;
    this.height = height;
    this.grid = [];
  }

  generateLevel() {
    // Initialize grid with empty tiles
    this.grid = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(0));

    // Generate a path using a simple random walk algorithm
    let x = Math.floor(Math.random() * this.width);
    let y = Math.floor(Math.random() * this.height);
    this.grid[y][x] = 1; // Mark as path

    const waypoints = [{ x, y }];

    for (let i = 0; i < (this.width + this.height) * 2; i++) {
      const possibleMoves = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ];

      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      const newX = x + move.dx;
      const newY = y + move.dy;

      if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
        x = newX;
        y = newY;
        this.grid[y][x] = 1; // Mark as path
        waypoints.push({ x, y });
      }
    }

    this.waypoints = waypoints;
    return this.grid;
  }

  getWaypoints() {
    return this.waypoints;
  }
}