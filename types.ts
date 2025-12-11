
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  width: number;
  height: number;
  active: boolean;
}

export type WeaponType = 'DEFAULT' | 'LASER' | 'SPREAD' | 'EXPLOSIVE' | 'ELECTRIC_WEB' | 'ELECTRIC_LASER' | 'METEOR' | 'PIERCING';

export interface Player extends Entity {
  cooldown: number;
  shieldActive: boolean;
  rapidFireTimer: number;
  weapon: WeaponType; // New property for current weapon
  // New props
  hasSidekicks: boolean;
  invincibleTimer: number;
  damageBoostTimer: number; // New: x2 Damage
  scoreMultiplierTimer: number; // New: x2 Score
}

export type PowerUpType = 'RAPID_FIRE' | 'SHIELD' | 'BOMB' | 'WEAPON_LASER' | 'WEAPON_SPREAD' | 'WEAPON_EXPLOSIVE' | 'TIME_FREEZE' | 'EXTRA_LIFE' | 'WEAPON_PIERCE' | 'SIDEKICK' | 'INVINCIBILITY' | 'DAMAGE_BOOST' | 'SCORE_MULTIPLIER';

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Enemy extends Entity {
  id: string; // Added ID for piercing shot tracking
  row: number;
  col: number;
  type: 'dragon-red' | 'dragon-green' | 'dragon-gold' | 'dragon-boss' | 'dragon-mech-boss' | 'dragon-electric-boss' | 'dragon-hydra-boss' | 'dragon-sorcerer-boss' | 'dragon-meteor-boss' | 'dragon-chef-boss' | 'dragon-blue' | 'dragon-brown' | 'dragon-silver' | 'dragon-shadow' | 'dragon-orange' | 'dragon-emerald' | 'dragon-amethyst' | 'dragon-frost' | 'dragon-obsidian' | 'dragon-crimson';
  state: 'GRID' | 'DIVING' | 'RETURNING' | 'PREPARE_CHARGE'; // Added PREPARE_CHARGE
  animationFrame: number;
  health: number;
  maxHealth: number;
  hitTimer?: number; // Visual flash when hit
  diveStartX?: number; // For sine wave calculations
  diveStartY?: number;
  fireBreathTimer?: number; // For the continuous fire attack
  chargeTargetX?: number; // For Hydra charge targeting
  moveAngle?: number; // For Sorcerer circular movement
  // Sorcerer Laser Props
  sorcererLaserState?: 'OFF' | 'WARNING' | 'FIRING';
  sorcererLaserTimer?: number;
  // Meteor Boss Props
  meteorState?: 'OFF' | 'WARNING' | 'RAINING';
  meteorTimer?: number;
  meteorTargets?: number[]; // X coordinates for rain
}

export interface Projectile extends Entity {
  dy: number;
  dx?: number; // Added horizontal velocity for spread shots
  color: string;
  isEnemy: boolean;
  isBomb?: boolean; // Explodes on ground contact (Enemy) OR impact (Player)
  projectileType?: WeaponType; // To track behavior like explosions
  rotation?: number; // For rotating projectiles like the web
  // Piercing props
  isPiercing?: boolean;
  hitEntityIds?: string[]; // IDs of enemies already hit by this projectile
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  maxLife: number; // Added for opacity calculation
  color: string;
  size: number;
  gravity?: number; // Added for physics feel
}

export interface FloatingText extends Position {
  text: string;
  life: number; // Frames to live
  color: string;
  vy: number; // Float speed
  size: number;
}

export interface BunkerPart extends Entity {
  damage: number; // 0 to 3
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

export interface GameStats {
  score: number;
  lives: number;
  level: number;
}
