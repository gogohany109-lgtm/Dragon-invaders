
import React, { useState, useEffect } from 'react';
import { GameEngine } from './components/GameEngine';
import { GameState, GameStats } from './types';
import { generateDragonLore } from './services/geminiService';
import { initAudio, playGameOver, toggleMute, getMuteStatus } from './services/soundService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [gameStats, setGameStats] = useState<GameStats>({ score: 0, lives: 3, level: 1 });
  const [lore, setLore] = useState<string>("");
  const [loadingLore, setLoadingLore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(!getMuteStatus());

  // Generate Lore on Game Over
  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      playGameOver(); // Play sound
      setLoadingLore(true);
      generateDragonLore(gameStats.score, 'defeat').then(text => {
        setLore(text);
        setLoadingLore(false);
      });
    }
  }, [gameState, gameStats.score]);

  // Handle Pause Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showSettings]); 

  const togglePause = () => {
    setGameState(prev => {
      if (prev === GameState.PLAYING) return GameState.PAUSED;
      if (prev === GameState.PAUSED) return GameState.PLAYING;
      return prev;
    });
  };

  const quitToMenu = () => {
    setGameState(GameState.START);
  };

  const startGame = () => {
    initAudio(); // Initialize Web Audio API on user interaction
    setGameStats({ score: 0, lives: 3, level: 1 });
    setGameState(GameState.PLAYING);
  };

  const handleToggleSound = () => {
    const muted = toggleMute();
    setIsSoundOn(!muted);
  };

  return (
    <div className="h-[100dvh] w-full bg-neutral-900 flex items-center justify-center md:p-4 relative overflow-hidden touch-none">
      
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      
      {/* Arcade Cabinet Frame - Responsive Container */}
      <div className="relative z-10 w-full h-full md:h-auto md:max-h-[90vh] md:aspect-[6/7] lg:aspect-[3/4] bg-neutral-800 md:rounded-3xl shadow-2xl md:border-4 border-neutral-700 flex flex-col md:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Cabinet Header */}
        <div className="w-full flex justify-between items-center p-2 md:p-4 border-b-2 border-neutral-700 bg-neutral-800 shrink-0 z-20 h-16 md:h-20">
           <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 font-bold drop-shadow-[2px_2px_0_rgba(255,0,0,0.5)] tracking-tighter" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                DRAGON
              </h1>
              <h2 className="text-xs md:text-xl text-cyan-400 tracking-widest mt-1 opacity-80" style={{ fontFamily: '"Press Start 2P", cursive' }}>INVADERS</h2>
           </div>
           
           <div className="flex gap-2 md:gap-4 items-center">
             {/* Pause Button (Visible during play) */}
             {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && !showSettings && (
                <button 
                  onClick={togglePause}
                  className="hidden md:block text-neutral-400 hover:text-white border-2 border-neutral-600 hover:border-white rounded px-3 py-2 text-xs font-bold transition-colors"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  {gameState === GameState.PAUSED ? "RESUME" : "PAUSE"}
                </button>
             )}

             {/* Score Board */}
             <div className="bg-black border-2 border-neutral-600 rounded p-1 px-2 md:p-2 md:px-4 text-right min-w-[100px] md:min-w-[150px]">
                <div className="text-[10px] md:text-xs text-red-500 mb-0 md:mb-1">SCORE</div>
                <div className="text-sm md:text-xl text-white font-mono">{gameStats.score.toString().padStart(6, '0')}</div>
             </div>
           </div>
        </div>

        {/* Game Viewport - Flex grow to fill available space */}
        <div className="relative flex-1 w-full bg-black overflow-hidden md:rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,1)] md:border-x-4 md:border-b-4 border-neutral-900 flex items-center justify-center">
           
           {/* CRT Overlays */}
           <div className="scanline"></div>
           <div className="crt-flicker"></div>
           
           <GameEngine 
              gameState={gameState} 
              setGameState={setGameState} 
              gameStats={gameStats}
              setGameStats={setGameStats}
           />

           {/* UI Overlay: Settings */}
           {showSettings && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50 backdrop-blur-md text-center p-4">
               <h2 className="text-2xl md:text-4xl text-cyan-400 mb-8 drop-shadow-lg tracking-widest" style={{ fontFamily: '"Press Start 2P", cursive' }}>SETTINGS</h2>
               
               <button 
                  onClick={handleToggleSound}
                  className={`px-6 py-3 mb-6 w-64 font-bold rounded border-b-4 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base ${isSoundOn ? 'bg-green-600 hover:bg-green-500 border-green-800 text-white' : 'bg-neutral-600 hover:bg-neutral-500 border-neutral-800 text-neutral-300'}`}
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
               >
                  SOUND FX: {isSoundOn ? "ON" : "OFF"}
               </button>

               <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 w-64 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
               >
                  BACK
               </button>
             </div>
           )}

           {/* UI Overlay: Start Screen */}
           {gameState === GameState.START && !showSettings && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm text-center p-4">
                <div className="animate-pulse mb-6 md:mb-8 text-cyan-400 text-lg md:text-xl">START PLAYING</div>
                <button 
                  onClick={startGame}
                  className="px-6 py-3 md:px-8 md:py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-xl mb-4"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  PRESS START
                </button>
                
                <button 
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 md:px-6 md:py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded border-b-4 border-neutral-900 active:border-b-0 active:translate-y-1 transition-all text-xs md:text-sm"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  SETTINGS
                </button>

                <div className="mt-6 md:mt-8 text-neutral-500 text-[10px] md:text-xs max-w-md leading-5 md:leading-6">
                   CONTROLS:<br/>
                   ARROWS / TOUCH to Move<br/>
                   SPACE / TAP to Fire<br/>
                   P to Pause
                </div>
             </div>
           )}

            {/* UI Overlay: Pause Screen */}
            {gameState === GameState.PAUSED && !showSettings && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30 backdrop-blur-[2px] text-center p-4">
                <h2 className="text-2xl md:text-4xl text-yellow-400 mb-6 md:mb-8 drop-shadow-lg tracking-widest animate-pulse" style={{ fontFamily: '"Press Start 2P", cursive' }}>PAUSED</h2>
                <button 
                  onClick={togglePause}
                  className="px-5 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base mb-4 w-52"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  RESUME GAME
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="px-5 py-2 md:px-6 md:py-3 bg-neutral-600 hover:bg-neutral-500 text-white font-bold rounded border-b-4 border-neutral-800 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base mb-4 w-52"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  SETTINGS
                </button>
                <button 
                  onClick={quitToMenu}
                  className="px-5 py-2 md:px-6 md:py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base w-52"
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  EXIT TO MENU
                </button>
             </div>
           )}

           {/* UI Overlay: Game Over */}
           {gameState === GameState.GAME_OVER && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 z-20 backdrop-blur-sm p-4 md:p-8 text-center">
                <h2 className="text-2xl md:text-4xl text-white mb-2 md:mb-4 drop-shadow-lg">GAME OVER</h2>
                <div className="text-yellow-400 mb-4 md:mb-6 text-sm md:text-xl">FINAL SCORE: {gameStats.score}</div>
                
                {/* AI Lore Box */}
                <div className="bg-black/50 p-3 md:p-4 rounded border border-red-500/30 w-full max-w-md mb-6 md:mb-8 min-h-[80px] md:min-h-[100px] flex items-center justify-center">
                  {loadingLore ? (
                    <span className="text-neutral-400 animate-pulse text-[10px] md:text-xs">Consulting the Oracles...</span>
                  ) : (
                    <p className="text-neutral-300 text-xs md:text-sm leading-5 md:leading-6 italic">"{lore}"</p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={startGame}
                    className="px-5 py-2 md:px-6 md:py-3 bg-white text-black hover:bg-neutral-200 font-bold rounded border-b-4 border-neutral-400 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base w-52"
                    style={{ fontFamily: '"Press Start 2P", cursive' }}
                  >
                    TRY AGAIN
                  </button>

                  <button 
                    onClick={quitToMenu}
                    className="px-5 py-2 md:px-6 md:py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base w-52"
                    style={{ fontFamily: '"Press Start 2P", cursive' }}
                  >
                    EXIT TO MENU
                  </button>
                </div>
             </div>
           )}
           
           {/* HUD: Lives & Level */}
           <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-1 md:gap-2 pointer-events-none z-10">
              {Array.from({ length: Math.max(0, gameStats.lives) }).map((_, i) => (
                <div key={i} className="text-lg md:text-2xl text-blue-400">🛡️</div>
              ))}
           </div>
           <div className="absolute top-2 right-2 md:top-4 md:right-4 text-white text-xs md:text-sm pointer-events-none z-10">
              LVL {gameStats.level}
           </div>

        </div>

        {/* Cabinet Footer - Decorative, hidden on mobile */}
        <div className="hidden md:flex w-full mt-2 justify-between items-end opacity-50 px-4 pb-4 shrink-0">
           <div className="flex gap-4">
              <div className="w-10 h-10 bg-neutral-700 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-neutral-600"></div>
              <div className="w-10 h-10 bg-neutral-700 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-neutral-600"></div>
           </div>
           <div className="text-neutral-600 text-[10px]">
              © 198X DRAGON CORP
           </div>
        </div>

      </div>
    </div>
  );
}
