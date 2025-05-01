import React, { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Assets } from "pixi.js";
import { Enemy, waypoints, waypointGridCoords } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { ProceduralLevelGenerator } from "./ProceduralLevelGenerator.js";
import { WaveManager } from "./WaveManager.jsx";
import {
  toIsometric,
  screenToGrid,
  getBlockedTiles,
  drawIsometricGrid,
  gridConsts,
} from "./gridUtils";
import asteroidImage from "../../sprites/basic.png";
import sniperImage from "../../sprites/sniper.png";
import Tooltip from "./Tooltip.jsx";

export default function TowerDefenseGame({ gameMode }) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const selectedTowerTypeRef = useRef("basic");
  const [selectedTower, setSelectedTower] = useState(null);
  const selectedTowerRef = useRef(null);
  const [baseHealth, setBaseHealth] = useState(10);
  const [gold, setGold] = useState(100);
  const goldRef = useRef(gold);
  const [gameState, setGameState] = useState("build"); // "build" or "wave"
  const gameStateRef = useRef(null);
  const waveManagerRef = useRef(null); // Ref for WaveManager
  const [currentWave, setCurrentWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  // Infinity Mode specific states
  const [grid, setGrid] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const waypointsRef = useRef([]);
  const [gridWaypoints, setGridWaypoints] = useState([]);
  const gridWaypointsRef = useRef(null);
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(6);

  const [placedTowers, setPlacedTowers] = useState([]);
  const placedTowersRef = useRef(placedTowers);

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    stats: {},
  });

  useEffect(() => {
    if (!gameMode) return;
  
    if (gameMode === "infinity") {
      setCols(Math.floor(Math.random() * 10) + 10); // 10–19
      setRows(Math.floor(Math.random() * 8) + 8);   // 8–15
    } 
  }, [gameMode]);

  useEffect(() => {
    selectedTowerTypeRef.current = selectedTowerType;
  }, [selectedTowerType]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    goldRef.current = gold;
  }, [gold]);

  useEffect(() => {
    gridWaypointsRef.current = gridWaypoints;
  }, [gridWaypoints]);

  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  useEffect(() => {
    placedTowersRef.current = placedTowers;
  }, [placedTowers]);

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

      Assets.load({ alias: "basic", src: asteroidImage }).then(() => {
        const tileTexture = Assets.get("basic");
      });
      Assets.load({ alias: "sniper", src: sniperImage }).then(() => {
        const tileTexture = Assets.get("sniper");
      });

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

        waypointsRef.current = newWaypoints;
        gridWaypointsRef.current = newGridWaypoints;
        initialWaypoints = newWaypoints;
        initialGridWaypoints = newGridWaypoints
      } else {
        // Reset infinity mode specific states
        setGrid([]);
        setWaypoints([]);
        setGridWaypoints([]);
        initialWaypoints = waypointsRef.current;
        initialGridWaypoints = waypointGridCoords;
      }

      drawIsometricGrid(
        stage,
        (col, row) =>
          handlePlacement(col, row, stage, projectileContainer),
        initialGridWaypoints,
        cols,
        rows
      );

      const clearProjectiles = () => {
        projectileContainer.removeChildren();
      };

      const resizeGame = () => {
        const container = pixiContainerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        app.renderer.resize(containerWidth, containerHeight);

        const totalGridWidth = (cols + rows) * (gridConsts.TILE_WIDTH / 2);
        const totalGridHeight = (cols + rows) * (gridConsts.TILE_HEIGHT / 2);
        const scale = Math.min(
          containerWidth / totalGridWidth,
          containerHeight / totalGridHeight
        );

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
        (enemy) =>
          setBaseHealth((prev) => Math.max(0, prev - enemy.damageValue)),
        initialWaypoints
      );
      waveManagerRef.current = waveManager;

      app.ticker.add(() => {
        if (gameStateRef.current === "wave" && waveManagerRef.current) {
          waveManagerRef.current.update(app.ticker.speed);
          if (waveManagerRef.current.isWaveComplete()) {
            setGameState("build");
            clearProjectiles();
            setCurrentWave(waveManagerRef.current.currentWave + 1);
          }
        }
        placedTowersRef.current.forEach((tower) =>
          tower.update(
            waveManagerRef.current?.getEnemies() || [],
            app.ticker.speed
          )
        );
        projectileContainer.children.forEach((proj) =>
          proj.update?.(app.ticker.speed)
        );
        stage.children.sort((a, b) => a.y - b.y); // depth sorting
      });
    });
  }, [cols, rows, gameMode, initializeGame]);

  const handlePlacement = (col, row, stage, projectileContainer) => {
    if (gameStateRef.current !== "build") return;

    const towerType = selectedTowerTypeRef.current;
    const towerBuildCost = Tower.prototype.baseStats[towerType].buildCost;

    if (goldRef.current < towerBuildCost) {
      console.log("Not enough gold to place tower.");
      return;
    }

    let blockedTiles = [];
    blockedTiles = getBlockedTiles(gridWaypointsRef.current);

    if (blockedTiles.some(([bx, by]) => bx === col && by === row)) {
      console.log("Cannot place tower on path tile.");
      return;
    }

    const localToIsometric = (col, row) => {
      const x = (col - row) * (gridConsts.TILE_WIDTH / 2);
      const y = (col + row) * (gridConsts.TILE_HEIGHT / 2);
      return { x, y };
    };

    const { x, y } = localToIsometric(col, row);
    const offsetX = ((cols + rows) * (gridConsts.TILE_WIDTH / 2)) / 2;
    const towerX = x + offsetX + gridConsts.TILE_WIDTH / 2;
    const towerY = y + gridConsts.TILE_HEIGHT / 2;

    if (placedTowersRef.current.some((t) => t.x === towerX && t.y === towerY)) {
      console.log("Tower already exists at this location.");
      return;
    }

    const tower = new Tower(towerX, towerY, projectileContainer, selectedTowerTypeRef.current);
    tower.zIndex = 2;
    tower.onSelect = (towerInstance) => {
      if (
        selectedTowerRef.current &&
        selectedTowerRef.current !== towerInstance
      ) {
        selectedTowerRef.current.setSelected(false);
      }
      selectedTowerRef.current = towerInstance;
      setSelectedTower(towerInstance);
    };
    tower.onHover = (stats, x, y) => {
      // Add onHover handler
      setTooltip({ visible: true, x, y, stats });
    };
    tower.onOut = () => {
      // Add onOut handler
      setTooltip({ ...tooltip, visible: false });
    };
    stage.addChild(tower);
    setPlacedTowers([...placedTowersRef.current, tower]);
    setGold(goldRef.current - towerBuildCost);
  };

  const sellTower = () => {
    if (!selectedTowerRef.current) return;

    const tower = selectedTowerRef.current;
    const refundPercentage = 0.7; // 70% refund

    const refundAmount = (tower.baseStats.buildCost + ((tower.level - 1) * tower.baseStats.upgradeCost)) * refundPercentage;
    setGold(goldRef.current + refundAmount);

    // Remove the tower from the stage
    appRef.current.stage.removeChild(tower);

    // Remove the tower from the placedTowers array
    setPlacedTowers(placedTowersRef.current.filter((t) => t !== tower));

    // Clear the selected tower
    setSelectedTower(null);
    selectedTowerRef.current = null;
  };

  useEffect(() => {
    initializeGame();
    return () => {
      appRef.current?.destroy(true, true);
      window.removeEventListener("resize", () => {});
    };
  }, [initializeGame, gameMode]);

  const startWave = () => {
    if (gameState !== "wave" && waveManagerRef.current) {
      if(gameMode === "infinity") {waveManagerRef.current.spawnRandomWave(currentWave);}
      else	{waveManagerRef.current.start();}

      setGameState("wave");
    }
  };

  useEffect(() => {
    if (appRef.current) {
      appRef.current.ticker.speed = gameSpeed;
    }
  }, [gameSpeed]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        {/* Tower Type Selection */}
        {["basic", "sniper", "rapid", "splash"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTowerType(type)}
            style={{
              padding: "6px 12px",
              backgroundColor:
                selectedTowerType === type ? "#66ccff" : "#ccc",
              color: "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: "4px",
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <button
          onClick={startWave}
          disabled={gameState === "wave"}
          style={{
            padding: "6px 12px",
            backgroundColor: gameState === "wave" ? "#ccc" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: "4px",
          }}
        >
          Start Wave
        </button>

        <button
          onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#ccc",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: "4px",
          }}
        >
          Speed: {gameSpeed}x
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 40,
          left: 10,
          zIndex: 10,
          color: "red",
        }}
      >
        Base HP: {baseHealth}
      </div>
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 10,
          zIndex: 10,
          color: "yellow",
        }}
      >
        Gold: {gold}
      </div>
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 10,
          zIndex: 10,
          color: "white",
        }}
      >
        Wave: {currentWave}
      </div>

      {selectedTowerRef.current && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              selectedTowerRef.current.upgrade(setGold, gold);
              selectedTowerRef.current = null;
              setSelectedTower(null);
            }}
            disabled={gameState === "wave"}
            style={{
              padding: "6px 12px",
              backgroundColor: gameState === "wave" ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: "4px",
            }}
          >
            Upgrade
          </button>
          <button
            onClick={sellTower}
            disabled={gameState === "wave"}
            style={{
              padding: "6px 12px",
              backgroundColor: gameState === "wave" ? "#ccc" : "#FF4136",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sell
          </button>
        </div>
      )}
      {tooltip.visible && (
        <Tooltip x={tooltip.x} y={tooltip.y} stats={tooltip.stats} />
      )}{" "}
      {/* Render Tooltip */}
      <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}