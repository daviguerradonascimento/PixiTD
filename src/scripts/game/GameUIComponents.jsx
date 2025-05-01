import React from "react";

const uiButtonStyle = (color, borderColor, disabled, extra = {}) => ({
    padding: "6px 16px",
    background: disabled ? "#222" : "#181c24",
    color: color,
    border: `2px solid ${borderColor}`,
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "1.08em",
    marginRight: "8px",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 2px 8px #0004",
    transition: "background 0.2s, color 0.2s, border 0.2s",
    ...extra,
  });
  
  export const TowerTypeButton = ({ type, selectedTowerType, onClick }) => {
    const isSelected = selectedTowerType === type;
    const colorMap = {
      basic: "#66ccff",
      sniper: "#ffcc00",
      rapid: "#00ff99",
      splash: "#ff3333",
    };
    return (
      <button
        onClick={() => onClick(type)}
        style={uiButtonStyle(
          isSelected ? "#fff" : colorMap[type] || "#fff",
          isSelected ? "#fff" : colorMap[type] || "#fff",
          false,
          {
            background: isSelected ? colorMap[type] : "#181c24",
            marginRight: 8,
          }
        )}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </button>
    );
  };
  
  export const GameControlButton = ({ text, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={uiButtonStyle("#fff", "#66ccff", disabled)}
    >
      {text}
    </button>
  );
  

export const GameInfo = ({ baseHealth, gold, currentWave }) => (
    <div
    style={{
        position: "fixed",
        bottom: 32,
        left: 32,
        zIndex: 100,
        background: "rgba(30, 30, 40, 0.92)",
        borderRadius: "12px",
        boxShadow: "0 2px 12px #0008",
        padding: "18px 28px",
        minWidth: 180,
        fontFamily: "Segoe UI, Arial, sans-serif",
        fontSize: "1.15em",
        color: "#fff",
        border: "2px solid #444",
        letterSpacing: "0.5px",
        userSelect: "none",
      }}
    >
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
        <span style={{ color: "#ff4d4f", fontWeight: "bold", marginRight: 8, fontSize: "1.2em" }}>
          ♥
        </span>
        <span>Base HP:</span>
        <span style={{ marginLeft: "auto", color: "#ff4d4f", fontWeight: "bold" }}>{baseHealth}</span>
      </div>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
        <span style={{ color: "#ffd700", fontWeight: "bold", marginRight: 8, fontSize: "1.2em" }}>
          ⛃
        </span>
        <span>Gold:</span>
        <span style={{ marginLeft: "auto", color: "#ffd700", fontWeight: "bold" }}>{gold}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: "#66ccff", fontWeight: "bold", marginRight: 8, fontSize: "1.2em" }}>
          ⚔
        </span>
        <span>Wave:</span>
        <span style={{ marginLeft: "auto", color: "#66ccff", fontWeight: "bold" }}>{currentWave}</span>
      </div>
    </div>
  );

  export const TowerActionButtons = ({ onUpgrade, onSell, disabled }) => (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
      <button
        onClick={onUpgrade}
        disabled={disabled}
        style={uiButtonStyle("#4CAF50", "#4CAF50", disabled)}
      >
        Upgrade
      </button>
      <button
        onClick={onSell}
        disabled={disabled}
        style={uiButtonStyle("#FF4136", "#FF4136", disabled)}
      >
        Sell
      </button>
    </div>
  );