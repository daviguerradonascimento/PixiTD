import * as PIXI from "pixi.js";

export class Projectile extends PIXI.Graphics {
  constructor(startX, startY, target,color = '0xffff00', damage) {
    super();

    this.x = startX;
    this.y = startY;
    this.color = color;

    this.target = target;
    this.damage = damage;
    this.speed = 2;

    this.drawShape();
  }

  drawShape() {
    this.fill(this.color);
    this.circle(0, 0, 4); 
    this.fill();
  }

  update(gameSpeed) {
    console.log(this.damage,this.color);
    if (!this.target || this.target.destroyed) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed * gameSpeed) {
      this.target.takeDamage(this.damage);
      this.destroy();
      return;
    }

    this.x += (dx / dist) * (this.speed * gameSpeed);
    this.y += (dy / dist) * (this.speed * gameSpeed);
  }
}

export class BasicProjectile extends Projectile {
  constructor(startX, startY, target, damage) {
    super(startX, startY, target, 0x3399ff, damage); 
  }
}

export class SniperProjectile extends Projectile {
  constructor(startX, startY, target, damage) {
    super(startX, startY, target, 0xffcc00, damage); 
  }
  drawShape() {
    this.fill(this.color);
    this.poly([
      0, -10,  // Top point
      5, 0,    // Right point
      0, 10,   // Bottom point
      -5, 0,   // Left point
    ]); // Diamond shape
    this.fill();
  }
}

export class RapidProjectile extends Projectile {
  constructor(startX, startY, target, damage) {
    super(startX, startY, target, 0x00ff99, damage);
  }
  drawShape() {
    this.fill(this.color);
    this.ellipse(0, 0, 6, 3); 
    this.fill();
  }
}

export class SplashProjectile extends Projectile {
  constructor(startX, startY, target, damage) {
    super(startX, startY, target, 0xff3333, damage); 
  }

  drawShape() {
    this.fill(this.color);
    this.drawPolygon([
      -5, -5,
      5, -5,
      0, 5,
    ]); 
    this.fill();
  }
}