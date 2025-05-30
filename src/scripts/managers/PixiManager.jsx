import { useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { drawIsometricGrid, toIsometric, gridConsts } from '../utils/gridUtils';
import { ProceduralLevelGenerator } from '../utils/ProceduralLevelGenerator';
import { WaveManager } from './WaveManager';
import { waypointGridCoords } from '../entities/Enemy';

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
    placedTowersRef,
    onBossWave
  }
) {
  const pixiContainerRef = useRef(null);
  const appRef = useRef(null);
  const waveManagerRef = useRef(null);

  // Add state for stage panning
  const dragStartRef = useRef(null);
  const isPanningRef = useRef(false);

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

      stage.eventMode = 'static';

      stage.on('pointerdown', (event) => {
        // Only start dragging when not placing towers or during game or wave
        if (gameStateRef.current !== "gameover" && !event.defaultPrevented) {
          dragStartRef.current = { 
            x: event.client.x - stage.x, 
            y: event.client.y - stage.y 
          };
          isPanningRef.current = true;
        }
      });

      stage.on('pointermove', (event) => {
        if (isPanningRef.current && dragStartRef.current) {
          const newX = event.client.x - dragStartRef.current.x;
          const newY = event.client.y - dragStartRef.current.y;

          // Limit dragging to reasonable bounds
          const maxDrag = Math.max(cols * gridConsts.TILE_WIDTH, rows * gridConsts.TILE_HEIGHT) * 2;

          stage.x = Math.max(Math.min(newX, maxDrag), -maxDrag);
          stage.y = Math.max(Math.min(newY, maxDrag), -maxDrag);

          // Prevent tower placement when dragging
          event.stopPropagation();
        }
      });

      stage.on('pointerup', () => {
        isPanningRef.current = false;
        dragStartRef.current = null;
      });

      stage.on('pointerupoutside', () => {
        isPanningRef.current = false;
        dragStartRef.current = null;
      });

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

          app.stage.scale.set(scale * 0.8);

          // Center the grid initially if not already positioned by user
          if (!dragStartRef.current) {
            app.stage.x = (containerWidth - totalGridWidth * scale * 0.8) / 2;
            app.stage.y = (containerHeight - totalGridHeight * scale * 0.8) / 2;
          }
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
        { 
          cols, 
          rows, 
          gameMode,
          onBossWave // Pass the callback here
        }
      );
      waveManagerRef.current = waveManager;

      app.ticker.add(() => {
        if (isPausedRef.current || gameStateRef.current === "gameover") {
          if (waveManagerRef.current) {
            waveManagerRef.current.setPaused(true);
          }
          return;
        }

        if (waveManagerRef.current) {
          waveManagerRef.current.setPaused(false);
        }

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
  }, [cols, rows, gameMode, layoutConfig, onBossWave]);

  // Add a method to reset the grid position
  const resetGridPosition = () => {
    if (appRef.current && pixiContainerRef.current) {
      const container = pixiContainerRef.current;
      const app = appRef.current;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const totalGridWidth = (cols + rows) * (gridConsts.TILE_WIDTH / 2);
      const totalGridHeight = (cols + rows) * (gridConsts.TILE_HEIGHT / 2);
      const scale = Math.min(containerWidth / totalGridWidth, containerHeight / totalGridHeight);

      app.stage.x = (containerWidth - totalGridWidth * scale * 0.8) / 2;
      app.stage.y = (containerHeight - totalGridHeight * scale * 0.8) / 2;
    }
  };

  return {
    pixiContainerRef,
    appRef,
    waveManagerRef,
    initializeGame,
    cleanupResources,
    resetGridPosition,
    isPanningRef
  };
}