import { Enemy } from "./Enemy.jsx";

export class WaveManager {
  constructor(app , onEnemySpawned, onEnemyKilled, onEnemyReachedBase, waypoints = null) {
    this.app = app;
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyKilled = onEnemyKilled;
    this.onEnemyReachedBase = onEnemyReachedBase;
    this.currentWave = 0;
    this.activeEnemies = [];
    this.isSpawning = false;
    this.waypoints = waypoints || [];
    
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

  update(gameSpeed, gameMode) {
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

  spawnRandomWave(waveIndex) {
    if (waveIndex >= 20) {
      this.isSpawning = false;
      return; // All waves spawned
    }

    const wave = this.generateWave(waveIndex);
    let delay = 0;
    wave.enemies.forEach((enemyType) => {
      setTimeout(() => {
        this.spawnEnemy(enemyType.type, enemyType.health, enemyType.speed, enemyType.goldValue, enemyType.damageValue);
      }, delay);
      delay += wave.interval; // Delay between each enemy
    });

    setTimeout(() => {
      this.isSpawning = false;
    }, delay);
    this.currentWave++;
  }

  generateWave(waveNumber) {
    const wave = { enemies: [], interval: 500 };
    const numEnemies = Math.floor(Math.random() * (waveNumber + 5)) + waveNumber; // Increasing number of enemies
    
    for (let i = 0; i < numEnemies; i++) {
      const enemyType = this.getRandomEnemyType(waveNumber);
      wave.enemies.push(enemyType);
    }

    return wave;
  }

  spawnEnemy(type, health, speed, goldValue, damageValue) {
    const enemy = new Enemy( type, () => {
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.onEnemyDeath(enemy);
    }, this.onEnemyReachedBase, this.waypoints);
    enemy.speed = speed;
    enemy.maxHp = health;
    enemy.hp = health;
    enemy.goldValue = goldValue;
    enemy.damageValue = damageValue;
    enemy.zIndex = 4;
    enemy.onDeath = () => {
        this.onEnemyKilled(enemy);
        this.removeEnemy(enemy);
      };
      enemy.onReachedBase = () => {
        this.onEnemyReachedBase(enemy);
        this.removeEnemy(enemy);
      };
    this.app.stage.addChild(enemy);
    this.activeEnemies.push(enemy);
    // this.enemies.push(enemy);
  }

  getRandomEnemyType(waveNumber) {
    const randomValue = Math.random();
    let type = "basic";
    let health = 100;
    let speed = 1;
    let goldValue = 10;
    let damageValue = 1;

    if (randomValue < 0.3) {
      type = "fast";
      health = 50 + waveNumber * 5;
      speed = 1.5 + waveNumber * 0.05;
      goldValue = 15;
      damageValue = 0.5;
    } else if (randomValue < 0.6) {
      type = "tank";
      health = 200 + waveNumber * 10;
      speed = 0.5 + waveNumber * 0.02;
      goldValue = 20;
      damageValue = 2;
    } else {
      health = 100 + waveNumber * 8;
      speed = 0.8 + waveNumber * 0.03;
      goldValue = 10;
      damageValue = 1;
    }

    return { type: type, health: health, speed: speed, goldValue: goldValue, damageValue: damageValue };
  }
}