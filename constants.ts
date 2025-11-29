
import { StageConfig, UpgradeType, UpgradeConfig } from './types';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800; // Fallback/Base height
export const PLAYER_SPEED = 5; 
export const PLAYER_SIZE = { width: 40, height: 40 };
export const PROJECTILE_SIZE = { width: 6, height: 16 };
export const ENEMY_SIZE = { width: 35, height: 35 };
export const BOSS_SIZE = { width: 140, height: 100 }; // Slightly larger boss
export const LEVEL_KEY_SIZE = { width: 30, height: 30 };
export const COIN_SIZE = { width: 10, height: 10 };
export const BIG_COIN_SIZE = { width: 18, height: 18 };

// Gameplay Constants
export const PLAYER_MAX_Y_PERCENT = 0.9; // Player can move in bottom 90%

// Colors
export const COLOR_PLAYER = '#ffffff';
export const COLOR_PLAYER_PROJECTILE = '#ffff00'; // Yellow
export const COLOR_PLAYER_PROJECTILE_MAX = '#00ffff'; // Cyan (Max Level)
export const COLOR_LEVEL_KEY = '#ffd700'; // Gold
export const COLOR_COIN = '#ffd700'; // Gold
export const COLOR_COIN_GLOW = '#ffff00';
export const COLOR_SHIELD = 'rgba(0, 255, 255, 0.4)';

// World Constants
const WORLD_1_NAME = "The Neon Nebula";
const WORLD_1_COLOR = "#00ffff"; // Cyan
const WORLD_2_NAME = "The Cyber Void";
const WORLD_2_COLOR = "#ff00ff"; // Magenta

export const STAGES: StageConfig[] = [
  // --- WORLD 1: THE NEON NEBULA (No Shooting, Cyan Theme) ---
  {
    level: 1,
    name: "Sector Alpha",
    worldName: WORLD_1_NAME,
    primaryColor: WORLD_1_COLOR, 
    secondaryColor: '#00cccc',
    isBossStage: false,
    waves: [
      { enemyCount: 1, spawnInterval: 120, enemySpeed: 0.4, enemyHealth: 2, startDelay: 60 },
      { enemyCount: 2, spawnInterval: 120, enemySpeed: 0.5, enemyHealth: 2, startDelay: 100 },
      { enemyCount: 2, spawnInterval: 100, enemySpeed: 0.5, enemyHealth: 2, startDelay: 100 }
    ]
  },
  {
    level: 2,
    name: "Sector Beta",
    worldName: WORLD_1_NAME,
    primaryColor: WORLD_1_COLOR, 
    secondaryColor: '#00cccc',
    isBossStage: false,
    waves: [
      { enemyCount: 2, spawnInterval: 100, enemySpeed: 0.6, enemyHealth: 4, startDelay: 60 },
      { enemyCount: 3, spawnInterval: 90, enemySpeed: 0.7, enemyHealth: 4, startDelay: 100 },
      { enemyCount: 3, spawnInterval: 80, enemySpeed: 0.8, enemyHealth: 3, startDelay: 100 }
    ]
  },
  {
    level: 3,
    name: "Sector Gamma",
    worldName: WORLD_1_NAME,
    primaryColor: WORLD_1_COLOR, 
    secondaryColor: '#00cccc',
    isBossStage: false,
    waves: [
      { enemyCount: 3, spawnInterval: 80, enemySpeed: 0.8, enemyHealth: 7, startDelay: 60 },
      { enemyCount: 4, spawnInterval: 70, enemySpeed: 0.9, enemyHealth: 7, startDelay: 120 },
      { enemyCount: 3, spawnInterval: 60, enemySpeed: 1.2, enemyHealth: 5, startDelay: 100 }
    ]
  },
  {
    level: 4,
    name: "Sector Delta",
    worldName: WORLD_1_NAME,
    primaryColor: WORLD_1_COLOR, 
    secondaryColor: '#00cccc',
    isBossStage: false,
    waves: [
      { enemyCount: 4, spawnInterval: 70, enemySpeed: 1.0, enemyHealth: 10, startDelay: 60 },
      { enemyCount: 4, spawnInterval: 65, enemySpeed: 1.1, enemyHealth: 10, startDelay: 100 }
    ]
  },
  {
    level: 5,
    name: "Nebula Core",
    worldName: WORLD_1_NAME,
    primaryColor: WORLD_1_COLOR, 
    secondaryColor: '#cc0000',
    isBossStage: true,
    waves: [] // Boss 1
  },

  // --- WORLD 2: THE CYBER VOID (Enemies Shoot, Magenta Theme) ---
  {
    level: 6,
    name: "Void Entrance",
    worldName: WORLD_2_NAME,
    primaryColor: WORLD_2_COLOR,
    secondaryColor: '#ff00aa',
    isBossStage: false,
    waves: [
      { enemyCount: 3, spawnInterval: 90, enemySpeed: 0.8, enemyHealth: 15, fireChance: 1, startDelay: 60 }, 
      { enemyCount: 3, spawnInterval: 90, enemySpeed: 0.9, enemyHealth: 15, fireChance: 1, startDelay: 100 }
    ]
  },
  {
    level: 7,
    name: "Data Stream",
    worldName: WORLD_2_NAME,
    primaryColor: WORLD_2_COLOR,
    secondaryColor: '#ff00aa',
    isBossStage: false,
    waves: [
      { enemyCount: 4, spawnInterval: 80, enemySpeed: 1.0, enemyHealth: 20, fireChance: 1, startDelay: 60 },
      { enemyCount: 4, spawnInterval: 75, enemySpeed: 1.1, enemyHealth: 18, fireChance: 1, startDelay: 100 }
    ]
  },
  {
    level: 8,
    name: "Corrupted Memory",
    worldName: WORLD_2_NAME,
    primaryColor: WORLD_2_COLOR,
    secondaryColor: '#ff00aa',
    isBossStage: false,
    waves: [
      { enemyCount: 5, spawnInterval: 70, enemySpeed: 1.1, enemyHealth: 25, fireChance: 1, startDelay: 60 },
      { enemyCount: 4, spawnInterval: 60, enemySpeed: 1.2, enemyHealth: 22, fireChance: 1, startDelay: 100 }
    ]
  },
  {
    level: 9,
    name: "Firewall Breach",
    worldName: WORLD_2_NAME,
    primaryColor: WORLD_2_COLOR,
    secondaryColor: '#ff00aa',
    isBossStage: false,
    waves: [
      { enemyCount: 5, spawnInterval: 60, enemySpeed: 1.2, enemyHealth: 35, fireChance: 1, startDelay: 60 },
      { enemyCount: 5, spawnInterval: 50, enemySpeed: 1.3, enemyHealth: 30, fireChance: 1, startDelay: 100 }
    ]
  },
  {
    level: 10,
    name: "The Void Heart",
    worldName: WORLD_2_NAME,
    primaryColor: WORLD_2_COLOR,
    secondaryColor: '#ff0000',
    isBossStage: true,
    waves: [] // Boss 2
  }
];

export const UPGRADE_DEFINITIONS: Record<UpgradeType, UpgradeConfig> = {
  // --- OFFENSE ---
  [UpgradeType.WEAPON_DAMAGE]: {
    name: 'Photon Overcharge',
    description: 'Increases bullet damage.',
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 10,
    baseValue: 1, 
    valuePerLevel: 2,
    category: 'OFFENSE'
  },
  [UpgradeType.FIRE_RATE]: {
    name: 'Rapid Fire Core',
    description: 'Reduces shot cooldown.',
    baseCost: 150,
    costMultiplier: 1.5,
    maxLevel: 8,
    baseValue: 30, 
    valuePerLevel: 0,
    category: 'OFFENSE'
  },
  [UpgradeType.MULTISHOT]: {
    name: 'Spread Shot',
    description: 'Adds diagonal projectiles.',
    baseCost: 300,
    costMultiplier: 2.0,
    maxLevel: 3,
    baseValue: 0,
    valuePerLevel: 1,
    category: 'OFFENSE'
  },
  [UpgradeType.PROJECTILE_SPEED]: {
    name: 'Plasma Velocity',
    description: 'Bullets travel faster.',
    baseCost: 80,
    costMultiplier: 1.3,
    maxLevel: 5,
    baseValue: 10,
    valuePerLevel: 2,
    category: 'OFFENSE'
  },

  // --- DEFENSE ---
  [UpgradeType.MAX_HEALTH]: {
    name: 'Nano-Weave Armor',
    description: 'Increases hull integrity (HP).',
    baseCost: 120,
    costMultiplier: 1.4,
    maxLevel: 10,
    baseValue: 3,
    valuePerLevel: 1,
    category: 'DEFENSE'
  },
  [UpgradeType.SHIELD]: {
    name: 'Emergency Shield',
    description: 'Absorbs one hit per stage.',
    baseCost: 250,
    costMultiplier: 2.0,
    maxLevel: 1,
    baseValue: 0,
    valuePerLevel: 1,
    category: 'DEFENSE'
  },

  // --- UTILITY ---
  [UpgradeType.MOVEMENT_SPEED]: {
    name: 'Thruster Overdrive',
    description: 'Enhances ship maneuverability.',
    baseCost: 80,
    costMultiplier: 1.3,
    maxLevel: 3,
    baseValue: 0.1, 
    valuePerLevel: 0.05,
    category: 'UTILITY'
  },
  [UpgradeType.MAGNET]: {
    name: 'Gravity Well',
    description: 'Pulls loose currency.',
    baseCost: 100,
    costMultiplier: 1.5,
    maxLevel: 5,
    baseValue: 0, 
    valuePerLevel: 50,
    category: 'UTILITY'
  },
  [UpgradeType.CRIT_CHANCE]: {
    name: 'Luck Processor',
    description: 'Chance to deal double damage.',
    baseCost: 150,
    costMultiplier: 1.4,
    maxLevel: 5,
    baseValue: 0,
    valuePerLevel: 0.05, 
    category: 'UTILITY'
  }
};