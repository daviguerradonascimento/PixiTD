import { Tower } from "./Tower.jsx";
import { getBlockedTiles, gridConsts, toIsometric } from "./gridUtils.js";

export function handlePlacement({
  col,
  row,
  stage,
  projectileContainer,
  gameStateRef,
  selectedTowerType,
  goldRef,
  gridWaypointsRef,
  placedTowersRef,
  setPlacedTowers,
  setGold,
  setSelectedTower,
  setTooltip,
  cols,
  rows,
}) {
  if (gameStateRef.current !== "build") return;

  const towerBuildCost = Tower.prototype.baseStats[selectedTowerType].buildCost;
  if (goldRef.current < towerBuildCost) {
    console.log("Not enough gold to place tower.");
    return;
  }

  let blockedTiles = getBlockedTiles(gridWaypointsRef.current);
  if (blockedTiles.some(([bx, by]) => bx === col && by === row)) {
    console.log("Cannot place tower on path tile.");
    return;
  }

  const { x, y } = toIsometric(col, row, cols, rows);
  if (placedTowersRef.current.some((t) => t.x === x && t.y === y)) {
    console.log("Tower already exists at this location.");
    return;
  }

  const offsetX = ((cols + rows) * (gridConsts.TILE_WIDTH / 2)) / 2;
  const towerX = x + offsetX + gridConsts.TILE_WIDTH / 2;
  const towerY = y + gridConsts.TILE_HEIGHT / 2;

  const tower = new Tower(towerX, towerY, projectileContainer, selectedTowerType);
  tower.zIndex = 2;
  tower.onSelect = (towerInstance) => setSelectedTower(towerInstance);
  tower.onHover = (stats, x, y) => setTooltip({ visible: true, x, y, stats });
  tower.onOut = () => setTooltip((prev) => ({ ...prev, visible: false }));

  stage.addChild(tower);
  setPlacedTowers([...placedTowersRef.current, tower]);
  setGold(goldRef.current - towerBuildCost);
}

export function sellTower({
  selectedTowerRef,
  setGold,
  goldRef,
  setPlacedTowers,
  placedTowersRef,
  setSelectedTower,
  appRef,
  refundPercentage,
}) {
  if (!selectedTowerRef.current) return;
  const tower = selectedTowerRef.current;
  const refundAmount =
    (tower.baseStats.buildCost + (tower.level - 1) * tower.baseStats.upgradeCost) *
    refundPercentage;
  setGold(goldRef.current + refundAmount);
  appRef.current.stage.removeChild(tower);
  setPlacedTowers(placedTowersRef.current.filter((t) => t !== tower));
  setSelectedTower(null);
}