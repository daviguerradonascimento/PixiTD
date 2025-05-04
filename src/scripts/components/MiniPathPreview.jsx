import React, { useRef, useEffect } from "react";

const MiniPathPreview = ({ gridWaypoints, cols, rows, visible, width = 280, height = 190 }) => {
  const canvasRef = useRef(null);
  const padding = 15;

  useEffect(() => {
    // Only run this effect when the component is visible and we have waypoints
    if (!visible || !gridWaypoints?.length) return;
    
    // Make sure the canvas ref exists
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear the entire canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#232946";
    ctx.globalAlpha = 0.92;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Calculate cell dimensions
    const cellW = (width - padding * 2) / cols;
    const cellH = (height - padding * 2) / rows;
    
    // Draw grid lines
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
    if (gridWaypoints.length > 1) {
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
    }

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
        overflow: "hidden",
        width: width + 20, // Add padding to the container width
        height: height + 20, // Add padding to the container height
        padding: 10,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: "block",
          borderRadius: 8,
          width: width,   // Explicitly set width
          height: height, // Explicitly set height
        }}
      />
    </div>
  );
};

export default MiniPathPreview;