import { Enemy, enemyBaseStats } from "../entities/Enemy";

export class WaveManager {
  constructor(app, onEnemySpawned, onEnemyKilled, onEnemyReachedBase, customWaypoints = null, options = {}) {
    this.app = app;
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyKilled = onEnemyKilled;
    this.onEnemyReachedBase = onEnemyReachedBase;
    this.currentWave = 0;
    this.gameSpeed = 1;
    this.activeEnemies = [];
    this.isSpawning = false;
    this.isPaused = false;

    // Store custom waypoints if provided
    this.waypoints = customWaypoints || waypoints;
    this.options = options;

    this.spawnTimers = [];
    this.delayTimers = [];

    // Add a flag to track if the current wave is a boss wave
    this.isBossWave = false;

    this.waves = [
      { enemies: ["basic", "basic", "basic"], interval: 1500 },
      { enemies: ["basic", "basic", "basic", "basic"], interval: 1300 },
      { enemies: ["basic", "basic", "fast", "fast"], interval: 1200 },
      { enemies: ["basic", "basic", "fast", "fast", "basic"], interval: 1100 },
      // Wave 5: First boss wave
      { enemies: ["boss", "basic", "fast", "fast"], interval: 2000, isBossWave: true },
      { enemies: ["fast", "fast", "fast", "tank", "basic", "basic"], interval: 900 },
      { enemies: ["tank", "tank", "basic", "basic", "fast", "fast"], interval: 800 },
      { enemies: ["tank", "fast", "fast", "fast", "basic", "basic", "basic"], interval: 750 },
      { enemies: ["tank", "tank", "fast", "fast", "basic", "basic", "basic"], interval: 700 },
      // Wave 10: Second boss wave
      { enemies: ["boss", "boss", "tank", "fast", "fast"], interval: 2200, isBossWave: true },
    ];
  }

  start() {
    this.spawnWave(this.currentWave);
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  spawnWave(index) {
    const wave = this.waves[index];
    if (!wave) return;

    // Set boss wave flag
    this.isBossWave = !!wave.isBossWave;
    this.isSpawning = true;

    // Add a delay before boss waves to build anticipation
    const initialDelay = this.isBossWave ? 2000 : 0;

    setTimeout(() => {
      // If this is a boss wave, send a warning notification
      if (this.isBossWave && this.options.onBossWave) {
        this.options.onBossWave();
      }

      let i = 0;
      let lastSpawnTime = Date.now();

      const spawnNext = () => {
        if (!this.app || !this.app.stage) {
          this.isSpawning = false;
          return;
        }

        // If paused, just reschedule the check
        if (this.isPaused) {
          const timer = setTimeout(spawnNext, 100);
          this.spawnTimers.push(timer);
          return;
        }

        const now = Date.now();
        const elapsed = now - lastSpawnTime;
        const adjustedInterval = wave.interval / this.gameSpeed;

        if (elapsed >= adjustedInterval) {
          if (i >= wave.enemies.length) {
            this.currentWave++;
            this.isSpawning = false;
            return;
          }

          const enemyType = wave.enemies[i];
          const baseStats = enemyBaseStats[enemyType];
          this.spawnEnemy(
            enemyType,
            baseStats.baseHealth,
            baseStats.baseSpeed,
            baseStats.goldValue,
            baseStats.baseDamage
          );

          i++;
          lastSpawnTime = now;
        }

        const checkInterval = Math.max(16, Math.min(adjustedInterval / 4, 100));
        const timer = setTimeout(spawnNext, checkInterval);
        this.spawnTimers.push(timer);
      };

      spawnNext();
    }, initialDelay);
  }

  update(gameSpeed, gameMode) {
    this.gameSpeed = gameSpeed;
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
    this.isSpawning = true;
    const wave = this.generateWave(waveIndex);

    let enemyIndex = 0;
    let lastSpawnTime = Date.now();

    const spawnNextRandom = () => {
      if (!this.app || !this.app.stage) {
        this.isSpawning = false;
        return;
      }

      if (this.isPaused) {
        const timer = setTimeout(spawnNextRandom, 100);
        this.delayTimers.push(timer);
        return;
      }

      const now = Date.now();
      const elapsed = now - lastSpawnTime;
      const adjustedInterval = wave.interval / this.gameSpeed;

      if (elapsed >= adjustedInterval) {
        if (enemyIndex >= wave.enemies.length) {
          this.isSpawning = false;
          this.currentWave++;
          return;
        }

        const enemyType = wave.enemies[enemyIndex];
        this.spawnEnemy(
          enemyType.type,
          enemyType.health,
          enemyType.speed,
          enemyType.goldValue,
          enemyType.damageValue
        );

        enemyIndex++;
        lastSpawnTime = now;
      }

      const checkInterval = Math.max(16, Math.min(adjustedInterval / 4, 100));
      const timer = setTimeout(spawnNextRandom, checkInterval);
      this.delayTimers.push(timer);
    };

    spawnNextRandom();
  }

  generateWave(waveNumber) {
    // Every 5th wave is a boss wave
    const isBossWave = waveNumber % 5 === 0 && waveNumber > 0;

    const wave = {
      enemies: [],
      interval: isBossWave ? 2000 : 500, // Longer interval for boss waves
      isBossWave
    };

    // Base number of enemies decreases for boss waves
    const baseEnemyCount = isBossWave ?
      Math.floor(Math.random() * 3) + 3 : // 3-5 enemies for boss waves
      Math.floor(Math.random() * (waveNumber + 5)) + waveNumber; // Normal formula for regular waves

    if (isBossWave) {
      // 1-2 bosses based on wave number
      const bossCount = Math.min(Math.floor(waveNumber / 10) + 1, 3);

      // Add bosses to the beginning of the wave
      for (let i = 0; i < bossCount; i++) {
        const bossStats = this.getEnemyStats("boss", waveNumber);
        wave.enemies.push(bossStats);
      }

      // Add some regular enemies after bosses
      for (let i = 0; i < baseEnemyCount - bossCount; i++) {
        const enemyType = this.getRandomEnemyType(waveNumber);
        wave.enemies.push(enemyType);
      }

      // Notify boss wave if callback exists
      if (this.options.onBossWave) {
        setTimeout(() => this.options.onBossWave(), 0);
      }
    } else {
      // Regular wave
      for (let i = 0; i < baseEnemyCount; i++) {
        const enemyType = this.getRandomEnemyType(waveNumber);
        wave.enemies.push(enemyType);
      }
    }

    return wave;
  }

  spawnEnemy(type, health, speed, goldValue, damageValue) {
    if (!this.app || !this.app.stage) {
      return;
    }

    // Create enemy with the stored waypoints
    const enemy = new Enemy(
      type,
      () => {
        this.onEnemyKilled(enemy);
        this.removeEnemy(enemy);
      },
      (e) => {
        this.onEnemyReachedBase(e);
        this.removeEnemy(e);
      },
      this.waypoints // Use the stored waypoints
    );

    // Rest of the method remains the same
    enemy.speed = speed;
    enemy.maxHp = health;
    enemy.hp = health;
    enemy.goldValue = goldValue;
    enemy.damageValue = damageValue;
    enemy.zIndex = 4;

    this.app.stage.addChild(enemy);
    this.activeEnemies.push(enemy);
  }

  getEnemyStats(type, waveNumber) {
    const baseStats = enemyBaseStats[type];

    // Apply scaling based on wave number
    const scaleFactor = type === "boss" ? 1 + (waveNumber * 0.1) : 1 + (waveNumber * 0.1);
    const health = Math.round(baseStats.baseHealth * scaleFactor);
    const speed = baseStats.baseSpeed;
    const damageValue = baseStats.baseDamage + Math.floor(waveNumber * (baseStats.baseDamage * 0.05));
    const goldValue = baseStats.goldValue + Math.floor(waveNumber / 3);

    return {
      type: type,
      health: health,
      speed: speed,
      goldValue: goldValue,
      damageValue: damageValue
    };
  }

  getRandomEnemyType(waveNumber) {
    const randomValue = Math.random();
    let selectedType = "basic";

    if (randomValue < 0.3 && waveNumber > 1) {
      selectedType = "fast";
    } else if (randomValue < 0.6 && waveNumber > 2) {
      selectedType = "tank";
    } else {
      selectedType = "basic";
    }

    return this.getEnemyStats(selectedType, waveNumber);
  }

  cleanup() {
    // Clear all spawn interval timers
    this.spawnTimers.forEach(timer => clearInterval(timer));
    this.spawnTimers = [];

    // Clear all setTimeout timers
    this.delayTimers.forEach(timer => clearTimeout(timer));
    this.delayTimers = [];

    // Remove all active enemies
    this.activeEnemies.forEach(enemy => {
      if (enemy && enemy.parent) {
        enemy.parent.removeChild(enemy);
      }
    });
    this.activeEnemies = [];

    // Set spawning to false
    this.isSpawning = false;
  }
}