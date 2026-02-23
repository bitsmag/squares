import * as squareModule from './square';
import type { Square } from './square';
import type { PlayerColor } from './colors';

export class Board {
  private _squares: Square[];
  private _width: number;
  private _height: number;
  private _startSquares: { [color in PlayerColor]: number };
  private _matchDuration: number;
  private _countdownDuration: number;
  private _doubleSpeedDuration: number;

  constructor() {
    this._squares = [];
    this._width = 9;
    this._height = 9;
    this._startSquares = { blue: 0, orange: 8, green: 72, red: 80 };
    this._matchDuration = 60;
    this._countdownDuration = 4;
    this._doubleSpeedDuration = 5000;

    // Programmatically generate all squares with their adjacency edges
    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const id = y * this._width + x;
        const edgesTo: number[] = [];
        if (x > 0) edgesTo.push(id - 1); // left
        if (y > 0) edgesTo.push(id - this._width); // up
        if (x < this._width - 1) edgesTo.push(id + 1); // right
        if (y < this._height - 1) edgesTo.push(id + this._width); // down
        this._squares.push(new squareModule.Square(id, edgesTo, { x, y }));
      }
    }
  }

  // Accessors
  get squares(): Square[] {
    return this._squares;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get startSquares(): { [color in PlayerColor]: number } {
    return this._startSquares;
  }

  get matchDuration(): number {
    return this._matchDuration;
  }

  get countdownDuration(): number {
    return this._countdownDuration;
  }

  get doubleSpeedDuration(): number {
    return this._doubleSpeedDuration;
  }

  // Backwards-compatible methods
  getSquares(): Square[] {
    return this.squares;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getStartSquares(): { [color in PlayerColor]: number } {
    return this.startSquares;
  }

  getMatchDuration(): number {
    return this.matchDuration;
  }

  getCountdownDuration(): number {
    return this.countdownDuration;
  }

  getDoubleSpeedDuration(): number {
    return this.doubleSpeedDuration;
  }

  getSquare(id: number): Square {
    const found = this.squares.find((sq) => sq.getId() === id);
    if (!found) throw new Error('squareNotFoundById');
    return found;
  }

  getSquareByCoordinates(x: number, y: number): Square {
    const found = this.squares.find((sq) => sq.getPosition().x === x && sq.getPosition().y === y);
    if (!found) throw new Error('squareNotFoundByCoordinates');
    return found;
  }
}
