import * as PIXI from "pixi.js";
import { Projectile } from "./Projectile.jsx";

export class Tower extends PIXI.Graphics {
  constructor(x, y, projectileContainer, type = "basic") {
    super();
    this.type = type;
    this.level = 1;

    this.baseStats = {
      basic: { color: 0x3399ff, range: 100, cooldown: 60 },
      sniper: { color: 0xffcc00, range: 200, cooldown: 120 },
      rapid: { color: 0x00ff99, range: 80, cooldown: 20 },
      splash: { color: 0xff3333, range: 100, cooldown: 80 },
    }[type];

    this.projectileContainer = projectileContainer;
    this.fireTimer = 0;

    this.position.set(x, y);
    this.interactive = true;
    this.buttonMode = true;

    this.drawTower();
    this.createRangeCircle();

    this.on("pointerdown", () => {
      this.range.visible = !this.range.visible;
      if (this.onSelect) this.onSelect(this);
    });
    this.on("pointerout", () => (this.range.visible = false));
  }

  drawTower() {
    this.clear();
    this.beginFill(this.baseStats.color);
    this.drawRect(-16, -16, 32, 32);
    this.endFill();

    // Optional: level label
    const style = new PIXI.TextStyle({ fontSize: 10, fill: 0xffffff });
    const levelText = new PIXI.Text(`Lv${this.level}`, style);
    levelText.anchor.set(0.5);
    levelText.position.set(0, -24);
    this.addChild(levelText);
  }

  createRangeCircle() {
    this.rangeSize = this.getStat("range");
    this.cooldown = this.getStat("cooldown");

    this.range = new PIXI.Graphics();
    this.range.beginFill(this.baseStats.color, 0.1);
    this.range.drawCircle(0, 0, this.rangeSize);
    this.range.endFill();
    this.range.visible = false;
    this.addChild(this.range);
  }

  getStat(stat) {
    // Example stat scaling per level
    if (stat === "range") return this.baseStats.range + this.level * 10;
    if (stat === "cooldown") return Math.max(10, this.baseStats.cooldown - this.level * 5);
    return 0;
  }

  upgrade() {
    this.level++;
    this.rangeSize = this.getStat("range");
    this.cooldown = this.getStat("cooldown");

    this.range.clear();
    this.range.beginFill(this.baseStats.color, 0.1);
    this.range.drawCircle(0, 0, this.rangeSize);
    this.range.endFill();

    this.drawTower(); // Redraw with new level
  }

  update(enemies) {
    if (this.fireTimer > 0) {
      this.fireTimer--;
      return;
    }

    for (const enemy of enemies) {
      if (!enemy || enemy.destroyed) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.rangeSize) {
        this.attack(enemy);
        this.fireTimer = this.cooldown;
        break;
      }
    }
  }

  attack(enemy) {
    if (this.type === "splash") {
      for (const other of enemy._enemyList || []) {
        if (!other || other.destroyed) continue;
        const dx = other.x - enemy.x;
        const dy = other.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          const projectile = new Projectile(this.x, this.y, other);
          this.projectileContainer.addChild(projectile);
        }
      }
    } else {
      const projectile = new Projectile(this.x, this.y, enemy);
      this.projectileContainer.addChild(projectile);
    }
  }
}
