import React, { useState } from "react";
import TowerDefenseGame from "./game/GameComponent";
import InfinityModeGame from "./game/InfinityGameComponent"; // Import the new component

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
      ) : gameMode === "traditional" ? (
        // Traditional Mode
        <TowerDefenseGame />
      ) : (
        // Infinity Mode
        <InfinityModeGame />
      )}
    </div>
  );
};

export default App;