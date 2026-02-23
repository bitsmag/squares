import { randomUUID } from 'crypto';
import type { PlayerColor } from './colors';
import type { Direction } from './direction';

export class Player {
  private _id: string;
  private _name: string;
  private _color: PlayerColor;
  private _position: number;
  private _activeDirection: Direction | null;
  private _score: number;
  private _doubleSpeedSpecial: boolean;
  private _host: boolean;

  constructor(name: string, color: PlayerColor, position: number, host: boolean) {
    this._id = randomUUID();
    this._name = name;
    this._color = color;
    this._position = position;
    this._activeDirection = null;
    this._score = 0;
    this._doubleSpeedSpecial = false;
    this._host = host;
  }

  // Accessors
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get color(): PlayerColor {
    return this._color;
  }

  get position(): number {
    return this._position;
  }

  set position(pos: number) {
    this._position = pos;
  }

  get activeDirection(): Direction | null {
    return this._activeDirection;
  }

  set activeDirection(dir: Direction | null) {
    this._activeDirection = dir;
  }

  get score(): number {
    return this._score;
  }

  get doubleSpeedSpecial(): boolean {
    return this._doubleSpeedSpecial;
  }

  set doubleSpeedSpecial(enabled: boolean) {
    this._doubleSpeedSpecial = enabled;
  }

  get host(): boolean {
    return this._host;
  }

  increaseScore(points: number): void {
    this._score += points;
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
