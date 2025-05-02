import * as PIXI from "pixi.js";

import { GRID_COLS, GRID_ROWS, GRID_SIZE, TILE_HEIGHT, TILE_WIDTH } from "./gridUtils.js";

export const enemyBaseStats = {
  basic: { baseHealth: 100, baseSpeed: 0.5, baseDamage: 1, goldValue: 10 },
  fast:  { baseHealth: 50,  baseSpeed: 1.0, baseDamage: 0.5, goldValue: 5 },
  tank:  { baseHealth: 200, baseSpeed: 0.25, baseDamage: 2, goldValue: 15 },
};

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
    
    // Get stats from the unified base stats object
    const stats = enemyBaseStats[type] || enemyBaseStats.basic;
    this.speed = stats.baseSpeed;
    this.maxHp = stats.baseHealth;
    this.hp = stats.baseHealth;
    this.goldValue = stats.goldValue;
    this.damageValue = stats.baseDamage;

    let texture;
    if (type === "fast") {
      texture = PIXI.Texture.from("fast_enemy");
    } else if (type === "tank") {
      texture = PIXI.Texture.from("tank");
    } else {
      texture = PIXI.Texture.from("enemy");
    }
    texture.baseTexture.scaleMode = 'nearest';
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);

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

    this.walkAnimCounter += 0.18 * this.speed * gameSpeed;
    this.sprite.y = Math.sin(this.walkAnimCounter) * 3;
    this.sprite.rotation = Math.sin(this.walkAnimCounter) * 0.08;
    
    if (dist < (this.speed * gameSpeed)) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.onReachedBase?.(this);
        this.destroy();
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
      if (this.parent) {
        this.spawnDeathParticles(this.parent, this.x, this.y, this.type === "tank" ? 0x9966ff : this.type === "fast" ? 0x33ccff : 0xff3333);
      }
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
      if (this.sprite && !this.sprite.destroyed) {
        let typeTint = 0xff3333; // Red for basic
        if (this.type === "fast") typeTint = 0x33ccff; // Blue for fast
        else if (this.type === "tank") typeTint = 0x9966ff; // Purple for tank
  
        this.sprite.tint = typeTint; 
        setTimeout(() => {
          if (this.sprite && !this.sprite.destroyed) {
            this.sprite.tint = 0xffffff;
          }
        }, 150); 
      }
    }, 100); 
  }

  spawnDeathParticles(stage, x, y, color = 0xff3333, count = 12) {
    for (let i = 0; i < count; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(color);
      particle.drawCircle(0, 0, Math.random() * 2 + 2);
      particle.endFill();
      particle.x = x;
      particle.y = y;
      particle.alpha = 1;
  
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
  
      particle.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; 
        this.alpha -= 0.03;
        if (this.alpha <= 0) {
          this.parent && this.parent.removeChild(this);
        }
      };
  
      stage.addChild(particle);
      PIXI.Ticker.shared.add(particle.update, particle);
    }
  }
}