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
            backgroundColor: "#333",
            color: "white",
          }}
        >
          <h1>Pixi TD</h1>
          <button
            style={{
              padding: "10px 20px",
              fontSize: "1.2em",
              margin: "10px",
              cursor: "pointer",
            }}
            onClick={() => setGameMode("traditional")}
          >
            Traditional Mode
          </button>
          <button
            style={{
              padding: "10px 20px",
              fontSize: "1.2em",
              margin: "10px",
              cursor: "pointer",
            }}
            onClick={() => setGameMode("infinity")}
          >
            Infinity Mode
          </button>
        </div>
      ) : (
        <TowerDefenseGame gameMode={gameMode} />
      )}
    </div>
  );
};

export default App;