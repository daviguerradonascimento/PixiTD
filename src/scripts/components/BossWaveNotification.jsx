import React, { useEffect, useState } from 'react';

const BossWaveNotification = ({ isVisible, onAnimationComplete }) => {
  const [animationStage, setAnimationStage] = useState(0);
  
  useEffect(() => {
    if (isVisible) {
      // Start animation sequence
      setAnimationStage(1);
      
      // Stage 2: Fully visible
      const timer1 = setTimeout(() => setAnimationStage(2), 300);
      
      // Stage 3: Begin fade out
      const timer2 = setTimeout(() => setAnimationStage(3), 2500);
      
      // Stage 4: Complete and notify parent
      const timer3 = setTimeout(() => {
        setAnimationStage(0);
        onAnimationComplete();
      }, 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onAnimationComplete]);
  
  if (animationStage === 0) return null;
  
  // Generate animation styles based on current stage
  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1000,
    transition: 'all 0.3s ease-in-out',
    opacity: animationStage === 1 ? 0 : animationStage === 3 ? 0 : 1,
  };
  
  const notificationStyle = {
    background: 'rgba(220, 20, 20, 0.85)',
    color: 'white',
    padding: '1rem 3rem',
    borderRadius: '8px',
    transform: `scale(${animationStage === 1 ? 0.8 : 1.0})`,
    transition: 'all 0.3s ease-out',
    border: '3px solid #ff6666',
    boxShadow: '0 0 30px #ff0000',
    textAlign: 'center',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  };
  
  return (
    <div style={containerStyle}>
      <div style={notificationStyle}>
        <h1 style={{ 
          fontSize: '3rem', 
          margin: '0.5rem 0',
          textShadow: '0 0 10px #ff0000',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          BOSS WAVE!
        </h1>
        <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>
          Prepare your defenses!
        </p>
      </div>
    </div>
  );
};

export default BossWaveNotification;