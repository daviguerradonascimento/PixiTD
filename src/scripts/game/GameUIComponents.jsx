import React from "react";

export const TowerTypeButton = ({ type, selectedTowerType, onClick }) => (
  <button
    onClick={() => onClick(type)}
    style={{
      padding: "6px 12px",
      backgroundColor: selectedTowerType === type ? "#66ccff" : "#ccc",
      color: "#000",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      marginRight: "4px",
    }}
  >
    {type.charAt(0).toUpperCase() + type.slice(1)}
  </button>
);

export const GameControlButton = ({ text, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "6px 12px",
      backgroundColor: disabled ? "#ccc" : "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      marginRight: "4px",
    }}
  >
    {text}
  </button>
);

export const GameInfo = ({ baseHealth, gold, currentWave }) => (
  <>
    <div style={{ position: "absolute", top: 40, left: 10, zIndex: 10, color: "red" }}>
      Base HP: {baseHealth}
    </div>
    <div style={{ position: "absolute", top: 70, left: 10, zIndex: 10, color: "yellow" }}>
      Gold: {gold}
    </div>
    <div style={{ position: "absolute", top: 100, left: 10, zIndex: 10, color: "white" }}>
      Wave: {currentWave}
    </div>
  </>
);

export const TowerActionButtons = ({ onUpgrade, onSell, disabled }) => (
  <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
    <button
      onClick={onUpgrade}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        backgroundColor: disabled ? "#ccc" : "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        marginRight: "4px",
      }}
    >
      Upgrade
    </button>
    <button
      onClick={onSell}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        backgroundColor: disabled ? "#ccc" : "#FF4136",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Sell
    </button>
  </div>
);