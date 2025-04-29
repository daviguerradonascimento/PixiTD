import * as PIXI from "pixi.js";

export class Projectile extends PIXI.Graphics {
  constructor(startX, startY, target) {
    super();
    this.beginFill(0xffff00);
    this.drawCircle(0, 0, 4);
    this.endFill();
    this.x = startX;
    this.y = startY;

    this.target = target;
    this.speed = 4;
  }

  update() {
    if (!this.target || this.target.destroyed) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.target.takeDamage(10);
      this.destroy();
      return;
    }

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }
}