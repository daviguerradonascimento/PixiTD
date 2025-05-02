import React, { useState, useEffect } from "react";
import TowerDefenseGame from './components/GameComponent';
import { Assets } from "pixi.js";
import basicImage from "../assets/sprites/basic.png";
import sniperImage from "../assets/sprites/sniper.png";
import rapidImage from "../assets/sprites/fast.png";
import splashImage from "../assets/sprites/splash.png";
import tankImage from "../assets/sprites/knight_level_3.png";
import enemyImage from "../assets/sprites/knight_level_2.png";
import fastImage from "../assets/sprites/knight_level_1.png";

const assetList = [
  { alias: "basic", src: basicImage },
  { alias: "sniper", src: sniperImage },
  { alias: "rapid", src: rapidImage },
  { alias: "splash", src: splashImage },
  { alias: "tank", src: tankImage },
  { alias: "enemy", src: enemyImage },
  { alias: "fast_enemy", src: fastImage },
];

// Predefined game layouts
const traditionalLayouts = [
  { 
    id: "classic", 
    name: "Classic", 
    description: "The original layout with a simple path",
    preview: "🗺️",
    cols: 10,
    rows: 6,
    waypoints: [[0, 1], [1, 1], [2, 1], [2, 4], [7, 4], [7, 1], [9, 1]]
  },
  { 
    id: "maze", 
    name: "Maze", 
    description: "A complex zigzag maze to test your strategy",
    preview: "🌀",
    cols: 12,
    rows: 8,
    waypoints: [[0, 3], [2, 3], [2, 1], [4, 1], [4, 5], [6, 5], [6, 2], [9, 2], [9, 6], [11, 6]]
  },
  { 
    id: "spiral", 
    name: "Spiral", 
    description: "A spiral path that winds toward the center",
    preview: "🌪️",
    cols: 10,
    rows: 10,
    waypoints: [[0, 4], [8, 4], [8, 1], [2, 1], [2, 7], [6, 7], [6, 3], [4, 3], [4, 5], [9, 5]] 
  }
];

const App = () => {
  const [gameMode, setGameMode] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  const resetGame = () => {
    setGameMode(null);
    setSelectedLayout(null);
  };

  useEffect(() => {
    // Preload all assets before showing the menu/game
    Assets.load(assetList).then(() => setAssetsLoaded(true));
  }, []);

  if (!assetsLoaded) {
    return (
      <div style={{
        color: "#fff",
        background: "#222",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2em"
      }}>
        Loading assets...
      </div>
    );
  }

  const renderMenu = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #232946 0%, #181c24 100%)",
        }}
      >
        <div
          style={{
            background: "rgba(30, 30, 40, 0.97)",
            borderRadius: "18px",
            border: "3px solid #66ccff",
            boxShadow: "0 4px 32px #000a",
            padding: "3em 4em 2.5em 4em",
            minWidth: 340,
            maxWidth: "90vw",
            textAlign: "center",
            fontFamily: "Segoe UI, Arial, sans-serif",
            color: "#fff",
            letterSpacing: "1px",
            userSelect: "none",
          }}
        >
          <h1 style={{
            color: "#66ccff",
            fontWeight: "bold",
            fontSize: "2.8em",
            marginBottom: 24,
            letterSpacing: "2px",
            textShadow: "0 2px 8px #000a"
          }}>
            Pixi TD
          </h1>
          <button
            style={{
              padding: "14px 36px",
              fontSize: "1.25em",
              margin: "12px 0",
              cursor: "pointer",
              borderRadius: "8px",
              border: "2px solid #66ccff",
              background: "#181c24",
              color: "#fff",
              fontWeight: "bold",
              boxShadow: "0 2px 8px #0004",
              transition: "background 0.2s, color 0.2s, border 0.2s",
              letterSpacing: "1px",
            }}
            onClick={() => setGameMode("traditional")}
          >
            Traditional Mode
          </button>
          <br />
          <button
            style={{
              padding: "14px 36px",
              fontSize: "1.25em",
              margin: "12px 0",
              cursor: "pointer",
              borderRadius: "8px",
              border: "2px solid #66ccff",
              background: "#181c24",
              color: "#fff",
              fontWeight: "bold",
              boxShadow: "0 2px 8px #0004",
              transition: "background 0.2s, color 0.2s, border 0.2s",
              letterSpacing: "1px",
            }}
            onClick={() => setGameMode("infinity")}
          >
            Infinity Mode
          </button>
        </div>
      </div>
    );
  };

  const renderTraditionalLayoutMenu = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #232946 0%, #181c24 100%)",
        }}
      >
        <div
          style={{
            background: "rgba(30, 30, 40, 0.97)",
            borderRadius: "18px",
            border: "3px solid #66ccff",
            boxShadow: "0 4px 32px #000a",
            padding: "2em 3em",
            minWidth: 380,
            maxWidth: "90vw",
            textAlign: "center",
            fontFamily: "Segoe UI, Arial, sans-serif",
            color: "#fff",
            letterSpacing: "1px",
            userSelect: "none",
          }}
        >
          <h2 style={{
            color: "#66ccff",
            fontWeight: "bold",
            fontSize: "2.2em",
            marginBottom: 20,
            letterSpacing: "1px",
            textShadow: "0 2px 8px #000a"
          }}>
            Choose a Layout
          </h2>
          
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px",
            marginBottom: "24px",
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "10px 0"
          }}>
            {traditionalLayouts.map(layout => (
  <div 
    key={layout.id}
    style={{
      background: selectedLayout?.id === layout.id 
        ? "rgba(60, 70, 95, 0.9)" 
        : "rgba(40, 45, 60, 0.8)",
      borderRadius: "12px",
      border: selectedLayout?.id === layout.id 
        ? "2px solid #66ccff" 
        : "2px solid #3a4466",
      padding: "14px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      textAlign: "left",
      boxShadow: selectedLayout?.id === layout.id 
        ? "0 0 12px rgba(102, 204, 255, 0.4)" 
        : "0 2px 8px rgba(0, 0, 0, 0.2)",
    }}
    onClick={() => setSelectedLayout(layout)}
  >
    <div style={{ 
      fontSize: "2.5em", 
      marginRight: "16px",
      width: "60px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: selectedLayout?.id === layout.id 
        ? "#1a2035" 
        : "#232946",
      borderRadius: "8px",
      transition: "all 0.2s"
    }}>
      {layout.preview}
    </div>
    <div>
      <div style={{ 
        fontWeight: "bold", 
        fontSize: "1.2em", 
        color: selectedLayout?.id === layout.id 
          ? "#8cdfff" 
          : "#66ccff" 
      }}>
        {layout.name}
      </div>
      <div style={{ fontSize: "0.9em", color: "#ddd", marginTop: "4px" }}>
        {layout.description}
      </div>
      <div style={{ fontSize: "0.8em", color: "#aaa", marginTop: "4px" }}>
        Grid: {layout.cols}x{layout.rows}
      </div>
    </div>
    
    {/* Add a checkmark icon when selected */}
    {selectedLayout?.id === layout.id && (
      <div style={{
        marginLeft: "auto", 
        color: "#66ccff", 
        fontSize: "1.5em",
        fontWeight: "bold"
      }}>
        ✓
      </div>
    )}
  </div>
))}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <button
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                cursor: "pointer",
                borderRadius: "8px",
                border: "2px solid #66ccff",
                background: "#181c24",
                color: "#fff",
                fontWeight: "bold",
              }}
              onClick={() => setGameMode(null)}
            >
              Back
            </button>
            
            <button
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                cursor: selectedLayout ? "pointer" : "not-allowed",
                borderRadius: "8px",
                border: "2px solid #66ccff",
                background: selectedLayout ? "#66ccff" : "#333",
                color: selectedLayout ? "#181c24" : "#888",
                fontWeight: "bold",
                opacity: selectedLayout ? 1 : 0.6,
              }}
              onClick={() => selectedLayout && setGameMode("traditional-custom")}
              disabled={!selectedLayout}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main rendering logic
  if (gameMode === null) {
    return renderMenu();
  } else if (gameMode === "traditional") {
    return renderTraditionalLayoutMenu();
  } else {
    // Either infinity mode or traditional-custom with a selected layout
    return (
      <TowerDefenseGame 
        key={`game-${Date.now()}-${gameMode}-${selectedLayout?.id || 'default'}`}
        gameMode={gameMode === "traditional-custom" ? "traditional" : gameMode} 
        layoutConfig={gameMode === "traditional-custom" ? selectedLayout : null}
        onReturnToMenu={resetGame}
      />
    );
  }
};

export default App;