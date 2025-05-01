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
  screenToGrid,
} from "./gridUtils";

import basicImage from "../../sprites/basic.png";
import sniperImage from "../../sprites/sniper.png";
import rapidImage from "../../sprites/sniper.png";
import splashImage from "../../sprites/sniper.png";

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
  const [gold, setGold] = useState(10000);
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
  const [draggingTowerType, setDraggingTowerType] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);

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
  const selectedTowerTypeRef = useRef(selectedTowerType);

  // --- Effects ---
  useEffect(() => { goldRef.current = gold; }, [gold]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gridWaypointsRef.current = gridWaypoints; }, [gridWaypoints]);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);
  useEffect(() => { placedTowersRef.current = placedTowers; }, [placedTowers]);
  useEffect(() => { selectedTowerRef.current = selectedTower; }, [selectedTower]);
  useEffect(() => { selectedTowerTypeRef.current = draggingTowerType; }, [draggingTowerType]);

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

      Assets.load({ alias: "basic", src: basicImage });
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
        setGridWaypoints(waypointGridCoords);
        initialWaypoints = waypointsRef.current;
        initialGridWaypoints = waypointGridCoords;
      }

      drawIsometricGrid(
        stage,
        () =>{},
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
  }, [cols, rows, gameMode]);

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

  // --- Drag & Drop Handlers ---
  const handleDragStart = (type) => {
    setDraggingTowerType(type);
    setGhostPos(null);
  };

  const handleDragEnd = () => {
    setDraggingTowerType(null);
    setGhostPos(null);
  };

  // Mouse move over Pixi canvas to update ghost position
  useEffect(() => {
    if (!draggingTowerType || !pixiContainerRef.current) return;

    const handleMouseMove = (e) => {
      const rect = pixiContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setGhostPos({ x: mouseX, y: mouseY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [draggingTowerType]);

  const getStageCoords = (mouseX, mouseY) => {
    const app = appRef.current;
    if (!app) return { x: mouseX, y: mouseY };
    const stage = app.stage;
    const scale = stage.scale.x; // assuming uniform scaling
    const stageX = (mouseX - stage.x) / scale;
    const stageY = (mouseY - stage.y) / scale;
    return { x: stageX, y: stageY };
  };

  // --- Handle drop on grid ---
  const handleCanvasDrop = (e) => {
    if (!draggingTowerType) return;
    e.preventDefault();
    const rect = pixiContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x, y } = getStageCoords(mouseX, mouseY);
    const { col, row } = screenToGrid(x, y, cols, rows);
    console.log(col, row);
    console.log(gridWaypointsRef.current);
    handlePlacement({
      col,
      row,
      stage: appRef.current.stage,
      projectileContainer: appRef.current.stage.children.find(c => c.zIndex === 15),
      gameStateRef,
      selectedTowerTypeRef: { current: draggingTowerType },
      goldRef,
      gridWaypointsRef,
      placedTowersRef,
      setPlacedTowers,
      setGold,
      setSelectedTower,
      setTooltip,
      cols,
      rows,
      selectedTowerRef,
    });
    handleDragEnd();
  };

  useEffect(() => {
    const canvas = pixiContainerRef.current;
    if (!canvas) return;
    if (draggingTowerType) {
      canvas.addEventListener("mouseup", handleCanvasDrop);
    }
    return () => {
      canvas.removeEventListener("mouseup", handleCanvasDrop);
    };
  }, [draggingTowerType, handleCanvasDrop]);

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
      {/* Drag & Drop Tower Palette */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 20, display: "flex", gap: 8 }}>
        {[
          { type: "basic", img: basicImage },
          { type: "sniper", img: sniperImage },
          { type: "rapid", img: rapidImage },
          { type: "splash", img: splashImage },
          // Add more tower types and images as needed
        ].map(({ type, img }) => (
          <img
            key={type}
            src={img}
            alt={type}
            draggable={false}
            style={{
              width: 48,
              height: 48,
              border: draggingTowerType === type ? "2px solid #66ccff" : "2px solid #ccc",
              borderRadius: 8,
              opacity: draggingTowerType && draggingTowerType !== type ? 0.5 : 1,
              cursor: "grab",
              background: "#222",
            }}
            onMouseDown={() => handleDragStart(type)}
            onMouseUp={handleDragEnd}
          />
        ))}
        <GameControlButton text="Start Wave" onClick={startWave} disabled={gameState === "wave"} />
        <GameControlButton
          text={`Speed: ${gameSpeed}x`}
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
        />
        <GameControlButton text={isPaused ? "Resume" : "Pause"} onClick={() =>{togglePause(); isPausedRef.current = !isPausedRef.current}} />
      </div>

      {/* Ghost Tower Visual Feedback */}
      {draggingTowerType && ghostPos && (
        <img
        src={
          draggingTowerType === "basic"
            ? basicImage
            : draggingTowerType === "sniper"
            ? sniperImage
            : draggingTowerType === "rapid"
            ? rapidImage
            : draggingTowerType === "splash"
            ? splashImage
            : basicImage
        }
          alt="ghost"
          style={{
            position: "absolute",
            left: ghostPos.x - 24,
            top: ghostPos.y - 24,
            width: 48,
            height: 48,
            opacity: 0.5,
            pointerEvents: "none",
            zIndex: 100,
            filter: "drop-shadow(0 0 8px #66ccff)",
          }}
        />
      )}

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