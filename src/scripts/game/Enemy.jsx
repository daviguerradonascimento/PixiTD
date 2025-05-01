import * as PIXI from "pixi.js";

import { GRID_COLS, GRID_ROWS, GRID_SIZE, TILE_HEIGHT } from "./gridUtils.js";

const offsetX = ((GRID_COLS + GRID_ROWS) * (GRID_SIZE / 2)) / 2;

function toIsometric(col, row) {
  const x = (col - row) * (GRID_SIZE / 2);
  const y = (col + row) * (GRID_SIZE / 4);
  return { x, y };
}

export const waypointGridCoords = [
  [0, 1],
  [1, 1],
  [2, 1],
  [2, 4],
  [7, 4],
  [7, 1],
  [10, 1]
];

export const waypoints = waypointGridCoords.map(([col, row]) => {
  const { x, y } = toIsometric(col, row);
  return {
    x: x + offsetX + (TILE_HEIGHT / 2),
    y: y + (TILE_HEIGHT / 4)
  };
});

export class Enemy extends PIXI.Graphics {
  constructor(type = "basic", onDeath = () => {}, onReachedBase = () => {}, waypointsa = waypoints) {
    super();
    
    this.waypoints = waypointsa;
    this.type = type;
    this.speed = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.color = 0xff3333;
    this.goldValue = 10;
    this.damageValue = 1;

    if (type === "fast") {
      this.speed = 2;
      this.color = 0x33ccff;
      this.maxHp = 50;
      this.hp = 50;
      this.goldValue = 5;
      this.damageValue = 0.5;

    } else if (type === "tank") {
      this.speed = 0.5;
      this.color = 0x9966ff;
      this.maxHp = 200;
      this.hp = 200;
      this.goldValue = 15;
      this.damageValue = 2;

    }

    
    this.waypointIndex = 0;
    this.position.set(this.waypoints[0].x, this.waypoints[0].y);

    this.onDeath = typeof onDeath === "function" ? onDeath : () => {};
    this.onReachedBase = typeof onReachedBase === "function" ? onReachedBase : () => {};

    this.body = new PIXI.Graphics();
    this.body.fill(this.color);
    this.body.circle(0, 0, (TILE_HEIGHT / 2));
    this.body.fill();
    this.addChild(this.body);

    this.hpBarBackground = new PIXI.Graphics();
    this.addChild(this.hpBarBackground);
    this.hpBarFill = new PIXI.Graphics();
    this.addChild(this.hpBarFill);

    this.updateHpBar();
  }

  update(gameSpeed) {
    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < (this.speed * gameSpeed)) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.onReachedBase?.(this);
        this.destroy(); // Reached base
        return;
      }
    } else {
      this.x += (dx / dist) * (this.speed * gameSpeed);
      this.y += (dy / dist) * (this.speed * gameSpeed);
    }

    this.updateHpBar();
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashHit();
    this.updateHpBar();
    if (this.hp <= 0) {
      this.onDeath();
      this.destroy();
    }
  }

  updateHpBar() {
    const barWidth = 32;
    const barHeight = 5;

    this.hpBarBackground.clear();
    this.hpBarBackground.fill(0x000000);
    this.hpBarBackground.rect(-barWidth / 2, -26, barWidth, barHeight);
    this.hpBarBackground.fill();

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fill(0x00ff00);
    this.hpBarFill.rect(-barWidth / 2, -26, barWidth * hpPercent, barHeight);
    this.hpBarFill.fill();
  }

  flashHit() {
    this.body.tint = 0xffffff;
    setTimeout(() => {
      this.body.tint = 0xff3333;
    }, 100);
  }
}