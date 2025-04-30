import React, { useState, useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import {Assets} from "pixi.js";
import { Enemy } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { ProceduralLevelGenerator } from "./ProceduralLevelGenerator.js";
import { RandomWaveGenerator } from "./RandomWaveGenerator.js";
import { toIsometric, screenToGrid, getBlockedTiles, drawIsometricGrid, gridConsts } from "./gridUtils";
import asteroidImage from "../../sprites/basic.png";
import sniperImage from "../../sprites/sniper.png";

const InfinityModeGame = () => {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const [level, setLevel] = useState(1);
  const [baseHealth, setBaseHealth] = useState(10);
  const [gold, setGold] = useState(100);
  const [gameState, setGameState] = useState("build"); // "build" or "wave"
  const gameStateRef = useRef(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const selectedTowerTypeRef = useRef("basic");
  const [selectedTower, setSelectedTower] = useState(null);
  const selectedTowerRef = useRef(null);
  const [gameSpeed, setGameSpeed] = useState(1);

  const [grid, setGrid] = useState([]);
  const [waypoints, setWaypoints] = useState([]);

  useEffect(() => {
    gameStateRef.current = gameState;
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

      // Generate level and waypoints
      const levelGenerator = new ProceduralLevelGenerator(16, 12);
      const newGrid = levelGenerator.generateLevel();
      const newWaypoints = levelGenerator.getWaypoints();

      setGrid(newGrid);
      setWaypoints(newWaypoints);

      drawIsometricGrid(stage, (col, row) =>
        handlePlacement(col, row, stage, placedTowers, projectileContainer), newWaypoints
      );

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
    // const pos = e.data.global;
    // const localPos = stage.toLocal(pos);
    // const { col, row } = screenToGrid(localPos.x, localPos.y);
    if (gameStateRef.current !== "build") return;

    const blockedTiles = getBlockedTiles(waypoints);
    if (blockedTiles.some(([bx, by]) => bx === col && by === row)) {
      console.log("Cannot place tower on path tile.");
      return;
    }

    const { x, y } = toIsometric(col, row);
    // const towerX = x + TILE_WIDTH / 2;
    // const towerY = y + TILE_HEIGHT / 2;
    const offsetX = ((gridConsts.GRID_COLS + gridConsts.GRID_ROWS) * (64 / 2)) / 2;
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
    stage.addChild(tower);
    placedTowers.push(tower);
  };

  useEffect(() => {
    initializeGame();
    return () => {
      appRef.current?.destroy(true, true);
      window.removeEventListener("resize", () => {});
    };
  }, [initializeGame]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default InfinityModeGame;