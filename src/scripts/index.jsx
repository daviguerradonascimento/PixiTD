import React from "react";
import { createRoot } from "react-dom/client";
import TowerDefenseGame from './components/GameComponent.jsx';
import App from "./App.jsx";



const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);