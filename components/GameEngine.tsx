
import React, { useEffect, useRef, useCallback } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, BULLET_SPEED, 
  ENEMY_SPEED_BASE, ENEMY_DROP_DISTANCE, FIRE_COOLDOWN, BOSS_HP_BASE,
  SPRITE_PLAYER, SPRITE_DRAGON_1, SPRITE_DRAGON_2, 
  SPRITE_BOSS, SPRITE_BOSS_2, SPRITE_BOSS_MECH, SPRITE_BOSS_MECH_2,
  SPRITE_BOSS_ELECTRIC, SPRITE_BOSS_ELECTRIC_2,
  SPRITE_BOSS_HYDRA, SPRITE_BOSS_HYDRA_2,
  SPRITE_BOSS_SORCERER, SPRITE_BOSS_SORCERER_2,
  SPRITE_BOSS_METEOR, SPRITE_BOSS_METEOR_2,
  SPRITE_BOSS_CHEF, SPRITE_BOSS_CHEF_2,
  SPRITE_DRAGON_BLUE, SPRITE_DRAGON_BLUE_2,
  SPRITE_DRAGON_BROWN, SPRITE_DRAGON_BROWN_2,
  SPRITE_DRAGON_SILVER, SPRITE_DRAGON_SILVER_2,
  SPRITE_DRAGON_SHADOW, SPRITE_DRAGON_SHADOW_2,
  SPRITE_DRAGON_ORANGE,
  SPRITE_DRAGON_EMERALD_1, SPRITE_DRAGON_EMERALD_2,
  SPRITE_DRAGON_AMETHYST_1, SPRITE_DRAGON_AMETHYST_2,
  SPRITE_DRAGON_FROST_1, SPRITE_DRAGON_FROST_2,
  SPRITE_DRAGON_OBSIDIAN_1, SPRITE_DRAGON_OBSIDIAN_2,
  SPRITE_DRAGON_CRIMSON_1, SPRITE_DRAGON_CRIMSON_2,
  SPRITE_POWERUP_RAPID, SPRITE_POWERUP_SHIELD, SPRITE_POWERUP_BOMB, 
  SPRITE_POWERUP_SPREAD, SPRITE_POWERUP_LASER, SPRITE_POWERUP_EXPLOSIVE, SPRITE_POWERUP_TIME, SPRITE_POWERUP_LIFE,
  SPRITE_POWERUP_PIERCE, SPRITE_POWERUP_SIDEKICK, SPRITE_POWERUP_INVINCIBILITY, SPRITE_POWERUP_DAMAGE, SPRITE_POWERUP_SCORE,
  COLOR_NEON_BLUE, COLOR_NEON_RED, COLOR_NEON_GREEN, COLOR_NEON_GOLD, COLOR_NEON_PURPLE, COLOR_NEON_CYAN, COLOR_NEON_BROWN, COLOR_NEON_SILVER, COLOR_NEON_SHADOW, COLOR_NEON_ORANGE, COLOR_NEON_EMERALD, COLOR_NEON_AMETHYST,
  COLOR_NEON_FROST, COLOR_NEON_OBSIDIAN, COLOR_NEON_CRIMSON,
  COLOR_BOSS_MECH, COLOR_BOSS_MECH_DARK, COLOR_BOSS_ELECTRIC, COLOR_BOSS_ELECTRIC_WEB, COLOR_BOSS_HYDRA, COLOR_BOSS_HYDRA_DARK,
  COLOR_BOSS_SORCERER, COLOR_BOSS_SORCERER_DARK, COLOR_LASER_BEAM,
  COLOR_BOSS_METEOR, COLOR_METEOR_FIRE,
  COLOR_BOSS_CHEF_SKIN, COLOR_BOSS_CHEF_APRON,
  COLOR_FOOD_APPLE, COLOR_FOOD_CARROT, COLOR_FOOD_PUMPKIN, COLOR_FOOD_WATERMELON,
  POWERUP_SPEED, POWERUP_DROP_CHANCE, RAPID_FIRE_COOLDOWN, RAPID_FIRE_DURATION, DAMAGE_BOOST_DURATION, SCORE_MULTIPLIER_DURATION,
  COLOR_POWERUP_RAPID, COLOR_POWERUP_SHIELD, COLOR_POWERUP_BOMB,
  COLOR_POWERUP_SPREAD, COLOR_POWERUP_LASER, COLOR_POWERUP_EXPLOSIVE, COLOR_POWERUP_TIME, COLOR_POWERUP_LIFE,
  COLOR_POWERUP_PIERCE, COLOR_POWERUP_SIDEKICK, COLOR_POWERUP_INVINCIBILITY, COLOR_POWERUP_DAMAGE, COLOR_POWERUP_SCORE
} from '../constants';
import { GameState, GameStats, Player, Enemy, Projectile, Particle, BunkerPart, PowerUp, PowerUpType, Star, FloatingText, WeaponType } from '../types';
import { 
  playPlayerShoot, playEnemyShoot, playExplosion, 
  playPowerUpCollect, playShieldHit, playStartGame 
} from '../services/soundService';

interface GameEngineProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  gameStats: GameStats;
  setGameStats: React.Dispatch<React.SetStateAction<GameStats>>;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, setGameState, gameStats, setGameStats 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  const internalStatsRef = useRef<GameStats>({ ...gameStats });
  const uiSyncTimerRef = useRef<number>(0);
  
  const playerRef = useRef<Player>({ 
    x: CANVAS_WIDTH / 2 - 20, 
    y: CANVAS_HEIGHT - 60, 
    width: 44, 
    height: 32, 
    active: true, 
    cooldown: 0,
    shieldActive: false,
    rapidFireTimer: 0,
    weapon: 'DEFAULT',
    hasSidekicks: false,
    invincibleTimer: 0,
    damageBoostTimer: 0,
    scoreMultiplierTimer: 0
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bunkersRef = useRef<BunkerPart[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<Star[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  
  const enemyDirectionRef = useRef<number>(1);
  const enemyMoveTimerRef = useRef<number>(0);
  const enemyAnimationToggleRef = useRef<boolean>(false);
  const bossAttackTimerRef = useRef<number>(0); 
  const enemyFireCooldownRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const levelBannerTimerRef = useRef<number>(0);
  
  const nextBlueDiveIndexRef = useRef<number>(0);
  const blueDiveTimerRef = useRef<number>(0);
  const timeFreezeTimerRef = useRef<number>(0);
  
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const levelTransitionRef = useRef<boolean>(false);
  const prevGameStateRef = useRef<GameState>(gameState);
  const prevLevelRef = useRef<number>(gameStats.level);

  // --- Helper Functions ---

  const initStars = () => {
    const starCount = 60;
    starsRef.current = [];
    for (let i = 0; i < starCount; i++) {
      starsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.2,
        brightness: Math.random()
      });
    }
  };

  const triggerShake = (intensity: number) => {
      screenShakeRef.current = intensity;
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string, size: number = 10) => {
      floatingTextsRef.current.push({
          x, y, text, color, size,
          life: 40,
          vy: -1.5
      });
  };

  const generateEnemyId = () => Math.random().toString(36).substr(2, 9);

  const createExplosion = (x: number, y: number, color: string, count: number = 10, speed: number = 5, gravity: number = 0) => {
    for(let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 4 + 2,
        gravity: gravity
      });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    const r = Math.random();
    let type: PowerUpType = 'RAPID_FIRE';
    if (r < 0.12) type = 'RAPID_FIRE';
    else if (r < 0.22) type = 'SHIELD';
    else if (r < 0.32) type = 'WEAPON_SPREAD';
    else if (r < 0.40) type = 'WEAPON_LASER';
    else if (r < 0.48) type = 'WEAPON_EXPLOSIVE';
    else if (r < 0.56) type = 'WEAPON_PIERCE';
    else if (r < 0.64) type = 'SIDEKICK';
    else if (r < 0.70) type = 'TIME_FREEZE';
    else if (r < 0.76) type = 'INVINCIBILITY';
    else if (r < 0.84) type = 'DAMAGE_BOOST';
    else if (r < 0.92) type = 'SCORE_MULTIPLIER'; 
    else if (r < 0.96) type = 'BOMB';
    else type = 'EXTRA_LIFE';

    powerUpsRef.current.push({
      x, y,
      width: 24,
      height: 24,
      active: true,
      type
    });
  };

  const damagePlayer = () => {
    if (!playerRef.current.active) return;
    if (playerRef.current.invincibleTimer > 0) return; // Invincibility check

    triggerShake(15);
    if (playerRef.current.shieldActive) {
      playerRef.current.shieldActive = false;
      createExplosion(playerRef.current.x + 20, playerRef.current.y + 10, COLOR_POWERUP_SHIELD, 20);
      playShieldHit(); 
      return;
    }
    createExplosion(playerRef.current.x + 20, playerRef.current.y + 10, COLOR_NEON_BLUE, 30, 8, 0.2);
    playExplosion(); 
    
    if (internalStatsRef.current.lives > 1) {
      internalStatsRef.current.lives -= 1;
      setGameStats(prev => ({ ...prev, lives: internalStatsRef.current.lives }));
      
      playerRef.current.x = CANVAS_WIDTH / 2 - 20;
      projectilesRef.current = projectilesRef.current.filter(bp => !bp.isEnemy);
      playerRef.current.rapidFireTimer = 0;
      playerRef.current.weapon = 'DEFAULT';
      playerRef.current.hasSidekicks = false;
      playerRef.current.invincibleTimer = 180; // Respawn immunity
      playerRef.current.damageBoostTimer = 0;
      playerRef.current.scoreMultiplierTimer = 0;
      spawnFloatingText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, "SYSTEM DAMAGE", COLOR_NEON_RED, 20);
    } else {
      internalStatsRef.current.lives = 0;
      setGameStats(prev => ({ ...prev, lives: 0 }));
      setGameState(GameState.GAME_OVER);
    }
  };

  const initLevel = useCallback(() => {
    projectilesRef.current = [];
    particlesRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    enemyDirectionRef.current = 1;
    enemyFireCooldownRef.current = 0;
    levelTransitionRef.current = false;
    timeFreezeTimerRef.current = 0;
    screenShakeRef.current = 0;
    levelBannerTimerRef.current = 120;
    
    internalStatsRef.current.level = gameStats.level;
    nextBlueDiveIndexRef.current = 0;
    blueDiveTimerRef.current = 120;
    
    const isBossLevel = gameStats.level % 5 === 0;

    if (isBossLevel) {
      const bossWidth = 192;
      const bossEncounterNum = (gameStats.level / 5) - 1;
      const bossCycle = bossEncounterNum % 7; 

      let bossType: Enemy['type'] = 'dragon-boss';
      let bossHeight = 112;
      let hpMultiplier = 1.0;

      if (bossCycle === 0) { 
         bossType = 'dragon-boss';
         bossHeight = 112;
         hpMultiplier = 1.0;
      } else if (bossCycle === 1) { 
         bossType = 'dragon-chef-boss';
         bossHeight = 120;
         hpMultiplier = 1.15;
      } else if (bossCycle === 2) { 
         bossType = 'dragon-mech-boss';
         bossHeight = 120;
         hpMultiplier = 1.25;
      } else if (bossCycle === 3) { 
         bossType = 'dragon-electric-boss';
         bossHeight = 120;
         hpMultiplier = 1.2; 
      } else if (bossCycle === 4) { 
         bossType = 'dragon-hydra-boss';
         bossHeight = 120;
         hpMultiplier = 1.35;
      } else if (bossCycle === 5) { 
         bossType = 'dragon-sorcerer-boss';
         bossHeight = 120;
         hpMultiplier = 1.45;
      } else if (bossCycle === 6) { 
         bossType = 'dragon-meteor-boss';
         bossHeight = 120;
         hpMultiplier = 1.6;
      }

      const bossHp = BOSS_HP_BASE * (gameStats.level / 5) * hpMultiplier;

      enemiesRef.current.push({
        id: generateEnemyId(),
        x: CANVAS_WIDTH / 2 - bossWidth / 2,
        y: 60,
        width: bossWidth,
        height: bossHeight,
        active: true,
        row: 0,
        col: 0,
        type: bossType,
        state: 'GRID',
        animationFrame: 0,
        health: bossHp,
        maxHealth: bossHp,
        fireBreathTimer: 0,
        moveAngle: 0,
        sorcererLaserState: 'OFF',
        sorcererLaserTimer: 180,
        meteorState: 'OFF',
        meteorTimer: 120,
        meteorTargets: []
      });
      bossAttackTimerRef.current = 0;
      triggerShake(10);
    } else {
      const rows = 5;
      const cols = 8;
      const startX = 50;
      const startY = 60;
      const padding = 50;
      
      for(let r = 0; r < rows; r++) {
        let type: Enemy['type'] = 'dragon-green';
        let health = 1;

        if (r === 0) {
           type = 'dragon-gold';
           if (gameStats.level >= 9 && Math.random() > 0.7) {
             type = 'dragon-crimson'; 
             health = 4;
           } else if (gameStats.level >= 7 && Math.random() > 0.6) {
             type = 'dragon-amethyst';
             health = 3;
           } else if (gameStats.level >= 6 && Math.random() > 0.6) {
             type = 'dragon-shadow'; 
           } else if (gameStats.level >= 5 && Math.random() > 0.6) {
             type = 'dragon-emerald';
             health = 2;
           } else if (gameStats.level >= 6 && Math.random() > 0.5) {
             type = 'dragon-brown';
             health = 2;
           } else if (gameStats.level >= 3 && Math.random() > 0.5) {
             type = 'dragon-blue';
           }
        }
        else if (r === 1) {
           if (gameStats.level >= 8 && Math.random() > 0.75) {
              type = 'dragon-obsidian'; 
              health = 5;
           } else if (gameStats.level >= 7 && Math.random() > 0.7) {
              type = 'dragon-amethyst';
              health = 3;
           } else if (gameStats.level >= 5 && Math.random() > 0.6) {
              type = 'dragon-emerald';
              health = 2;
           } else if (gameStats.level >= 4 && Math.random() > 0.7) {
              type = 'dragon-silver'; 
              health = 3; 
           } else if (gameStats.level >= 6 && Math.random() > 0.6) {
              type = 'dragon-brown';
              health = 2;
           } else if (gameStats.level >= 3 && Math.random() > 0.4) {
              type = 'dragon-blue';
           } else {
              type = 'dragon-red';
           }
        }
        else if (r < 3) {
            type = 'dragon-red';
            if (gameStats.level >= 6 && Math.random() > 0.8) {
               type = 'dragon-frost';
               health = 2;
            } else if (gameStats.level >= 8 && Math.random() > 0.9) {
                type = 'dragon-silver';
                health = 3;
            }
        }

        for(let c = 0; c < cols; c++) {
          enemiesRef.current.push({
            id: generateEnemyId(),
            x: startX + c * padding,
            y: startY + r * 40,
            width: 32,
            height: 32,
            active: true,
            row: r,
            col: c,
            type: type,
            state: 'GRID',
            animationFrame: 0,
            health: health,
            maxHealth: health
          });
        }
      }
    }
    
    if (gameStats.level === 1 || bunkersRef.current.length === 0) {
        bunkersRef.current = [];
        const bunkerCount = 4;
        const bunkerY = CANVAS_HEIGHT - 120;
        const spacing = CANVAS_WIDTH / bunkerCount;
        
        for(let b = 0; b < bunkerCount; b++) {
          const bx = (spacing * b) + 60;
          for(let by = 0; by < 3; by++) {
            for(let bx_part = 0; bx_part < 4; bx_part++) {
               bunkersRef.current.push({
                 x: bx + (bx_part * 10),
                 y: bunkerY + (by * 10),
                 width: 10,
                 height: 10,
                 active: true,
                 damage: 0
               });
            }
          }
        }
    }
    
    if (gameStats.level > 1 || gameState === GameState.PLAYING) {
       playStartGame();
    }
  }, [gameStats.level, gameState]);

  useEffect(() => {
    const isRestart = (
      gameState === GameState.PLAYING && 
      (prevGameStateRef.current === GameState.GAME_OVER || prevGameStateRef.current === GameState.START)
    );
    const isLevelChange = gameStats.level !== prevLevelRef.current;
    if (isRestart || isLevelChange) {
        if (isRestart) {
            internalStatsRef.current = { ...gameStats };
            initStars();
        }
        initLevel();
        if (isRestart) {
            if (playerRef.current) {
                playerRef.current.active = true;
                playerRef.current.shieldActive = false;
                playerRef.current.rapidFireTimer = 0;
                playerRef.current.weapon = 'DEFAULT';
                playerRef.current.hasSidekicks = false;
                playerRef.current.invincibleTimer = 0;
                playerRef.current.damageBoostTimer = 0;
                playerRef.current.scoreMultiplierTimer = 0;
                playerRef.current.x = CANVAS_WIDTH / 2 - 20;
            }
        }
    }
    prevGameStateRef.current = gameState;
    prevLevelRef.current = gameStats.level;
    if (gameState === GameState.START && starsRef.current.length === 0) {
        initStars();
    }
  }, [gameState, gameStats.level, initLevel, gameStats]);

  const drawSprite = (ctx: CanvasRenderingContext2D, spriteMap: number[][], x: number, y: number, color: string, scale: number = 3) => {
    ctx.fillStyle = color;
    for(let r = 0; r < spriteMap.length; r++) {
      for(let c = 0; c < spriteMap[r].length; c++) {
        if(spriteMap[r][c] === 1) {
          ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  };

  const updateLogic = () => {
    if (gameState !== GameState.PLAYING) return;
    
    frameCountRef.current++;
    uiSyncTimerRef.current++;
    if (uiSyncTimerRef.current >= 10) {
        uiSyncTimerRef.current = 0;
        if (internalStatsRef.current.score !== gameStats.score) {
            setGameStats(prev => ({ ...prev, score: internalStatsRef.current.score }));
        }
    }
    
    if (keysRef.current['ArrowLeft']) playerRef.current.x = Math.max(0, playerRef.current.x - PLAYER_SPEED);
    if (keysRef.current['ArrowRight']) playerRef.current.x = Math.min(CANVAS_WIDTH - playerRef.current.width, playerRef.current.x + PLAYER_SPEED);
    
    if (playerRef.current.rapidFireTimer > 0) playerRef.current.rapidFireTimer--;
    if (timeFreezeTimerRef.current > 0) timeFreezeTimerRef.current--;
    if (levelBannerTimerRef.current > 0) levelBannerTimerRef.current--;
    if (playerRef.current.invincibleTimer > 0) playerRef.current.invincibleTimer--;
    if (playerRef.current.damageBoostTimer > 0) playerRef.current.damageBoostTimer--;
    if (playerRef.current.scoreMultiplierTimer > 0) playerRef.current.scoreMultiplierTimer--;
    
    if (screenShakeRef.current > 0) screenShakeRef.current *= 0.9;
    if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;

    if (playerRef.current.cooldown > 0) playerRef.current.cooldown--;
    
    let currentMaxCooldown = playerRef.current.rapidFireTimer > 0 ? RAPID_FIRE_COOLDOWN : FIRE_COOLDOWN;
    if (playerRef.current.weapon === 'LASER') currentMaxCooldown *= 0.8; 
    if (playerRef.current.weapon === 'EXPLOSIVE') currentMaxCooldown *= 1.5;
    if (playerRef.current.weapon === 'PIERCING') currentMaxCooldown *= 1.2;

    if (keysRef.current[' '] && playerRef.current.cooldown <= 0 && playerRef.current.active) {
        const pX = playerRef.current.x + playerRef.current.width / 2;
        const pY = playerRef.current.y;
        
        const spawnBullet = (offsetX: number, offsetY: number, angle: number, type: WeaponType) => {
            const isPierce = type === 'PIERCING';
            projectilesRef.current.push({
                x: pX + offsetX - (isPierce ? 2 : 2), 
                y: pY + offsetY, 
                width: isPierce ? 4 : 4, 
                height: isPierce ? 20 : 12, 
                dy: -BULLET_SPEED * (isPierce ? 1.5 : 1), 
                dx: angle,
                color: isPierce ? COLOR_POWERUP_PIERCE : (playerRef.current.rapidFireTimer > 0 ? COLOR_POWERUP_RAPID : COLOR_NEON_BLUE),
                isEnemy: false, 
                active: true, 
                projectileType: type,
                isPiercing: isPierce,
                hitEntityIds: isPierce ? [] : undefined
            });
        };

        if (playerRef.current.weapon === 'SPREAD') {
            [-3, 0, 3].forEach(dx => spawnBullet(0, 0, dx, 'SPREAD'));
        } else if (playerRef.current.weapon === 'LASER') {
            projectilesRef.current.push({
                x: pX - 3, y: pY - 10, width: 6, height: 24, dy: -BULLET_SPEED * 1.8,
                color: COLOR_POWERUP_LASER, isEnemy: false, active: true, projectileType: 'LASER'
            });
        } else if (playerRef.current.weapon === 'EXPLOSIVE') {
            projectilesRef.current.push({
                x: pX - 5, y: pY, width: 10, height: 16, dy: -BULLET_SPEED * 0.6,
                color: COLOR_POWERUP_EXPLOSIVE, isEnemy: false, active: true, projectileType: 'EXPLOSIVE'
            });
        } else if (playerRef.current.weapon === 'PIERCING') {
            spawnBullet(0, -5, 0, 'PIERCING');
        } else {
            spawnBullet(0, 0, 0, 'DEFAULT');
        }

        if (playerRef.current.hasSidekicks) {
            spawnBullet(-25, 10, 0, 'DEFAULT');
            spawnBullet(25, 10, 0, 'DEFAULT');
        }

        playerRef.current.cooldown = currentMaxCooldown;
        playPlayerShoot(); 
    }

    const activeEnemies = enemiesRef.current.filter(e => e.active);
    const isTimeSlowed = timeFreezeTimerRef.current > 0;
    const shouldUpdateEnemies = !isTimeSlowed || frameCountRef.current % 3 === 0;
    
    if (activeEnemies.length === 0) {
        if (!levelTransitionRef.current) {
            levelTransitionRef.current = true;
            setGameStats(prev => ({ ...prev, score: internalStatsRef.current.score, level: prev.level + 1 }));
        }
    } else if (shouldUpdateEnemies) {
        const hasBoss = activeEnemies.some(e => e.type.includes('boss'));
        if (hasBoss) {
            const boss = activeEnemies.find(e => e.type.includes('boss'))!;
            if (boss.hitTimer && boss.hitTimer > 0) boss.hitTimer--;
            
            const isEnraged = boss.health < boss.maxHealth * 0.5;

            // Fire Breath Active Logic
            if (boss.fireBreathTimer && boss.fireBreathTimer > 0) {
                boss.fireBreathTimer--;
                if (boss.type === 'dragon-boss' && boss.fireBreathTimer % 2 === 0) { 
                    const mouthX = boss.x + boss.width / 2;
                    projectilesRef.current.push({
                        x: mouthX + (Math.random() * 16 - 8), y: boss.y + boss.height - 20,
                        width: 8, height: 12, dy: BULLET_SPEED * 1.2, dx: (Math.random() - 0.5) * 1.5,
                        color: Math.random() > 0.5 ? COLOR_NEON_RED : COLOR_NEON_GOLD, isEnemy: true, active: true
                    });
                    if (boss.fireBreathTimer % 10 === 0) playEnemyShoot();
                }
            } 
            else if (boss.type === 'dragon-sorcerer-boss') {
                if (!boss.sorcererLaserState) boss.sorcererLaserState = 'OFF';
                if (!boss.sorcererLaserTimer) boss.sorcererLaserTimer = 180;

                if (boss.sorcererLaserState === 'OFF') {
                    if (boss.moveAngle === undefined) boss.moveAngle = 0;
                    boss.moveAngle += 0.02 * (isEnraged ? 1.5 : 1.0);
                    const centerX = (CANVAS_WIDTH - boss.width) / 2;
                    boss.x = centerX + Math.sin(boss.moveAngle) * (CANVAS_WIDTH / 2 - 40);
                    boss.y = 60 + Math.sin(boss.moveAngle * 2) * 40;
                    
                    boss.sorcererLaserTimer--;
                    if (boss.sorcererLaserTimer <= 0) {
                        boss.sorcererLaserState = 'WARNING';
                        boss.sorcererLaserTimer = 100;
                        spawnFloatingText(boss.x + boss.width/2, boss.y, "WARNING!", COLOR_NEON_RED, 20);
                    }
                } else if (boss.sorcererLaserState === 'WARNING') {
                    boss.x += (Math.random() - 0.5) * 4;
                    boss.sorcererLaserTimer--;
                    if (boss.sorcererLaserTimer <= 0) {
                        boss.sorcererLaserState = 'FIRING';
                        boss.sorcererLaserTimer = 90;
                        playExplosion();
                        triggerShake(20);
                    }
                } else if (boss.sorcererLaserState === 'FIRING') {
                    triggerShake(5);
                    boss.sorcererLaserTimer--;
                    
                    const laserWidth = 60;
                    const laserX = boss.x + boss.width/2 - laserWidth/2;
                    const playerRight = playerRef.current.x + playerRef.current.width;
                    const laserRight = laserX + laserWidth;
                    
                    if (playerRef.current.active) {
                        if (playerRef.current.x < laserRight && playerRight > laserX) {
                            damagePlayer();
                        }
                    }

                    if (boss.sorcererLaserTimer <= 0) {
                        boss.sorcererLaserState = 'OFF';
                        boss.sorcererLaserTimer = isEnraged ? 180 : 300;
                    }
                }
            }
            else if (boss.type === 'dragon-meteor-boss') {
                if (!boss.meteorState) boss.meteorState = 'OFF';
                if (!boss.meteorTimer) boss.meteorTimer = 120;
                if (!boss.meteorTargets) boss.meteorTargets = [];

                const moveSpeed = (ENEMY_SPEED_BASE + 1);
                boss.x += moveSpeed * enemyDirectionRef.current;
                if (boss.x <= 20 || boss.x + boss.width >= CANVAS_WIDTH - 20) {
                    enemyDirectionRef.current *= -1;
                }
                boss.y = 60 + Math.sin(Date.now() / 500) * 15;

                if (boss.meteorState === 'OFF') {
                    boss.meteorTimer--;
                    if (boss.meteorTimer <= 0) {
                        boss.meteorState = 'WARNING';
                        boss.meteorTimer = 90;
                        const numMeteors = isEnraged ? 6 : 4;
                        const targets = [];
                        targets.push(playerRef.current.x + playerRef.current.width/2);
                        for (let i = 0; i < numMeteors - 1; i++) {
                            targets.push(Math.random() * CANVAS_WIDTH);
                        }
                        boss.meteorTargets = targets;
                        spawnFloatingText(boss.x + boss.width/2, boss.y, "METEOR RAIN!", COLOR_METEOR_FIRE, 15);
                    }
                } else if (boss.meteorState === 'WARNING') {
                    boss.meteorTimer--;
                    if (boss.meteorTimer <= 0) {
                        boss.meteorState = 'RAINING';
                        boss.meteorTimer = 30;
                        boss.meteorTargets?.forEach(targetX => {
                            projectilesRef.current.push({
                                x: targetX - 10, y: -50,
                                width: 20, height: 20,
                                dy: BULLET_SPEED * 1.5,
                                color: COLOR_METEOR_FIRE,
                                isEnemy: true, active: true, isBomb: true,
                                projectileType: 'METEOR'
                            });
                        });
                        playEnemyShoot();
                    }
                } else if (boss.meteorState === 'RAINING') {
                    boss.meteorTimer--;
                    if (boss.meteorTimer <= 0) {
                        boss.meteorState = 'OFF';
                        boss.meteorTimer = isEnraged ? 120 : 200;
                    }
                }
            }
            else if (boss.type === 'dragon-hydra-boss' && boss.state !== 'GRID') {
                if (boss.state === 'PREPARE_CHARGE') {
                    boss.x += (Math.random() * 6 - 3);
                    boss.chargeTargetX = (boss.chargeTargetX || 60) - 1;
                    if (boss.chargeTargetX <= 0) { 
                        boss.state = 'DIVING'; 
                        playEnemyShoot(); 
                        triggerShake(5); 
                        spawnFloatingText(boss.x + boss.width/2, boss.y + boss.height, "CHARGE!", COLOR_NEON_GREEN, 15);
                    }
                } else if (boss.state === 'DIVING') {
                    boss.y += 12;
                    const playerCenter = playerRef.current.x + playerRef.current.width/2;
                    const bossCenter = boss.x + boss.width/2;
                    if (bossCenter < playerCenter) boss.x += 2;
                    if (bossCenter > playerCenter) boss.x -= 2;

                    if (boss.y > CANVAS_HEIGHT - 150) {
                        boss.state = 'RETURNING';
                        createExplosion(boss.x + boss.width/2, boss.y + boss.height, COLOR_NEON_GREEN, 20);
                        playExplosion(); triggerShake(15);
                    }
                } else if (boss.state === 'RETURNING') {
                     boss.y -= 4;
                     if (boss.y <= 60) { boss.y = 60; boss.state = 'GRID'; }
                }
                
                if (playerRef.current.active &&
                    boss.x + 20 < playerRef.current.x + playerRef.current.width &&
                    boss.x + boss.width - 20 > playerRef.current.x &&
                    boss.y + 20 < playerRef.current.y + playerRef.current.height &&
                    boss.y + boss.height - 20 > playerRef.current.y) {
                        damagePlayer();
                }
            }
            else {
                 const moveSpeed = (ENEMY_SPEED_BASE + 2) * (isEnraged ? 1.5 : 1.0);
                 boss.x += moveSpeed * enemyDirectionRef.current;
                 if (boss.type === 'dragon-electric-boss') boss.y = 60 + (Math.random() * 4 - 2);
                 if (boss.type === 'dragon-chef-boss') boss.y = 60 + (Math.sin(Date.now() / 300) * 10);
                 if (boss.x <= 20 || boss.x + boss.width >= CANVAS_WIDTH - 20) {
                    enemyDirectionRef.current *= -1;
                 }
            }

            if (boss.state === 'GRID') {
                bossAttackTimerRef.current += isEnraged ? 1.5 : 1.0;
                if (bossAttackTimerRef.current > 60) {
                    bossAttackTimerRef.current = 0;
                    const rand = Math.random();

                    if (boss.type === 'dragon-chef-boss') {
                        if (rand < 0.4) {
                            const projectileCount = isEnraged ? 12 : 8;
                            spawnFloatingText(boss.x + boss.width/2, boss.y, "SALAD BOMBS!", COLOR_NEON_RED, 15);
                            for(let i=0; i<projectileCount; i++) {
                                const angle = (Math.PI / (projectileCount-1)) * i + (Math.PI/4);
                                const foodColors = [COLOR_FOOD_APPLE, COLOR_FOOD_CARROT, COLOR_FOOD_PUMPKIN, COLOR_FOOD_WATERMELON];
                                const color = foodColors[Math.floor(Math.random() * foodColors.length)];
                                projectilesRef.current.push({
                                    x: boss.x + boss.width/2, y: boss.y + boss.height/2, 
                                    width: 10, height: 10,
                                    dy: Math.sin(angle) * BULLET_SPEED, dx: Math.cos(angle) * BULLET_SPEED * (Math.random() * 2 - 1),
                                    color: color, isEnemy: true, active: true, isBomb: true
                                });
                            }
                            playEnemyShoot();
                        } else {
                            const foodColors = [COLOR_FOOD_APPLE, COLOR_FOOD_CARROT, COLOR_FOOD_PUMPKIN, COLOR_FOOD_WATERMELON];
                            [-1, 0, 1].forEach(dir => {
                                const color = foodColors[Math.floor(Math.random() * foodColors.length)];
                                projectilesRef.current.push({
                                    x: boss.x + boss.width/2, y: boss.y + boss.height - 20, 
                                    width: 8, height: 8,
                                    dy: BULLET_SPEED, dx: dir * 2, 
                                    color: color, isEnemy: true, active: true
                                });
                            });
                            playEnemyShoot();
                        }
                    }
                    else if (boss.type === 'dragon-sorcerer-boss') {
                        if (boss.sorcererLaserState === 'OFF') {
                            if (rand < 0.6) {
                                const count = isEnraged ? 5 : 3;
                                for(let i=0; i<count; i++) {
                                     projectilesRef.current.push({
                                        x: boss.x + Math.random() * boss.width, y: boss.y + boss.height - 20,
                                        width: 8, height: 8, dy: BULLET_SPEED * 0.8, dx: (Math.random() - 0.5) * 4,
                                        color: COLOR_BOSS_SORCERER_DARK, isEnemy: true, active: true
                                    });
                                }
                                playEnemyShoot();
                            }
                        }
                    }
                    else if (boss.type === 'dragon-meteor-boss') {
                        if (boss.meteorState === 'OFF' && rand < 0.5) {
                            for(let i=0; i<3; i++) {
                                projectilesRef.current.push({
                                    x: boss.x + boss.width/2, y: boss.y + boss.height - 10,
                                    width: 12, height: 12,
                                    dy: BULLET_SPEED, dx: (i-1) * 3,
                                    color: COLOR_BOSS_METEOR, isEnemy: true, active: true, isBomb: true
                                });
                            }
                            playEnemyShoot();
                        }
                    }
                    else if (boss.type === 'dragon-hydra-boss') {
                        if (rand < 0.4) {
                            boss.state = 'PREPARE_CHARGE';
                            boss.chargeTargetX = 45; 
                        } else if (rand < 0.7) {
                            [0.2, 0.5, 0.8].forEach(offset => {
                                const originX = boss.x + (boss.width * offset);
                                const angle = Math.atan2(playerRef.current.y - boss.y, (playerRef.current.x + playerRef.current.width/2) - originX);
                                projectilesRef.current.push({
                                    x: originX, y: boss.y + boss.height - 20, width: 10, height: 10,
                                    dy: Math.sin(angle) * BULLET_SPEED, dx: Math.cos(angle) * BULLET_SPEED,
                                    color: COLOR_BOSS_HYDRA, isEnemy: true, active: true
                                });
                            });
                            playEnemyShoot();
                        } else {
                             for (let i = 0; i < 5; i++) {
                                projectilesRef.current.push({
                                  x: boss.x + (i * (boss.width/4)), y: boss.y + boss.height - 20, width: 6, height: 15,
                                  dy: BULLET_SPEED * 0.9, dx: 0, color: COLOR_NEON_GREEN, isEnemy: true, active: true
                                });
                             }
                             playEnemyShoot();
                        }
                    }
                    else if (boss.type === 'dragon-mech-boss') {
                        if (rand < 0.5) {
                            const centerX = boss.x + boss.width / 2;
                            const centerY = boss.y + boss.height / 2;
                            const projectileCount = isEnraged ? 16 : 10;
                            for(let i=0; i<projectileCount; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = BULLET_SPEED * 0.7;
                                projectilesRef.current.push({
                                    x: centerX, y: centerY, width: 8, height: 8,
                                    dy: Math.sin(angle) * speed, dx: Math.cos(angle) * speed,
                                    color: COLOR_BOSS_MECH_DARK, isEnemy: true, active: true, isBomb: true
                                });
                            }
                            playEnemyShoot();
                            spawnFloatingText(centerX, centerY, "SCATTER!", COLOR_BOSS_MECH, 15);
                        } else if (rand < 0.8) {
                            [0.25, 0.75].forEach(offset => {
                                projectilesRef.current.push({
                                   x: boss.x + (boss.width * offset) - 5, y: boss.y + boss.height - 20,
                                   width: 10, height: 25, dy: BULLET_SPEED * 1.2, color: COLOR_NEON_RED, isEnemy: true, active: true
                                });
                            });
                            playEnemyShoot();
                        } else {
                             for (let i = 0; i < 6; i++) {
                                projectilesRef.current.push({
                                  x: boss.x + (i * (boss.width/5)), y: boss.y + boss.height - 20, width: 6, height: 12,
                                  dy: BULLET_SPEED * 0.9, dx: 0, color: '#fff', isEnemy: true, active: true
                                });
                             }
                             playEnemyShoot();
                        }
                    }
                    else if (boss.type === 'dragon-electric-boss') {
                         if (rand < 0.4) {
                             const centerX = boss.x + boss.width / 2;
                             projectilesRef.current.push({
                                 x: centerX - 20, y: boss.y + boss.height/2, width: 40, height: 40,
                                 dy: BULLET_SPEED * 0.6, dx: (playerRef.current.x - centerX) * 0.01,
                                 color: COLOR_BOSS_ELECTRIC_WEB, isEnemy: true, active: true, projectileType: 'ELECTRIC_WEB', rotation: 0
                             });
                             playEnemyShoot();
                             spawnFloatingText(centerX, boss.y, "WEB!", COLOR_BOSS_ELECTRIC, 15);
                         } else if (rand < 0.8) {
                             const beams = isEnraged ? 5 : 3;
                             for (let i = 0; i < beams; i++) {
                                 const offsetX = (i - (beams/2)) * 30;
                                 projectilesRef.current.push({
                                     x: boss.x + boss.width / 2 + offsetX, y: boss.y + boss.height - 20,
                                     width: 4, height: 30, dy: BULLET_SPEED * 1.5, color: COLOR_BOSS_ELECTRIC,
                                     isEnemy: true, active: true, projectileType: 'ELECTRIC_LASER'
                                 });
                             }
                             playEnemyShoot();
                         } else {
                             for (let i = 0; i < 5; i++) {
                                 projectilesRef.current.push({
                                     x: boss.x + boss.width * Math.random(), y: boss.y + boss.height - 10,
                                     width: 6, height: 6, dy: BULLET_SPEED, dx: (Math.random() - 0.5) * 2,
                                     color: '#fff', isEnemy: true, active: true
                                 });
                             }
                             playEnemyShoot();
                        }
                    }
                    else if (boss.type === 'dragon-boss') {
                         if (isEnraged && rand < 0.4) {
                           boss.fireBreathTimer = 90; 
                           spawnFloatingText(boss.x + boss.width/2, boss.y, "INFERNO", COLOR_NEON_RED, 15);
                        } else if (rand < 0.6) {
                           [-1, 0, 1].forEach(dir => {
                             projectilesRef.current.push({
                               x: boss.x + boss.width / 2 - 3, y: boss.y + boss.height - 10, width: 6, height: 12,
                               dy: BULLET_SPEED * 0.7, dx: dir * 2, color: COLOR_NEON_RED, isEnemy: true, active: true
                             });
                           });
                           playEnemyShoot();
                        } else if (rand < 0.8) {
                           const angle = Math.atan2(playerRef.current.y - boss.y, (playerRef.current.x + playerRef.current.width/2) - (boss.x + boss.width/2));
                           const speed = BULLET_SPEED * 0.9;
                           projectilesRef.current.push({
                             x: boss.x + boss.width / 2 - 4, y: boss.y + boss.height - 10, width: 8, height: 8,
                             dy: Math.sin(angle) * speed, dx: Math.cos(angle) * speed, color: COLOR_NEON_PURPLE, isEnemy: true, active: true
                           });
                           playEnemyShoot();
                        } else {
                           for (let i = 0; i < 5; i++) {
                              projectilesRef.current.push({
                                x: boss.x + (i * (boss.width/4)), y: boss.y + boss.height - 20, width: 6, height: 15,
                                dy: BULLET_SPEED * 0.9, dx: 0, color: COLOR_NEON_GOLD, isEnemy: true, active: true
                              });
                           }
                           playEnemyShoot();
                        }
                    }
                }
            }
        } else if (!hasBoss) {
            if (enemyFireCooldownRef.current > 0) enemyFireCooldownRef.current--;
            let hitEdge = false;
            let lowestEnemyY = 0;
            
            const blueDragons = activeEnemies.filter(e => e.type === 'dragon-blue');
            if (blueDragons.length > 0) {
                const isAnyDiving = blueDragons.some(e => e.state === 'DIVING' || e.state === 'RETURNING');
                if (!isAnyDiving) {
                    if (blueDiveTimerRef.current > 0) blueDiveTimerRef.current--;
                    else {
                        const d = blueDragons[nextBlueDiveIndexRef.current % blueDragons.length];
                        if (d && d.state === 'GRID') {
                            d.state = 'DIVING'; d.diveStartX = d.x; d.diveStartY = d.y;
                            playEnemyShoot(); nextBlueDiveIndexRef.current++;
                            blueDiveTimerRef.current = 60 + Math.random() * 60;
                        }
                    }
                }
            }

            const shootingCandidates: Enemy[] = [];
            const bottomEnemies = new Map<number, number>();
            activeEnemies.forEach(e => {
                if (e.state === 'GRID') {
                   const currentMax = bottomEnemies.get(e.col) ?? -1;
                   if (e.row > currentMax) bottomEnemies.set(e.col, e.row);
                }
            });

            activeEnemies.forEach(e => {
                if (e.type === 'dragon-orange') {
                     if (e.y < 120) e.y += 1;
                     e.y += Math.sin(Date.now() / 200) * 0.5;
                     if (Math.random() < 0.04) { 
                        const angle = Math.random() * Math.PI * 2;
                        const speed = BULLET_SPEED * 0.5; 
                        projectilesRef.current.push({
                            x: e.x + e.width/2, y: e.y + e.height/2, width: 10, height: 10,
                            dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
                            color: COLOR_NEON_ORANGE, isEnemy: true, active: true, isBomb: true
                        });
                        playEnemyShoot();
                     }
                     return;
                }
                
                if (e.type === 'dragon-blue' && (e.state === 'DIVING' || e.state === 'RETURNING')) {
                     if (e.state === 'DIVING') {
                         e.y += 5;
                         if (e.diveStartX) e.x = e.diveStartX + Math.sin((e.y - (e.diveStartY || 0)) * 0.05) * 60;
                         if (e.y > CANVAS_HEIGHT) { e.state = 'RETURNING'; e.y = -40; e.x = Math.random() * CANVAS_WIDTH; }
                     } else {
                         const anchor = activeEnemies.find(ae => ae.state === 'GRID');
                         const targetY = anchor ? anchor.y + (e.row - anchor.row) * 40 : 100;
                         const targetX = anchor ? anchor.x + (e.col - anchor.col) * 50 : e.x;
                         const dx = targetX - e.x, dy = targetY - e.y, dist = Math.hypot(dx, dy);
                         if (dist < 5) { e.state = 'GRID'; e.x = targetX; e.y = targetY; }
                         else { e.x += (dx/dist)*4; e.y += (dy/dist)*4; }
                     }
                     return;
                }

                if (e.state === 'GRID') {
                    e.x += 2 * enemyDirectionRef.current;
                    if (e.x <= 10 || e.x + e.width >= CANVAS_WIDTH - 10) hitEdge = true;
                }
                lowestEnemyY = Math.max(lowestEnemyY, e.y + e.height);

                let canShoot = false;
                if (e.type === 'dragon-brown') canShoot = true;
                else if (e.type === 'dragon-silver' && Math.random() > 0.8) canShoot = true;
                else if (e.type === 'dragon-shadow') canShoot = true;
                else if (e.type === 'dragon-emerald' && Math.random() > 0.7) canShoot = true;
                else if (e.type === 'dragon-amethyst') canShoot = true;
                else if (e.type === 'dragon-frost') canShoot = true;
                else if (e.type === 'dragon-obsidian' && Math.random() > 0.8) canShoot = true;
                else if (e.type === 'dragon-crimson') canShoot = true;
                else if (e.state === 'GRID' && bottomEnemies.get(e.col) === e.row) canShoot = true;
                
                if (canShoot) shootingCandidates.push(e);
            });

            if (enemyFireCooldownRef.current <= 0 && shootingCandidates.length > 0) {
                const shooter = shootingCandidates[Math.floor(Math.random() * shootingCandidates.length)];
                const isBomb = shooter.type === 'dragon-brown';
                
                if (shooter.type === 'dragon-amethyst') {
                    const angle = Math.atan2(playerRef.current.y - shooter.y, (playerRef.current.x + playerRef.current.width/2) - (shooter.x + shooter.width/2));
                    projectilesRef.current.push({
                        x: shooter.x + shooter.width / 2 - 3, y: shooter.y + shooter.height + 2,
                        width: 6, height: 6,
                        dy: Math.sin(angle) * BULLET_SPEED * 0.7,
                        dx: Math.cos(angle) * BULLET_SPEED * 0.7,
                        color: COLOR_NEON_AMETHYST,
                        isEnemy: true, active: true
                    });
                } else {
                    let pWidth = 6;
                    let pHeight = 12;
                    let pSpeed = BULLET_SPEED * 0.6;
                    let pColor = COLOR_NEON_RED;

                    if (isBomb) {
                        pWidth = 8; pHeight = 8; pSpeed = BULLET_SPEED * 0.8; pColor = COLOR_NEON_BROWN;
                    } else if (shooter.type === 'dragon-emerald') {
                        pColor = COLOR_NEON_EMERALD;
                    } else if (shooter.type === 'dragon-frost') {
                        pSpeed = BULLET_SPEED * 0.9; pColor = COLOR_NEON_FROST; pHeight = 16; pWidth = 4;
                    } else if (shooter.type === 'dragon-obsidian') {
                        pSpeed = BULLET_SPEED * 0.5; pColor = COLOR_NEON_OBSIDIAN; pWidth = 10; pHeight = 10;
                    } else if (shooter.type === 'dragon-crimson') {
                        pSpeed = BULLET_SPEED * 0.8; pColor = COLOR_NEON_CRIMSON; pWidth = 8;
                    }

                    projectilesRef.current.push({
                        x: shooter.x + shooter.width / 2 - pWidth/2, y: shooter.y + shooter.height + 2,
                        width: pWidth, height: pHeight,
                        dy: pSpeed,
                        color: pColor,
                        isEnemy: true, active: true, isBomb: isBomb
                    });
                }
                playEnemyShoot();
                enemyFireCooldownRef.current = Math.max(10, 50 - (gameStats.level * 3)) + Math.random() * 15;
            }

            if (hitEdge) {
                 enemyDirectionRef.current *= -1;
                 activeEnemies.forEach(e => { if (e.state === 'GRID') e.x += 2 * enemyDirectionRef.current; });
            }
            
            if (lowestEnemyY >= playerRef.current.y) {
                internalStatsRef.current.lives = 0;
                setGameStats(prev => ({ ...prev, lives: 0 }));
                setGameState(GameState.GAME_OVER);
            }
        }
    }
    
    enemyMoveTimerRef.current++;
    if (enemyMoveTimerRef.current > 30 - Math.min(20, gameStats.level * 2)) {
        enemyAnimationToggleRef.current = !enemyAnimationToggleRef.current;
        enemyMoveTimerRef.current = 0;
    }

    projectilesRef.current.forEach(p => {
         if (p.isEnemy && isTimeSlowed && frameCountRef.current % 3 !== 0) return;

         p.y += p.dy; if (p.dx) p.x += p.dx;
         if (p.rotation !== undefined) p.rotation += 0.1;

         if (p.x < 0 || p.x > CANVAS_WIDTH || p.y < -50 || p.y > CANVAS_HEIGHT) p.active = false;
         
         if (p.active && p.isBomb && p.isEnemy && p.y >= CANVAS_HEIGHT - 20) {
             p.active = false; createExplosion(p.x, CANVAS_HEIGHT - 20, COLOR_NEON_RED, 15); playExplosion(); triggerShake(5);
             if (Math.hypot(p.x - (playerRef.current.x + 22), (CANVAS_HEIGHT-20) - (playerRef.current.y+16)) < 60) damagePlayer();
         }

         if (p.isEnemy && p.active && playerRef.current.active) {
             if (p.x < playerRef.current.x + playerRef.current.width - 8 && p.x + p.width > playerRef.current.x + 8 &&
                 p.y < playerRef.current.y + playerRef.current.height - 8 && p.y + p.height > playerRef.current.y + 8) {
                 p.active = false; damagePlayer();
             }
         }
         
         if (!p.isEnemy && p.active) {
             activeEnemies.forEach(e => {
                 if (p.isPiercing && p.hitEntityIds?.includes(e.id)) return;

                 if (p.active && p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
                     
                     if (p.isPiercing) {
                         if (!p.hitEntityIds) p.hitEntityIds = [];
                         p.hitEntityIds.push(e.id);
                         createExplosion(p.x, p.y + 10, '#fff', 3, 2);
                     } else {
                         p.active = false;
                     }

                     let baseDmg = p.projectileType === 'EXPLOSIVE' ? 2 : 1;
                     if (p.projectileType === 'LASER') baseDmg = 0.5; 
                     
                     const multiplier = playerRef.current.damageBoostTimer > 0 ? 2 : 1;
                     const finalDmg = baseDmg * multiplier;

                     e.health -= finalDmg; e.hitTimer = 5;
                     
                     spawnFloatingText(e.x + e.width/2, e.y, finalDmg.toString(), playerRef.current.damageBoostTimer > 0 ? COLOR_POWERUP_DAMAGE : '#fff', 8);

                     if (p.projectileType === 'EXPLOSIVE') {
                         createExplosion(p.x, p.y, COLOR_POWERUP_EXPLOSIVE, 12, 6); playExplosion(); triggerShake(2);
                         activeEnemies.forEach(nearby => {
                             if (nearby !== e && nearby.active && Math.hypot(nearby.x - p.x, nearby.y - p.y) < 50) {
                                 nearby.health -= 1 * multiplier; nearby.hitTimer = 3;
                                 createExplosion(nearby.x+16, nearby.y+16, COLOR_POWERUP_EXPLOSIVE, 3);
                             }
                         });
                     } else {
                         createExplosion(p.x, p.y, '#fff', 2, 2); playShieldHit();
                     }

                     if (e.health <= 0) {
                         e.active = false;
                         let pts = 10;
                         if (e.type.includes('boss')) { pts = 1000; triggerShake(20); playExplosion(); }
                         else if (e.type === 'dragon-red') pts = 20;
                         else if (e.type === 'dragon-gold') pts = 50;
                         else if (e.type === 'dragon-amethyst') pts = 60;
                         else if (e.type === 'dragon-emerald') pts = 70;
                         else if (e.type === 'dragon-frost') pts = 80;
                         else if (e.type === 'dragon-obsidian') pts = 100;
                         else if (e.type === 'dragon-crimson') pts = 150;
                         
                         if (playerRef.current.scoreMultiplierTimer > 0) {
                             pts *= 2;
                         }

                         internalStatsRef.current.score += pts;
                         
                         spawnFloatingText(e.x + e.width/2, e.y, `+${pts}`, playerRef.current.scoreMultiplierTimer > 0 ? COLOR_POWERUP_SCORE : COLOR_NEON_GOLD, 10);
                         createExplosion(e.x + e.width/2, e.y + e.height/2, COLOR_NEON_GREEN, 15, 6, 0.1);
                         
                         if (Math.random() < POWERUP_DROP_CHANCE || e.type.includes('boss')) spawnPowerUp(e.x, e.y);
                     }
                 }
             });
         }
    });
    
    if (playerRef.current.invincibleTimer > 0) {
        activeEnemies.forEach(e => {
            if (e.active && playerRef.current.active && 
                playerRef.current.x < e.x + e.width && playerRef.current.x + playerRef.current.width > e.x &&
                playerRef.current.y < e.y + e.height && playerRef.current.y + playerRef.current.height > e.y) {
                    e.health = 0;
                    e.active = false;
                    createExplosion(e.x + e.width/2, e.y + e.height/2, COLOR_NEON_GOLD, 20);
                    playExplosion();
                    spawnFloatingText(e.x, e.y, "SMASH!", COLOR_NEON_GOLD, 15);
            }
        });
    }

    powerUpsRef.current.forEach(p => {
         p.y += POWERUP_SPEED;
         if (p.y > CANVAS_HEIGHT) p.active = false;
         if (p.active && p.x < playerRef.current.x + playerRef.current.width && p.x + p.width > playerRef.current.x &&
             p.y < playerRef.current.y + playerRef.current.height && p.y + p.height > playerRef.current.y) {
                 p.active = false; playPowerUpCollect();
                 
                 let displayText = p.type.replace('WEAPON_', '').replace('_', ' ');
                 let color = COLOR_NEON_CYAN;

                 if (p.type === 'SHIELD') playerRef.current.shieldActive = true;
                 else if (p.type === 'RAPID_FIRE') playerRef.current.rapidFireTimer = RAPID_FIRE_DURATION;
                 else if (p.type === 'WEAPON_SPREAD') playerRef.current.weapon = 'SPREAD';
                 else if (p.type === 'WEAPON_LASER') playerRef.current.weapon = 'LASER';
                 else if (p.type === 'WEAPON_EXPLOSIVE') playerRef.current.weapon = 'EXPLOSIVE';
                 else if (p.type === 'WEAPON_PIERCE') playerRef.current.weapon = 'PIERCING';
                 else if (p.type === 'SIDEKICK') { playerRef.current.hasSidekicks = true; displayText = "DRONE"; }
                 else if (p.type === 'INVINCIBILITY') { playerRef.current.invincibleTimer = 600; displayText = "INVINCIBLE"; color = COLOR_NEON_GOLD; }
                 else if (p.type === 'DAMAGE_BOOST') { playerRef.current.damageBoostTimer = DAMAGE_BOOST_DURATION; displayText = "DAMAGE x2"; color = COLOR_POWERUP_DAMAGE; }
                 else if (p.type === 'SCORE_MULTIPLIER') { playerRef.current.scoreMultiplierTimer = SCORE_MULTIPLIER_DURATION; displayText = "SCORE x2"; color = COLOR_POWERUP_SCORE; }
                 else if (p.type === 'EXTRA_LIFE') {
                     internalStatsRef.current.lives += 1;
                     setGameStats(prev => ({ ...prev, lives: internalStatsRef.current.lives }));
                 }
                 else if (p.type === 'TIME_FREEZE') {
                     timeFreezeTimerRef.current = 300;
                     displayText = "SLOW MO";
                 }
                 else if (p.type === 'BOMB') { 
                     enemiesRef.current.forEach(e => { if(e.active) { e.health = 0; e.active = false; createExplosion(e.x, e.y, COLOR_POWERUP_BOMB, 10); } });
                     triggerShake(30); playExplosion();
                 }
                 
                 spawnFloatingText(p.x, p.y - 10, displayText, color, 10);
         }
    });
    
    projectilesRef.current = projectilesRef.current.filter(p => p.active);
    enemiesRef.current = enemiesRef.current.filter(e => e.active);
    powerUpsRef.current = powerUpsRef.current.filter(p => p.active);
    
    floatingTextsRef.current.forEach(t => {
        t.y += t.vy;
        t.life--;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; 
      if (p.gravity) p.vy += p.gravity; 
      p.life -= 0.03; 
      p.vx *= 0.95; 
      if (!p.gravity) p.vy *= 0.95;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    if (starsRef.current.length === 0) initStars();
    starsRef.current.forEach(star => {
        star.y += star.speed * (gameState === GameState.PLAYING ? 1 : 0.2); 
        if (star.y > CANVAS_HEIGHT) { star.y = 0; star.x = Math.random() * CANVAS_WIDTH; }
    });
    
    // DRAW
    ctx.save();
    if (screenShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRef.current;
        const dy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(dx, dy);
    }

    ctx.fillStyle = '#050505';
    ctx.fillRect(-20, -20, CANVAS_WIDTH + 40, CANVAS_HEIGHT + 40); 

    starsRef.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    bunkersRef.current.forEach(b => {
      if (b.active) {
        ctx.fillStyle = `rgba(150, 150, 150, ${1 - (b.damage * 0.3)})`;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }
    });

    if (playerRef.current.active) {
       ctx.save();
       const tilt = (keysRef.current['ArrowLeft'] ? -0.15 : 0) + (keysRef.current['ArrowRight'] ? 0.15 : 0);
       const centerX = playerRef.current.x + playerRef.current.width/2;
       const centerY = playerRef.current.y + playerRef.current.height/2;
       
       ctx.translate(centerX, centerY);
       ctx.rotate(tilt);
       ctx.translate(-centerX, -centerY);

       // Invincibility Effect
       let playerColor = COLOR_NEON_BLUE;
       if (playerRef.current.invincibleTimer > 0) {
           playerColor = Math.floor(Date.now() / 50) % 2 === 0 ? '#fff' : COLOR_NEON_GOLD;
           ctx.shadowBlur = 10;
           ctx.shadowColor = COLOR_NEON_GOLD;
       }
       if (playerRef.current.damageBoostTimer > 0) {
           playerColor = Math.floor(Date.now() / 100) % 2 === 0 ? COLOR_POWERUP_DAMAGE : playerColor;
       }

       drawSprite(ctx, SPRITE_PLAYER, playerRef.current.x, playerRef.current.y, playerColor, 4);
       ctx.shadowBlur = 0;
       
       if (playerRef.current.shieldActive) {
         ctx.strokeStyle = COLOR_POWERUP_SHIELD;
         ctx.lineWidth = 2; ctx.beginPath();
         ctx.arc(playerRef.current.x + 22, playerRef.current.y + 16, 35, 0, Math.PI * 2);
         ctx.stroke();
       }

       // Draw Sidekicks
       if (playerRef.current.hasSidekicks) {
           const bob = Math.sin(Date.now() / 200) * 3;
           drawSprite(ctx, SPRITE_POWERUP_SIDEKICK, playerRef.current.x - 20, playerRef.current.y + 10 + bob, COLOR_POWERUP_SIDEKICK, 2);
           drawSprite(ctx, SPRITE_POWERUP_SIDEKICK, playerRef.current.x + playerRef.current.width + 8, playerRef.current.y + 10 + bob, COLOR_POWERUP_SIDEKICK, 2);
       }

       // Draw Status Icons
       if (playerRef.current.damageBoostTimer > 0) {
           ctx.fillStyle = COLOR_POWERUP_DAMAGE;
           ctx.font = '8px "Press Start 2P"';
           ctx.fillText("DMG UP", playerRef.current.x - 10, playerRef.current.y - 10);
       }
       if (playerRef.current.scoreMultiplierTimer > 0) {
           ctx.fillStyle = COLOR_POWERUP_SCORE;
           ctx.font = '8px "Press Start 2P"';
           ctx.fillText("SCORE x2", playerRef.current.x + 30, playerRef.current.y - 10);
       }

       let currentMaxCooldown = playerRef.current.rapidFireTimer > 0 ? RAPID_FIRE_COOLDOWN : FIRE_COOLDOWN;
       if (playerRef.current.weapon === 'LASER') currentMaxCooldown *= 0.8; 
       if (playerRef.current.weapon === 'EXPLOSIVE') currentMaxCooldown *= 1.5;
       if (playerRef.current.weapon === 'PIERCING') currentMaxCooldown *= 1.2;
       
       if (playerRef.current.cooldown > currentMaxCooldown * 0.7) {
           ctx.fillStyle = '#fff';
           ctx.beginPath();
           ctx.arc(playerRef.current.x + 22, playerRef.current.y, 8, 0, Math.PI * 2);
           ctx.fill();
       }
       ctx.restore();
    }

    const activeEnemies = enemiesRef.current.filter(e => e.active); 
    activeEnemies.forEach(e => {
       let color = COLOR_NEON_GREEN;
       if (e.type === 'dragon-red') color = COLOR_NEON_RED;
       else if (e.type === 'dragon-gold') color = COLOR_NEON_GOLD;
       else if (e.type === 'dragon-blue') color = COLOR_NEON_CYAN;
       else if (e.type === 'dragon-orange') color = COLOR_NEON_ORANGE;
       else if (e.type === 'dragon-boss') {
           color = (e.health < e.maxHealth * 0.5 && Math.floor(Date.now() / 200) % 2 === 0) ? COLOR_NEON_RED : COLOR_NEON_PURPLE;
       }
       else if (e.type === 'dragon-chef-boss') color = COLOR_BOSS_CHEF_SKIN;
       else if (e.type === 'dragon-mech-boss') color = COLOR_BOSS_MECH;
       else if (e.type === 'dragon-electric-boss') color = COLOR_BOSS_ELECTRIC;
       else if (e.type === 'dragon-hydra-boss') {
           if (e.state === 'PREPARE_CHARGE') color = Math.floor(Date.now() / 50) % 2 === 0 ? '#fff' : COLOR_BOSS_HYDRA;
           else color = COLOR_BOSS_HYDRA;
       }
       else if (e.type === 'dragon-sorcerer-boss') {
           if (e.sorcererLaserState === 'WARNING' && Math.floor(Date.now() / 50) % 2 === 0) color = COLOR_NEON_RED;
           else if (e.sorcererLaserState === 'FIRING') color = '#fff';
           else color = COLOR_BOSS_SORCERER;
       }
       else if (e.type === 'dragon-meteor-boss') {
           color = COLOR_BOSS_METEOR;
           if (e.meteorState === 'WARNING' && Math.floor(Date.now() / 100) % 2 === 0) color = COLOR_METEOR_FIRE;
       }
       else if (e.type === 'dragon-brown') color = COLOR_NEON_BROWN;
       else if (e.type === 'dragon-silver') color = COLOR_NEON_SILVER;
       else if (e.type === 'dragon-shadow') color = COLOR_NEON_SHADOW;
       else if (e.type === 'dragon-emerald') color = COLOR_NEON_EMERALD;
       else if (e.type === 'dragon-amethyst') color = COLOR_NEON_AMETHYST;
       else if (e.type === 'dragon-frost') color = COLOR_NEON_FROST;
       else if (e.type === 'dragon-obsidian') color = COLOR_NEON_OBSIDIAN;
       else if (e.type === 'dragon-crimson') color = COLOR_NEON_CRIMSON;
       
       if (e.hitTimer && e.hitTimer > 0) color = '#fff';
       
       let sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_1 : SPRITE_DRAGON_2;
       let scale = 3;
       if (e.type === 'dragon-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS : SPRITE_BOSS_2; scale = 8; }
       else if (e.type === 'dragon-chef-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_CHEF_2 : SPRITE_BOSS_CHEF; scale = 8; } 
       else if (e.type === 'dragon-mech-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_MECH : SPRITE_BOSS_MECH_2; scale = 8; }
       else if (e.type === 'dragon-electric-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_ELECTRIC : SPRITE_BOSS_ELECTRIC_2; scale = 8; }
       else if (e.type === 'dragon-hydra-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_HYDRA : SPRITE_BOSS_HYDRA_2; scale = 8; }
       else if (e.type === 'dragon-sorcerer-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_SORCERER : SPRITE_BOSS_SORCERER_2; scale = 8; }
       else if (e.type === 'dragon-meteor-boss') { sprite = enemyAnimationToggleRef.current ? SPRITE_BOSS_METEOR : SPRITE_BOSS_METEOR_2; scale = 8; }
       else if (e.type === 'dragon-blue') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_BLUE : SPRITE_DRAGON_BLUE_2;
       else if (e.type === 'dragon-orange') sprite = SPRITE_DRAGON_ORANGE;
       else if (e.type === 'dragon-brown') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_BROWN : SPRITE_DRAGON_BROWN_2;
       else if (e.type === 'dragon-silver') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_SILVER : SPRITE_DRAGON_SILVER_2;
       else if (e.type === 'dragon-shadow') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_SHADOW : SPRITE_DRAGON_SHADOW_2;
       else if (e.type === 'dragon-emerald') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_EMERALD_1 : SPRITE_DRAGON_EMERALD_2;
       else if (e.type === 'dragon-amethyst') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_AMETHYST_1 : SPRITE_DRAGON_AMETHYST_2;
       else if (e.type === 'dragon-frost') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_FROST_1 : SPRITE_DRAGON_FROST_2;
       else if (e.type === 'dragon-obsidian') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_OBSIDIAN_1 : SPRITE_DRAGON_OBSIDIAN_2;
       else if (e.type === 'dragon-crimson') sprite = enemyAnimationToggleRef.current ? SPRITE_DRAGON_CRIMSON_1 : SPRITE_DRAGON_CRIMSON_2;
       
       drawSprite(ctx, sprite, e.x, e.y, color, scale);

       if (e.type === 'dragon-sorcerer-boss') {
           const laserWidth = 60;
           const centerX = e.x + e.width / 2;
           if (e.sorcererLaserState === 'WARNING') {
               ctx.strokeStyle = COLOR_NEON_RED;
               ctx.setLineDash([5, 5]);
               ctx.lineWidth = 2;
               ctx.beginPath();
               ctx.moveTo(centerX, e.y + e.height - 20);
               ctx.lineTo(centerX, CANVAS_HEIGHT);
               ctx.stroke();
               ctx.setLineDash([]);
           } else if (e.sorcererLaserState === 'FIRING') {
               ctx.save();
               const gradient = ctx.createLinearGradient(centerX - laserWidth/2, 0, centerX + laserWidth/2, 0);
               gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
               gradient.addColorStop(0.2, 'rgba(255, 0, 0, 0.8)');
               gradient.addColorStop(0.5, '#fff');
               gradient.addColorStop(0.8, 'rgba(255, 0, 0, 0.8)');
               gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
               
               ctx.fillStyle = gradient;
               ctx.fillRect(centerX - laserWidth/2, e.y + e.height - 40, laserWidth, CANVAS_HEIGHT);
               ctx.fillStyle = '#fff';
               ctx.fillRect(centerX - 5, e.y + e.height - 30, 10, CANVAS_HEIGHT);
               for(let i=0; i<5; i++) {
                   const px = centerX + (Math.random() - 0.5) * laserWidth;
                   const py = e.y + e.height + Math.random() * (CANVAS_HEIGHT - e.y);
                   ctx.fillStyle = '#fff';
                   ctx.fillRect(px, py, 2, 10);
               }
               ctx.restore();
           }
       }
       if (e.type === 'dragon-meteor-boss' && e.meteorState === 'WARNING') {
           ctx.save();
           const opacity = (Math.sin(Date.now() / 50) + 1) / 2; 
           ctx.strokeStyle = `rgba(255, 0, 0, ${opacity * 0.8})`;
           ctx.lineWidth = 2;
           e.meteorTargets?.forEach(targetX => {
               ctx.beginPath();
               ctx.moveTo(targetX, 0);
               ctx.lineTo(targetX, CANVAS_HEIGHT);
               ctx.stroke();
               ctx.font = '20px Arial';
               ctx.textAlign = 'center';
               ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
               ctx.fillText('!', targetX, CANVAS_HEIGHT - 50);
           });
           ctx.restore();
       }
    });
    
    const boss = activeEnemies.find(e => e.type.includes('boss'));
    if (boss) {
        const hpPercent = Math.max(0, boss.health / boss.maxHealth);
        const barWidth = 400; const barX = (CANVAS_WIDTH - barWidth) / 2;
        ctx.fillStyle = '#333'; ctx.fillRect(barX, 20, barWidth, 16);
        ctx.fillStyle = COLOR_NEON_PURPLE; ctx.fillRect(barX + 2, 22, (barWidth - 4) * hpPercent, 12);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(barX, 20, barWidth, 16);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P"';
        let label = "DRAGON LORD";
        if (boss.type === 'dragon-chef-boss') label = "GOURMET DRAGON";
        else if (boss.type === 'dragon-mech-boss') label = "MECHA DRAGON";
        else if (boss.type === 'dragon-electric-boss') label = "THUNDER WYVERN";
        else if (boss.type === 'dragon-hydra-boss') label = "VENOM HYDRA";
        else if (boss.type === 'dragon-sorcerer-boss') label = "ARCH-MAGE DRAGON";
        else if (boss.type === 'dragon-meteor-boss') label = "MAGMA COLOSSUS";
        ctx.fillText(label, barX, 15);
    }

    projectilesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      if (p.projectileType === 'METEOR') {
          ctx.beginPath();
          ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
          ctx.fillRect(p.x + 2, p.y - 15, p.width - 4, 15);
          ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
          ctx.fillRect(p.x + 5, p.y - 25, p.width - 10, 10);
      }
      else if (p.projectileType === 'ELECTRIC_WEB') {
          ctx.save();
          ctx.translate(p.x + p.width/2, p.y + p.height/2);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath();
          ctx.arc(0, 0, p.width/2, 0, Math.PI * 2); ctx.arc(0, 0, p.width/4, 0, Math.PI * 2);
          ctx.moveTo(-p.width/2, 0); ctx.lineTo(p.width/2, 0);
          ctx.moveTo(0, -p.height/2); ctx.lineTo(0, p.height/2);
          ctx.stroke(); ctx.restore();
      } else if (p.projectileType === 'ELECTRIC_LASER') {
          ctx.shadowBlur = 10; ctx.shadowColor = p.color;
          ctx.fillRect(p.x, p.y, p.width, p.height); ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x + 1, p.y, p.width - 2, p.height);
      } else if (p.isBomb || p.projectileType === 'EXPLOSIVE') { 
          ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); 
      }
      else ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    
    powerUpsRef.current.forEach(p => {
        let sprite = SPRITE_POWERUP_RAPID;
        let color = COLOR_POWERUP_RAPID;
        if (p.type === 'SHIELD') { sprite = SPRITE_POWERUP_SHIELD; color = COLOR_POWERUP_SHIELD; }
        else if (p.type === 'BOMB') { sprite = SPRITE_POWERUP_BOMB; color = COLOR_POWERUP_BOMB; }
        else if (p.type === 'WEAPON_SPREAD') { sprite = SPRITE_POWERUP_SPREAD; color = COLOR_POWERUP_SPREAD; }
        else if (p.type === 'WEAPON_LASER') { sprite = SPRITE_POWERUP_LASER; color = COLOR_POWERUP_LASER; }
        else if (p.type === 'WEAPON_EXPLOSIVE') { sprite = SPRITE_POWERUP_EXPLOSIVE; color = COLOR_POWERUP_EXPLOSIVE; }
        else if (p.type === 'WEAPON_PIERCE') { sprite = SPRITE_POWERUP_PIERCE; color = COLOR_POWERUP_PIERCE; }
        else if (p.type === 'SIDEKICK') { sprite = SPRITE_POWERUP_SIDEKICK; color = COLOR_POWERUP_SIDEKICK; }
        else if (p.type === 'INVINCIBILITY') { sprite = SPRITE_POWERUP_INVINCIBILITY; color = COLOR_POWERUP_INVINCIBILITY; }
        else if (p.type === 'TIME_FREEZE') { sprite = SPRITE_POWERUP_TIME; color = COLOR_POWERUP_TIME; }
        else if (p.type === 'EXTRA_LIFE') { sprite = SPRITE_POWERUP_LIFE; color = COLOR_POWERUP_LIFE; }
        else if (p.type === 'DAMAGE_BOOST') { sprite = SPRITE_POWERUP_DAMAGE; color = COLOR_POWERUP_DAMAGE; }
        else if (p.type === 'SCORE_MULTIPLIER') { sprite = SPRITE_POWERUP_SCORE; color = COLOR_POWERUP_SCORE; }
        drawSprite(ctx, sprite, p.x, p.y, color, 3);
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.textAlign = 'center';
    floatingTextsRef.current.forEach(t => {
        ctx.globalAlpha = Math.min(1, t.life / 20);
        ctx.fillStyle = t.color;
        ctx.font = `${t.size}px "Press Start 2P"`;
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();

    ctx.strokeStyle = COLOR_NEON_BLUE;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 10);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 10);
    ctx.stroke();

    if (levelBannerTimerRef.current > 0 && gameState === GameState.PLAYING) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, levelBannerTimerRef.current / 30);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, CANVAS_HEIGHT/2 - 40, CANVAS_WIDTH, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`LEVEL ${gameStats.level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        if (gameStats.level % 5 === 0) {
             ctx.fillStyle = COLOR_NEON_RED; ctx.font = '15px "Press Start 2P"';
             ctx.fillText("BOSS APPROACHING", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
        }
        ctx.restore();
    }
  };

  const loop = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const deltaTime = timestamp - lastFrameTimeRef.current;
    const targetInterval = 1000 / 60; 
    if (deltaTime >= targetInterval) {
      updateLogic();
      drawFrame();
      lastFrameTimeRef.current = timestamp - (deltaTime % targetInterval);
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [updateLogic, drawFrame]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTouchInteract = (e: React.TouchEvent) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.START) return;
    keysRef.current[' '] = true;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    let targetX = (touch.clientX - rect.left) * scaleX;
    targetX -= playerRef.current.width / 2;
    targetX = Math.max(0, Math.min(CANVAS_WIDTH - playerRef.current.width, targetX));
    playerRef.current.x = targetX;
  };

  const handleTouchEndGlobal = () => {
    keysRef.current[' '] = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.START) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    let targetX = (e.clientX - rect.left) * scaleX;
    targetX -= playerRef.current.width / 2;
    targetX = Math.max(0, Math.min(CANVAS_WIDTH - playerRef.current.width, targetX));
    playerRef.current.x = targetX;
  };

  const handleMouseDown = () => {
    if (gameState === GameState.PLAYING || gameState === GameState.START) {
        keysRef.current[' '] = true;
    }
  };

  const handleMouseUp = () => {
    keysRef.current[' '] = false;
  };

  const handlePausePress = () => {
      setGameState(prev => {
        if (prev === GameState.PLAYING) return GameState.PAUSED;
        if (prev === GameState.PAUSED) return GameState.PLAYING;
        return prev;
      });
  };

  return (
    <div 
      className="relative w-full h-full flex justify-center items-center bg-black overflow-hidden"
      onTouchStart={handleTouchInteract}
      onTouchMove={handleTouchInteract}
      onTouchEnd={handleTouchEndGlobal}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-full object-contain pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
      {gameState === GameState.PLAYING && (
          <div className="absolute bottom-6 left-0 w-full flex justify-end px-6 md:hidden z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <button
                   className="w-10 h-10 bg-yellow-500/20 rounded-full border-2 border-yellow-500/50 backdrop-blur active:bg-yellow-500/40 text-yellow-100 text-[10px] font-bold flex items-center justify-center touch-manipulation"
                   onClick={handlePausePress}
                >
                  ||
                </button>
              </div>
          </div>
      )}
    </div>
  );
}
