import React, { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import {Assets} from "pixi.js";
import { Enemy, waypoints, waypointGridCoords } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { WaveManager } from "./WaveManager.jsx";
import asteroidImage from "../../sprites/basic.png";
import sniperImage from "../../sprites/sniper.png";
import { toIsometric, screenToGrid, getBlockedTiles, drawIsometricGrid, gridConsts } from "./gridUtils";
import Tooltip from "./Tooltip.jsx";

export default function TowerDefenseGame() {
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

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    stats: {},
  });

  useEffect(() => {
    selectedTowerTypeRef.current = selectedTowerType;
  }, [selectedTowerType]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    goldRef.current = gold;
  }, [gold]);

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

      const placedTowers = [];

      // Create WaveManager and store it in the ref
      waveManagerRef.current = new WaveManager(
        app,
        () => {},
        (enemy) => setGold((prev) => prev + (enemy.goldValue || 10)),
        (enemy) => setBaseHealth((prev) => Math.max(0, prev - enemy.damageValue))
      );

      drawIsometricGrid(stage, (col, row) =>
        handlePlacement(col, row, stage, placedTowers, projectileContainer), waypointGridCoords
      );


      app.ticker.add(() => {
        waveManagerRef.current.update(app.ticker.speed);
        placedTowers.forEach((tower) => tower.update(waveManagerRef.current.getEnemies(), app.ticker.speed));
        projectileContainer.children.forEach((proj) => proj.update?.(app.ticker.speed));
        stage.children.sort((a, b) => a.y - b.y); // depth sorting

        if (gameStateRef.current === "wave" && waveManagerRef.current.isWaveComplete()) {
          setGameState("build");
          clearProjectiles();
          setCurrentWave(waveManagerRef.current.currentWave + 1);
        }

        if (baseHealth <= 0) {
          setGameOver(true);
          setGameState("gameOver");
        } else if (waveManagerRef.current.currentWave >= waveManagerRef.current.waves.length && waveManagerRef.current.isWaveComplete()) {
          setGameOver(true);
          setTooltip({ visible: false});
          setGameState("win");
        }

      });

      const clearProjectiles = () => {
        projectileContainer.removeChildren();
      };

      const resizeGame = () => {
        const container = pixiContainerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        app.renderer.resize(containerWidth, containerHeight);

        const totalGridWidth = (gridConsts.GRID_COLS + gridConsts.GRID_ROWS) * (gridConsts.TILE_WIDTH / 2);
        const totalGridHeight = (gridConsts.GRID_COLS + gridConsts.GRID_ROWS) * (gridConsts.TILE_HEIGHT / 2);
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
    });
  }, []);

  const handlePlacement = (col, row, stage, placedTowers, projectileContainer) => {

    if (gameStateRef.current !== "build") return;

    const towerType = selectedTowerTypeRef.current;
    const towerBuildCost = Tower.prototype.baseStats[towerType].buildCost;

    if (goldRef.current < towerBuildCost) {
      console.log("Not enough gold to place tower.");
      return;
    }

    const blockedTiles = getBlockedTiles(waypointGridCoords);
    if (blockedTiles.some(([bx, by]) => bx === col && by === row)) {
      console.log("Cannot place tower on path tile.");
      return;
    }

    const { x, y } = toIsometric(col, row);
    // const towerX = x + TILE_WIDTH / 2;
    // const towerY = y + TILE_HEIGHT / 2;
    const offsetX = ((gridConsts.GRID_COLS + gridConsts.GRID_ROWS) * (gridConsts.TILE_WIDTH / 2)) / 2;
    const towerX = x + offsetX + gridConsts.TILE_WIDTH / 2;
    const towerY = y + gridConsts.TILE_HEIGHT / 2;
    console.log("Tower position:", col, row);
    console.log("Tower position:", towerX, towerY);
    if (placedTowers.some((t) => t.x === towerX && t.y === towerY)) {
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
      if (gameStateRef.current === "gameOver") setTooltip({ visible: false, x, y, stats });;
      setTooltip({ visible: true, x, y, stats });
    };
    tower.onOut = () => {
      setTooltip({ ...tooltip, visible: false });
    };
    stage.addChild(tower);
    placedTowers.push(tower);

    setGold(goldRef.current - towerBuildCost);
  };

  useEffect(() => {
    initializeGame();
    return () => {
      appRef.current?.destroy(true, true);
      window.removeEventListener("resize", () => {});
    };
  }, [initializeGame]);

  useEffect(() => {
    if (gameState === "wave" && waveManagerRef.current) {
      waveManagerRef.current.start();
    }
  }, [gameState]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.ticker.speed = gameSpeed;
    }
  }, [gameSpeed]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>

      {gameOver && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "3em",
              color: "white",
              zIndex: 20,
            }}
          >
            {gameState === "gameOver" ? "Game Over!" : "You Win!"}
          </div>
        )}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
        {["basic", "sniper", "rapid", "splash"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTowerType(type)}
            style={{
              padding: "6px 12px",
              backgroundColor: selectedTowerType === type ? "#66ccff" : "#ccc",
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
          onClick={() => setGameState("wave")}
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

      <div style={{ position: "absolute", top: 40, left: 10, zIndex: 10, color: "red" }}>
        Base HP: {baseHealth}
      </div>
      <div style={{ position: "absolute", top: 70, left: 10, zIndex: 10, color: "yellow" }}>
        Gold: {gold}
      </div>
      <div style={{ position: "absolute", top: 100, left: 10, zIndex: 10, color: "white" }}>
        Wave: {currentWave}
      </div>
      

      {selectedTowerRef.current && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
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
            }}
          >
            Upgrade
          </button>
        </div>
      )}
      {tooltip.visible && <Tooltip x={tooltip.x} y={tooltip.y} stats={tooltip.stats}/>}
      <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}