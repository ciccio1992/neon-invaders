
import React from 'react';
import { GameState, GameStats, StageConfig, UpgradeType } from '../types';
import { STAGES, UPGRADE_DEFINITIONS } from '../constants';
import { PlayerProgress } from '../utils/PlayerProgress';

interface OverlayProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  onSelectStage: (stage: number) => void;
  onRestart: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onUpgrade: (type: UpgradeType) => void;
  onOpenStageSelect: () => void;
  onOpenUpgradeMenu: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  gameState, 
  stats, 
  onStart,
  onSelectStage, 
  onRestart,
  onPause,
  onResume,
  onQuit,
  onUpgrade,
  onOpenStageSelect,
  onOpenUpgradeMenu
}) => {
  const currentStage: StageConfig = STAGES[stats.level - 1] || STAGES[0];
  const playerProgress = PlayerProgress.getInstance();

  // Common Button Style
  const btnClass = "relative px-6 py-3 bg-black/80 text-white font-bold border shadow-[0_0_10px_currentColor] active:bg-white/10 active:scale-95 transition-all uppercase tracking-widest clip-path-polygon touch-manipulation";
  
  const HealthBar = () => {
      const hearts = [];
      const max = stats.maxLives || 3;
      // Limit visual hearts to prevent overflow on mobile if upgraded heavily
      const displayMax = Math.min(max, 10); 
      
      for (let i = 0; i < displayMax; i++) {
          hearts.push(
              <div 
                key={i} 
                className={`w-3 h-3 md:w-4 md:h-4 transform rotate-45 border border-red-500 ${i < stats.lives ? 'bg-red-500 shadow-[0_0_8px_#ff0000]' : 'bg-transparent opacity-30'} transition-all`}
              />
          );
      }
      return <div className="flex gap-1.5 items-center">{hearts}</div>;
  };

  const UpgradeCard = ({ type }: { type: UpgradeType }) => {
    const config = UPGRADE_DEFINITIONS[type];
    const currentLevel = playerProgress.getUpgradeLevel(type);
    const cost = playerProgress.getUpgradeCost(type);
    const isMaxed = currentLevel >= config.maxLevel;
    const canAfford = stats.currency >= cost;

    return (
      <div className="bg-black/60 border-l-4 border-cyan-500 p-3 mb-2 flex justify-between items-center w-full backdrop-blur-sm shrink-0">
        <div className="text-left flex-1 mr-2 min-w-0">
          <div className="text-cyan-400 font-bold text-sm md:text-base uppercase tracking-wider truncate">{config.name}</div>
          <div className="text-[10px] text-cyan-200 mb-1 italic truncate">{config.description}</div>
          <div className="text-[10px] text-cyan-700">Lvl {currentLevel} <span className="text-gray-500">/ {config.maxLevel}</span></div>
        </div>
        <button 
          onClick={() => onUpgrade(type)}
          disabled={isMaxed || !canAfford}
          className={`px-3 py-2 text-xs font-bold border min-w-[70px] ${
            isMaxed 
              ? 'border-gray-600 text-gray-600 cursor-not-allowed' 
              : canAfford 
                ? 'bg-cyan-950 border-cyan-400 text-cyan-200 active:bg-cyan-800 shadow-[0_0_5px_#00ffff]' 
                : 'border-red-900 text-red-800 cursor-not-allowed'
          }`}
        >
          {isMaxed ? 'MAX' : `$${cost}`}
        </button>
      </div>
    );
  };

  const UpgradeCategory = ({ title, types }: { title: string, types: UpgradeType[] }) => (
      <div className="mb-4 w-full">
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 ml-1 border-b border-gray-800 pb-1">{title}</h3>
          <div className="flex flex-col gap-1">
              {types.map(t => <UpgradeCard key={t} type={t} />)}
          </div>
      </div>
  );

  // --- GAMEPLAY HUD ---
  if (gameState === GameState.PLAYING) {
    const stageColor = currentStage.primaryColor;
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 z-20 overflow-hidden bg-gradient-to-b from-black/50 to-transparent via-transparent h-24">
        
        {/* TOP BAR: Pause | Health | Stage */}
        <div className="flex justify-between items-start w-full">
            {/* LEFT: Pause Button */}
            <div className="pointer-events-auto flex flex-col items-start gap-2">
                <button 
                    onClick={onPause}
                    className="w-10 h-10 flex items-center justify-center text-white/80 active:text-white transition-colors"
                >
                    <div className="space-x-1">
                        <span className="inline-block w-1.5 h-4 bg-white shadow-[0_0_5px_white]"></span>
                        <span className="inline-block w-1.5 h-4 bg-white shadow-[0_0_5px_white]"></span>
                    </div>
                </button>
                
                {/* Score */}
                <div className="flex flex-col items-start pl-1">
                    <span className="text-[8px] text-gray-400 tracking-widest uppercase text-shadow-neon">Score</span>
                    <span className="text-cyan-400 font-bold text-lg tracking-widest drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] leading-none">
                        {stats.score.toString().padStart(6, '0')}
                    </span>
                </div>
            </div>

            {/* CENTER: Health */}
            <div className="mt-2">
                <HealthBar />
            </div>

            {/* RIGHT: Stage Info */}
            <div className="flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                    <div 
                        className="font-black text-2xl md:text-3xl tracking-tighter leading-none"
                        style={{ color: stageColor, textShadow: `0 0 10px ${stageColor}` }}
                    >
                        {stats.level}
                    </div>
                    <div className="text-[8px] md:text-[10px] text-white/80 uppercase tracking-widest leading-none">
                        Stage
                    </div>
                </div>
                
                {/* Credits */}
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] text-gray-400 tracking-widest uppercase text-shadow-neon">Credits</span>
                    <span className="text-yellow-400 font-bold text-lg tracking-widest drop-shadow-[0_0_5px_rgba(255,255,0,0.5)] leading-none">
                        ${stats.currency}
                    </span>
                 </div>
            </div>
        </div>
      </div>
    );
  }

  // --- PAUSE MENU ---
  if (gameState === GameState.PAUSED) {
      const primary = currentStage.primaryColor;
      const secondary = currentStage.secondaryColor;
      
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50 p-6">
          <h2 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-[0.2em]">PAUSED</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
                onClick={onResume} 
                className={btnClass} 
                style={{ borderColor: primary, color: primary }}
            >
                Resume
            </button>
            <button 
                onClick={onRestart} 
                className={btnClass}
                style={{ borderColor: '#ffff00', color: '#ffff00' }}
            >
                Restart
            </button>
            <button 
                onClick={onQuit} 
                className={btnClass}
                style={{ borderColor: '#ff0000', color: '#ff0000' }}
            >
                Quit
            </button>
          </div>
        </div>
      );
  }

  // --- STAGE SELECT ---
  if (gameState === GameState.STAGE_SELECT) {
      const highest = playerProgress.getHighestUnlockedStage();
      return (
        <div className="absolute inset-0 flex flex-col bg-black/95 backdrop-blur-xl z-50">
            {/* Header */}
            <div className="p-4 shrink-0 text-center border-b border-gray-800">
                <h2 className="text-2xl font-black text-cyan-400 text-shadow-neon uppercase tracking-widest">Select Sector</h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {STAGES.map((stage) => {
                        const isLocked = stage.level > highest;
                        return (
                            <button
                                key={stage.level}
                                disabled={isLocked}
                                onClick={() => onSelectStage(stage.level)}
                                className={`flex items-center justify-between p-3 border-l-4 transition-all w-full
                                    ${isLocked 
                                        ? 'bg-gray-900/50 border-gray-700 opacity-50 cursor-not-allowed' 
                                        : 'bg-white/5 border-cyan-500 active:bg-cyan-900/30 cursor-pointer shadow-[0_0_10px_rgba(0,255,255,0.1)]'}
                                `}
                            >
                                <div className="text-left w-full">
                                    <div className={`text-[9px] uppercase tracking-widest ${isLocked ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {stage.worldName}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className={`text-base font-bold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                            STAGE {stage.level}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-widest ${isLocked ? 'text-gray-600' : 'text-cyan-400'} text-right`}>
                                            {isLocked ? 'LOCKED' : stage.name}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-gray-800 shrink-0 bg-black/80 backdrop-blur">
                <button onClick={onQuit} className="w-full py-3 bg-black/80 text-gray-400 font-bold border border-gray-500 shadow-none active:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest clip-path-polygon">
                    Back
                </button>
            </div>
        </div>
      );
  }

  // --- UPGRADE MENU (Standalone) ---
  if (gameState === GameState.UPGRADE_MENU) {
    return (
      <div className="absolute inset-0 flex flex-col bg-black/95 backdrop-blur-xl z-50">
        <div className="p-4 shrink-0 bg-black/80 border-b border-cyan-900/50 flex flex-col items-center z-10">
             <h2 className="text-2xl font-black text-cyan-400 text-shadow-neon uppercase tracking-widest mb-1">Upgrades</h2>
             <div className="flex items-center gap-2">
                 <span className="text-[10px] text-gray-400 uppercase tracking-wider">Credits</span>
                 <span className="text-yellow-400 font-bold font-mono text-lg text-shadow-neon">${stats.currency}</span>
             </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <div className="max-w-md mx-auto">
                <UpgradeCategory title="Weapons" types={[UpgradeType.WEAPON_DAMAGE, UpgradeType.FIRE_RATE, UpgradeType.MULTISHOT, UpgradeType.PROJECTILE_SPEED]} />
                <UpgradeCategory title="Defense" types={[UpgradeType.MAX_HEALTH, UpgradeType.SHIELD]} />
                <UpgradeCategory title="Utility" types={[UpgradeType.MOVEMENT_SPEED, UpgradeType.MAGNET, UpgradeType.CRIT_CHANCE]} />
            </div>
        </div>

        <div className="p-4 border-t border-gray-800 shrink-0 bg-black/80 backdrop-blur z-10">
            <button onClick={onQuit} className="w-full py-3 bg-black/80 text-gray-400 font-bold border border-gray-500 shadow-none active:bg-gray-900 active:scale-95 transition-all uppercase tracking-widest clip-path-polygon">
                Back
            </button>
        </div>
      </div>
    );
  }

  // --- MAIN MENU ---
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50 overflow-hidden">
        <div className="mb-8 text-center relative px-4 group">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] italic transform -skew-x-12 leading-tight">
            NEON<br/>INVADERS
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4 group-hover:via-purple-500 transition-all duration-500"></div>
        </div>
        
        <div className="text-gray-400 mb-8 text-center font-light tracking-widest text-[10px] uppercase opacity-70">
            System Online...<br/>
            Target: The Crimson Core
        </div>
        
        <div className="flex flex-col gap-4 w-64 max-w-[80%]">
            <button 
            onClick={onStart}
            className="w-full py-4 bg-cyan-600 active:bg-cyan-500 text-black font-black text-lg skew-x-[-10deg] border-2 border-white shadow-[0_0_30px_#00ffff] active:scale-95 transition-transform duration-200"
            >
            <span className="block skew-x-[10deg]">LAUNCH</span>
            </button>
            
            <button 
                onClick={onOpenUpgradeMenu}
                className="w-full py-3 bg-transparent active:bg-cyan-900/30 text-cyan-400 font-bold text-base skew-x-[-10deg] border border-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.3)] active:scale-95 transition-all"
            >
                <span className="block skew-x-[10deg]">UPGRADES</span>
            </button>

            {playerProgress.getHighestUnlockedStage() > 1 && (
                <button 
                onClick={onOpenStageSelect}
                className="w-full py-3 bg-transparent active:bg-purple-900/30 text-purple-400 font-bold text-base skew-x-[-10deg] border border-purple-500 shadow-[0_0_10px_rgba(255,0,255,0.3)] active:scale-95 transition-all"
                >
                <span className="block skew-x-[10deg]">SECTORS</span>
                </button>
            )}
        </div>
      </div>
    );
  }

  // --- LEVEL COMPLETE ---
  if (gameState === GameState.LEVEL_COMPLETE) {
    const hasNextStage = stats.level < STAGES.length;

    return (
      <div className="absolute inset-0 flex flex-col bg-blue-950/90 backdrop-blur-xl z-50">
        {/* Sticky Header */}
        <div className="p-6 shrink-0 text-center bg-black/20 border-b border-cyan-500/30">
            <h2 className="text-3xl font-black mb-1 text-cyan-400 text-shadow-neon uppercase tracking-widest">Sector Cleared</h2>
            <div className="text-[10px] font-mono text-cyan-300 tracking-[0.3em]">SYSTEM UPGRADE AVAILABLE</div>
        </div>
        
        {/* Scrollable Content (Upgrades) */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
             <div className="max-w-md mx-auto">
                 <div className="flex justify-between w-full mb-6 border-b border-cyan-900 pb-2">
                     <span className="text-gray-400 uppercase text-xs tracking-wider">Available Credits</span>
                     <span className="text-yellow-400 font-bold font-mono text-lg">${stats.currency}</span>
                 </div>
                 
                 <div className="w-full">
                    {/* Show Recommended upgrades for quick access */}
                    <UpgradeCategory title="Recommended Upgrades" types={[UpgradeType.WEAPON_DAMAGE, UpgradeType.FIRE_RATE, UpgradeType.MAX_HEALTH]} />
                    
                    <button onClick={onOpenUpgradeMenu} className="w-full py-2 text-xs text-cyan-300 border border-cyan-900 bg-cyan-950/30 mt-2 mb-4">
                        OPEN FULL ARMORY
                    </button>
                </div>
            </div>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="p-4 border-t-2 border-cyan-500 bg-black/80 backdrop-blur shrink-0 z-10">
            <div className="flex gap-3 max-w-md mx-auto">
                <button onClick={onQuit} className="flex-1 py-3 bg-gray-800 active:bg-gray-700 text-gray-300 font-bold border border-gray-600 uppercase tracking-wider text-sm">
                    Menu
                </button>
                <button 
                onClick={onStart}
                className="flex-[2] py-3 bg-cyan-600 active:bg-cyan-500 text-black font-bold text-base uppercase tracking-widest shadow-[0_0_20px_#00ffff]"
                >
                {hasNextStage ? 'Next Sector' : 'Finish'}
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-50 text-center px-6">
        <h2 className="text-4xl md:text-6xl font-black mb-4 text-red-500 text-shadow-neon tracking-widest uppercase">Critical Failure</h2>
        <div className="text-xl mb-12 font-mono text-white/80">SCORE: {stats.score}</div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
            onClick={onRestart}
            className="w-full py-4 bg-transparent border-2 border-red-500 text-red-500 active:bg-red-500 active:text-black font-bold text-lg uppercase tracking-widest transition-colors shadow-[0_0_20px_#ff0000]"
            >
            Reboot System
            </button>
            <button onClick={onQuit} className="text-gray-400 active:text-white mt-2 uppercase tracking-widest text-xs p-4">
                Return to Menu
            </button>
        </div>
      </div>
    );
  }

  // --- VICTORY ---
  if (gameState === GameState.VICTORY) {
     return (
       <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-950/90 backdrop-blur-md z-50 px-6">
         <h2 className="text-3xl md:text-5xl font-black mb-6 text-green-400 text-shadow-neon uppercase tracking-wider text-center">Mission Accomplished</h2>
         <p className="mb-8 text-center max-w-md text-green-200 leading-relaxed font-light text-sm">
            The Void Heart has been neutralized.<br/>
            Galaxy security restored.
         </p>
         <div className="text-3xl mb-12 font-mono text-yellow-300 drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]">{stats.score} PTS</div>
         <button 
           onClick={onQuit}
           className="w-full max-w-xs py-4 bg-green-600 active:bg-green-500 text-black font-bold text-lg uppercase tracking-widest shadow-[0_0_30px_#00ff00]"
         >
           Return to Base
         </button>
       </div>
     );
   }

  return null;
};

export default Overlay;
