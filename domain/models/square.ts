import type { SquareColor } from './colors';

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

  // Backwards-compatible methods
  getId(): number {
    return this.id;
  }

  getEdgesTo(): number[] {
    return this.edgesTo;
  }

  getPosition(): { x: number; y: number } {
    return this.position;
  }

  getColor(): SquareColor {
    return this.color;
  }

  getDoubleSpeedSpecial(): boolean {
    return this.doubleSpeedSpecial;
  }

  // Kept for compatibility; consider migrating callers to `square.hasGetPointsSpecial`.
  getGetPointsSpecial(): boolean {
    return this.hasGetPointsSpecial;
  }

  isDfsVisited(): boolean {
    return this.dfsVisited;
  }

  setColor(color: SquareColor): void {
    this.color = color;
  }

  setDoubleSpeedSpecial(doubleSpeedSpecial: boolean): void {
    this.doubleSpeedSpecial = doubleSpeedSpecial;
  }

  setGetPointsSpecial(getPointsSpecial: boolean): void {
    this.hasGetPointsSpecial = getPointsSpecial;
  }

  setDfsVisited(visited: boolean): void {
    this.dfsVisited = visited;
  }
}
