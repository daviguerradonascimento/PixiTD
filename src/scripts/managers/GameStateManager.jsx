import { useEffect, useState, useRef } from 'react';

export default function useGameState(gameMode, layoutConfig) {
  // Core game state
  const [baseHealth, setBaseHealth] = useState(20);
  const [gold, setGold] = useState(100);
  const [gameState, setGameState] = useState("build");
  const [currentWave, setCurrentWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  
  // Grid/map related state
  const [grid, setGrid] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [gridWaypoints, setGridWaypoints] = useState([]);
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(6);
  
  // Tower related state
  const [placedTowers, setPlacedTowers] = useState([]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const [draggingTowerType, setDraggingTowerType] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, stats: {} });
  
  // Refs for values that need to be accessed in callbacks
  const goldRef = useRef(gold);
  const gameStateRef = useRef(gameState);
  const gridWaypointsRef = useRef(null);
  const waypointsRef = useRef(waypoints);
  const placedTowersRef = useRef(placedTowers);
  const selectedTowerRef = useRef(selectedTower);
  const selectedTowerTypeRef = useRef(selectedTowerType);
  
  // Update refs when state changes
  useEffect(() => { goldRef.current = gold; }, [gold]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gridWaypointsRef.current = gridWaypoints; }, [gridWaypoints]);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);
  useEffect(() => { placedTowersRef.current = placedTowers; }, [placedTowers]);
  useEffect(() => { selectedTowerRef.current = selectedTower; }, [selectedTower]);
  useEffect(() => { selectedTowerTypeRef.current = draggingTowerType; }, [draggingTowerType]);
  
  // Set grid dimensions based on game mode
  useEffect(() => {
    if (!gameMode) return;
    if (gameMode === "infinity") {
      setCols(Math.floor(Math.random() * 10) + 10);
      setRows(Math.floor(Math.random() * 8) + 8);
    } else if (layoutConfig) {
      setCols(layoutConfig.cols || 10);
      setRows(layoutConfig.rows || 6);
    } else {
      setCols(10);
      setRows(6);
    }
  }, [gameMode, layoutConfig]);
  
  // Game over condition
  useEffect(() => {
    if (baseHealth <= 0 && gameState !== "gameover") {
      setGameState("gameover");
    }
  }, [baseHealth, gameState]);
  
  // Game control methods
  const startWave = (waveManager) => {
    if (gameState !== "wave" && waveManager) {
      if (gameMode === "infinity") {
        waveManager.spawnRandomWave(currentWave);
      } else {
        waveManager.start();
      }
      setGameState("wave");
    }
  };
  
  const togglePause = () => {
    setIsPaused(p => !p);
    isPausedRef.current = !isPausedRef.current;
  };
  
  return {
    // State
    baseHealth, setBaseHealth,
    gold, setGold,
    gameState, setGameState,
    currentWave, setCurrentWave,
    gameSpeed, setGameSpeed,
    isPaused, isPausedRef,
    grid, setGrid,
    waypoints, setWaypoints,
    gridWaypoints, setGridWaypoints,
    cols, rows,
    placedTowers, setPlacedTowers,
    selectedTower, setSelectedTower,
    draggingTowerType, setDraggingTowerType,
    ghostPos, setGhostPos,
    tooltip, setTooltip,
    
    // Refs
    goldRef,
    gameStateRef,
    gridWaypointsRef,
    waypointsRef,
    placedTowersRef,
    selectedTowerRef,
    
    // Methods
    startWave,
    togglePause
  };
}