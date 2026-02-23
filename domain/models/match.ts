import { Board } from './board';
import type { MatchEngine } from '../engine/matchEngine';
import type { Player } from './player';
import type { PlayerColor } from './colors';

export class Match {
  private _id: string;
  private _players: Player[];
  private _board: Board;
  private _engine: MatchEngine;
  private _duration: number;
  private _countdownDuration: number;
  private _active: boolean;
  private _startInitiated: boolean;

  constructor(id: string) {
    this._id = id;
    this._players = [];
    this._board = new Board();
    this._engine = undefined as unknown as MatchEngine;
    this._duration = this._board.matchDuration;
    this._countdownDuration = this._board.countdownDuration;
    this._active = false;
    this._startInitiated = false;
  }

  // Accessors
  get id(): string {
    return this._id;
  }

  get players(): Player[] {
    return this._players;
  }

  get board(): Board {
    return this._board;
  }

  get engine(): MatchEngine {
    return this._engine;
  }

  set engine(engine: MatchEngine) {
    this._engine = engine;
  }

  get duration(): number {
    return this._duration;
  }

  get countdownDuration(): number {
    return this._countdownDuration;
  }

  get active(): boolean {
    return this._active;
  }

  set active(active: boolean) {
    this._active = active;
  }

  get startInitiated(): boolean {
    return this._startInitiated;
  }

  set startInitiated(startInitiated: boolean) {
    this._startInitiated = startInitiated;
  }

  getPlayer(playerName: string): Player {
    const foundPlayer = this.players.find((p) => p.name === playerName);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getPlayerById(playerId: string): Player {
    const foundPlayer = this.players.find((p) => p.id === playerId);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getPlayerByColor(playerColor: PlayerColor): Player {
    const foundPlayer = this.players.find((p) => p.color === playerColor);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  addPlayer(player: Player): void {
    const nameDuplicate = this.isNameInUse(player.name);
    if (this.players.length >= 4) {
      throw new Error('matchIsFull');
    } else if (nameDuplicate) {
      throw new Error('nameInUse');
    } else {
      const startSquares = this.board.startSquares;
      this.board.getSquare(startSquares[player.color]).color = player.color;
      this.players.push(player);
    }
  }

  removePlayer(player: Player): void {
    const index = this.players.indexOf(player);
    if (index > -1) {
      const startSquares = this.board.startSquares;
      this.board.getSquare(startSquares[player.color]).color = '';
      this.players.splice(index, 1);
    }
    if (this.players.length < 1) {
      this.destroy();
    }
  }

  durationDecrement(): void {
    this._duration--;
  }

  countdownDurationDecrement(): void {
    this._countdownDuration--;
  }

  updatePlayers(playerPositions: Record<PlayerColor, number>): void {
    (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
      const player = this.getPlayerByColor(color);
      player.position = playerPositions[color];
    });
  }

  updateBoard(playerPositions: Record<PlayerColor, number>): void {
    (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
      this.board.getSquare(playerPositions[color]).color = color;
    });
  }

  updateSpecials(specials: { doubleSpeed: number[]; getPoints: number[] }): void {
    if (specials.doubleSpeed.length) {
      this.board.getSquare(specials.doubleSpeed[0]).doubleSpeedSpecial = true;
    }
    if (specials.getPoints.length) {
      this.board.getSquare(specials.getPoints[0]).hasGetPointsSpecial = true;
    }
  }

  isNameInUse(name: string): boolean | undefined {
    let nameInUse: boolean | undefined;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].name === name) {
        nameInUse = true;
      }
    }
    return nameInUse;
  }

  destroy(): void {
    this.active = false;
  }
}
