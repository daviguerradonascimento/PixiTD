import React,{ useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Enemy, waypoints } from "./Enemy.jsx";
import { Tower } from "./Tower.jsx";
import { WaveManager } from "./WaveManager.jsx";


export default function TowerDefenseGame() {
  const pixiContainer = useRef(null);
  const appRef = useRef(null);

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




    const handlePlacement = (e) => {
        console.log("pointerdown");
        const pos = e.data.global;
        const row = Math.floor(pos.y / GRID_SIZE);
        const col = Math.floor(pos.x / GRID_SIZE);
        const key = `${row}-${col}`;
        console.log(waypoints);
        const pathSet = new Set(waypoints.map(waypoint => {
            // Calculate row and col based on x and y
            const col = Math.floor(waypoint.x / GRID_SIZE);
            const row = Math.floor(waypoint.y / GRID_SIZE);
            return `${row}-${col}`;
          }));
        console.log("Attempting to place at row-col:", key);
      
        if (pathSet.has(key)) {
          console.log("Cannot place tower on path tile.");
          return;
        }
      
        const gridX = col * GRID_SIZE + GRID_SIZE / 2;
        const gridY = row * GRID_SIZE + GRID_SIZE / 2;
      
        if (placedTowers.some(t => t.x === gridX && t.y === gridY)) {
          console.log("Tower already exists at this location.");
          return;
        }
      
        const tower = new Tower(gridX, gridY, projectileContainer);
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

  return <div ref={pixiContainer} style={{ width: "100vw", height: "100vh" }} />;
}
