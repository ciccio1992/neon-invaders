
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, Entity, EntityType, GameStats, UpgradeType } from '../types';
import { 
  CANVAS_WIDTH, 
  STAGES, 
  PLAYER_SIZE, 
  PROJECTILE_SIZE, 
  ENEMY_SIZE, 
  BOSS_SIZE,
  COIN_SIZE,
  BIG_COIN_SIZE,
  COLOR_PLAYER,
  COLOR_PLAYER_PROJECTILE,
  COLOR_PLAYER_PROJECTILE_MAX,
  PLAYER_MAX_Y_PERCENT,
  COLOR_COIN,
  COLOR_COIN_GLOW,
  UPGRADE_DEFINITIONS,
  COLOR_SHIELD
} from '../constants';
import { checkCollision, createEntity, createExplosion, createLevelKey } from '../utils/gameLogic';
import { PlayerProgress } from '../utils/PlayerProgress';
import { drawPlayer, drawEnemy, drawBoss, drawProjectile, drawLevelKey, drawExplosionParticle, drawCoin } from '../utils/renderUtils';
import { initAudio, playShootSound, playExplosionSound, playDamageSound, playCollectSound, setMusicState } from '../utils/audioUtils';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onStageComplete: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  stats, 
  setStats,
  onStageComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const prevGameState = useRef<GameState>(GameState.MENU);
  
  // Game Dimensions Logic
  const [dynamicHeight, setDynamicHeight] = useState(800);
  const gameHeightRef = useRef(800); // Ref for loop access

  // Game State Refs
  const entities = useRef<Entity[]>([]);
  const player = useRef<Entity | null>(null);
  const frameCount = useRef<number>(0);
  
  // Visual Effects Refs
  const damageEffectTimer = useRef<number>(0);
  const shieldEffectTimer = useRef<number>(0);
  const stars = useRef<{x: number, y: number, size: number, speed: number, alpha: number}[]>([]);

  // Wave Manager Refs
  const currentWaveIndex = useRef<number>(0);
  const enemiesSpawnedInWave = useRef<number>(0);
  const waveTimer = useRef<number>(0);
  const bossSpawned = useRef<boolean>(false);
  const keySpawned = useRef<boolean>(false);
  const lastShotTime = useRef<number>(0);

  // Boss Logic Refs
  const bossState = useRef<'ENTERING' | 'IDLE' | 'ATTACK_1' | 'ATTACK_2' | 'ATTACK_3' | 'COOLDOWN' | 'TELEPORT_OUT' | 'TELEPORT_IN'>('ENTERING');
  const bossTimer = useRef<number>(0);
  const bossTeleportTarget = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // Input Ref
  const input = useRef<{ x: number, y: number, firing: boolean }>({ 
    x: CANVAS_WIDTH / 2, 
    y: 600, 
    firing: false 
  });

  const playerProgress = PlayerProgress.getInstance();

  // Resize Handler: Calculate logical height based on aspect ratio to prevent stretching
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current && canvasRef.current.parentElement) {
              const rect = canvasRef.current.parentElement.getBoundingClientRect();
              const ratio = rect.height / rect.width;
              // We maintain logical width at 600, adjust height to match screen ratio
              const newHeight = Math.floor(CANVAS_WIDTH * ratio);
              setDynamicHeight(newHeight);
              gameHeightRef.current = newHeight;
          }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Init

      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Stars with dynamic height
  useEffect(() => {
    stars.current = [];
    const height = gameHeightRef.current;
    for(let i=0; i<100; i++) {
        stars.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * height,
            size: Math.random() * 2,
            speed: Math.random() * 3 + 0.5,
            alpha: Math.random()
        });
    }
  }, [dynamicHeight]);

  // Music State Management
  useEffect(() => {
    const stage = STAGES[stats.level - 1] || STAGES[0];
    if (gameState === GameState.MENU) {
      setMusicState('MENU');
    } else if (gameState === GameState.PLAYING) {
      if (stage.isBossStage) {
        setMusicState('BOSS');
      } else {
        setMusicState('ACTION');
      }
    } else {
      setMusicState('NONE');
    }
  }, [gameState, stats.level]);

  // Reset Wave Logic when Level Changes
  useEffect(() => {
    currentWaveIndex.current = 0;
    enemiesSpawnedInWave.current = 0;
    waveTimer.current = -120; 
    bossSpawned.current = false;
    keySpawned.current = false;
    bossState.current = 'ENTERING';
    bossTimer.current = 0;
  }, [stats.level]);

  // Initialize Game Full Reset
  const initGame = useCallback(() => {
    entities.current = [];
    frameCount.current = 0;
    lastShotTime.current = 0; 
    damageEffectTimer.current = 0;
    shieldEffectTimer.current = 0;
    
    currentWaveIndex.current = 0;
    enemiesSpawnedInWave.current = 0;
    waveTimer.current = -120; 
    bossSpawned.current = false;
    keySpawned.current = false;
    bossState.current = 'ENTERING';
    bossTimer.current = 0;
    
    const maxHP = playerProgress.getStatValue(UpgradeType.MAX_HEALTH);
    
    player.current = createEntity(
      EntityType.PLAYER,
      CANVAS_WIDTH / 2 - PLAYER_SIZE.width / 2,
      gameHeightRef.current - 150,
      PLAYER_SIZE.width,
      PLAYER_SIZE.height,
      COLOR_PLAYER,
      0, 0,
      maxHP 
    );
    
    const shieldLevel = playerProgress.getUpgradeLevel(UpgradeType.SHIELD);
    if (shieldLevel > 0) {
        player.current.hasShield = true;
    }

    entities.current.push(player.current);
    
    setStats(prev => ({ ...prev, currency: playerProgress.getCurrency(), lives: maxHP, maxLives: maxHP }));
    
    initAudio(); 
  }, [playerProgress, setStats]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      if (entities.current.length === 0 || 
          prevGameState.current === GameState.GAME_OVER || 
          prevGameState.current === GameState.MENU ||
          prevGameState.current === GameState.STAGE_SELECT) {
        initGame();
      } else if (prevGameState.current === GameState.LEVEL_COMPLETE) {
          if (player.current) {
               const maxHP = playerProgress.getStatValue(UpgradeType.MAX_HEALTH);
               player.current.health = maxHP; 
               player.current.maxHealth = maxHP;
               
               const shieldLevel = playerProgress.getUpgradeLevel(UpgradeType.SHIELD);
               if (shieldLevel > 0) player.current.hasShield = true; 
               
               setStats(prev => ({ ...prev, lives: maxHP, maxLives: maxHP }));
          }
      }
    }
    prevGameState.current = gameState;
  }, [gameState, initGame, playerProgress, setStats]);

  // Handle Input
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== GameState.PLAYING) return;
    initAudio();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = gameHeightRef.current / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    input.current.x = (clientX - rect.left) * scaleX;
    input.current.y = (clientY - rect.top) * scaleY;
    input.current.firing = true;
  };

  const handleInputEnd = () => {
    input.current.firing = false;
  };

  const triggerDamageEffect = () => {
      damageEffectTimer.current = 15; 
      playDamageSound();
  };

  const spawnLoot = (x: number, y: number, totalValue: number) => {
      // Dynamic coin scaling to ensure performance with large rewards
      const maxEntities = 30; // Max number of coins to spawn
      const minCoinValue = 10;
      
      let count = Math.ceil(totalValue / minCoinValue);
      let coinValue = minCoinValue;
      
      if (count > maxEntities) {
          count = maxEntities;
          coinValue = Math.ceil(totalValue / count);
      }

      const isBigCoins = coinValue >= 50;
      const size = isBigCoins ? BIG_COIN_SIZE : COIN_SIZE;

      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;

          const coin: Entity = {
              id: `coin-${Math.random()}`,
              type: EntityType.COIN,
              pos: { x, y },
              size: size,
              velocity: { x: vx, y: vy },
              color: COLOR_COIN,
              health: 1, maxHealth: 1, markedForDeletion: false,
              value: coinValue
          };
          entities.current.push(coin);
      }
  };
  
  const handleLevelComplete = () => {
      playCollectSound();
      playerProgress.unlockNextStage(stats.level);
      if (stats.level >= 10) {
          setGameState(GameState.VICTORY);
      } else {
          setGameState(GameState.LEVEL_COMPLETE);
      }
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAME_HEIGHT = gameHeightRef.current;
    const isPlaying = gameState === GameState.PLAYING;
    const isOverlay = gameState === GameState.GAME_OVER || gameState === GameState.VICTORY || gameState === GameState.LEVEL_COMPLETE || gameState === GameState.PAUSED;
    const currentStage = STAGES[stats.level - 1] || STAGES[0];

    const render = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);

      ctx.save();
      if (damageEffectTimer.current > 0) {
          const shakeX = (Math.random() - 0.5) * 10;
          const shakeY = (Math.random() - 0.5) * 10;
          ctx.translate(shakeX, shakeY);
          damageEffectTimer.current--;
          ctx.fillStyle = `rgba(255, 0, 0, ${damageEffectTimer.current / 40})`;
          ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, GAME_HEIGHT + 20);
      }

      if (shieldEffectTimer.current > 0) {
          shieldEffectTimer.current--;
          ctx.fillStyle = `rgba(0, 255, 255, ${shieldEffectTimer.current / 80})`; 
          ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);
          
          if (player.current) {
              const p = player.current;
              const cx = p.pos.x + p.size.width / 2;
              const cy = p.pos.y + p.size.height / 2;
              const maxRadius = 120;
              const progress = 1 - (shieldEffectTimer.current / 20); 
              const radius = p.size.width + (progress * maxRadius);
              const alpha = shieldEffectTimer.current / 20;
              
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
              ctx.lineWidth = 3;
              ctx.stroke();
          }
      }

      stars.current.forEach(star => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
          ctx.fill();
          if (isPlaying) {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * CANVAS_WIDTH;
            }
          }
      });

      ctx.strokeStyle = '#111122';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const offset = (frameCount.current * 1) % gridSize;
      ctx.beginPath();
      for(let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
      }
      for(let y = -gridSize + offset; y <= GAME_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
      }
      ctx.stroke();

      if (!isPlaying && !isOverlay) {
           frameCount.current++;
           frameRef.current = requestAnimationFrame(render);
           ctx.restore();
           return;
      }
      
      if (!isPlaying && isOverlay) {
          drawEntities(ctx, currentStage.primaryColor);
          ctx.restore();
          return;
      }

      frameCount.current++;

      // --- LOGIC UPDATES ---

      if (!currentStage.isBossStage) {
        if (currentWaveIndex.current < currentStage.waves.length) {
          const currentWave = currentStage.waves[currentWaveIndex.current];
          if (waveTimer.current < (currentWave.startDelay || 0)) {
            waveTimer.current++;
          } else {
            if (enemiesSpawnedInWave.current < currentWave.enemyCount) {
              if (frameCount.current % currentWave.spawnInterval === 0) {
                 const buffer = 30; // 30px buffer from screen edge
                 const x = buffer + Math.random() * (CANVAS_WIDTH - ENEMY_SIZE.width - buffer * 2);
                 const enemy = createEntity(
                   EntityType.ENEMY,
                   x, -ENEMY_SIZE.height,
                   ENEMY_SIZE.width, ENEMY_SIZE.height,
                   currentWave.enemyColor || currentStage.primaryColor,
                   0, currentWave.enemySpeed,
                   currentWave.enemyHealth,
                   10 + (stats.level * 5) + (currentWave.enemyHealth * 2),
                   currentWave.fireChance 
                 );
                 entities.current.push(enemy);
                 enemiesSpawnedInWave.current++;
              }
            } else {
              currentWaveIndex.current++;
              enemiesSpawnedInWave.current = 0;
              waveTimer.current = 0;
            }
          }
        }
      } else {
        if (waveTimer.current < 0) {
            waveTimer.current++;
        } else if (!bossSpawned.current && entities.current.filter(e => e.type === EntityType.BOSS).length === 0) {
          bossSpawned.current = true;
          const isBoss2 = stats.level === 10;
          
          // First Time Clear Bonus Check
          const isFirstTimeClear = stats.level === playerProgress.getHighestUnlockedStage();
          const baseCurrency = isBoss2 ? 3000 : 1000;
          const bonusCurrency = isFirstTimeClear ? (isBoss2 ? 5000 : 2000) : 0;
          const totalReward = baseCurrency + bonusCurrency;

          const bossHealth = isBoss2 ? 12000 : 400; 
          const buffer = 40;
          const startX = buffer + Math.random() * (CANVAS_WIDTH - BOSS_SIZE.width - buffer * 2);

          const boss = createEntity(
              EntityType.BOSS,
              startX,
              -BOSS_SIZE.height,
              BOSS_SIZE.width,
              BOSS_SIZE.height,
              currentStage.primaryColor,
              2, 1,
              bossHealth,
              totalReward, // Adjusted reward
              0,
              isBoss2 ? 'OMEGA' : 'ALPHA' 
          );
          entities.current.push(boss);
        }
      }

      const activeEnemies = entities.current.filter(e => e.type === EntityType.ENEMY || e.type === EntityType.BOSS).length;
      const allWavesSpawned = currentStage.isBossStage ? bossSpawned.current : currentWaveIndex.current >= currentStage.waves.length;
      if (allWavesSpawned && activeEnemies === 0 && !keySpawned.current && !currentStage.isBossStage) {
        keySpawned.current = true;
        const key = createLevelKey(CANVAS_WIDTH / 2 - 15, -50);
        entities.current.push(key);
      }

      const damageUpgrade = playerProgress.getStatValue(UpgradeType.WEAPON_DAMAGE);
      const damageLevel = playerProgress.getUpgradeLevel(UpgradeType.WEAPON_DAMAGE);
      const isMaxDamage = damageLevel >= UPGRADE_DEFINITIONS[UpgradeType.WEAPON_DAMAGE].maxLevel;
      
      const fireRateDelay = playerProgress.getStatValue(UpgradeType.FIRE_RATE);
      const moveSpeedFactor = playerProgress.getStatValue(UpgradeType.MOVEMENT_SPEED); 
      
      const extraBullets = playerProgress.getStatValue(UpgradeType.MULTISHOT);
      const projSpeed = playerProgress.getStatValue(UpgradeType.PROJECTILE_SPEED);
      const magnetRadius = playerProgress.getStatValue(UpgradeType.MAGNET);
      const critChance = playerProgress.getStatValue(UpgradeType.CRIT_CHANCE);

      entities.current.forEach(entity => {
        if (entity.type === EntityType.PLAYER) {
          const targetX = input.current.x - entity.size.width/2;
          const dx = targetX - entity.pos.x;
          entity.pos.x += dx * (0.1 + moveSpeedFactor); 
          entity.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - entity.size.width, entity.pos.x));
          
          const targetY = input.current.y - entity.size.height/2;
          const minY = GAME_HEIGHT * (1 - PLAYER_MAX_Y_PERCENT);
          const maxY = GAME_HEIGHT - entity.size.height;
          const clampedTargetY = Math.max(minY, Math.min(maxY, targetY));
          const dy = clampedTargetY - entity.pos.y;
          entity.pos.y += dy * (0.1 + moveSpeedFactor);
          entity.pos.y = Math.max(minY, Math.min(maxY, entity.pos.y));

          if (input.current.firing && frameCount.current - lastShotTime.current > fireRateDelay) {
             const projColor = isMaxDamage ? COLOR_PLAYER_PROJECTILE_MAX : COLOR_PLAYER_PROJECTILE;
             const projWidth = isMaxDamage ? PROJECTILE_SIZE.width + 4 : PROJECTILE_SIZE.width;
             
             const bulletsToSpawn = [{ vx: 0, vy: -projSpeed }];
             
             if (extraBullets >= 2) {
                 bulletsToSpawn.push({ vx: -2, vy: -projSpeed * 0.95 });
                 bulletsToSpawn.push({ vx: 2, vy: -projSpeed * 0.95 });
             }
             if (extraBullets >= 4) {
                 bulletsToSpawn.push({ vx: -4, vy: -projSpeed * 0.9 });
                 bulletsToSpawn.push({ vx: 4, vy: -projSpeed * 0.9 });
             }

             bulletsToSpawn.forEach(b => {
                const bullet = createEntity(
                    EntityType.PLAYER_PROJECTILE,
                    entity.pos.x + entity.size.width / 2 - projWidth / 2,
                    entity.pos.y,
                    projWidth,
                    PROJECTILE_SIZE.height,
                    projColor,
                    b.vx, b.vy,
                    1
                );
                entities.current.push(bullet);
             });
             
             lastShotTime.current = frameCount.current;
             playShootSound(); 
          }

        } else if (entity.type === EntityType.ENEMY) {
             entity.pos.y += entity.velocity.y;
             const t = frameCount.current * 0.05 + (entity.hoverOffset || 0);
             entity.pos.x += Math.sin(t) * 1; 

             // --- ENEMY SHOOTING LOGIC ---
             if (entity.fireChance && entity.fireChance > 0 && player.current) {
                 // Decrement cooldown if available
                 if (entity.shootCooldown && entity.shootCooldown > 0) {
                     entity.shootCooldown--;
                 } else {
                     // Shoot!
                     const centerX = entity.pos.x + entity.size.width / 2;
                     const centerY = entity.pos.y + entity.size.height;
                     const playerCx = player.current.pos.x + player.current.size.width/2;
                     const playerCy = player.current.pos.y + player.current.size.height/2;
                     
                     const angle = Math.atan2(playerCy - centerY, playerCx - centerX);
                     const speed = 4;
                     
                     const bullet = createEntity(
                        EntityType.ENEMY_PROJECTILE,
                        centerX - 4, centerY, 8, 14,
                        currentStage.secondaryColor,
                        Math.cos(angle) * speed, Math.sin(angle) * speed,
                        1
                     );
                     entities.current.push(bullet);
                     
                     // Reset cooldown with randomness (e.g. 1.5 - 3 seconds)
                     entity.shootCooldown = 90 + Math.random() * 90;
                 }
             }

             if (entity.pos.y > GAME_HEIGHT) {
                 entity.markedForDeletion = true;
                 if (player.current) {
                     if (player.current.hasShield) {
                         player.current.hasShield = false;
                         shieldEffectTimer.current = 20; 
                         playDamageSound(); 
                         entities.current.push(...createExplosion(player.current.pos.x + player.current.size.width/2, player.current.pos.y + player.current.size.height/2, '#00ffff', 10));
                     } else {
                         player.current.health -= 1;
                         triggerDamageEffect();
                         setStats(prev => ({ ...prev, lives: Math.max(0, player.current!.health) }));
                         if (player.current.health <= 0) {
                             setGameState(GameState.GAME_OVER);
                             playExplosionSound();
                             entities.current.push(...createExplosion(player.current.pos.x + player.current.size.width/2, player.current.pos.y + player.current.size.height/2, COLOR_PLAYER, 20));
                         }
                     }
                 }
             }

        } else if (entity.type === EntityType.BOSS) {
            
            if (entity.pos.y < 50) {
                entity.pos.y += 1;
            }

            const centerX = entity.pos.x + entity.size.width / 2;
            const centerY = entity.pos.y + entity.size.height;
            bossTimer.current++;

            if (bossState.current === 'ENTERING') {
                if (entity.pos.y >= 50) {
                    bossState.current = 'COOLDOWN';
                    bossTimer.current = 0;
                }
            } 
            else if (stats.level === 5) {
                entity.pos.x += Math.sin(frameCount.current * 0.02) * 2;
                entity.pos.x = Math.max(0, Math.min(CANVAS_WIDTH - entity.size.width, entity.pos.x));

                if (bossState.current === 'COOLDOWN') {
                    if (bossTimer.current > 90) { 
                        const rand = Math.random();
                        if (rand < 0.33) bossState.current = 'ATTACK_1';
                        else if (rand < 0.66) bossState.current = 'ATTACK_2';
                        else bossState.current = 'ATTACK_3';
                        bossTimer.current = 0;
                    }
                } 
                else if (bossState.current === 'ATTACK_1') { 
                    if (frameCount.current % 30 === 0 && player.current) {
                        const angle = Math.atan2(player.current.pos.y - centerY, player.current.pos.x - centerX);
                        const speed = 7;
                        const bullet = createEntity(
                            EntityType.ENEMY_PROJECTILE, centerX, centerY, 8, 20,
                            currentStage.secondaryColor, Math.cos(angle) * speed, Math.sin(angle) * speed, 1
                        );
                        entities.current.push(bullet);
                    }
                    if (bossTimer.current > 120) {
                        bossState.current = 'COOLDOWN';
                        bossTimer.current = 0;
                    }
                } 
                else if (bossState.current === 'ATTACK_2') { 
                    if (frameCount.current % 40 === 0) {
                        [-0.5, -0.2, 0, 0.2, 0.5].forEach(spread => {
                            const bullet = createEntity(
                                EntityType.ENEMY_PROJECTILE, centerX, centerY, 8, 20, '#ff00ff', spread * 6, 6, 1
                            );
                            entities.current.push(bullet);
                        });
                    }
                    if (bossTimer.current > 120) {
                        bossState.current = 'COOLDOWN';
                        bossTimer.current = 0;
                    }
                } 
                else if (bossState.current === 'ATTACK_3') { 
                    if (frameCount.current % 20 === 0) {
                        for(let i=0; i<6; i++) {
                            const angle = (Math.PI * 2 / 6) * i + bossTimer.current * 0.1;
                            const bullet = createEntity(
                                EntityType.ENEMY_PROJECTILE, centerX + Math.cos(angle)*40, centerY + Math.sin(angle)*40, 6, 6, '#ffffff', Math.cos(angle) * 4, Math.sin(angle) * 4, 1
                            );
                            entities.current.push(bullet);
                        }
                    }
                    if (bossTimer.current > 100) {
                        bossState.current = 'COOLDOWN';
                        bossTimer.current = 0;
                    }
                }
            } 
            else if (stats.level === 10) {
                if (bossState.current === 'COOLDOWN') {
                     entity.pos.x += Math.sin(frameCount.current * 0.05) * 1;
                     if (bossTimer.current > 60) {
                         const rand = Math.random();
                         if (rand < 0.4) bossState.current = 'ATTACK_1'; 
                         else if (rand < 0.7) bossState.current = 'TELEPORT_OUT'; 
                         else bossState.current = 'ATTACK_2'; 
                         bossTimer.current = 0;
                     }
                }
                else if (bossState.current === 'ATTACK_1') { 
                    if (bossTimer.current % 20 === 0) {
                         for(let i=0; i<12; i++) {
                             const angle = (Math.PI * 2 / 12) * i;
                             const bullet = createEntity(
                                 EntityType.ENEMY_PROJECTILE, centerX, centerY, 10, 10, '#ffffff', Math.cos(angle) * 5, Math.sin(angle) * 5, 1
                             );
                             entities.current.push(bullet);
                         }
                    }
                    if (bossTimer.current > 60) {
                        bossState.current = 'COOLDOWN';
                        bossTimer.current = 0;
                    }
                }
                else if (bossState.current === 'ATTACK_2') { 
                    if (bossTimer.current % 5 === 0) {
                        const spread = (Math.sin(bossTimer.current * 0.2) * 2);
                        const bullet = createEntity(
                             EntityType.ENEMY_PROJECTILE, centerX + spread * 10, centerY, 6, 15, currentStage.secondaryColor, spread, 7, 1
                        );
                        entities.current.push(bullet);
                    }
                    if (bossTimer.current > 100) {
                        bossState.current = 'COOLDOWN';
                        bossTimer.current = 0;
                    }
                }
                else if (bossState.current === 'TELEPORT_OUT') {
                    entity.size.width *= 0.9;
                    entity.size.height *= 0.9;
                    if (bossTimer.current > 30) {
                        bossState.current = 'TELEPORT_IN';
                        bossTimer.current = 0;
                        const buffer = 40;
                        bossTeleportTarget.current = {
                             x: buffer + Math.random() * (CANVAS_WIDTH - BOSS_SIZE.width - buffer * 2),
                             y: 50 + Math.random() * 100
                        };
                        entity.pos.x = bossTeleportTarget.current.x;
                        entity.pos.y = bossTeleportTarget.current.y;
                    }
                }
                else if (bossState.current === 'TELEPORT_IN') {
                    entity.size.width = Math.min(BOSS_SIZE.width, entity.size.width * 1.15);
                    entity.size.height = Math.min(BOSS_SIZE.height, entity.size.height * 1.15);
                    if (bossTimer.current > 30) {
                        bossState.current = 'COOLDOWN';
                        entity.size.width = BOSS_SIZE.width;
                        entity.size.height = BOSS_SIZE.height;
                        bossTimer.current = 0;
                    }
                }
            }
            
        } else if (entity.type === EntityType.LEVEL_KEY) {
            entity.pos.y += entity.velocity.y;
            entity.pos.x += Math.sin(frameCount.current * 0.05) * 0.5;
        } else if (entity.type === EntityType.COIN) {
            if (player.current && magnetRadius > 0) {
                const dx = (player.current.pos.x + player.current.size.width/2) - (entity.pos.x + entity.size.width/2);
                const dy = (player.current.pos.y + player.current.size.height/2) - (entity.pos.y + entity.size.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < magnetRadius) {
                    entity.velocity.x += (dx / dist) * 1.5;
                    entity.velocity.y += (dy / dist) * 1.5;
                } else {
                    entity.velocity.y += 0.05; 
                    if (entity.velocity.y > 3) entity.velocity.y = 3; 
                }
            } else {
                entity.velocity.y += 0.05; 
                if (entity.velocity.y > 3) entity.velocity.y = 3; 
            }

            entity.pos.x += entity.velocity.x;
            entity.pos.y += entity.velocity.y;
            entity.velocity.x *= 0.95; 

        } else if (entity.type === EntityType.PARTICLE) {
            entity.pos.x += entity.velocity.x;
            entity.pos.y += entity.velocity.y;
            entity.size.width *= 0.92; 
            entity.size.height *= 0.92;
            if (entity.size.width < 0.2) entity.markedForDeletion = true;
        } else {
          entity.pos.x += entity.velocity.x;
          entity.pos.y += entity.velocity.y;
        }

        if ((entity.pos.y > GAME_HEIGHT + 50 || entity.pos.y < -150 || entity.pos.x < -100 || entity.pos.x > CANVAS_WIDTH + 100) && entity.type !== EntityType.ENEMY) {
           if (entity.type !== EntityType.PLAYER && entity.type !== EntityType.BOSS && entity.type !== EntityType.LEVEL_KEY) {
               entity.markedForDeletion = true;
           }
        }
      });

      const bullets = entities.current.filter(e => e.type === EntityType.PLAYER_PROJECTILE);
      const hostiles = entities.current.filter(e => e.type === EntityType.ENEMY || e.type === EntityType.BOSS);
      const playerEntity = entities.current.find(e => e.type === EntityType.PLAYER);
      const enemyBullets = entities.current.filter(e => e.type === EntityType.ENEMY_PROJECTILE);
      const levelKey = entities.current.find(e => e.type === EntityType.LEVEL_KEY);
      const coins = entities.current.filter(e => e.type === EntityType.COIN);

      bullets.forEach(bullet => {
          hostiles.forEach(hostile => {
              if (!bullet.markedForDeletion && !hostile.markedForDeletion && checkCollision(bullet, hostile)) {
                  bullet.markedForDeletion = true;
                  
                  let damage = damageUpgrade;
                  const isCrit = Math.random() < critChance;
                  if (isCrit) damage *= 2;

                  hostile.health -= damage;
                  
                  const explosionColor = isCrit ? '#ff0000' : bullet.color; 
                  entities.current.push(...createExplosion(bullet.pos.x, bullet.pos.y, explosionColor, 3));

                  if (hostile.health <= 0) {
                      hostile.markedForDeletion = true;
                      playExplosionSound(hostile.type === EntityType.BOSS);
                      
                      if (hostile.currencyValue && hostile.currencyValue > 0) {
                           spawnLoot(hostile.pos.x + hostile.size.width/2, hostile.pos.y + hostile.size.height/2, hostile.currencyValue);
                           setStats(prev => ({ 
                              ...prev, 
                              score: prev.score + (hostile.scoreValue || 0)
                          }));
                      }

                      entities.current.push(...createExplosion(hostile.pos.x + hostile.size.width/2, hostile.pos.y + hostile.size.height/2, hostile.color, 15));
                      
                      if (hostile.type === EntityType.BOSS) {
                          handleLevelComplete();
                      }
                  }
              }
          });
      });

      if (playerEntity && !playerEntity.markedForDeletion) {
          [...hostiles, ...enemyBullets].forEach(threat => {
             if (!threat.markedForDeletion && checkCollision(playerEntity, threat)) {
                 if (threat.type === EntityType.ENEMY_PROJECTILE) {
                     threat.markedForDeletion = true;
                     entities.current.push(...createExplosion(threat.pos.x, threat.pos.y, threat.color, 5));
                 } else {
                     if (threat.type === EntityType.ENEMY) {
                        threat.markedForDeletion = true;
                        entities.current.push(...createExplosion(threat.pos.x, threat.pos.y, threat.color, 10));
                     }
                 }

                 if (playerEntity.hasShield) {
                     playerEntity.hasShield = false;
                     shieldEffectTimer.current = 20; 
                     playDamageSound(); 
                     entities.current.push(...createExplosion(playerEntity.pos.x + playerEntity.size.width/2, playerEntity.pos.y + playerEntity.size.height/2, COLOR_SHIELD, 15));
                 } else {
                     playerEntity.health -= 1;
                     triggerDamageEffect();
                     entities.current.push(...createExplosion(playerEntity.pos.x + playerEntity.size.width/2, playerEntity.pos.y + playerEntity.size.height/2, COLOR_PLAYER, 20));
                     
                     if (playerEntity.health <= 0) {
                         setGameState(GameState.GAME_OVER);
                         playExplosionSound();
                     } else {
                         setStats(prev => ({ ...prev, lives: playerEntity.health }));
                     }
                 }
             }
          });

          if (levelKey && !levelKey.markedForDeletion && checkCollision(playerEntity, levelKey)) {
              levelKey.markedForDeletion = true;
              handleLevelComplete();
          }

          coins.forEach(coin => {
             if (!coin.markedForDeletion && checkCollision(playerEntity, coin)) {
                 coin.markedForDeletion = true;
                 playCollectSound();
                 playerProgress.addCurrency(coin.value || 0);
                 setStats(prev => ({ ...prev, currency: playerProgress.getCurrency() }));
             }
          });
      }

      entities.current = entities.current.filter(e => !e.markedForDeletion);
      drawEntities(ctx, currentStage.primaryColor);
      ctx.restore(); 

      frameRef.current = requestAnimationFrame(render);
    };

    const drawEntities = (ctx: CanvasRenderingContext2D, stageColor: string) => {
        const fireRateLevel = playerProgress.getUpgradeLevel(UpgradeType.FIRE_RATE);
        const isMaxFireRate = fireRateLevel >= UPGRADE_DEFINITIONS[UpgradeType.FIRE_RATE].maxLevel;

        entities.current.forEach(entity => {
            if (entity.type === EntityType.PLAYER) {
                drawPlayer(ctx, entity.pos.x, entity.pos.y, entity.size.width, entity.size.height, entity.color, isMaxFireRate, entity.hasShield);
            } else if (entity.type === EntityType.ENEMY) {
                drawEnemy(ctx, entity.pos.x, entity.pos.y, entity.size.width, entity.size.height, entity.color, frameCount.current, entity.health, entity.maxHealth);
            } else if (entity.type === EntityType.BOSS) {
                drawBoss(ctx, entity.pos.x, entity.pos.y, entity.size.width, entity.size.height, entity.color, frameCount.current, entity.health, entity.maxHealth, entity.variant);
            } else if (entity.type === EntityType.LEVEL_KEY) {
                drawLevelKey(ctx, entity.pos.x, entity.pos.y, entity.size.width, entity.size.height, entity.color, frameCount.current);
            } else if (entity.type === EntityType.PARTICLE) {
                drawExplosionParticle(ctx, entity);
            } else if (entity.type === EntityType.COIN) {
                drawCoin(ctx, entity);
            } else {
                drawProjectile(ctx, entity.pos.x, entity.pos.y, entity.size.width, entity.size.height, entity.color);
            }
        });
    };

    frameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, stats.level, setStats, setGameState, playerProgress, stats.maxLives, dynamicHeight]);

  return (
    <div className="relative w-full h-full" onClick={initAudio}>
        <div className="scanlines"></div>
        <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={dynamicHeight}
        className="w-full h-full block cursor-crosshair touch-none bg-black"
        onMouseDown={handleTouchMove}
        onMouseMove={handleTouchMove}
        onMouseUp={handleInputEnd}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInputEnd}
        />
    </div>
  );
};

export default GameCanvas;
