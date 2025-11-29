
import { Entity, Position, Size } from '../types';
import { COLOR_COIN, COLOR_COIN_GLOW, COLOR_PLAYER_PROJECTILE_MAX, COLOR_SHIELD } from '../constants';

// Helper to set glow styles
const setGlow = (ctx: CanvasRenderingContext2D, color: string, blur: number = 10) => {
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const drawHealthBar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, health: number, maxHealth: number) => {
  const pct = Math.max(0, health / maxHealth);
  const color = pct > 0.5 ? '#00ff00' : '#ff0000';
  
  // Bar Background
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y - 10, w, 4);
  
  // Bar Fill
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.fillRect(x, y - 10, w * pct, 4);
  
  ctx.shadowBlur = 0; // Reset
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, isUpgraded: boolean = false, hasShield: boolean = false) => {
  setGlow(ctx, color, 15);
  ctx.fillStyle = '#000'; // Black fill to hide background stars behind ship

  ctx.beginPath();
  // Main Hull
  ctx.moveTo(x + w * 0.5, y); // Nose
  ctx.lineTo(x + w, y + h); // Right Wing Tip
  ctx.lineTo(x + w * 0.5, y + h * 0.8); // Engine Notch
  ctx.lineTo(x, y + h); // Left Wing Tip
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit detail
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.3);
  ctx.lineTo(x + w * 0.5, y + h * 0.6);
  ctx.stroke();

  // Engine Thruster Glow
  ctx.shadowColor = '#00ffff';
  ctx.strokeStyle = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h);
  ctx.lineTo(x + w * 0.5, y + h + (Math.random() * 10 + 5));
  ctx.lineTo(x + w * 0.7, y + h);
  ctx.stroke();

  // Upgraded Visuals (Max Fire Rate/Speed)
  if (isUpgraded) {
    setGlow(ctx, '#ff00ff', 10);
    ctx.strokeStyle = '#ff00ff'; // Magenta accents
    
    // Left Wing Vent
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.6);
    ctx.lineTo(x, y + h * 0.8);
    ctx.stroke();

    // Right Wing Vent
    ctx.beginPath();
    ctx.moveTo(x + w * 0.8, y + h * 0.6);
    ctx.lineTo(x + w, y + h * 0.8);
    ctx.stroke();

    // Extra Thruster Trails
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h);
    ctx.lineTo(x + w * 0.15, y + h + (Math.random() * 8 + 3));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.9, y + h);
    ctx.lineTo(x + w * 0.85, y + h + (Math.random() * 8 + 3));
    ctx.stroke();
  }

  // Draw Shield Bubble
  if (hasShield) {
    ctx.save();
    setGlow(ctx, COLOR_SHIELD, 20);
    ctx.strokeStyle = COLOR_SHIELD;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.2; // Pulsing opacity
    
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2 + 5, w * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Scanline effect on shield
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = COLOR_SHIELD;
    ctx.fill();
    ctx.restore();
  }
};

export const drawEnemy = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, frame: number, health: number, maxHealth: number) => {
  setGlow(ctx, color, 10);
  ctx.fillStyle = '#000';
  
  // Bobbing animation
  const offset = Math.sin(frame * 0.1) * 2;

  ctx.beginPath();
  // Insectoid / Invader Shape
  ctx.moveTo(x + w * 0.2, y); // Top Left Horn
  ctx.lineTo(x + w * 0.8, y); // Top Right Horn
  ctx.lineTo(x + w, y + h * 0.4); // Right Shoulder
  ctx.lineTo(x + w * 0.7, y + h); // Right Bottom
  ctx.lineTo(x + w * 0.5, y + h * 0.8 + offset); // Bottom Center
  ctx.lineTo(x + w * 0.3, y + h); // Left Bottom
  ctx.lineTo(x, y + h * 0.4); // Left Shoulder
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();

  // Inner Core
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.4, w * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  drawHealthBar(ctx, x, y, w, health, maxHealth);
};

export const drawBoss = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, frame: number, health: number, maxHealth: number, variant: 'ALPHA' | 'OMEGA' = 'ALPHA') => {
  setGlow(ctx, color, 25);
  ctx.fillStyle = '#000';

  if (variant === 'ALPHA') {
      // Standard Tank Boss
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.lineTo(x + w * 0.7, y);
      ctx.lineTo(x + w, y + h * 0.4);
      ctx.lineTo(x + w * 0.8, y + h);
      ctx.lineTo(x + w * 0.2, y + h);
      ctx.lineTo(x, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wings / Cannons
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.4);
      ctx.lineTo(x - 20, y + h * 0.8);
      ctx.lineTo(x + 20, y + h * 0.8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + w, y + h * 0.4);
      ctx.lineTo(x + w + 20, y + h * 0.8);
      ctx.lineTo(x + w - 20, y + h * 0.8);
      ctx.stroke();
  } else {
      // OMEGA VARIANT: Void Angel / Spiky
      // Central spike
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, y + h); // Bottom tip
      ctx.lineTo(x + w * 0.8, y + h * 0.3); // Right upper
      ctx.lineTo(x + w * 0.5, y); // Top center
      ctx.lineTo(x + w * 0.2, y + h * 0.3); // Left upper
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Floating side segments
      const float = Math.sin(frame * 0.05) * 10;
      
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.2 + float);
      ctx.lineTo(x + w * 0.3, y + h * 0.5 + float);
      ctx.lineTo(x + w * 0.1, y + h * 0.8 + float);
      ctx.closePath();
      ctx.stroke();
      
      // Right Wing
      ctx.beginPath();
      ctx.moveTo(x + w, y + h * 0.2 + float);
      ctx.lineTo(x + w * 0.7, y + h * 0.5 + float);
      ctx.lineTo(x + w * 0.9, y + h * 0.8 + float);
      ctx.closePath();
      ctx.stroke();
  }

  // Rotating Core (Common)
  ctx.save();
  ctx.translate(x + w * 0.5, y + h * 0.5);
  ctx.rotate(frame * 0.05);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(-w * 0.15, -h * 0.15, w * 0.3, h * 0.3);
  ctx.restore();

  drawHealthBar(ctx, x, y, w, health, maxHealth);
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  setGlow(ctx, color, 10);
  ctx.fillStyle = color;

  if (color === COLOR_PLAYER_PROJECTILE_MAX) {
    // Enhanced Plasma Bolt for max level
    setGlow(ctx, color, 20);
    ctx.fillStyle = '#ffffff'; // White hot core
    
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer Ring
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2 + 2, h/2 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Standard Projectile
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const drawLevelKey = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, frame: number) => {
  setGlow(ctx, color, 20);
  
  // Rotating 3D Cube (Simulated)
  const cx = x + w / 2;
  const cy = y + h / 2;
  const size = w / 2;
  
  const angle = frame * 0.05;
  
  ctx.beginPath();
  // Draw diamond shape expanding/contracting to simulate rotation
  const scaleX = Math.cos(angle);
  
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * scaleX, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * scaleX, cy);
  ctx.closePath();
  
  ctx.stroke();
  
  // Outer Ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 1.4, 0 + angle, Math.PI + angle);
  ctx.stroke();
};

export const drawExplosionParticle = (ctx: CanvasRenderingContext2D, entity: Entity) => {
   ctx.fillStyle = entity.color;
   ctx.shadowColor = entity.color;
   ctx.shadowBlur = 10;
   ctx.beginPath();
   ctx.arc(entity.pos.x, entity.pos.y, entity.size.width, 0, Math.PI * 2);
   ctx.fill();
};

export const drawCoin = (ctx: CanvasRenderingContext2D, entity: Entity) => {
    setGlow(ctx, COLOR_COIN_GLOW, 8);
    ctx.fillStyle = COLOR_COIN;
    
    ctx.beginPath();
    ctx.arc(entity.pos.x + entity.size.width/2, entity.pos.y + entity.size.height/2, entity.size.width/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
};