import React, { useRef, useEffect } from "react";

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
  
  export function TowerTypeButton({ type, img, name, price, isSelected, onMouseDown, onMouseUp, disabled }) {
    // Use ref to store the event handlers
    const imgRef = useRef(null);
    
    // Set up touch event listeners with passive: false when component mounts
    useEffect(() => {
      const imgElement = imgRef.current;
      if (!imgElement) return;
      
      const handleTouchStart = (e) => {
        e.preventDefault(); // Now this will work
        onMouseDown();
      };
      
      const handleTouchEnd = (e) => {
        e.preventDefault(); // Now this will work
        onMouseUp();
      };
      
      // Add event listeners with passive: false
      imgElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      imgElement.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      // Clean up
      return () => {
        imgElement.removeEventListener('touchstart', handleTouchStart);
        imgElement.removeEventListener('touchend', handleTouchEnd);
      };
    }, [onMouseDown, onMouseUp]);
    
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, opacity: disabled ? 0.5 : 1 }}>
        <img
          ref={imgRef} // Add this ref
          src={img}
          alt={type}
          draggable={false}
          style={{
            width: 80,
            height: 80,
            border: isSelected ? "2px solid #66ccff" : "2px solid #ccc",
            borderRadius: 8,
            cursor: "grab",
            background: "#222",
            touchAction: "none",
          }}
          onMouseDown={onMouseDown} // Keep basic mouse handlers
          onMouseUp={onMouseUp}
        />
        <div style={{
          marginTop: 4,
          fontWeight: "bold",
          color: "#fff",
          fontSize: "1em",
          textShadow: "0 1px 2px #000a",
          letterSpacing: "0.5px"
        }}>
          {name}
        </div>
        <div style={{
          color: "#ffd700",
          fontWeight: "bold",
          fontSize: "0.95em",
          marginTop: 2,
          background: "#181c24",
          borderRadius: 6,
          padding: "2px 8px",
          border: "1px solid #444",
          boxShadow: "0 1px 4px #0004"
        }}>
          ⛃ {price}
        </div>
      </div>
    );
  }
  
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