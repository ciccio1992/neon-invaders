
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  STAGE_SELECT = 'STAGE_SELECT',
  UPGRADE_MENU = 'UPGRADE_MENU'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum EntityType {
  PLAYER = 'PLAYER',
  PLAYER_PROJECTILE = 'PLAYER_PROJECTILE',
  ENEMY = 'ENEMY',
  ENEMY_PROJECTILE = 'ENEMY_PROJECTILE',
  BOSS = 'BOSS',
  PARTICLE = 'PARTICLE',
  LEVEL_KEY = 'LEVEL_KEY',
  COIN = 'COIN'
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  size: Size;
  velocity: Position;
  color: string;
  health: number;
  maxHealth: number;
  markedForDeletion: boolean;
  scoreValue?: number;
  currencyValue?: number;
  hoverOffset?: number; // Used for sine wave movement patterns
  value?: number; // For coins
  hasShield?: boolean; // For Emergency Shield upgrade
  fireChance?: number; // Chance per frame to shoot (0 to 1)
  shootCooldown?: number; // Frames until next shot
  variant?: 'ALPHA' | 'OMEGA'; // Visual variant for bosses
}

export interface WaveConfig {
  enemyCount: number;
  spawnInterval: number; // Frames between individual enemy spawns in this wave
  enemySpeed: number;
  enemyHealth: number;
  enemyColor?: string; // Optional override
  startDelay?: number; // Frames to wait before starting this wave
  fireChance?: number; // 0 = no shooting, 0.01 = 1% chance per frame
}

export interface StageConfig {
  level: number;
  name: string;
  worldName: string; // New grouping category
  primaryColor: string; // Default Enemy color
  secondaryColor: string; // Projectile/Effect color
  waves: WaveConfig[];
  isBossStage: boolean;
  backgroundAsset?: string;
}

export interface GameStats {
  score: number;
  level: number;
  lives: number;
  maxLives: number;
  currency: number;
}

export interface PlayerData {
  currency: number;
  highestUnlockedStage: number;
  upgrades: Record<UpgradeType, number>;
}

export enum UpgradeType {
  // Offense
  WEAPON_DAMAGE = 'WEAPON_DAMAGE',
  FIRE_RATE = 'FIRE_RATE',
  MULTISHOT = 'MULTISHOT',
  PROJECTILE_SPEED = 'PROJECTILE_SPEED',
  
  // Defense
  MAX_HEALTH = 'MAX_HEALTH',
  SHIELD = 'SHIELD',
  
  // Utility
  MOVEMENT_SPEED = 'MOVEMENT_SPEED',
  MAGNET = 'MAGNET',
  CRIT_CHANCE = 'CRIT_CHANCE'
}

export interface UpgradeConfig {
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  baseValue: number;
  valuePerLevel: number;
  category: 'OFFENSE' | 'DEFENSE' | 'UTILITY';
}