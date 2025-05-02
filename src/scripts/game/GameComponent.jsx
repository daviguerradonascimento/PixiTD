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

import MiniPathPreview from "./MiniPathPreview"; // Import the new component

const DEFAULT_COLS = 10;
const DEFAULT_ROWS = 6;
const REFUND_PERCENTAGE = 0.7;

const towerData = [
  { type: "basic", img: basicImage, name: "Basic", price: Tower.prototype.baseStats.basic.buildCost },
  { type: "sniper", img: sniperImage, name: "Sniper", price: Tower.prototype.baseStats.sniper.buildCost },
  { type: "rapid", img: rapidImage, name: "Rapid", price: Tower.prototype.baseStats.rapid.buildCost },
  { type: "splash", img: splashImage, name: "Splash", price: Tower.prototype.baseStats.splash.buildCost },
];

export default function TowerDefenseGame({ gameMode, layoutConfig = null, onReturnToMenu }) {
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
    } else if (layoutConfig) {
      // Use the selected layout's grid dimensions
      setCols(layoutConfig.cols || DEFAULT_COLS);
      setRows(layoutConfig.rows || DEFAULT_ROWS);
    } else {
      setCols(DEFAULT_COLS);
      setRows(DEFAULT_ROWS);
    }
  }, [gameMode, layoutConfig]);

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

  useEffect(() => {
    // Only start music when app is initialized
    if (appRef.current && buildMusicRef.current) {
      // Small delay to ensure initialization is complete
      const timer = setTimeout(() => {
        try {
          buildMusicRef.current.volume = 0.3;
          buildMusicRef.current.play().catch(err => {
            // Handle autoplay restrictions
            if (err.name !== "AbortError") {
              console.warn("Initial music autoplay failed:", err);
            }
          });
        } catch (err) {
          console.warn("Error playing initial music:", err);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [appRef.current]);

  // --- Control Music Based on Game State ---
  useEffect(() => {
    // Flag to track if component is mounted
    let isMounted = true;
    
    const playAudio = async (audioElement) => {
      if (!audioElement || !audioElement.paused) return;
      
      try {
        // Only play if element exists and is paused
        const playPromise = audioElement.play();
        
        // Modern browsers return a promise from play()
        if (playPromise !== undefined) {
          await playPromise;
          // Only adjust volume if still mounted
          if (isMounted) {
            audioElement.volume = audioElement === buildMusicRef.current ? 0.3 : 0.4;
          }
        }
      } catch (error) {
        // Ignore AbortError as it's expected during quick state changes
        if (error.name !== "AbortError") {
          console.warn("Audio play failed:", error);
        }
      }
    };
  
    const pauseAudio = (audioElement) => {
      if (!audioElement || audioElement.paused) return;
      
      // Reset time only after ensuring the element exists and is playing
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  
    // Handle audio based on game state
    if (gameState === "build") {
      pauseAudio(waveMusicRef.current);
      playAudio(buildMusicRef.current);
    } else if (gameState === "wave") {
      pauseAudio(buildMusicRef.current);
      playAudio(waveMusicRef.current);
    } else {
      // Pause both if game over or paused
      pauseAudio(buildMusicRef.current);
      pauseAudio(waveMusicRef.current);
    }
  
    // Update gameStateRef
    gameStateRef.current = gameState;
  
    // Return a proper cleanup function
    return () => {
      isMounted = false;
      
      // Try to cancel any playing audio to avoid errors
      buildMusicRef.current?.pause();
      waveMusicRef.current?.pause();
    };
  }, [gameState]);

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
      } else if (layoutConfig && layoutConfig.waypoints) {
        // Use custom waypoints from the selected layout
        const customGridWaypoints = layoutConfig.waypoints;
        setGridWaypoints(customGridWaypoints);
        
        // Convert grid waypoints to screen coordinates
        const offsetX = ((cols + rows) * (gridConsts.TILE_WIDTH / 2)) / 2;
        const customWaypoints = customGridWaypoints.map(([col, row]) => {
          const { x, y } = toIsometric(col, row);
          return {
            x: x + offsetX + (gridConsts.TILE_HEIGHT / 2),
            y: y + (gridConsts.TILE_HEIGHT / 4)
          };
        });
        
        setWaypoints(customWaypoints);
        initialWaypoints = customWaypoints;
        initialGridWaypoints = customGridWaypoints;
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
        const app = appRef.current;
        
        // Add thorough null checks
        if (!container || !app || !app.renderer || !app.stage) {
          return;
        }
        
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        try {
          // Resize renderer with error handling
          app.renderer.resize(containerWidth, containerHeight);
          
          const totalGridWidth = (cols + rows) * (gridConsts.TILE_WIDTH / 2);
          const totalGridHeight = (cols + rows) * (gridConsts.TILE_HEIGHT / 2);
          const scale = Math.min(containerWidth / totalGridWidth, containerHeight / totalGridHeight);
          
          app.stage.scale.set(scale);
          app.stage.x = (containerWidth - totalGridWidth * scale) / 2;
          app.stage.y = (containerHeight - totalGridHeight * scale) / 2;
        } catch (err) {
          console.warn("Error during resize operation:", err);
        }
      };

      resizeGame();
      const resizeHandler = () => resizeGame();
      window.addEventListener("resize", resizeHandler);

      const waveManager = new WaveManager(
        app,
        () => {},
        (enemy) => setGold((prev) => prev + (enemy.goldValue || 10)),
        (enemy) => setBaseHealth((prev) => Math.max(0, prev - enemy.damageValue)),
        initialWaypoints,
        { cols, rows, gameMode } // Pass extra options including grid dimensions
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
  }, [cols, rows, gameMode, layoutConfig]);

  const cleanupResources = () => {
    // Stop music
    buildMusicRef.current?.pause();
    waveMusicRef.current?.pause();

    if (waveManagerRef.current) {
      waveManagerRef.current.cleanup();
    }
    
    // Clear all references to game objects
    setSelectedTower(null);
    setPlacedTowers([]);
    // waveManagerRef.current = null;
  
    // Reset all game state
    setGrid([]);
    setWaypoints([]);
    setGridWaypoints([]);
    
    // Destroy PIXI app with thorough cleanup
    if (appRef.current) {
      try {
        // Stop the ticker to prevent further updates
        appRef.current.ticker?.stop();
        
        // Remove all children from the stage
        if (appRef.current.stage) {
          appRef.current.stage.removeChildren();
        }
        
        // Remove the canvas from DOM
        if (appRef.current.canvas && appRef.current.canvas.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        
        // Destroy all textures and resources
        for (const resource in appRef.current.renderer?.textureSystem?.managedTextures || {}) {
          resource?.destroy?.(true);
        }
        
        // Finally destroy the app
        appRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true
        });
      } catch (err) {
        console.warn("Error during PIXI cleanup:", err);
      } finally {
        // Ensure reference is cleared even if destroy fails
        appRef.current = null;
      }
    }
    
    // Clear the container
    if (pixiContainerRef.current) {
      // window.removeEventListener("resize", resizeHandler);
      pixiContainerRef.current.innerHTML = '';
    }
  };

  useEffect(() => {
    if (gameMode && pixiContainerRef.current) {
      console.log("Game mode changed, reinitializing:", gameMode);
      // Force cleanup and reinitialization
      cleanupResources();
      // Short timeout to ensure DOM updates before reinitialization
      setTimeout(() => {
        initializeGame();
      }, 50);
    }
  }, [gameMode, initializeGame]);

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
        <div style={{ display: 'flex', gap: 8, alignItems: "center" }}>
          <GameControlButton text="Start Wave" onClick={startWave} disabled={gameState === "wave" || gameState === "gameover"} />
          <GameControlButton
            text={`Speed: ${gameSpeed}x`}
            onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          />
          <GameControlButton text={isPaused ? "Resume" : "Pause"} onClick={() =>{togglePause(); isPausedRef.current = !isPausedRef.current}} />
          
          {/* Add the new return to menu button */}
          <button
            style={{
              padding: "6px 16px",
              background: "#D81F26", // Red color for caution action
              color: "#fff",
              border: "2px solid #AB0F15", // Darker red border
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1.08em",
              marginLeft: "16px", // Extra margin to separate from other buttons
              cursor: "pointer",
              boxShadow: "0 2px 8px #0004",
              display: "flex",
              alignItems: "center"
            }}
            onClick={() => {
              cleanupResources();
              onReturnToMenu();
            }}
          >
            <span style={{ marginRight: "4px" }}>◀</span> Menu
          </button>
        </div>
        
        {/* Existing tower buttons */}
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "2vw", justifyContent: "center",}}>
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
      
      {/* Game over dialog - add a return button here too */}
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
          <div style={{ fontSize: "1.1em", color: "#ffe066", marginBottom: "20px" }}>
            {baseHealth <= 0
              ? "You lost. Try again!"
              : "Congratulations! You won!"}
          </div>
          <button
            style={{
              padding: "10px 20px",
              fontSize: "0.8em",
              cursor: "pointer",
              borderRadius: "8px",
              border: "2px solid #66ccff",
              background: "#181c24",
              color: "#fff",
              fontWeight: "bold",
            }}
            onClick={() => {
              cleanupResources();
              onReturnToMenu();
            }}
          >
            Return to Menu
          </button>
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

        {/* Now using the imported component with set dimensions */}
     
      </div>

      <MiniPathPreview
        gridWaypoints={gridWaypoints}
        cols={cols}
        rows={rows}
        visible={gameState === "build"}
        width={Math.min(400, window.innerWidth * 0.35)} // 35% of viewport width up to 400px max
        height={Math.min(280, window.innerHeight * 0.3)} // 30% of viewport height up to 280px max
      />
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