import { useEffect } from 'react';
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
  selectedTowerRef
}) {
  // Handle tower dragging
  const handleDragStart = (type) => {
    setDraggingTowerType(type);
    setGhostPos(null);
  };

  const handleDragEnd = () => {
    setDraggingTowerType(null);
    setGhostPos(null);
  };

  // Mouse move handler for tower ghost position
  useEffect(() => {
    if (!draggingTowerType || !pixiContainerRef.current) return;

    const handleMouseMove = (e) => {
      const rect = pixiContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setGhostPos({ x: mouseX, y: mouseY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [draggingTowerType]);

  // Convert mouse coordinates to stage coordinates
  const getStageCoords = (mouseX, mouseY) => {
    const app = appRef.current;
    if (!app) return { x: mouseX, y: mouseY };
    const stage = app.stage;
    const scale = stage.scale.x;
    const stageX = (mouseX - stage.x) / scale;
    const stageY = (mouseY - stage.y) / scale;
    return { x: stageX, y: stageY };
  };

  // Handle tower placement
  const handleCanvasDrop = (e) => {
    if (!draggingTowerType) return;
    e.preventDefault();
    const rect = pixiContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x, y } = getStageCoords(mouseX, mouseY);
    const { col, row } = screenToGrid(x, y, cols, rows);
    
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
  };

  // Add event listener for tower placement
  useEffect(() => {
    const canvas = pixiContainerRef.current;
    if (!canvas) return;
    if (draggingTowerType) {
      canvas.addEventListener("mouseup", handleCanvasDrop);
    }
    return () => {
      canvas.removeEventListener("mouseup", handleCanvasDrop);
    };
  }, [draggingTowerType, handleCanvasDrop]);

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
    handleCanvasDrop,
    getStageCoords,
    sellTower,
    handleUpgrade
  };
}