import { Enemy } from "./Enemy.jsx";

export class WaveManager {
  constructor(app, onEnemySpawned, onEnemyKilled = () => {}, onEnemyReachedBase = () => {}) {
    this.app = app;
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyKilled = onEnemyKilled;
    this.onEnemyReachedBase = onEnemyReachedBase;
    this.currentWave = 0;
    this.activeEnemies = [];

    this.waves = [
      { enemies: ["basic", "basic", "basic", "fast", "basic"], interval: 1000 },
      { enemies: ["fast", "fast", "basic", "tank", "basic"], interval: 900 },
      { enemies: ["tank", "tank", "fast", "fast", "basic", "basic"], interval: 800 },
    ];
  }

  start() {
    this.spawnWave(this.currentWave);
  }

  spawnWave(index) {
    const wave = this.waves[index];
    if (!wave) return;

    let i = 0;
    const timer = setInterval(() => {
      if (i >= wave.enemies.length) {
        clearInterval(timer);
        this.currentWave++;
        setTimeout(() => this.spawnWave(this.currentWave), 5000);
        return;
      }

      const enemyType = wave.enemies[i];
      const enemy = new Enemy(enemyType, () => {
        this.onEnemyKilled(enemy);
      },
      () => {
        this.onEnemyReachedBase?.(enemy); // ✅ call when base is hit
        this.activeEnemies = this.activeEnemies.filter(e => e !== enemy);
      });

      this.activeEnemies.push(enemy);
      this.app.stage.addChild(enemy);
      this.onEnemySpawned?.(enemy);
      i++;
    }, wave.interval);
  }

  update() {
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      if (!enemy.destroyed) {
        enemy.update();
        if (enemy.hp <= 0) {
          enemy.onDeath?.();
          this.app.stage.removeChild(enemy);
          this.activeEnemies.splice(i, 1);
        }
      } else {
        this.activeEnemies.splice(i, 1);
      }
    }
  }

  getEnemies() {
    return this.activeEnemies;
  }
}