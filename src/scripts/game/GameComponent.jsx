import React,{ useEffect, useRef, useState  } from "react";
import * as PIXI from "pixi.js";
import { Enemy, waypoints, waypointGridCoords } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { WaveManager } from "./WaveManager.jsx";


export default function TowerDefenseGame() {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);
  const [selectedTowerType, setSelectedTowerType] = useState("basic");
  const selectedTowerTypeRef = useRef("basic");

  useEffect(() => {
    selectedTowerTypeRef.current = selectedTowerType;
  }, [selectedTowerType]);

  useEffect(() => {
    const app = new PIXI.Application({
      resizeTo: window,
      backgroundColor: 0x222222,
      antialias: true,
    });
    appRef.current = app;
    pixiContainer.current.appendChild(app.view);
    
    const placedTowers = [];

    const waveManager = new WaveManager(app, () => {
        // You can attach enemy-specific logic or effects here if needed
      });
  
      waveManager.start();

    // === Basic Setup ===
    const stage = app.stage;

    // Grid constants
    const GRID_SIZE = 64;
    const GRID_COLS = 10;
    const GRID_ROWS = 6;

    // Draw Grid
    const drawGrid = () => {
        for (let row = 0; row < GRID_ROWS; row++) {
          for (let col = 0; col < GRID_COLS; col++) {
            const gridCell = new PIXI.Graphics();
            gridCell.beginFill(0xDDDDDD, 1); // Light gray fill, alpha 1 (opaque)
            gridCell.drawRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            gridCell.endFill();
            gridCell.zIndex = 0;
            gridCell.interactive = true;
            gridCell.on("pointerdown", (e) => {
              console.log("Grid cell clicked:", row, col);
              handlePlacement(e); // Call handlePlacement with the event
            });
            stage.addChild(gridCell);
          }
        }
      };

    drawGrid();
    // graphics.zIndex = 0;


    const pathSet = new Set(
        waypointGridCoords.map(([col, row]) => `${row}-${col}`)
      );

      const handlePlacement = (e, towerType) => {
        console.log("pointerdown");
        const pos = e.data.global;
        const row = Math.floor(pos.y / GRID_SIZE);
        const col = Math.floor(pos.x / GRID_SIZE);
        const key = `${row}-${col}`;
    
        const getBlockedTiles = () => {
            const blockedTiles = [];
            for (let i = 0; i < waypointGridCoords.length - 1; i++) {
                const [startX, startY] = waypointGridCoords[i];
                const [endX, endY] = waypointGridCoords[i + 1];
        
                // Handle vertical movement
                if (startX === endX) {
                    const yRange = startY < endY ? [...Array(endY - startY + 1).keys()].map(i => startY + i) : [...Array(startY - endY + 1).keys()].map(i => startY - i);
                    yRange.forEach(y => {
                        if (!blockedTiles.some(tile => tile[0] === startX && tile[1] === y)) {
                            blockedTiles.push([startX, y]);
                        }
                    });
                }
                // Handle horizontal movement
                else if (startY === endY) {
                    const xRange = startX < endX ? [...Array(endX - startX + 1).keys()].map(i => startX + i) : [...Array(startX - endX + 1).keys()].map(i => startX - i);
                    xRange.forEach(x => {
                        if (!blockedTiles.some(tile => tile[0] === x && tile[1] === startY)) {
                            blockedTiles.push([x, startY]);
                        }
                    });
                }
            }
            return blockedTiles;
        };
    
        const blockedTiles = getBlockedTiles();
        function isTileBlocked(x, y) {
            return blockedTiles.some(tile => tile[0] === x && tile[1] === y);
        }
    
        console.log("Attempting to place at row-col:", key);
        console.log("Path set:", pathSet);
    
        // Check if the tile is blocked by the path
        if (isTileBlocked(col, row)) {
            console.log("Cannot place tower on path tile.");
            return;
        }
    
        // Check if the tile is already occupied by a tower
        const gridX = col * GRID_SIZE + GRID_SIZE / 2;
        const gridY = row * GRID_SIZE + GRID_SIZE / 2;
        
        if (placedTowers.some(t => t.x === gridX && t.y === gridY)) {
            console.log("Tower already exists at this location.");
            return;
        }
    
        // Create the new tower
        console.log(selectedTowerTypeRef.current);
        const tower = new Tower(gridX, gridY, projectileContainer, selectedTowerTypeRef.current);
        app.stage.addChild(tower);
        placedTowers.push(tower);
    };

    app.stage.interactive = true;
    app.stage.sortableChildren = true;

    // const enemies = [enemy];
    const projectileContainer = new PIXI.Container();
    stage.addChild(projectileContainer);

    app.ticker.add(() => {
        waveManager.update();

        placedTowers.forEach(tower => tower.update(waveManager.getEnemies()));

        projectileContainer.children.forEach((proj, i) => {
            if (proj.update) proj.update();
          });

      });

    // Cleanup on unmount
    return () => {
      app.destroy(true, true);
    };
  }, []);

//   return <div ref={pixiContainer} style={{ width: "100vw", height: "100vh" }} />;
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
      }}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  ))}
</div>
  
      {/* PIXI Canvas */}
      <div ref={pixiContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
  
}
