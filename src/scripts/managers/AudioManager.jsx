import { useEffect, useRef } from 'react';
// Update paths to audio files
import buildMusicSrc from "../../assets/audio/chill.mp3";
import waveMusicSrc from "../../assets/audio/battle.mp3";

export default function useAudioManager(gameState, appRef) {
  const buildMusicRef = useRef(null);
  const waveMusicRef = useRef(null);
  
  // Initialize audio objects
  useEffect(() => {
    buildMusicRef.current = new Audio(buildMusicSrc);
    buildMusicRef.current.loop = true;
    buildMusicRef.current.volume = 0.3;

    waveMusicRef.current = new Audio(waveMusicSrc);
    waveMusicRef.current.loop = true;
    waveMusicRef.current.volume = 0.4;

    return () => {
      buildMusicRef.current?.pause();
      waveMusicRef.current?.pause();
    };
  }, []);
  
  // Start initial music when app is ready
  useEffect(() => {
    if (appRef.current && buildMusicRef.current) {
      const timer = setTimeout(() => {
        try {
          buildMusicRef.current.volume = 0.3;
          buildMusicRef.current.play().catch(err => {
            if (err.name !== "AbortError") {
              console.warn("Initial music autoplay failed:", err);
            }
          });
        } catch (err) {
          console.warn("Error playing initial music:", err);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [appRef.current]);
  
  // Handle music based on game state
  useEffect(() => {
    let isMounted = true;
    
    const playAudio = async (audioElement) => {
      if (!audioElement || !audioElement.paused) return;
      
      try {
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          if (isMounted) {
            audioElement.volume = audioElement === buildMusicRef.current ? 0.3 : 0.4;
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Audio play failed:", error);
        }
      }
    };
  
    const pauseAudio = (audioElement) => {
      if (!audioElement || audioElement.paused) return;
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  
    if (gameState === "build") {
      pauseAudio(waveMusicRef.current);
      playAudio(buildMusicRef.current);
    } else if (gameState === "wave") {
      pauseAudio(buildMusicRef.current);
      playAudio(waveMusicRef.current);
    } else {
      pauseAudio(buildMusicRef.current);
      pauseAudio(waveMusicRef.current);
    }
  
    return () => {
      isMounted = false;
      buildMusicRef.current?.pause();
      waveMusicRef.current?.pause();
    };
  }, [gameState]);
  
  return {
    buildMusicRef,
    waveMusicRef
  };
}