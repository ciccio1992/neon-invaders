
import { PlayerData, UpgradeType } from '../types';
import { UPGRADE_DEFINITIONS } from '../constants';

export class PlayerProgress {
  private static instance: PlayerProgress;
  private data: PlayerData;

  private constructor() {
    this.data = {
      currency: 0,
      highestUnlockedStage: 1,
      upgrades: {
        [UpgradeType.WEAPON_DAMAGE]: 1,
        [UpgradeType.FIRE_RATE]: 1,
        [UpgradeType.MULTISHOT]: 1,
        [UpgradeType.PROJECTILE_SPEED]: 1,
        [UpgradeType.MAX_HEALTH]: 1,
        [UpgradeType.SHIELD]: 0, // Starts locked (Level 0)
        [UpgradeType.MOVEMENT_SPEED]: 1,
        [UpgradeType.MAGNET]: 1,
        [UpgradeType.CRIT_CHANCE]: 0 // Starts locked
      }
    };
  }

  public static getInstance(): PlayerProgress {
    if (!PlayerProgress.instance) {
      PlayerProgress.instance = new PlayerProgress();
    }
    return PlayerProgress.instance;
  }

  public getData(): PlayerData {
    return { ...this.data, upgrades: { ...this.data.upgrades } };
  }

  public getCurrency(): number {
    return this.data.currency;
  }

  public addCurrency(amount: number): void {
    this.data.currency += Math.floor(amount);
  }

  public getHighestUnlockedStage(): number {
    return this.data.highestUnlockedStage;
  }

  public unlockNextStage(currentCompletedStage: number): void {
    if (currentCompletedStage >= this.data.highestUnlockedStage) {
      this.data.highestUnlockedStage = currentCompletedStage + 1;
    }
  }

  public getUpgradeLevel(type: UpgradeType): number {
    return this.data.upgrades[type];
  }

  public getUpgradeCost(type: UpgradeType): number {
    const level = this.data.upgrades[type];
    const config = UPGRADE_DEFINITIONS[type];
    
    if (level >= config.maxLevel) {
      return Infinity; // Maxed out
    }
    
    // Cost = Base * (Multiplier ^ (Level - 1)) if level > 0
    // If level is 0 (unlocking), cost is Base
    const power = Math.max(0, level - 1);
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, power));
  }

  public purchaseUpgrade(type: UpgradeType): boolean {
    const cost = this.getUpgradeCost(type);
    
    if (cost === Infinity) return false;

    if (this.data.currency >= cost) {
      this.data.currency -= cost;
      this.data.upgrades[type]++;
      return true;
    }
    return false;
  }

  // Helper to get the actual gameplay value (damage amount, speed scalar, etc.)
  public getStatValue(type: UpgradeType): number {
    const level = this.data.upgrades[type];
    const config = UPGRADE_DEFINITIONS[type];

    if (type === UpgradeType.FIRE_RATE) {
       // Exponential Decay: max(0.1, base * (0.9 ^ level))
       // baseValue is 30 frames. 
       // Logic: level 1 = 30 * 1. level 2 = 30 * 0.9 = 27.
       const frames = Math.floor(config.baseValue * Math.pow(0.85, level - 1));
       return Math.max(4, frames); // Min 4 frames limit
    }

    if (type === UpgradeType.MULTISHOT) {
        // Level 1: 0 extra (Total 1)
        // Level 2: 2 extra (Total 3)
        // Level 3: 4 extra (Total 5)
        if (level === 1) return 0;
        if (level === 2) return 2;
        if (level >= 3) return 4;
        return 0;
    }

    // Standard linear scaling: base + (level * step)
    // Note: If level is 0 (unlocked), value is usually 0 unless base is high
    if (level === 0) return 0;

    return config.baseValue + ((level - 1) * config.valuePerLevel);
  }
}
