import * as PIXI from "pixi.js";
import { GRID_COLS, GRID_ROWS, GRID_SIZE, TILE_HEIGHT, TILE_WIDTH } from "../utils/gridUtils.js";

// Update paths to audio files
import hitSoundSrc from "../../assets/audio/impact.mp3";
import deathSoundSrc from "../../assets/audio/death.mp3";

const hitSound = new Audio(hitSoundSrc);
const deathSound = new Audio(deathSoundSrc);

export const enemyBaseStats = {
  basic: { baseHealth: 80, baseSpeed: 0.65, baseDamage: 1, goldValue: 15 },
  fast:  { baseHealth: 45,  baseSpeed: 1.3, baseDamage: 1, goldValue: 10 },
  tank:  { baseHealth: 280, baseSpeed: 0.35, baseDamage: 3, goldValue: 25 },
  boss:  { baseHealth: 800, baseSpeed: 0.4, baseDamage: 5, goldValue: 100 },
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
  constructor(type = "basic", onDeath = () => {}, onReachedBase = () => {}, waypoints = this.waypoints) {
    super();

    this.waypoints = waypoints;
    this.type = type;
    this.isBoss = type === "boss";
    
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
    } else if (type === "boss") {
      texture = PIXI.Texture.from("tank");
    } else {
      texture = PIXI.Texture.from("enemy");
    }
    texture.baseTexture.scaleMode = 'nearest';
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);

    // Bosses are bigger
    const scale = Math.min(TILE_WIDTH / this.sprite.width, TILE_HEIGHT / this.sprite.height);
    const scaleSize = this.isBoss ? 1.1 : 0.7;
    this.sprite.scale.set(scale * scaleSize);
    
    // Boss visual effects - glowing aura
    if (this.isBoss) {
      // Add a pulsing aura behind the boss
      this.aura = new PIXI.Graphics();
      this.aura.zIndex = -1;
      this.addChild(this.aura);
      
      // Tint the boss sprite to make it distinct
      this.sprite.tint = 0xff2222; // Red tint for boss
    }
    
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
    // Boss visual effect - pulsing aura
    if (this.isBoss && this.aura) {
      const pulseSize = 20 + Math.sin(performance.now() / 300) * 8;
      this.aura.clear();
      this.aura.fill(0xff3300, 0.25);
      this.aura.circle(0, 0, pulseSize);
      this.aura.fill();
    }
    
    // Existing movement update code
    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.walkAnimCounter += 0.18 * this.speed * gameSpeed;
    this.sprite.y = Math.sin(this.walkAnimCounter) * 3;
    this.sprite.rotation = Math.sin(this.walkAnimCounter) * (this.isBoss ? 0.04 : 0.08); // Less rotation for bosses
    
    let pathFactor = 1;
    if (this.waypoints && this.waypoints.length > 3) {
      const pathLength = this.waypoints.length;
      const referenceLength = 7;
      pathFactor = Math.min(Math.max(referenceLength / pathLength, 0.5), 1.5);
    }
    
    const adjustedSpeed = this.speed * gameSpeed * pathFactor;
    
    if (dist < adjustedSpeed) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.onReachedBase?.(this);
        this.destroy();
        return;
      }
    } else {
      this.x += (dx / dist) * adjustedSpeed;
      this.y += (dy / dist) * adjustedSpeed;
    }

    this.updateHpBar();
  }

  takeDamage(amount) {
    this.hp -= amount;
    
    // Play hit sound - create a new instance to allow overlapping sounds
    const hitSoundInstance = hitSound.cloneNode();
    hitSoundInstance.volume = this.isBoss ? 0.4 : 0.3; // Slightly louder for bosses
    hitSoundInstance.play().catch(e => console.warn("Could not play hit sound:", e));
    
    this.flashHit();
    this.updateHpBar();
    
    if (this.hp <= 0) {
      // Play death sound
      const deathSoundInstance = deathSound.cloneNode();
      deathSoundInstance.volume = this.isBoss ? 0.7 : 0.5; // Louder for bosses
      deathSoundInstance.play().catch(e => console.warn("Could not play death sound:", e));
      
      if (this.parent) {
        // More particles for boss death
        const particleCount = this.isBoss ? 30 : 12;
        this.spawnDeathParticles(this.parent, this.x, this.y, 
            this.isBoss ? 0xff2222 : 
            this.type === "tank" ? 0x9966ff : 
            this.type === "fast" ? 0x33ccff : 0xff3333, 
            particleCount);
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
        else if (this.type === "boss") typeTint = 0xff2222; // Red for boss
  
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