import * as boardModule from './board';
import * as matchController from '../controllers/matchController';
import * as matchesManager from './matchesManager';
import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Player } from './player';
import type { Board } from './board';
import type { MatchController } from '../controllers/matchController';

export class Match {
  id: string;
  players: Player[];
  board: Board;
  controller: MatchController;
  duration: number;
  countdownDuration: number;
  active: boolean;

  constructor() {
    this.id = '';
    this.players = [];
    this.board = new boardModule.Board();
    this.controller = new (matchController as any).MatchController(this);
    this.duration = this.board.getMatchDuration();
    this.countdownDuration = this.board.getCountdownDuration();
    this.active = false;

    this.id = createUniqueId();
    (matchesManager as any).manager.addMatch(this);
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

  getPlayerByColor(playerColor: string): Player {
    const foundPlayer = this.players.find((p) => p.getColor() === playerColor);
    if (!foundPlayer) {
      throw new Error('playerNotFound');
    }
    return foundPlayer;
  }

  getMatchCreator(): Player {
    if (this.players.length === 0) {
      throw new Error('matchCreatorNotFound');
    }
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].isMatchCreator()) {
        return this.players[i];
      }
    }
    throw new Error('matchCreatorNotFound');
  }

  getBoard(): Board {
    return this.board;
  }

  getController(): MatchController {
    return this.controller;
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

  updatePlayers(playerPositions: any): void {
    Object.keys(playerPositions).forEach((color) => {
      try {
        const player = this.getPlayerByColor(color);
        player.setPosition(playerPositions[color]);
      } catch (err) {
        socketErrorHandler(this, err, 'match.updatePlayers()');
      }
    });
  }

  updateBoard(playerPositions: any, _specials?: any): void {
    Object.keys(playerPositions).forEach((color) => {
      try {
        this.getBoard().getSquare(playerPositions[color]).setColor(color);
      } catch (err) {
        socketErrorHandler(this, err, 'match.updateBoard()');
      }
    });
  }

  updateSpecials(specials: any): void {
    if (specials.doubleSpeed.length) {
      try {
        this.getBoard().getSquare(specials.doubleSpeed[0]).setDoubleSpeedSpecial(true);
      } catch (err) {
        socketErrorHandler(this, err, 'match.updateSpecials()');
      }
    }
    if (specials.getPoints.length) {
      try {
        this.getBoard().getSquare(specials.getPoints[0]).setGetPointsSpecial(true);
      } catch (err) {
        socketErrorHandler(this, err, 'match.updateSpecials()');
      }
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
    (matchesManager as any).manager.removeMatch(this);
  }
}

function createUniqueId(): string {
  let timestamp: string,
    matchId: string,
    duplicate: boolean,
    unique = false;

  while (!unique) {
    timestamp = Date.now().toString();
    matchId = 'x' + timestamp.substring(timestamp.length - 4, timestamp.length);

    duplicate = false;
    for (let i = 0; i < (matchesManager as any).manager.getMatches().length; i++) {
      if ((matchesManager as any).manager.getMatches()[i].getId() === matchId) {
        duplicate = true;
      }
    }
    if (!duplicate) {
      unique = true;
    }
  }
  return matchId;
}

// CommonJS compatibility
module.exports = { Match } as any;
