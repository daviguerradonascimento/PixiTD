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

  spawnWave(index) {
    const wave = this.waves[index];
    if (!wave) return;
    this.isSpawning = true;
    let i = 0;
    const timer = setInterval(() => {
      if (!this.app || !this.app.stage) {
        clearInterval(timer);
        const timerIndex = this.spawnTimers.indexOf(timer);
        if (timerIndex !== -1) {
          this.spawnTimers.splice(timerIndex, 1);
        }
        return;
      }
      
      if (i >= wave.enemies.length) {
        clearInterval(timer);
        const timerIndex = this.spawnTimers.indexOf(timer);
        if (timerIndex !== -1) {
          this.spawnTimers.splice(timerIndex, 1);
        }
        this.currentWave++;
        this.isSpawning = false;
        return;
      }

      const enemyType = wave.enemies[i];
      // Use our spawnEnemy method that uses this.waypoints
      const baseStats = enemyBaseStats[enemyType];
      this.spawnEnemy(
        enemyType,
        baseStats.baseHealth,
        baseStats.baseSpeed,
        baseStats.goldValue,
        baseStats.baseDamage
      );
      
      i++;
    }, wave.interval);
    
    this.spawnTimers.push(timer);
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
    let delay = 0;
    
    wave.enemies.forEach((enemyType) => {
      const timer = setTimeout(() => {
        // First check if app still exists
        if (!this.app || !this.app.stage) {
          const timerIndex = this.delayTimers.indexOf(timer);
          if (timerIndex !== -1) {
            this.delayTimers.splice(timerIndex, 1);
          }
          return;
        }
        
        this.spawnEnemy(enemyType.type, enemyType.health, enemyType.speed, enemyType.goldValue, enemyType.damageValue);
        
        const timerIndex = this.delayTimers.indexOf(timer);
        if (timerIndex !== -1) {
          this.delayTimers.splice(timerIndex, 1);
        }
      }, delay);
      
      this.delayTimers.push(timer);
      delay += wave.interval; // Delay between each enemy
    });

    const finalTimer = setTimeout(() => {
      this.isSpawning = false;
      
      const timerIndex = this.delayTimers.indexOf(finalTimer);
      if (timerIndex !== -1) {
        this.delayTimers.splice(timerIndex, 1);
      }
    }, delay);
    
    this.delayTimers.push(finalTimer);
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