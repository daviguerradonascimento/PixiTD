import React, { useState, useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
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
import rapidImage from "../../sprites/fast.png";
import splashImage from "../../sprites/splash.png";

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

// --- Import your music files ---
import buildMusicSrc from "../../sprites/chill.mp3"; // Replace with your actual path
import waveMusicSrc from "../../sprites/battle.mp3"; // Replace with your actual path

const DEFAULT_COLS = 10;
const DEFAULT_ROWS = 6;
const REFUND_PERCENTAGE = 0.7;

const towerData = [
  { type: "basic", img: basicImage, name: "Basic", price: Tower.prototype.baseStats.basic.buildCost },
  { type: "sniper", img: sniperImage, name: "Sniper", price: Tower.prototype.baseStats.sniper.buildCost },
  { type: "rapid", img: rapidImage, name: "Rapid", price: Tower.prototype.baseStats.rapid.buildCost },
  { type: "splash", img: splashImage, name: "Splash", price: Tower.prototype.baseStats.splash.buildCost },
];

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

  // --- Audio Refs ---
  const buildMusicRef = useRef(null);
  const waveMusicRef = useRef(null);

  // Mini path preview size
  const miniWidth = 180;
  const miniHeight = 120;
  const miniPadding = 12;

  // Draw the minimap preview on a canvas
  const MiniPathPreview = ({ gridWaypoints, cols, rows, visible }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      if (!visible || !canvasRef.current || !gridWaypoints?.length) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, miniWidth, miniHeight);

      // Draw background
      ctx.fillStyle = "#232946";
      ctx.globalAlpha = 0.92;
      ctx.fillRect(0, 0, miniWidth, miniHeight);
      ctx.globalAlpha = 1;

      // Draw grid
      const cellW = (miniWidth - miniPadding * 2) / cols;
      const cellH = (miniHeight - miniPadding * 2) / rows;
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(miniPadding + x * cellW, miniPadding);
        ctx.lineTo(miniPadding + x * cellW, miniHeight - miniPadding);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(miniPadding, miniPadding + y * cellH);
        ctx.lineTo(miniWidth - miniPadding, miniPadding + y * cellH);
        ctx.stroke();
      }

      // Draw path
      ctx.strokeStyle = "#66ccff";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      gridWaypoints.forEach(([col, row], idx) => {
        const cx = miniPadding + (col + 0.5) * cellW;
        const cy = miniPadding + (row + 0.5) * cellH;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Draw start/end
      if (gridWaypoints.length > 0) {
        // Start
        const [startCol, startRow] = gridWaypoints[0];
        ctx.fillStyle = "#5e60ce";
        ctx.beginPath();
        ctx.arc(
          miniPadding + (startCol + 0.5) * cellW,
          miniPadding + (startRow + 0.5) * cellH,
          Math.max(cellW, cellH) * 0.32,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // End
        const [endCol, endRow] = gridWaypoints[gridWaypoints.length - 1];
        ctx.fillStyle = "#f2545b";
        ctx.beginPath();
        ctx.arc(
          miniPadding + (endCol + 0.5) * cellW,
          miniPadding + (endRow + 0.5) * cellH,
          Math.max(cellW, cellH) * 0.32,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }, [gridWaypoints, cols, rows, visible]);

    if (!visible) return null;
    return (
      <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 50,
        background: "rgba(30,30,40,0.97)",
        border: "2px solid #66ccff",
        borderRadius: 12,
        boxShadow: "0 4px 16px #000a",
        padding: 6,
        pointerEvents: "none",
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "calc(100vh - 24px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        width={miniWidth}
        height={miniHeight}
        style={{
          display: "block",
          borderRadius: 8,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
      <div style={{
        color: "#66ccff",
        fontWeight: "bold",
        fontSize: "1em",
        textAlign: "center",
        marginTop: 2,
        letterSpacing: "1px"
      }}>Path Preview</div>
    </div>
    );
  };

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

  useEffect(() => {
    if (baseHealth <= 0 && gameState !== "gameover") {
      setGameState("gameover");
    }
  }, [baseHealth, gameState]);

  // --- Initialize Audio Objects ---
  useEffect(() => {
    buildMusicRef.current = new Audio(buildMusicSrc);
    buildMusicRef.current.loop = true;
    buildMusicRef.current.volume = 0.3; // Adjust volume as needed

    waveMusicRef.current = new Audio(waveMusicSrc);
    waveMusicRef.current.loop = true;
    waveMusicRef.current.volume = 0.4; // Adjust volume as needed

    // Cleanup function to pause music when component unmounts
    return () => {
      buildMusicRef.current?.pause();
      waveMusicRef.current?.pause();
    };
  }, []); // Run only once on mount

  // --- Control Music Based on Game State ---
  useEffect(() => {
    const playAudio = async (audioElement) => {
      if (audioElement && audioElement.paused) {
        try {
          await audioElement.play();
        } catch (error) {
          console.error("Audio play failed:", error);
          // Browsers often require user interaction before playing audio.
          // Consider adding a 'click to enable sound' button if needed.
        }
      }
    };

    const pauseAudio = (audioElement) => {
      if (audioElement && !audioElement.paused) {
        audioElement.pause();
        audioElement.currentTime = 0; // Reset time if desired
      }
    };

    if (gameState === "build") {
      pauseAudio(waveMusicRef.current);
      playAudio(buildMusicRef.current);
    } else if (gameState === "wave") {
      pauseAudio(buildMusicRef.current);
      playAudio(waveMusicRef.current);
    } else {
      // Pause both if game over or paused (optional)
      pauseAudio(buildMusicRef.current);
      pauseAudio(waveMusicRef.current);
    }

    // Update gameStateRef
    gameStateRef.current = gameState;

  }, [gameState]); // Re-run when gameState changes

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
        if (isPausedRef.current ||gameStateRef.current ==="gameover") return;
        if (gameStateRef.current === "wave" && waveManagerRef.current) {
          waveManagerRef.current.update(app.ticker.speed);
          if (waveManagerRef.current.isWaveComplete()) {
            setGameState("build");
            clearProjectiles();
            setCurrentWave(waveManagerRef.current.currentWave + 1);
          }
          if (gameMode !== "infinity" && waveManagerRef.current.currentWave >= waveManagerRef.current.waves.length  && waveManagerRef.current.isWaveComplete()) {
            setGameState("gameover");
            app.ticker.stop();
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

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Drag & Drop Tower Palette */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 20, display: "flex", gap: 8, flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <GameControlButton text="Start Wave" onClick={startWave} disabled={gameState === "wave" || gameState === "gameover"} />
          <GameControlButton
            text={`Speed: ${gameSpeed}x`}
            onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          />
          <GameControlButton text={isPaused ? "Resume" : "Pause"} onClick={() =>{togglePause(); isPausedRef.current = !isPausedRef.current}} />
        </div>
        <div style={{display: "flex",flexDirection: "row", flexWrap: "wrap",gap: "2vw", justifyContent: "center",}}>
        {towerData.map(({ type, img, name, price }) => (
          <TowerTypeButton
            key={type}
            type={type}
            img={img}
            name={name}
            price={price}
            isSelected={draggingTowerType === type}
            onMouseDown={() => handleDragStart(type)}
            onMouseUp={handleDragEnd}
            disabled={gameState === "wave" || gameState === "gameover"}
          />
        ))}
        </div>
        </div>
        {gameState === "gameover" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "rgba(30, 30, 40, 0.97)",
            color: "#fff",
            padding: "2.5em 4em",
            borderRadius: "18px",
            fontSize: "2.2em",
            textAlign: "center",
            boxShadow: "0 4px 32px #000a",
            border: "3px solid #66ccff",
            fontFamily: "Segoe UI, Arial, sans-serif",
            letterSpacing: "1px",
            minWidth: 340,
            maxWidth: "90vw",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: "bold", color: baseHealth <= 0 ? "#ff4d4f" : "#66ff99", marginBottom: 16 }}>
            {baseHealth <= 0 ? "Game Over" : "Victory!"}
          </div>
          <div style={{ fontSize: "1.1em", color: "#ffe066" }}>
            {baseHealth <= 0
              ? "You lost. Try again!"
              : "Congratulations! You won!"}
          </div>
        </div>
      )}
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

      {/* Responsive Game Info */}
      <div
        style={{
          position: "absolute",
          top: "2vw",
          right: "2vw",
          zIndex: 10, // Lower z-index to ensure it doesn't overlap the UI
          minWidth: "120px",
          maxWidth: "90vw",
          width: "clamp(140px, 18vw, 320px)",
          pointerEvents: "auto",
        }}
      >
        <GameInfo baseHealth={baseHealth} gold={gold} currentWave={currentWave} />

        <MiniPathPreview
        gridWaypoints={gridWaypoints}
        cols={cols}
        rows={rows}
        visible={gameState === "build"}
      />
      </div>

      {selectedTower && (
        <TowerActionButtons
          onUpgrade={handleUpgrade}
          onSell={sellTower}
          disabled={gameState === "wave" || gameState === "gameover"}
        />
      )}
      {tooltip.visible && (
        <Tooltip x={tooltip.x} y={tooltip.y} stats={tooltip.stats} />
      )}

      <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}