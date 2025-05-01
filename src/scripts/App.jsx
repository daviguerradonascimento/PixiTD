import React, { useState, useEffect } from "react";
import TowerDefenseGame from "./game/GameComponent";
import { Assets } from "pixi.js";
import basicImage from "../sprites/basic.png";
import sniperImage from "../sprites/sniper.png";
import rapidImage from "../sprites/fast.png";
import splashImage from "../sprites/splash.png";
import tileImage from "../sprites/tile2.png";
import tankImage from "../sprites/knight_level_3.png";
import enemyImage from "../sprites/knight_level_2.png";
import fastImage from "../sprites/knight_level_1.png";

const assetList = [
  { alias: "basic", src: basicImage },
  { alias: "sniper", src: sniperImage },
  { alias: "rapid", src: rapidImage },
  { alias: "splash", src: splashImage },
  { alias: "tile", src: tileImage },
  { alias: "tank", src: tankImage },
  { alias: "enemy", src: enemyImage },
  { alias: "fast_enemy", src: fastImage },
];

const App = () => {
  const [gameMode, setGameMode] = useState(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

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

  return (
    <div>
      {gameMode === null ? (
        // Menu
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
      ) : (
        <TowerDefenseGame gameMode={gameMode} />
      )}
    </div>
  );
};

export default App;