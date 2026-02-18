import type { Match } from './match';

export class Player {
  name: string;
  color: string;
  position: number;
  activeDirection: string | null;
  score: number;
  doubleSpeedSpecial: boolean;
  matchCreator: boolean;
  socket: any;

  constructor(name: string, match: Match, matchCreator: boolean) {
    this.name = name;
    this.color = '';
    this.position = 0;
    this.activeDirection = null;
    this.score = 0;
    this.doubleSpeedSpecial = false;
    this.matchCreator = matchCreator;
    this.socket = null;

    if (!match.isActive()) {
      const unusedColor = getUnusedColor(match);
      this.color = unusedColor;
      this.position = match.getBoard().getStartSquares()[unusedColor];
      match.addPlayer(this);
    } else {
      throw new Error('matchIsActive');
    }
  }

  getName(): string {
    return this.name;
  }

  getColor(): string {
    return this.color;
  }

  getPosition(): number {
    return this.position;
  }

  getActiveDirection(): string | null {
    return this.activeDirection;
  }

  getScore(): number {
    return this.score;
  }

  getDoubleSpeedSpecial(): boolean {
    return this.doubleSpeedSpecial;
  }

  isMatchCreator(): boolean {
    return this.matchCreator;
  }

  getSocket(): any {
    return this.socket;
  }

  setActiveDirection(dir: string): void {
    if (dir === 'left' || dir === 'right' || dir === 'up' || dir === 'down') {
      this.activeDirection = dir;
    }
  }

  setSocket(socket: any): void {
    this.socket = socket;
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

  // helper to retrieve a safe default when migrating from JS where board provided it
  private getDefaultDoubleSpeedDuration(): number {
    return 5000;
  }
}

function getUnusedColor(match: Match): string {
  const unusedColors = ['blue', 'orange', 'green', 'red'];
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
