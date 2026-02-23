import type { Square } from './square';
import type { PlayerColor } from './colors';
import type { BoardSettings } from './boardTopology';

export class Board {
  private _squares: Square[];
  private _settings: BoardSettings;

  constructor(settings: BoardSettings, squares: Square[]) {
    this._settings = settings;
    this._squares = squares;
  }
  // Accessors
  get squares(): Square[] {
    return this._squares;
  }

  get width(): number {
    return this._settings.width;
  }

  get height(): number {
    return this._settings.height;
  }

  get startSquares(): { [color in PlayerColor]: number } {
    return this._settings.startSquares;
  }

  get matchDuration(): number {
    return this._settings.matchDurationSeconds;
  }

  get countdownDuration(): number {
    return this._settings.countdownSeconds;
  }

  get doubleSpeedDuration(): number {
    return this._settings.doubleSpeedDurationMs;
  }

  getSquare(id: number): Square {
    const found = this.squares.find((sq) => sq.id === id);
    if (!found) throw new Error('squareNotFoundById');
    return found;
  }

  getSquareByCoordinates(x: number, y: number): Square {
    const found = this.squares.find((sq) => sq.position.x === x && sq.position.y === y);
    if (!found) throw new Error('squareNotFoundByCoordinates');
    return found;
  }
}
