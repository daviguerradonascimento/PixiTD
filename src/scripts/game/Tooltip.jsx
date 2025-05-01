import React from "react";

const Tooltip = ({ x, y, stats }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: y + 12,
        left: x + 12,
        background: "rgba(30, 30, 40, 0.97)",
        color: "#fff",
        padding: "14px 18px",
        borderRadius: "10px",
        zIndex: 200,
        pointerEvents: "none",
        border: "2px solid #66ccff",
        boxShadow: "0 4px 16px #000a",
        fontFamily: "Segoe UI, Arial, sans-serif",
        fontSize: "1.08em",
        minWidth: 160,
        letterSpacing: "0.2px",
        lineHeight: 1.5,
        userSelect: "none",
      }}
    >
      <div style={{ fontWeight: "bold", color: "#66ccff", marginBottom: 6 }}>
        {stats.type?.charAt(0).toUpperCase() + stats.type?.slice(1)} Tower
      </div>
      <div>
        <span style={{ color: "#ffe066" }}>Level:</span>{" "}
        <span style={{ fontWeight: "bold" }}>{stats.level}</span>
      </div>
      <div>
        <span style={{ color: "#00ff99" }}>Range:</span>{" "}
        <span style={{ fontWeight: "bold" }}>{stats.range}</span>
      </div>
      <div>
        <span style={{ color: "#ffcc00" }}>Cooldown:</span>{" "}
        <span style={{ fontWeight: "bold" }}>{stats.cooldown}</span>
      </div>
      <div>
        <span style={{ color: "#ff4d4f" }}>Damage:</span>{" "}
        <span style={{ fontWeight: "bold" }}>{stats.damage}</span>
      </div>
      <div>
        <span style={{ color: "#ff4d4f" }}>Upgrade Cost:</span>{" "}
        <span style={{ fontWeight: "bold" }}>{stats.upgradeCost}</span>
      </div>
    </div>
  );
};

export default Tooltip;