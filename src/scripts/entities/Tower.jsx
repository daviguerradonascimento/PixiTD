import * as PIXI from "pixi.js";
import { Projectile, BasicProjectile, SplashProjectile, RapidProjectile, SniperProjectile } from "./Projectile";
import { gridConsts, TILE_WIDTH, TILE_HEIGHT } from "../utils/gridUtils";

export class Tower extends PIXI.Container {
  constructor(x, y, projectileContainer, type = "basic") {
    super();
    // super();
    this.type = type;
    this.level = 1;
    this.isSelected = false;
    this.highlight = new PIXI.Graphics();
    this.addChild(this.highlight);

    this.range = new PIXI.Graphics();
    this.addChild(this.range);

    this.baseStats = Tower.prototype.baseStats[type];

    this.projectileContainer = projectileContainer;
    this.fireTimer = 0;


    this.interactive = true;
    this.buttonMode = true;
    this.levelText = null;

    this.drawHighlight(); 
    this.createRangeCircle();

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

    
    this.range.fill({color:this.baseStats.color, alpha: 0.3});
    this.range.circle(0, 0, this.rangeSize);
    this.range.fill();
    this.range.visible = false;
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
      this.highlight.stroke();
    }
    this.highlight.visible = this.isSelected;

  }

  setSelected(isSelected) {
    this.isSelected = isSelected;
    this.range.visible = isSelected;
    this.drawHighlight(); // Update highlight visibility
  }

  getStat(stat) {
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
      this.range.fill({color:this.baseStats.color, alpha: 0.3});
      this.range.circle(0, 0, this.rangeSize);
      this.range.fill();
      
      this.drawLevelText(); // Redraw with new level
    } 
    else {
      console.log("Not enough gold to upgrade!");
    }
  }

  update(enemies, gameSpeed) {
    if (this.fireTimer > 0) {
      this.fireTimer -= gameSpeed;
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
  basic:   { damage: 8, color: 0x3399ff, range: 100, cooldown: 50, upgradeCost: 75, buildCost: 50, targetStrategy: "first" },
  sniper:  { damage: 15, color: 0xffcc00, range: 200, cooldown: 100, upgradeCost: 110, buildCost: 80, targetStrategy: "strongest" },
  rapid:   { damage: 3, color: 0xffb300, range: 80, cooldown: 15, upgradeCost: 85, buildCost: 65, targetStrategy: "closest" },
  splash:  { damage: 5, color: 0xff3333, range: 110, cooldown: 70, upgradeCost: 90, buildCost: 75, targetStrategy: "first" },
};