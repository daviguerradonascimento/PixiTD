import { useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { drawIsometricGrid, toIsometric, gridConsts } from './gridUtils';
import { ProceduralLevelGenerator } from './ProceduralLevelGenerator';
import { WaveManager } from './WaveManager';
import { waypointGridCoords } from './Enemy';

export default function usePixiManager(
  gameState,
  {
    cols, rows,
    gameMode, layoutConfig,
    setGrid, setWaypoints, setGridWaypoints,
    waypointsRef, gridWaypointsRef,
    gameStateRef, isPausedRef,
    setGameState, setCurrentWave,
    setGold, setBaseHealth,
    placedTowersRef
  }
) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const waveManagerRef = useRef(null);
  
  const cleanupResources = () => {
    // Stop wave manager
    if (waveManagerRef.current) {
      waveManagerRef.current.cleanup();
    }
    
    // Destroy PIXI app with thorough cleanup
    if (appRef.current) {
      try {
        appRef.current.ticker?.stop();
        
        if (appRef.current.stage) {
          appRef.current.stage.removeChildren();
        }
        
        if (appRef.current.canvas && appRef.current.canvas.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        
        for (const resource in appRef.current.renderer?.textureSystem?.managedTextures || {}) {
          resource?.destroy?.(true);
        }
        
        appRef.current.destroy({
          children: true,
          texture: true,
          baseTexture: true
        });
      } catch (err) {
        console.warn("Error during PIXI cleanup:", err);
      } finally {
        appRef.current = null;
      }
    }
    
    if (pixiContainerRef.current) {
      pixiContainerRef.current.innerHTML = '';
    }
  };
  
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
        const customGridWaypoints = layoutConfig.waypoints;
        setGridWaypoints(customGridWaypoints);
        
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
        () => {},
        initialGridWaypoints,
        cols,
        rows
      );

      const clearProjectiles = () => projectileContainer.removeChildren();

      const resizeGame = () => {
        const container = pixiContainerRef.current;
        const app = appRef.current;
        
        if (!container || !app || !app.renderer || !app.stage) {
          return;
        }
        
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        try {
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
        { cols, rows, gameMode }
      );
      waveManagerRef.current = waveManager;

      app.ticker.add(() => {
        if (isPausedRef.current || gameStateRef.current === "gameover") return;
        
        if (gameStateRef.current === "wave" && waveManagerRef.current) {
          waveManagerRef.current.update(app.ticker.speed);
          
          if (waveManagerRef.current.isWaveComplete()) {
            setGameState("build");
            clearProjectiles();
            setCurrentWave(waveManagerRef.current.currentWave + 1);
          }
          
          if (gameMode !== "infinity" && 
              waveManagerRef.current.currentWave >= waveManagerRef.current.waves.length && 
              waveManagerRef.current.isWaveComplete()) {
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
  
  return {
    pixiContainerRef,
    appRef,
    waveManagerRef,
    initializeGame,
    cleanupResources
  };
}