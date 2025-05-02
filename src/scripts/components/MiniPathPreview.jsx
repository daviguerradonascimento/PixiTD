import React, { useRef, useEffect } from "react";

const MiniPathPreview = ({ gridWaypoints, cols, rows, visible, width = 280, height = 190 }) => {
  const canvasRef = useRef(null);
  const padding = 15;

  useEffect(() => {
    if (!visible || !canvasRef.current || !gridWaypoints?.length) return;
    
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#232946";
    ctx.globalAlpha = 0.92;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Draw grid
    const cellW = (width - padding * 2) / cols;
    const cellH = (height - padding * 2) / rows;
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(padding + x * cellW, padding);
      ctx.lineTo(padding + x * cellW, height - padding);
      ctx.stroke();
    }
    
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + y * cellH);
      ctx.lineTo(width - padding, padding + y * cellH);
      ctx.stroke();
    }

    // Draw path
    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    
    gridWaypoints.forEach(([col, row], idx) => {
      const cx = padding + (col + 0.5) * cellW;
      const cy = padding + (row + 0.5) * cellH;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    
    ctx.stroke();

    // Draw start/end
    if (gridWaypoints.length > 0) {
      // Start
      const [startCol, startRow] = gridWaypoints[0];
      ctx.fillStyle = "#5e60ce";
      ctx.beginPath();
      ctx.arc(
        padding + (startCol + 0.5) * cellW,
        padding + (startRow + 0.5) * cellH,
        Math.max(cellW, cellH) * 0.32,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // End
      const [endCol, endRow] = gridWaypoints[gridWaypoints.length - 1];
      ctx.fillStyle = "#f2545b";
      ctx.beginPath();
      ctx.arc(
        padding + (endCol + 0.5) * cellW,
        padding + (endRow + 0.5) * cellH,
        Math.max(cellW, cellH) * 0.32,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  }, [gridWaypoints, cols, rows, visible, width, height, padding]);

  if (!visible) return null;
  
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 50,
        background: "rgba(30,30,40,0.97)",
        border: "3px solid #66ccff",
        borderRadius: 16,
        boxShadow: "0 4px 20px #000a",
        pointerEvents: "none",
        boxSizing: "border-box",
        overflow: "hidden", // Keep children inside the border radius
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)",
      }}
    >
      {/* Title bar that spans the full width */}
      <div style={{
        width: "100%",
        textAlign: "center",
        padding: "10px 10px 5px 10px",
        borderBottom: "1px solid #4488aa",
        background: "rgba(35,35,50,0.97)", // Slightly different to create visual separation
        zIndex: 3,
      }}>
        <div style={{
          color: "#66ccff",
          fontWeight: "bold",
          fontSize: "1.3em",
          letterSpacing: "1px",
        }}>
          Path Preview
        </div>
      </div>
      
      {/* Canvas with padding */}
      <div style={{ padding: 10 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            borderRadius: 8,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default MiniPathPreview;