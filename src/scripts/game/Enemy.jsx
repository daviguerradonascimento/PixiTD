import * as PIXI from "pixi.js";

const GRID_SIZE = 64;

export const waypointGridCoords = [
  [0, 1],
  [1, 1],
  [2, 1],
  [2, 4],
  [7, 4],
  [7, 1],
  [10, 1]
];

export const waypoints = waypointGridCoords.map(([col, row]) => ({
  x: col * GRID_SIZE + GRID_SIZE / 2,
  y: row * GRID_SIZE + GRID_SIZE / 2
}));

export class Enemy extends PIXI.Graphics {
  constructor(type = "basic", onDeath = () => {}, onReachedBase = () => {}) {
    super();

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
    this.position.set(waypoints[0].x, waypoints[0].y);

    this.onDeath = typeof onDeath === "function" ? onDeath : () => {};
    this.onReachedBase = typeof onReachedBase === "function" ? onReachedBase : () => {};
    
    this.body = new PIXI.Graphics();
    this.body.beginFill(this.color);
    this.body.drawCircle(0, 0, 16);
    this.body.endFill();
    this.addChild(this.body);

    // this.hpBar = new PIXI.Graphics();
    // this.addChild(this.hpBar);
    this.hpBarBackground = new PIXI.Graphics();
    this.addChild(this.hpBarBackground);
    this.hpBarFill = new PIXI.Graphics();
    this.addChild(this.hpBarFill);

    this.updateHpBar();
  }

  update() {
    const target = waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= waypoints.length) {
        this.onReachedBase?.(this);
        this.destroy(); // Reached base
        return;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    this.updateHpBar();
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashHit();
    this.updateHpBar();
    // console.log(`Enemy took ${amount} damage, remaining HP: ${this.hp}`);
    if (this.hp <= 0) {
      // console.log('Enemy destroyed');
      this.onDeath();
      this.destroy();
    }
  }

  // drawHPBar() {
  //   const barWidth = 32;
  //   const barHeight = 5;

  //   this.hpBarBackground.clear();
  //   this.hpBarBackground.beginFill(0x000000);
  //   this.hpBarBackground.drawRect(-barWidth / 2, -26, barWidth, barHeight);
  //   this.hpBarBackground.endFill();

  //   const hpPercent = Math.max(0, this.hp / this.maxHP);
  //   this.hpBarFill.clear();
  //   this.hpBarFill.beginFill(0x00ff00);
  //   this.hpBarFill.drawRect(-barWidth / 2, -26, barWidth * hpPercent, barHeight);
  //   this.hpBarFill.endFill();
  // }

  updateHpBar() {
    // this.hpBar.clear();
    const barWidth = 32;
      const barHeight = 5;
  
      this.hpBarBackground.clear();
      this.hpBarBackground.beginFill(0x000000);
      this.hpBarBackground.drawRect(-barWidth / 2, -26, barWidth, barHeight);
      this.hpBarBackground.endFill();
  
      const hpPercent = Math.max(0, this.hp / this.maxHp);
      this.hpBarFill.clear();
      this.hpBarFill.beginFill(0x00ff00);
      this.hpBarFill.drawRect(-barWidth / 2, -26, barWidth * hpPercent, barHeight);
      this.hpBarFill.endFill();
  }

  flashHit() {
    this.body.tint = 0xffffff;
    setTimeout(() => {
      this.body.tint = 0xff3333;
    }, 100);
  }

}
