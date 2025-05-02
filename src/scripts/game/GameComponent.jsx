import React, { useEffect } from "react";
import * as PIXI from "pixi.js";
import { screenToGrid, gridConsts } from "./gridUtils";

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
import { Tower } from "./Tower.jsx";

import MiniPathPreview from "./MiniPathPreview";
import useGameState from "./GameStateManager";
import useAudioManager from "./AudioManager";
import usePixiManager from "./PixiManager";
import useTowerManager from "./TowerManager";



const towerData = [
  { type: "basic", img: basicImage, name: "Basic", price: Tower.prototype.baseStats.basic.buildCost },
  { type: "sniper", img: sniperImage, name: "Sniper", price: Tower.prototype.baseStats.sniper.buildCost },
  { type: "rapid", img: rapidImage, name: "Rapid", price: Tower.prototype.baseStats.rapid.buildCost },
  { type: "splash", img: splashImage, name: "Splash", price: Tower.prototype.baseStats.splash.buildCost },
];

export default function TowerDefenseGame({ gameMode, layoutConfig = null, onReturnToMenu }) {
  // Use our custom hooks to manage different aspects of the game
  const gameState = useGameState(gameMode, layoutConfig);
  
  const pixiManager = usePixiManager(
    gameState.gameState,
    {
      cols: gameState.cols, 
      rows: gameState.rows,
      gameMode, 
      layoutConfig,
      setGrid: gameState.setGrid, 
      setWaypoints: gameState.setWaypoints, 
      setGridWaypoints: gameState.setGridWaypoints,
      waypointsRef: gameState.waypointsRef, 
      gridWaypointsRef: gameState.gridWaypointsRef,
      gameStateRef: gameState.gameStateRef, 
      isPausedRef: gameState.isPausedRef,
      setGameState: gameState.setGameState, 
      setCurrentWave: gameState.setCurrentWave,
      setGold: gameState.setGold, 
      setBaseHealth: gameState.setBaseHealth,
      placedTowersRef: gameState.placedTowersRef
    }
  );
  
  const audioManager = useAudioManager(gameState.gameState, pixiManager.appRef);
  
  const towerManager = useTowerManager({
    pixiContainerRef: pixiManager.pixiContainerRef,
    appRef: pixiManager.appRef,
    draggingTowerType: gameState.draggingTowerType,
    setDraggingTowerType: gameState.setDraggingTowerType,
    setGhostPos: gameState.setGhostPos,
    ghostPos: gameState.ghostPos,
    cols: gameState.cols,
    rows: gameState.rows,
    gameStateRef: gameState.gameStateRef,
    goldRef: gameState.goldRef,
    gold: gameState.gold,
    gridWaypointsRef: gameState.gridWaypointsRef,
    placedTowersRef: gameState.placedTowersRef,
    setPlacedTowers: gameState.setPlacedTowers,
    setGold: gameState.setGold,
    setSelectedTower: gameState.setSelectedTower,
    setTooltip: gameState.setTooltip,
    selectedTowerRef: gameState.selectedTowerRef
  });
  
  // Initialize game and handle cleanup
  useEffect(() => {
    pixiManager.initializeGame();
    return () => {
      pixiManager.cleanupResources();
    };
  }, [pixiManager.initializeGame, gameMode]);
  
  // Update game speed when changed
  useEffect(() => {
    if (pixiManager.appRef.current) {
      pixiManager.appRef.current.ticker.speed = gameState.gameSpeed;
    }
  }, [gameState.gameSpeed]);
  
  // Handle return to menu with cleanup
  const handleReturnToMenu = () => {
    pixiManager.cleanupResources();
    onReturnToMenu();
  };
  
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Drag & Drop Tower Palette */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 20, display: "flex", gap: 8, flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: "center" }}>
          <GameControlButton 
            text="Start Wave" 
            onClick={() => gameState.startWave(pixiManager.waveManagerRef.current)} 
            disabled={gameState.gameState === "wave" || gameState.gameState === "gameover"} 
          />
          <GameControlButton
            text={`Speed: ${gameState.gameSpeed}x`}
            onClick={() => gameState.setGameSpeed(gameState.gameSpeed === 1 ? 2 : 1)}
          />
          <GameControlButton 
            text={gameState.isPaused ? "Resume" : "Pause"} 
            onClick={gameState.togglePause} 
          />
          
          {/* Return to menu button */}
          <button
            style={{
              padding: "6px 16px",
              background: "#D81F26",
              color: "#fff",
              border: "2px solid #AB0F15",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1.08em",
              marginLeft: "16px",
              cursor: "pointer",
              boxShadow: "0 2px 8px #0004",
              display: "flex",
              alignItems: "center"
            }}
            onClick={handleReturnToMenu}
          >
            <span style={{ marginRight: "4px" }}>◀</span> Menu
          </button>
        </div>
        
        {/* Tower buttons */}
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "2vw", justifyContent: "center",}}>
          {towerData.map(({ type, img, name, price }) => (
            <TowerTypeButton
              key={type}
              type={type}
              img={img}
              name={name}
              price={price}
              isSelected={gameState.draggingTowerType === type}
              onMouseDown={() => towerManager.handleDragStart(type)}
              onMouseUp={towerManager.handleDragEnd}
              disabled={gameState.gameState === "wave" || gameState.gameState === "gameover"}
            />
          ))}
        </div>
      </div>
      
      {/* Game over dialog */}
      {gameState.gameState === "gameover" && (
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
          <div style={{ fontWeight: "bold", color: gameState.baseHealth <= 0 ? "#ff4d4f" : "#66ff99", marginBottom: 16 }}>
            {gameState.baseHealth <= 0 ? "Game Over" : "Victory!"}
          </div>
          <div style={{ fontSize: "1.1em", color: "#ffe066", marginBottom: "20px" }}>
            {gameState.baseHealth <= 0
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
            onClick={handleReturnToMenu}
          >
            Return to Menu
          </button>
        </div>
      )}
      
      {/* Ghost Tower Visual Feedback */}
      {gameState.draggingTowerType && gameState.ghostPos && (
        <img
          src={
            gameState.draggingTowerType === "basic"
              ? basicImage
              : gameState.draggingTowerType === "sniper"
              ? sniperImage
              : gameState.draggingTowerType === "rapid"
              ? rapidImage
              : gameState.draggingTowerType === "splash"
              ? splashImage
              : basicImage
          }
          alt="ghost"
          style={{
            position: "absolute",
            left: gameState.ghostPos.x - 24,
            top: gameState.ghostPos.y - 24,
            width: 48,
            height: 48,
            opacity: 0.5,
            pointerEvents: "none",
            zIndex: 100,
            filter: "drop-shadow(0 0 8px #66ccff)",
          }}
        />
      )}

      {/* Game Info */}
      <div
        style={{
          position: "absolute",
          top: "2vw",
          right: "2vw",
          zIndex: 10,
          minWidth: "120px",
          maxWidth: "90vw",
          width: "clamp(140px, 18vw, 320px)",
          pointerEvents: "auto",
        }}
      >
        <GameInfo 
          baseHealth={gameState.baseHealth} 
          gold={gameState.gold} 
          currentWave={gameState.currentWave} 
        />
      </div>

      <MiniPathPreview
        gridWaypoints={gameState.gridWaypoints}
        cols={gameState.cols}
        rows={gameState.rows}
        visible={gameState.gameState === "build"}
        width={Math.min(400, window.innerWidth * 0.35)}
        height={Math.min(280, window.innerHeight * 0.3)}
      />
      
      {gameState.selectedTower && (
        <TowerActionButtons
          onUpgrade={towerManager.handleUpgrade}
          onSell={towerManager.sellTower}
          disabled={gameState.gameState === "wave" || gameState.gameState === "gameover"}
        />
      )}
      
      {gameState.tooltip.visible && (
        <Tooltip 
          x={gameState.tooltip.x} 
          y={gameState.tooltip.y} 
          stats={gameState.tooltip.stats} 
        />
      )}

      <div ref={pixiManager.pixiContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}