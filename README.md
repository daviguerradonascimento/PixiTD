# PixiTD - Tower Defense Game

![PixiTD Game Screenshot](image.png)

## Project Overview:
A browser-based tower defense game built with PixiJS and React. PixiTD features both traditional and procedurally generated levels, multiple tower types, and responsive gameplay.

## Features

- **Multiple Game Modes**
  - Traditional mode with predefined maps
  - Infinity mode with procedurally generated maps
  
- **Tower Types**
  - Basic Tower: Balanced attack and range
  - Sniper Tower: High damage and long range
  - Rapid Tower: Fast firing speed with lower damage
  - Splash Tower: Area damage attack
  
- **Enemy Types**
  - Basic: Standard enemy
  - Fast: Moves quicker but has less health
  - Tank: Slow but high health
  
- **Gameplay Features**
  - Upgradeable towers
  - Path preview before waves
  - Dynamic music that changes between build and wave phases
  - Visual and sound effects for combat
  - Tower tooltips and stats
  - Game speed controls and pause functionality
  
- **UI Features**
  - Interactive grid panning with pan/drag controls
  - Touch-friendly controls
  - Minimap path preview
  - Tower drag and drop placement
  - Responsive design for various screen sizes

## Controls

- **Tower Placement**: Drag and drop tower icons to the grid
- **Grid Navigation**: Click and drag the grid to move it around
- **Tower Management**: Click on placed towers to upgrade or sell them
- **Game Controls**: Use the buttons at the top to start waves, adjust speed, or pause the game
- **Return to Menu**: Click the Menu button to return to the main menu

## Technical Implementation

- **Framework**: React with PixiJS rendering
- **Architecture**: Component-based design with custom hooks for game logic
- **Rendering**: Isometric grid with layered sprites
- **Audio**: Dynamic audio management based on game state

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation
1. Clone the repository
   ```
   git clone https://github.com/daviguerradonascimento/pixitd.git
   cd pixitd
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Build for production
   ```
   npm run build
   ```

## Project Structure

- components: UI components like GameComponent and Tooltip
- entities: Game objects like Tower, Enemy, and Projectile
- managers: Game state management logic
- utils: Helper functions and utility classes
- assets: Game assets (sprites, audio)
- webpack: Webpack configuration files
