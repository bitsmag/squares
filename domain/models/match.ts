import { Board } from './board';
import type { MatchEngine } from '../engine/matchEngine';
import type { Player } from './player';
import type { PlayerColor } from './colors';

export class Match {
  id: string;
  players: Player[];
  board: Board;
  engine: MatchEngine;
  duration: number;
  countdownDuration: number;
  active: boolean;
  startInitiated: boolean;

  constructor(id: string) {
    this.id = id;
    this.players = [];
    this.board = new Board();
    this.engine = undefined as unknown as MatchEngine;
    this.duration = this.board.getMatchDuration();
    this.countdownDuration = this.board.getCountdownDuration();
    this.active = false;
    this.startInitiated = false;
  }

  getId(): string {
    return this.id;
  }

  getPlayers(): Player[] {
    return this.players;
  }

  getPlayer(playerName: string): Player {
    const foundPlayer = this.players.find((p) => p.getName() === playerName);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getPlayerById(playerId: string): Player {
    const foundPlayer = this.players.find((p) => p.getId() === playerId);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getPlayerByColor(playerColor: PlayerColor): Player {
    const foundPlayer = this.players.find((p) => p.getColor() === playerColor);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getBoard(): Board {
    return this.board;
  }

  getEngine(): MatchEngine {
    return this.engine;
  }

  setEngine(engine: MatchEngine): void {
    this.engine = engine;
  }

  getDuration(): number {
    return this.duration;
  }

  getCountdownDuration(): number {
    return this.countdownDuration;
  }

  isActive(): boolean {
    return this.active;
  }

  isStartInitiated(): boolean {
    return this.startInitiated;
  }

  addPlayer(player: Player): void {
    const nameDuplicate = this.isNameInUse(player.getName());
    if (this.players.length >= 4) {
      throw new Error('matchIsFull');
    } else if (nameDuplicate) {
      throw new Error('nameInUse');
    } else {
      const startSquares = this.getBoard().getStartSquares();
      this.getBoard().getSquare(startSquares[player.getColor()]).setColor(player.getColor());
      this.players.push(player);
    }
  }

  removePlayer(player: Player): void {
    const index = this.players.indexOf(player);
    if (index > -1) {
      const startSquares = this.getBoard().getStartSquares();
      this.getBoard().getSquare(startSquares[player.getColor()]).setColor('');
      this.players.splice(index, 1);
    }
    if (this.players.length < 1) {
      this.destroy();
    }
  }

  durationDecrement(): void {
    this.duration--;
  }

  countdownDurationDecrement(): void {
    this.countdownDuration--;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  setStartInitiated(startInitiated: boolean): void {
    this.startInitiated = startInitiated;
  }

  updatePlayers(playerPositions: Record<PlayerColor, number>): void {
    (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
      const player = this.getPlayerByColor(color);
      player.setPosition(playerPositions[color]);
    });
  }

  updateBoard(playerPositions: Record<PlayerColor, number>): void {
    (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
      this.getBoard().getSquare(playerPositions[color]).setColor(color);
    });
  }

  updateSpecials(specials: { doubleSpeed: number[]; getPoints: number[] }): void {
    if (specials.doubleSpeed.length) {
      this.getBoard().getSquare(specials.doubleSpeed[0]).setDoubleSpeedSpecial(true);
    }
    if (specials.getPoints.length) {
      this.getBoard().getSquare(specials.getPoints[0]).setGetPointsSpecial(true);
    }
  }

  isNameInUse(name: string): boolean | undefined {
    let nameInUse: boolean | undefined;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].getName() === name) {
        nameInUse = true;
      }
    }
    return nameInUse;
  }

  destroy(): void {
    this.setActive(false);
  }
}
