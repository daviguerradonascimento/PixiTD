import { useEffect, useRef, useCallback } from 'react';
import { handlePlacement, sellTower as sellTowerLogic } from './towerUtils';
import { screenToGrid } from './gridUtils';

const REFUND_PERCENTAGE = 0.7;

export default function useTowerManager({
  pixiContainerRef, appRef,
  draggingTowerType, setDraggingTowerType,
  setGhostPos, ghostPos,
  cols, rows,
  gameStateRef,
  goldRef, gold,
  gridWaypointsRef,
  placedTowersRef, setPlacedTowers,
  setGold, setSelectedTower, setTooltip,
  selectedTowerRef,
  isPanningRef
}) {
  // Add a new state to track if we're currently dragging
  const isDraggingRef = useRef(false);

  // Handle tower dragging
  const handleDragStart = (type) => {
    setDraggingTowerType(type);
    setGhostPos(null);
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    setDraggingTowerType(null);
    setGhostPos(null);
    isDraggingRef.current = false;
  };

  // Mouse/touch move handler for tower ghost position
  useEffect(() => {
    if (!draggingTowerType || !pixiContainerRef.current) return;

    const handlePointerMove = (e) => {
      e.preventDefault(); // Prevent scrolling during drag

      const rect = pixiContainerRef.current.getBoundingClientRect();
      // Get position from either mouse or touch event
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      setGhostPos({ x: mouseX, y: mouseY });
    };

    // Add both mouse and touch event listeners
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [draggingTowerType]);

  // Convert mouse/touch coordinates to stage coordinates
  const getStageCoords = (clientX, clientY) => {
    const rect = pixiContainerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const app = appRef.current;
    if (!app) return { x: mouseX, y: mouseY };
    const stage = app.stage;
    const scale = stage.scale.x;
    const stageX = (mouseX - stage.x) / scale;
    const stageY = (mouseY - stage.y) / scale;
    return { x: stageX, y: stageY };
  };

  // Handle tower placement for both mouse and touch
  const handlePointerUp = useCallback((e) => {
    if (!draggingTowerType) return;

    if (isPanningRef.current) {
        handleDragEnd();
        return;
      }

    console.log("Pointer up event received:", e.type);

    // Don't immediately prevent default - we need the coordinates
    let clientX, clientY;

    // Handle different event types properly
    if (e.type === "touchend" && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
      e.preventDefault(); // Stop further touch events
    } else if (e.type === "mouseup") {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      // Fallback to ghost position if event coordinates aren't available
      if (ghostPos) {
        const rect = pixiContainerRef.current.getBoundingClientRect();
        clientX = ghostPos.x + rect.left;
        clientY = ghostPos.y + rect.top;
      } else {
        // If all fails, exit
        handleDragEnd();
        return;
      }
    }

    const { x, y } = getStageCoords(clientX, clientY);
    const { col, row } = screenToGrid(x, y, cols, rows);

    console.log("Placing tower at grid:", col, row, "from coords:", x, y);

    handlePlacement({
      col,
      row,
      stage: appRef.current.stage,
      projectileContainer: appRef.current.stage.children.find(c => c.zIndex === 15),
      gameStateRef,
      selectedTowerTypeRef: { current: draggingTowerType },
      goldRef,
      gridWaypointsRef,
      placedTowersRef,
      setPlacedTowers,
      setGold,
      setSelectedTower,
      setTooltip,
      cols,
      rows,
      selectedTowerRef,
    });

    handleDragEnd();
  }, [draggingTowerType, ghostPos, cols, rows, isPanningRef]);

  // Add event listeners for both mouse and touch events
  useEffect(() => {
    const canvas = pixiContainerRef.current;
    if (!canvas) return;

    if (draggingTowerType) {
      // Use document to capture events that might happen outside the canvas
      document.addEventListener("mouseup", handlePointerUp);
      document.addEventListener("touchend", handlePointerUp, { passive: false });
      document.addEventListener("touchcancel", handleDragEnd);

      // Also handle direct events on the canvas
      canvas.addEventListener("mouseup", handlePointerUp);
      canvas.addEventListener("touchend", handlePointerUp, { passive: false });
    }

    return () => {
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchend", handlePointerUp);
      document.removeEventListener("touchcancel", handleDragEnd);

      canvas.removeEventListener("mouseup", handlePointerUp);
      canvas.removeEventListener("touchend", handlePointerUp);
    };
  }, [draggingTowerType, handlePointerUp]);

  // Tower actions
  const sellTower = () =>
    sellTowerLogic({
      selectedTowerRef,
      setGold,
      goldRef,
      setPlacedTowers,
      placedTowersRef,
      setSelectedTower,
      appRef,
      refundPercentage: REFUND_PERCENTAGE,
    });

  const handleUpgrade = () => {
    if (selectedTowerRef.current) {
      selectedTowerRef.current.upgrade(setGold, gold);
    }
  };

  return {
    handleDragStart,
    handleDragEnd,
    handlePointerUp,
    getStageCoords,
    sellTower,
    handleUpgrade
  };
}