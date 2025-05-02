import { Enemy, enemyBaseStats } from "./Enemy.jsx";

export class WaveManager {
  constructor(app, onEnemySpawned, onEnemyKilled, onEnemyReachedBase, customWaypoints = null, options = {}) {
    this.app = app;
    this.onEnemySpawned = onEnemySpawned;
    this.onEnemyKilled = onEnemyKilled;
    this.onEnemyReachedBase = onEnemyReachedBase;
    this.currentWave = 0;
    this.activeEnemies = [];
    this.isSpawning = false;
    this.isPaused = false;
    
    // Store custom waypoints if provided
    this.waypoints = customWaypoints || waypoints;
    this.options = options;
    
    this.spawnTimers = [];
    this.delayTimers = [];
    
    this.waves = [
      { enemies: ["basic", "basic", "basic"], interval: 1000 },
      { enemies: ["fast", "fast", "basic"], interval: 900 },
      { enemies: ["tank", "tank", "fast"], interval: 800 },
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
    this.isSpawning = true;
    
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
      
      if (elapsed >= wave.interval) {
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
      
      const checkInterval = Math.max(16, Math.min(wave.interval / 4, 100));
      const timer = setTimeout(spawnNext, checkInterval);
      this.spawnTimers.push(timer);
    };
    
    spawnNext();
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
      
      if (elapsed >= wave.interval) {
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
      
      const checkInterval = Math.max(16, Math.min(wave.interval / 4, 100));
      const timer = setTimeout(spawnNextRandom, checkInterval);
      this.delayTimers.push(timer);
    };
    
    spawnNextRandom();
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