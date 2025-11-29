
import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import Overlay from './components/Overlay';
import { GameState, GameStats, UpgradeType } from './types';
import { STAGES } from './constants';
import { PlayerProgress } from './utils/PlayerProgress';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    level: 1,
    lives: 3,
    maxLives: 3,
    currency: 0
  });

  const playerProgress = PlayerProgress.getInstance();

  const handleStart = () => {
    if (gameState === GameState.LEVEL_COMPLETE) {
        // Proceed to next level
        setStats(prev => {
            const nextLevel = prev.level + 1;
            return { 
                ...prev, 
                level: nextLevel <= STAGES.length ? nextLevel : 1,
                lives: prev.maxLives // Refill health on new stage
            };
        });
        setGameState(GameState.PLAYING);
    } else {
        // Start Game: Jump to highest unlocked stage
        const startLevel = playerProgress.getHighestUnlockedStage();
        setStats({ 
          score: 0, 
          level: startLevel, 
          lives: 3, 
          maxLives: 3, 
          currency: playerProgress.getCurrency() 
        });
        setGameState(GameState.PLAYING);
    }
  };

  const handleSelectStage = (stageLevel: number) => {
      setStats({ score: 0, level: stageLevel, lives: 3, maxLives: 3, currency: playerProgress.getCurrency() });
      setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
    // Restart current stage - Refill health
    setStats(prev => ({ ...prev, score: 0, lives: 3, maxLives: 3, currency: playerProgress.getCurrency() }));
    setGameState(GameState.PLAYING);
  };

  const handlePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    }
  };

  const handleResume = () => {
    if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  };

  const handleQuit = () => {
      // Force refresh of currency stats when returning to menu in case we bought stuff
      setStats(prev => ({...prev, currency: playerProgress.getCurrency()}));
      setGameState(GameState.MENU);
  };

  const handleOpenStageSelect = () => {
      setGameState(GameState.STAGE_SELECT);
  };

  const handleOpenUpgradeMenu = () => {
      setStats(prev => ({...prev, currency: playerProgress.getCurrency()}));
      setGameState(GameState.UPGRADE_MENU);
  }

  const handleUpgrade = (type: UpgradeType) => {
    const success = playerProgress.purchaseUpgrade(type);
    if (success) {
      // Force UI update for currency
      setStats(prev => ({
        ...prev,
        currency: playerProgress.getCurrency()
      }));
    }
  };

  const handleStageComplete = useCallback(() => {
     // Triggered by collision in GameCanvas
  }, []);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[600px] h-full border-x border-gray-800 shadow-[0_0_50px_rgba(0,255,255,0.1)]">
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          stats={stats}
          setStats={setStats}
          onStageComplete={handleStageComplete}
        />
        <Overlay 
          gameState={gameState}
          stats={stats}
          onStart={handleStart}
          onSelectStage={handleSelectStage}
          onRestart={handleRestart}
          onPause={handlePause}
          onResume={handleResume}
          onQuit={handleQuit}
          onUpgrade={handleUpgrade}
          onOpenStageSelect={handleOpenStageSelect}
          onOpenUpgradeMenu={handleOpenUpgradeMenu}
        />
      </div>
    </div>
  );
};

export default App;
