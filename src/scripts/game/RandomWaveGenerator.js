const ENEMY_TYPES = [
  { type: 'basic', health: 100, speed: 1, goldValue: 10, damageValue: 5 },
  { type: 'fast', health: 50, speed: 2, goldValue: 15, damageValue: 3 },
  { type: 'tank', health: 200, speed: 0.5, goldValue: 20, damageValue: 10 },
];

class RandomWaveGenerator {
  constructor() {
    this.currentWave = 0;
  }
  
  generateWave(waveNumber) {
    const wave = { enemies: [], interval: 500 };
    const numEnemies = Math.floor(Math.random() * (waveNumber + 5)) + waveNumber; // Increasing number of enemies

    for (let i = 0; i < numEnemies; i++) {
      const enemyType = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
      wave.enemies.push(enemyType);
    }

    return wave;
  }

  getRandomEnemyType() {
    const difficultyFactor = Math.min(this.currentWave, ENEMY_TYPES.length - 1);
    const enemyPool = ENEMY_TYPES.slice(0, difficultyFactor + 1);
    const randomIndex = Math.floor(Math.random() * enemyPool.length);
    return enemyPool[randomIndex];
  }
}

export default RandomWaveGenerator;