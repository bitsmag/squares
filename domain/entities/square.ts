import type { SquareColor } from '../valueObjects/colors';

export class Square {
  private _id: number;
  private _edgesTo: number[];
  private _position: { x: number; y: number };
  private _color: SquareColor;
  private _doubleSpeedSpecial: boolean;
  private _hasGetPointsSpecial: boolean;
  private _dfsVisited: boolean;

  constructor(squareId: number, edgesTo: number[], position: { x: number; y: number }) {
    this._id = squareId;
    this._edgesTo = edgesTo;
    this._position = position;
    this._color = '';
    this._doubleSpeedSpecial = false;
    this._hasGetPointsSpecial = false;
    this._dfsVisited = false;
  }

  // Accessors
  get id(): number {
    return this._id;
  }

  get edgesTo(): number[] {
    return this._edgesTo;
  }

  get position(): { x: number; y: number } {
    return this._position;
  }

  get color(): SquareColor {
    return this._color;
  }

  set color(color: SquareColor) {
    this._color = color;
  }

  get doubleSpeedSpecial(): boolean {
    return this._doubleSpeedSpecial;
  }

  set doubleSpeedSpecial(enabled: boolean) {
    this._doubleSpeedSpecial = enabled;
  }

  get hasGetPointsSpecial(): boolean {
    return this._hasGetPointsSpecial;
  }

  set hasGetPointsSpecial(enabled: boolean) {
    this._hasGetPointsSpecial = enabled;
  }

  get dfsVisited(): boolean {
    return this._dfsVisited;
  }

  set dfsVisited(visited: boolean) {
    this._dfsVisited = visited;
  }
}
