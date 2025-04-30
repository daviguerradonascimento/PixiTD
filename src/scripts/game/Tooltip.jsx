import React from "react";

const Tooltip = ({ x, y, stats }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "5px",
        borderRadius: "5px",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div>Type: {stats.type}</div>
      <div>Level: {stats.level}</div>
      <div>Range: {stats.range}</div>
      <div>Cooldown: {stats.cooldown}</div>
      <div>Upgrade Cost: {stats.upgradeCost}</div>
    </div>
  );
};

export default Tooltip;