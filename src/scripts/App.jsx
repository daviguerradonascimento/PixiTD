import React, { useState } from "react";
import TowerDefenseGame from "./game/GameComponent";

const App = () => {
  const [gameMode, setGameMode] = useState(null); // null, "traditional", or "infinity"

  const handleModeSelect = (mode) => {
    setGameMode(mode);
  };

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
            onClick={() => handleModeSelect("traditional")}
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
            onClick={() => handleModeSelect("infinity")}
          >
            Infinity Mode
          </button>
        </div>
      ) : (
        // Game Component
        <TowerDefenseGame gameMode={gameMode} />
      )}
    </div>
  );
};

export default App;