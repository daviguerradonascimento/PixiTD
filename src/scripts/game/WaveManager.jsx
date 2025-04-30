import { Enemy } from "./Enemy.jsx";

export class WaveManager {
  constructor(app, onEnemySpawned, onEnemyKilled, onEnemyReachedBase) {
    this.app = app;
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyKilled = onEnemyKilled;
    this.onEnemyReachedBase = onEnemyReachedBase;
    this.currentWave = 0;
    this.activeEnemies = [];
    this.isSpawning = false;

    this.waves = [
      { enemies: ["basic", "basic", "basic"], interval: 1000 },
      { enemies: ["fast", "fast", "basic"], interval: 900 },
      { enemies: ["tank", "tank", "fast"], interval: 800 },
    ];
  }

  start() {
    this.spawnWave(this.currentWave);
  }

  spawnWave(index) {
    const wave = this.waves[index];
    if (!wave) return;
    this.isSpawning = true;
    let i = 0;
    const timer = setInterval(() => {
      if (i >= wave.enemies.length) {
        clearInterval(timer);
        this.currentWave++;
        this.isSpawning = false;
        return;
      }

      const enemyType = wave.enemies[i];
      const enemy = new Enemy(enemyType);
      enemy.onDeath = () => {
        this.onEnemyKilled(enemy);
        this.removeEnemy(enemy);
      };
      enemy.onReachedBase = () => {
        this.onEnemyReachedBase(enemy);
        this.removeEnemy(enemy);
      };

      this.activeEnemies.push(enemy);
      this.app.stage.addChild(enemy);
      this.onEnemySpawned?.(enemy);
      i++;
    }, wave.interval);
  }

  update(gameSpeed) {
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      enemy.update(gameSpeed);
    }
  }

  removeEnemy(enemy) {
    this.app.stage.removeChild(enemy);
    this.activeEnemies = this.activeEnemies.filter((e) => e !== enemy);
  }

  getEnemies() {
    return this.activeEnemies;
  }

  isWaveComplete() {
    return this.activeEnemies.length === 0 && this.isSpawning === false;
  }
}