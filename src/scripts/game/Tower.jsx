import * as PIXI from "pixi.js";
import { Projectile, BasicProjectile, SplashProjectile, RapidProjectile, SniperProjectile } from "./Projectile.jsx";
import { TILE_WIDTH, TILE_HEIGHT } from "./gridUtils.js";

export class Tower extends PIXI.Container {
  constructor(x, y, projectileContainer, type = "basic") {
    super();
    // super();
    this.type = type;
    this.level = 1;
    this.isSelected = false;
    this.highlight = new PIXI.Graphics();


    this.baseStats = {
      basic:   { damage: 5, color: 0x3399ff, range: 100, cooldown: 60, upgradeCost: 50, buildCost: 50, targetStrategy: "first" },
      sniper:  { damage: 7, color: 0xffcc00, range: 200, cooldown: 120, upgradeCost: 80, buildCost: 75, targetStrategy: "strongest" },
      rapid:   { damage: 3, color: 0x00ff99, range: 80, cooldown: 20, upgradeCost: 60, buildCost: 60, targetStrategy: "closest" },
      splash:  { damage: 2, color: 0xff3333, range: 100, cooldown: 80, upgradeCost: 70, buildCost: 70, targetStrategy: "first" },
    }[type];

    this.projectileContainer = projectileContainer;
    this.fireTimer = 0;

    
    this.interactive = true;
    this.buttonMode = true;
    this.levelText = null;

    const towerTexture = PIXI.Texture.from(type);
    towerTexture.source.scaleMode = 'nearest';
    this.towerSprite = new PIXI.Sprite(towerTexture);
    this.towerSprite.anchor.set(0.5, 0.7);
    const scale = Math.min(TILE_WIDTH / this.towerSprite.width, TILE_HEIGHT / this.towerSprite.height);
    const scaleSize = 1.2;
    this.towerSprite.scale.set(scale*scaleSize);
    this.addChild(this.towerSprite);

    this.position.set(x, y); 

    this.drawLevelText();
    this.createRangeCircle();
    this.drawHighlight(); 

    this.position.set(x, y );
    this.on("pointerdown", () => {
      this.setSelected(!this.isSelected);
      if (this.onSelect) this.onSelect(this);
    });
    // this.on("pointerout", () => (this.range.visible = false));
    this.on("pointerover", this.onTowerHover);
    this.on("pointerout", this.onTowerOut);
  }

  drawLevelText() {
    if (this.levelText) {
      this.removeChild(this.levelText);
      this.levelText.destroy();
    }
  
    const style = new PIXI.TextStyle({
      fontFamily: "Segoe UI, Arial, sans-serif",
      fontSize: 15, 
      fontWeight: "bold",
      fill: "#ffe066",
      stroke: "#222",
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: "#000",
      dropShadowBlur: 4,
      dropShadowDistance: 2,
      align: "center",
    });
  
    const levelText = new PIXI.Text(`Lv${this.level}`, style, 3);
    levelText.anchor.set(0.5);
    levelText.position.set(0, TILE_HEIGHT * 0.1);
  
    levelText.scale.set(0.5);
  
    this.addChild(levelText);
    this.levelText = levelText;
  }

  createRangeCircle() {
    this.rangeSize = this.getStat("range");
    this.cooldown = this.getStat("cooldown");
    this.damage = this.getStat("damage");

    this.range = new PIXI.Graphics();
    this.range.fill({color:this.baseStats.color, alpha: 0.1});
    this.range.circle(0, 0, this.rangeSize);
    this.range.fill();
    this.range.visible = false;
    this.addChild(this.range);
  }

  drawHighlight() {
    this.highlight.clear();
    if (this.isSelected) {
      const halfW = 32;
      const halfH = 16;
      this.highlight.setStrokeStyle({ width: 2, color: 0xffff00 });
      this.highlight.moveTo(0, -halfH );       
      this.highlight.lineTo(halfW, 0 );        
      this.highlight.lineTo(0, halfH );        
      this.highlight.lineTo(-halfW, 0 );       
      this.highlight.lineTo(0, -halfH );  
      // this.highlight.rect(0 , 0, 36, 36);
      this.highlight.stroke();
      // this.highlight.fill();
    }
    this.highlight.visible = this.isSelected;
    this.addChild(this.highlight);
  }

  setSelected(isSelected) {
    this.isSelected = isSelected;
    this.range.visible = isSelected;
    this.drawHighlight(); // Update highlight visibility
  }

  getStat(stat) {
    // Example stat scaling per level
    if (stat === "range") return this.baseStats.range + this.level * 10;
    if (stat === "cooldown") return Math.max(10, this.baseStats.cooldown - this.level * 5);
    if (stat === "damage") return this.baseStats.damage + this.level * 2;
    return 0;
  }

  upgrade(setGold, gold) {
    const upgradeCost = this.baseStats.upgradeCost;
    if (gold >= upgradeCost) {
      setGold(gold - upgradeCost);
      this.level++;
      this.rangeSize = this.getStat("range");
      this.cooldown = this.getStat("cooldown");
      this.damage = this.getStat("damage");

      this.range.clear();
      this.range.fill({color:this.baseStats.color, alpha: 0.1});
      this.range.circle(0, 0, this.rangeSize);
      this.range.fill();
      
      this.setSelected(!this.isSelected);
      this.drawLevelText(); // Redraw with new level
    } 
    else {
      console.log("Not enough gold to upgrade!");
      // Optionally, display a message to the player
    }
  }

  update(enemies, gameSpeed) {
    if ((this.fireTimer / gameSpeed) > 0) {
      this.fireTimer--;
      return;
    }
  
    const target = this.getTarget(enemies);
    if (target) {
      this.attack(target, enemies);
      this.fireTimer = this.cooldown;
    }
  }

  attack(enemy, enemies) {
    if (this.type === "splash") {
      for (const other of enemies) {
        if (!other || other.destroyed) continue;
          const projectile = new SplashProjectile(this.x, this.y, other, this.baseStats.damage);
          this.projectileContainer.addChild(projectile);
      }
    } else {
      switch (this.type) {
        case "sniper":
          const sniper = new SniperProjectile(this.x, this.y, enemy, this.baseStats.damage);
          this.projectileContainer.addChild(sniper);
          break;
        case "rapid":
          const rapid = new RapidProjectile(this.x, this.y, enemy, this.baseStats.damage);
          this.projectileContainer.addChild(rapid);
          break;
        case "basic":
        default:
          const basic = new BasicProjectile(this.x, this.y, enemy, this.baseStats.damage);
          this.projectileContainer.addChild(basic);
          break;
      }
      
    }
  }

  getTarget(enemies) {
    const inRange = enemies.filter(
      (enemy) =>
        enemy &&
        !enemy.destroyed &&
        Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2) <= this.rangeSize
    );
    if (inRange.length === 0) return null;
  
    switch (this.baseStats.targetStrategy) {
      case "closest":
        return inRange.reduce((a, b) =>
          Math.hypot(a.x - this.x, a.y - this.y) < Math.hypot(b.x - this.x, b.y - this.y) ? a : b
        );
      case "strongest":
        return inRange.reduce((a, b) => (a.hp > b.hp ? a : b));
      case "first":
      default:
        // Assuming enemies[0] is the first in path; adjust as needed for your enemy logic
        return inRange[0];
    }
  }

  onTowerHover = (event) => {
    this.isHovered = true;
    if (this.onHover) {
      this.onHover(this.getTowerStats(), event.data.global.x, event.data.global.y);
    }
  };
  
  onTowerOut = () => {
    this.isHovered = false;
    if (this.onOut) {
      this.onOut();
    }
  };
  
  getTowerStats() {
    return {
      type: this.type,
      level: this.level,
      range: this.rangeSize,
      cooldown: this.cooldown,
      damage: this.getStat("damage"),
      upgradeCost: this.baseStats.upgradeCost,
    };
  }
}

Tower.prototype.baseStats = {
  basic:   { damage: 5, color: 0x3399ff, range: 100, cooldown: 60, upgradeCost: 50, buildCost: 50, targetStrategy: "first" },
  sniper:  { damage: 7, color: 0xffcc00, range: 200, cooldown: 120, upgradeCost: 80, buildCost: 75, targetStrategy: "strongest" },
  rapid:   { damage: 3, color: 0x00ff99, range: 80, cooldown: 20, upgradeCost: 60, buildCost: 60, targetStrategy: "closest" },
  splash:  { damage: 2, color: 0xff3333, range: 100, cooldown: 80, upgradeCost: 70, buildCost: 70, targetStrategy: "first" },
};