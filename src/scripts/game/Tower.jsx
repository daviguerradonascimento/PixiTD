import * as PIXI from "pixi.js";
import { Projectile } from "./Projectile.jsx";
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
      basic: { texture: "assets/asteroid.png",color: 0x3399ff, range: 100, cooldown: 60, upgradeCost: 50 },
      sniper: { texture: "basicTower.png",color: 0xffcc00, range: 200, cooldown: 120, upgradeCost: 80 },
      rapid: { texture: "basicTower.png",color: 0x00ff99, range: 80, cooldown: 20, upgradeCost: 60 },
      splash: { texture: "basicTower.png",color: 0xff3333, range: 100, cooldown: 80, upgradeCost: 70 },
    }[type];

    this.projectileContainer = projectileContainer;
    this.fireTimer = 0;

    
    this.interactive = true;
    this.buttonMode = true;
    this.levelText = null;

    const towerTexture = PIXI.Texture.from(type);
    this.towerSprite = new PIXI.Sprite(towerTexture);
    this.towerSprite.anchor.set(0.5, 0.5);
    const scale = Math.min(TILE_WIDTH / this.towerSprite.width, TILE_HEIGHT / this.towerSprite.height);
    this.towerSprite.scale.set(scale);
    this.addChild(this.towerSprite);

    this.position.set(x, y);  // Set the position of the tow

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

    const style = new PIXI.TextStyle({ fontSize: 12, fill: 0x000000 });
    const levelText = new PIXI.Text({text:`Lv${this.level}`, style:style});
    levelText.anchor.set(0.5);
    levelText.position.set(0, TILE_HEIGHT * 0.1); // Position below the tower
    this.addChild(levelText);
    this.levelText = levelText;
  }

  createRangeCircle() {
    this.rangeSize = this.getStat("range");
    this.cooldown = this.getStat("cooldown");

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
    return 0;
  }

  upgrade(setGold, gold) {
    const upgradeCost = this.baseStats.upgradeCost;
    if (gold >= upgradeCost) {
      setGold(gold - upgradeCost);
      this.level++;
      this.rangeSize = this.getStat("range");
      this.cooldown = this.getStat("cooldown");

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
    if ((this.fireTimer/gameSpeed) > 0) {
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
      upgradeCost: this.baseStats.upgradeCost,
    };
  }
}
