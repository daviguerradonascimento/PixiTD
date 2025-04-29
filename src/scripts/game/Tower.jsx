import * as PIXI from "pixi.js";
import { Projectile } from "./Projectile.jsx";

export class Tower extends PIXI.Graphics {
  constructor(x, y, projectileContainer) {
    super();
    this.beginFill(0x3399ff);
    this.drawRect(-16, -16, 32, 32);
    this.endFill();
    this.position.set(x, y);
    this.interactive = true;
    this.buttonMode = true;

    this.rangeSize = 100;
    this.cooldown = 60; // frames
    this.fireTimer = 0;
    this.projectileContainer = projectileContainer;

    // Optional: show range circle on hover
    this.range = new PIXI.Graphics();
    this.range.beginFill(0x3399ff, 0.1);
    this.range.drawCircle(0, 0, this.rangeSize);
    this.range.endFill();
    this.range.visible = false;
    this.addChild(this.range);

    this.on("pointerover", () => (this.range.visible = true));
    this.on("pointerout", () => (this.range.visible = false));
  }

  update(enemies) {

    if (this.fireTimer > 0) {
      this.fireTimer--;
      return;
    }
    // Find first enemy in range
    for (const enemy of enemies) {
      if (!enemy || enemy.destroyed) { // Check if enemy is valid
        continue;
      }
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // console.log(dist, this.rangeSize);
      if (dist <= this.rangeSize) {
        this.attack(enemy);
        this.fireTimer = this.cooldown;
        break;
      }
    }
  }

  attack(enemy) {
    console.log("Attacking enemy at", enemy.x, enemy.y);
    const projectile = new Projectile(this.x, this.y, enemy);
    this.projectileContainer.addChild(projectile);
  }
}
