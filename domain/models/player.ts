import { randomUUID } from 'crypto';
import type { Match } from './match';
import type { PlayerColor } from './colors';
import type { Direction } from './direction';

export class Player {
  id: string;
  name: string;
  color: PlayerColor;
  position: number;
  activeDirection: Direction | null;
  score: number;
  doubleSpeedSpecial: boolean;
  host: boolean;

  constructor(name: string, match: Match, host: boolean) {
    this.id = randomUUID();
    this.name = name;
    const unusedColor = getUnusedColor(match);
    this.color = unusedColor;
    this.position = match.getBoard().getStartSquares()[unusedColor];
    this.activeDirection = null;
    this.score = 0;
    this.doubleSpeedSpecial = false;
    this.host = host;

    if (!match.isActive()) {
      match.addPlayer(this);
    } else {
      throw new Error('matchIsActive');
    }
  }

  getName(): string {
    return this.name;
  }

  getId(): string {
    return this.id;
  }

  getColor(): PlayerColor {
    return this.color;
  }

  getPosition(): number {
    return this.position;
  }

  getActiveDirection(): Direction | null {
    return this.activeDirection;
  }

  getScore(): number {
    return this.score;
  }

  getDoubleSpeedSpecial(): boolean {
    return this.doubleSpeedSpecial;
  }

  isHost(): boolean {
    return this.host;
  }

  setActiveDirection(dir: Direction): void {
    this.activeDirection = dir;
  }

  setPosition(pos: number): void {
    this.position = pos;
  }

  increaseScore(points: number): void {
    this.score += points;
  }

  startDoubleSpeedSpecial(_duration?: number): void {
    if (!this.doubleSpeedSpecial) {
      this.doubleSpeedSpecial = true;
      const duration = _duration || this.getDefaultDoubleSpeedDuration();
      setTimeout(() => {
        this.doubleSpeedSpecial = false;
      }, duration);
    }
  }

  private getDefaultDoubleSpeedDuration(): number {
    return 5000;
  }
}

function getUnusedColor(match: Match): PlayerColor {
  const unusedColors: PlayerColor[] = ['blue', 'orange', 'green', 'red'];
  const players = match.getPlayers();

  for (let i = 0; i < players.length; i++) {
    const index = unusedColors.indexOf(players[i].getColor());
    if (index > -1) {
      unusedColors.splice(index, 1);
    }
  }

  if (unusedColors.length > 0) {
    return unusedColors[0];
  } else {
    throw new Error('matchIsFull');
  }
}
