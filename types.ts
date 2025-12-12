
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
  weapon: WeaponType;
  hasSidekicks: boolean;
  invincibleTimer: number;
  damageBoostTimer: number;
  scoreMultiplierTimer: number;
}

export type PowerUpType = 'RAPID_FIRE' | 'SHIELD' | 'BOMB' | 'WEAPON_LASER' | 'WEAPON_SPREAD' | 'WEAPON_EXPLOSIVE' | 'TIME_FREEZE' | 'EXTRA_LIFE' | 'WEAPON_PIERCE' | 'SIDEKICK' | 'INVINCIBILITY' | 'DAMAGE_BOOST' | 'SCORE_MULTIPLIER';

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Enemy extends Entity {
  id: string;
  row: number;
  col: number;
  type: 'dragon-red' | 'dragon-green' | 'dragon-gold' | 'dragon-boss' | 'dragon-mech-boss' | 'dragon-electric-boss' | 'dragon-hydra-boss' | 'dragon-sorcerer-boss' | 'dragon-meteor-boss' | 'dragon-chef-boss' | 'dragon-blue' | 'dragon-brown' | 'dragon-silver' | 'dragon-shadow' | 'dragon-orange' | 'dragon-emerald' | 'dragon-amethyst' | 'dragon-frost' | 'dragon-obsidian' | 'dragon-crimson';
  state: 'GRID' | 'DIVING' | 'RETURNING' | 'PREPARE_CHARGE'; 
  animationFrame: number;
  health: number;
  maxHealth: number;
  hitTimer?: number;
  diveStartX?: number;
  diveStartY?: number;
  fireBreathTimer?: number;
  chargeTargetX?: number;
  moveAngle?: number;
  // Sorcerer Laser Props
  sorcererLaserState?: 'OFF' | 'WARNING' | 'FIRING';
  sorcererLaserTimer?: number;
  // Meteor Boss Props
  meteorState?: 'OFF' | 'WARNING' | 'RAINING';
  meteorTimer?: number;
  meteorTargets?: number[];
}

export interface Projectile extends Entity {
  dy: number;
  dx?: number;
  color: string;
  isEnemy: boolean;
  isBomb?: boolean;
  projectileType?: WeaponType;
  rotation?: number;
  isPiercing?: boolean;
  hitEntityIds?: string[];
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity?: number;
}

export interface FloatingText extends Position {
  text: string;
  life: number;
  color: string;
  vy: number;
  size: number;
}

export interface BunkerPart extends Entity {
  damage: number;
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
