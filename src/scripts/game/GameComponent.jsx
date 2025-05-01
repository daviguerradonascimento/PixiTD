import React, { useState, useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Assets } from "pixi.js";
import { Enemy, waypoints, waypointGridCoords } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { ProceduralLevelGenerator } from "./ProceduralLevelGenerator.js";
import { WaveManager } from "./WaveManager.jsx";
import {
  toIsometric,
  getBlockedTiles,
  drawIsometricGrid,
  gridConsts,
} from "./gridUtils";
import asteroidImage from "../../sprites/basic.png";
import sniperImage from "../../sprites/sniper.png";
import Tooltip from "./Tooltip.jsx";
import {
  TowerTypeButton,
  GameControlButton,
  GameInfo,
  TowerActionButtons,
} from "./GameUIComponents.jsx";
import {
  handlePlacement,
  sellTower as sellTowerLogic,
} from "./towerUtils.js";

const DEFAULT_COLS = 10;
const DEFAULT_ROWS = 6;
const REFUND_PERCENTAGE = 0.7;

export default function TowerDefenseGame({ gameMode }) {
  // --- States ---
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const [selectedTower, setSelectedTower] = useState(null);
  const [baseHealth, setBaseHealth] = useState(10);
  const [gold, setGold] = useState(100);
  const [gameState, setGameState] = useState("build");
  const [currentWave, setCurrentWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [grid, setGrid] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [gridWaypoints, setGridWaypoints] = useState([]);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [placedTowers, setPlacedTowers] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, stats: {} });

  // --- Refs ---
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const goldRef = useRef(gold);
  const gameStateRef = useRef(gameState);
  const waveManagerRef = useRef(null);
  const gridWaypointsRef = useRef(null);
  const waypointsRef = useRef(waypoints);
  const placedTowersRef = useRef(placedTowers);
  const selectedTowerRef = useRef(selectedTower);

  // --- Effects ---
  useEffect(() => { goldRef.current = gold; }, [gold]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gridWaypointsRef.current = gridWaypoints; }, [gridWaypoints]);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);
  useEffect(() => { placedTowersRef.current = placedTowers; }, [placedTowers]);
  useEffect(() => { selectedTowerRef.current = selectedTower; }, [selectedTower]);

  useEffect(() => {
    if (!gameMode) return;
    if (gameMode === "infinity") {
      setCols(Math.floor(Math.random() * 10) + 10);
      setRows(Math.floor(Math.random() * 8) + 8);
    } else {
      setCols(DEFAULT_COLS);
      setRows(DEFAULT_ROWS);
    }
  }, [gameMode]);

  const initializeGame = useCallback(() => {
    if (!pixiContainerRef.current || appRef.current) return;
    const app = new PIXI.Application();
    app.init({
      resizeTo: pixiContainerRef.current,
      backgroundColor: 0x222222,
      antialias: true,
    }).then(() => {
      appRef.current = app;
      pixiContainerRef.current.appendChild(app.canvas);

      Assets.load({ alias: "basic", src: asteroidImage });
      Assets.load({ alias: "sniper", src: sniperImage });

      const stage = app.stage;
      stage.interactive = true;
      stage.sortableChildren = true;

      const projectileContainer = new PIXI.Container();
      projectileContainer.zIndex = 15;
      stage.addChild(projectileContainer);

      setPlacedTowers([]);

      let initialWaypoints = waypointsRef.current;
      let initialGridWaypoints = gridWaypointsRef.current;

      if (gameMode === "infinity") {
        const levelGenerator = new ProceduralLevelGenerator(cols, rows);
        const newGrid = levelGenerator.generateLevel();
        const newWaypoints = levelGenerator.getWaypoints();
        const newGridWaypoints = levelGenerator.getGridWaypoints();

        setGrid(newGrid);
        setWaypoints(newWaypoints);
        setGridWaypoints(newGridWaypoints);

        initialWaypoints = newWaypoints;
        initialGridWaypoints = newGridWaypoints;
      } else {
        setGrid([]);
        setWaypoints([]);
        setGridWaypoints([]);
        initialWaypoints = waypointsRef.current;
        initialGridWaypoints = waypointGridCoords;
      }

      drawIsometricGrid(
        stage,
        (col, row) =>
          handlePlacement({
            col,
            row,
            stage,
            projectileContainer,
            gameStateRef,
            selectedTowerType,
            goldRef,
            gridWaypointsRef,
            placedTowersRef,
            setPlacedTowers,
            setGold,
            setSelectedTower,
            setTooltip,
            cols,
            rows,
          }),
        initialGridWaypoints,
        cols,
        rows
      );

      const clearProjectiles = () => projectileContainer.removeChildren();

      const resizeGame = () => {
        const container = pixiContainerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        app.renderer.resize(containerWidth, containerHeight);
        const totalGridWidth = (cols + rows) * (gridConsts.TILE_WIDTH / 2);
        const totalGridHeight = (cols + rows) * (gridConsts.TILE_HEIGHT / 2);
        const scale = Math.min(containerWidth / totalGridWidth, containerHeight / totalGridHeight);
        stage.scale.set(scale);
        stage.x = (containerWidth - totalGridWidth * scale) / 2;
        stage.y = (containerHeight - totalGridHeight * scale) / 2;
      };

      resizeGame();
      window.addEventListener("resize", resizeGame);

      const waveManager = new WaveManager(
        app,
        () => {},
        (enemy) => setGold((prev) => prev + (enemy.goldValue || 10)),
        (enemy) => setBaseHealth((prev) => Math.max(0, prev - enemy.damageValue)),
        initialWaypoints
      );
      waveManagerRef.current = waveManager;

      app.ticker.add(() => {
        if (isPausedRef.current) return;
        console.log("Game tick", gameStateRef.current);
        if (gameStateRef.current === "wave" && waveManagerRef.current) {
          waveManagerRef.current.update(app.ticker.speed);
          if (waveManagerRef.current.isWaveComplete()) {
            setGameState("build");
            clearProjectiles();
            setCurrentWave(waveManagerRef.current.currentWave + 1);
          }
        }
        placedTowersRef.current.forEach((tower) =>
          tower.update(waveManagerRef.current?.getEnemies() || [], app.ticker.speed)
        );
        projectileContainer.children.forEach((proj) => proj.update?.(app.ticker.speed));
        stage.children.sort((a, b) => a.y - b.y);
      });
    });
  }, [cols, rows, gameMode, selectedTowerType]);

  const sellTower = () =>
    sellTowerLogic({
      selectedTowerRef,
      setGold,
      goldRef,
      setPlacedTowers,
      placedTowersRef,
      setSelectedTower,
      appRef,
      refundPercentage: REFUND_PERCENTAGE,
    });

  const startWave = () => {
    if (gameState !== "wave" && waveManagerRef.current) {
      if (gameMode === "infinity") {
        waveManagerRef.current.spawnRandomWave(currentWave);
      } else {
        waveManagerRef.current.start();
      }
      setGameState("wave");
    }
  };

  const togglePause = () => setIsPaused((p) => !p);

  const handleUpgrade = () => {
    if (selectedTowerRef.current) {
      selectedTowerRef.current.upgrade(setGold, gold);
      setSelectedTower(null);
    }
  };

  useEffect(() => {
    initializeGame();
    return () => {
      appRef.current?.destroy(true, true);
      window.removeEventListener("resize", () => {});
    };
  }, [initializeGame, gameMode]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.ticker.speed = gameSpeed;
    }
  }, [gameSpeed]);

  // --- Render ---
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        {["basic", "sniper", "rapid", "splash"].map((type) => (
          <TowerTypeButton
            key={type}
            type={type}
            selectedTowerType={selectedTowerType}
            onClick={setSelectedTowerType}
          />
        ))}
        <GameControlButton text="Start Wave" onClick={startWave} disabled={gameState === "wave"} />
        <GameControlButton
          text={`Speed: ${gameSpeed}x`}
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
        />
        <GameControlButton text={isPaused ? "Resume" : "Pause"} onClick={() =>{togglePause(); isPausedRef.current = !isPausedRef.current}} />
      </div>
      <GameInfo baseHealth={baseHealth} gold={gold} currentWave={currentWave} />
      {selectedTower && (
        <TowerActionButtons
          onUpgrade={handleUpgrade}
          onSell={sellTower}
          disabled={gameState === "wave"}
        />
      )}
      {tooltip.visible && <Tooltip x={tooltip.x} y={tooltip.y} stats={tooltip.stats} />}
      <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}