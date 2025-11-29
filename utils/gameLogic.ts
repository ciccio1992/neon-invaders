
import { Entity, EntityType, Position, Size } from '../types';
import { LEVEL_KEY_SIZE, COLOR_LEVEL_KEY } from '../constants';

export const checkCollision = (rect1: Entity, rect2: Entity): boolean => {
  return (
    rect1.pos.x < rect2.pos.x + rect2.size.width &&
    rect1.pos.x + rect1.size.width > rect2.pos.x &&
    rect1.pos.y < rect2.pos.y + rect2.size.height &&
    rect1.pos.y + rect1.size.height > rect2.pos.y
  );
};

export const createEntity = (
  type: EntityType,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  vx: number,
  vy: number,
  health: number = 1,
  currencyValue: number = 0,
  fireChance: number = 0,
  variant?: 'ALPHA' | 'OMEGA'
): Entity => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    pos: { x, y },
    size: { width, height },
    velocity: { x: vx, y: vy },
    color,
    health,
    maxHealth: health,
    markedForDeletion: false,
    scoreValue: 100,
    currencyValue,
    hoverOffset: Math.random() * 100, // Random seed for movement patterns
    fireChance: fireChance,
    shootCooldown: 120 + Math.random() * 60, // Start cooldown ~2-3 seconds
    variant: variant || 'ALPHA'
  };
};

export const createLevelKey = (x: number, y: number): Entity => {
  return {
    id: 'level-key',
    type: EntityType.LEVEL_KEY,
    pos: { x, y },
    size: LEVEL_KEY_SIZE,
    velocity: { x: 0, y: 1.5 }, // Slowly floats down
    color: COLOR_LEVEL_KEY,
    health: 1,
    maxHealth: 1,
    markedForDeletion: false,
    scoreValue: 1000
  };
};

export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

// Simple particle explosion
export const createExplosion = (x: number, y: number, color: string, count: number = 10): Entity[] => {
  const particles: Entity[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1;
    particles.push(
      createEntity(
        EntityType.PARTICLE,
        x,
        y,
        3,
        3,
        color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        1
      )
    );
  }
  return particles;
};