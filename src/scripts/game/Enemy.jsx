import * as PIXI from "pixi.js";

import { GRID_COLS, GRID_ROWS, GRID_SIZE, TILE_HEIGHT, TILE_WIDTH } from "./gridUtils.js";

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
  [9, 1]
];

export const waypoints = waypointGridCoords.map(([col, row]) => {
  const { x, y } = toIsometric(col, row);
  return {
    x: x + offsetX + (TILE_HEIGHT / 2),
    y: y + (TILE_HEIGHT / 4)
  };
});

export class Enemy extends PIXI.Container {
  constructor(type = "basic", onDeath = () => {}, onReachedBase = () => {}, waypointsa = waypoints) {
    super();

    this.waypoints = waypointsa;
    this.type = type;
    this.speed = 0.5;
    this.maxHp = 100;
    this.hp = 100;
    this.goldValue = 10;
    this.damageValue = 1;

 
    let texture;
    // Color/tint by type
    if (type === "fast") {
      texture = PIXI.Texture.from("fast_enemy");
      this.speed = 1;
      this.maxHp = 50;
      this.hp = 50;
      this.goldValue = 5;
      this.damageValue = 0.5;
      // this.sprite.tint = 0x33ccff;
    } else if (type === "tank") {
      this.speed = 0.25;
      this.maxHp = 200;
      this.hp = 200;
      this.goldValue = 15;
      this.damageValue = 2;
      texture = PIXI.Texture.from("tank");
      // this.sprite.tint = 0x9966ff;
    } else {
      texture = PIXI.Texture.from("enemy");
    }
    texture.baseTexture.scaleMode = 'nearest';
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5); // Center horizontally, feet at bottom

    const scale = Math.min(TILE_WIDTH / this.sprite.width, TILE_HEIGHT / this.sprite.height);
    const scaleSize = 0.7;
    this.sprite.scale.set(scale*scaleSize);
    this.addChild(this.sprite);

    this.waypointIndex = 0;
    this.position.set(this.waypoints[0].x, this.waypoints[0].y);

    this.onDeath = typeof onDeath === "function" ? onDeath : () => {};
    this.onReachedBase = typeof onReachedBase === "function" ? onReachedBase : () => {};

    // HP bar
    this.hpBarBackground = new PIXI.Graphics();
    this.addChild(this.hpBarBackground);
    this.hpBarFill = new PIXI.Graphics();
    this.addChild(this.hpBarFill);

    this.updateHpBar();
    this.walkAnimCounter = Math.random() * Math.PI * 2;
  }
  


  update(gameSpeed) {
    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // --- Walking animation: bob up and down ---
    this.walkAnimCounter += 0.18 * this.speed * gameSpeed;
    this.sprite.y = Math.sin(this.walkAnimCounter) * 3;
    this.sprite.rotation = Math.sin(this.walkAnimCounter) * 0.08;
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
    this.sprite.tint = 0xffffff;
    setTimeout(() => {
      if (this.type === "fast") this.sprite.tint = 0x33ccff;
      else if (this.type === "tank") this.sprite.tint = 0x9966ff;
      else this.sprite.tint = 0xff3333;
    }, 100);
  }
}