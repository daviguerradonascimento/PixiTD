import React, { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Enemy, waypoints, waypointGridCoords } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { WaveManager } from "./WaveManager.jsx";

export default function TowerDefenseGame() {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const selectedTowerTypeRef = useRef("basic");
  const [selectedTower, setSelectedTower] = useState(null);
  const selectedTowerRef = useRef(null);

  const [baseHealth, setBaseHealth] = useState(10);
  const [gold, setGold] = useState(100);

  useEffect(() => {
    selectedTowerTypeRef.current = selectedTowerType;
  }, [selectedTowerType]);

  const initializePixi = useCallback(() => {
    if (pixiContainer.current && !appRef.current) {
      try {
        const app = new PIXI.Application();
        app.init({ resizeTo: window,
          backgroundColor: 0x222222,
          antialias: true,}).then(async () => {

        // await app.init({ resizeTo: window,
        //   backgroundColor: 0x222222,
        //   antialias: true,});
          

        appRef.current = app;
        console.log(app);

        // Move the appendChild call *after* the app is created
        if (pixiContainer.current) {
          pixiContainer.current.appendChild(app.canvas); // Use app.canvas instead of app.view
        } else {
          console.error("PIXI container not found");
          return; // Important: Exit if container is not found
        }
      

        const placedTowers = [];
        const projectileContainer = new PIXI.Container();
        projectileContainer.zIndex = 15;
        app.stage.addChild(projectileContainer);

        const waveManager = new WaveManager(
          app,
          () => {},
          (enemy) => setGold((prev) => prev + (enemy.goldValue || 10)),
          (enemy) => setBaseHealth((prev) => Math.max(0, prev - enemy.damageValue))
        );

        waveManager.start();

        const stage = app.stage;
        const GRID_SIZE = 64;
        const GRID_COLS = 10;
        const GRID_ROWS = 6;

        const drawGrid = () => {
          for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
              const gridCell = new PIXI.Graphics();
              gridCell.fill({0xdddddd: 1});
              gridCell.rect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
              gridCell.fill();
              gridCell.zIndex = 0;
              gridCell.interactive = true;
              gridCell.on("pointerdown", (e) => {
                handlePlacement(e);
              });
              stage.addChild(gridCell);
            }
          }
        };

        drawGrid();

        const pathSet = new Set(
          waypointGridCoords.map(([col, row]) => `${row}-${col}`)
        );

        const handlePlacement = (e) => {
          const pos = e.data.global;
          const row = Math.floor(pos.y / GRID_SIZE);
          const col = Math.floor(pos.x / GRID_SIZE);
          const key = `${row}-${col}`;

          const getBlockedTiles = () => {
            const blockedTiles = [];
            for (let i = 0; i < waypointGridCoords.length - 1; i++) {
              const [startX, startY] = waypointGridCoords[i];
              const [endX, endY] = waypointGridCoords[i + 1];

              if (startX === endX) {
                const yRange = Array.from(
                  { length: Math.abs(endY - startY) + 1 },
                  (_, j) => (startY < endY ? startY + j : startY - j)
                );
                yRange.forEach((y) => blockedTiles.push([startX, y]));
              } else if (startY === endY) {
                const xRange = Array.from(
                  { length: Math.abs(endX - startX) + 1 },
                  (_, j) => (startX < endX ? startX + j : startX - j)
                );
                xRange.forEach((x) => blockedTiles.push([x, startY]));
              }
            }
            return blockedTiles;
          };

          const blockedTiles = getBlockedTiles();
          const isTileBlocked = (x, y) => blockedTiles.some(([bx, by]) => bx === x && by === y);

          if (isTileBlocked(col, row)) {
            console.log("Cannot place tower on path tile.");
            return;
          }

          const gridX = col * GRID_SIZE + GRID_SIZE / 2;
          const gridY = row * GRID_SIZE + GRID_SIZE / 2;

          if (placedTowers.some((t) => t.x === gridX && t.y === gridY)) {
            console.log("Tower already exists at this location.");
            return;
          }

          const tower = new Tower(
            gridX,
            gridY,
            projectileContainer,
            selectedTowerTypeRef.current
          );

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

          app.stage.addChild(tower);
          placedTowers.push(tower);
        };

        app.stage.interactive = true;
        app.stage.sortableChildren = true;

        app.ticker.add(() => {
          waveManager.update();
          placedTowers.forEach((tower) =>
            tower.update(waveManager.getEnemies())
          );
          projectileContainer.children.forEach((proj) => {
            console.log(projectileContainer.renderable);
            if (proj.update) proj.update();
          });
        });

      });
      } catch (error) {
        console.error("PIXI initialization error:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (pixiContainer.current) {
      initializePixi();
    }

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
      }
    };
  }, [pixiContainer, initializePixi]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* UI Overlay */}
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
      </div>

      <div style={{ position: "absolute", top: 40, left: 10, zIndex: 10, color: "red" }}>
        Base HP: {baseHealth}
      </div>

      <div style={{ position: "absolute", top: 70, left: 10, zIndex: 10, color: "yellow" }}>
        Gold: {gold}
      </div>

      {selectedTowerRef.current && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
          <button
            onClick={() => {
              selectedTowerRef.current.upgrade(setGold, gold);
              selectedTowerRef.current = null;
              setSelectedTower(null);
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#4CAF50",
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

      {/* PIXI Canvas */}
      <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}