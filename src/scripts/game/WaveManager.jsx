import { Enemy, enemyBaseStats } from "./Enemy.jsx";

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
    let selectedType = "basic";

    if (randomValue < 0.3 && waveNumber > 1) { // Introduce fast enemies after wave 1
      selectedType = "fast";
    } else if (randomValue < 0.6 && waveNumber > 2) { // Introduce tank enemies after wave 2
      selectedType = "tank";
    } else {
      selectedType = "basic";
    }

    const baseStats = enemyBaseStats[selectedType];

    // Apply scaling based on wave number
    const health = Math.round(baseStats.baseHealth + waveNumber * (baseStats.baseHealth * 0.1)); // +10% base health per wave
    const speed = baseStats.baseSpeed; 
    const damageValue = baseStats.baseDamage + waveNumber * (baseStats.baseDamage * 0.05); // +5% base damage per wave
    const goldValue = baseStats.goldValue; // Keep gold value constant or scale differently if needed

    return {
      type: selectedType,
      health: health,
      speed: speed,
      goldValue: goldValue,
      damageValue: damageValue
    };
  }
}