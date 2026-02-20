import * as positionCalc from './utilities/positionCalc';
import type { PlayerColor, PlayerPositions as RawPlayerPositions } from './utilities/positionCalc';
import * as circuitsCheck from './utilities/circuitsCheck';
import * as randomSpecials from './utilities/randomSpecials';
import type { Match } from '../models/match';

export type MatchEmitter = {
  sendCountdownEvent(match: Match): void;
  sendMatchEndEvent(match: Match): void;
  sendUpdateBoardEvent(match: Match, specials: unknown): void;
  sendClearSquaresEvent(match: Match, clearSquares: unknown[], clearSpecials: number[]): void;
  sendUpdateScoreEvent(match: Match): void;
  sendFatalErrorEvent(match: Match): void;
};

export type MatchErrorHandler = (match: Match | undefined, err: unknown) => void;

type PlayerPositions = RawPlayerPositions;

export class MatchEngine {
  match: Match;
  private emitter: MatchEmitter;
  private errorHandler: MatchErrorHandler;

  constructor(match: Match, emitter: MatchEmitter, errorHandler: MatchErrorHandler) {
    this.match = match;
    this.emitter = emitter;
    this.errorHandler = errorHandler;
  }

  startMatch(): void {
    const countdownDurationDecrementInterval = setInterval(() => {
      if (!this.match.isActive()) {
        clearInterval(countdownDurationDecrementInterval);
      } else {
        this.match.countdownDurationDecrement();
        this.emitter.sendCountdownEvent(this.match);
        if (this.match.getCountdownDuration() === 0) {
          clearInterval(countdownDurationDecrementInterval);
          this.timer();
          this.matchTicker();
        }
      }
    }, 1000);
  }

  timer(): void {
    const durationDecrementInterval = setInterval(() => {
      if (!this.match.isActive()) {
        clearInterval(durationDecrementInterval);
      } else {
        this.match.durationDecrement();
        if (this.match.getDuration() === 0) {
          clearInterval(durationDecrementInterval);
          this.match.setActive(false);
          // Cleanup finished match so it is removed from the singleton registry
          this.match.destroy();
        }
      }
    }, 1000);
  }

  matchTicker(): void {
    let tickCount = 0;
    const tick = () => {
      tickCount++;
      if (!this.match.isActive()) {
        this.emitter.sendMatchEndEvent(this.match);
        clearInterval(tickerInterval);
      } else {
        let playerPositions: PlayerPositions;
        if (tickCount % 2 !== 0) {
          const activeColors: PlayerColor[] = [];
          const players = this.match.getPlayers();
          for (let i = 0; i < players.length; i++) {
            activeColors.push(players[i].getColor() as PlayerColor);
          }
          playerPositions = positionCalc.calculateNewPlayerPositions(this.match, activeColors);
        } else {
          const doubleSpeedColors: PlayerColor[] = [];
          const players = this.match.getPlayers();
          for (let i = 0; i < players.length; i++) {
            if (players[i].getDoubleSpeedSpecial()) {
              doubleSpeedColors.push(players[i].getColor() as PlayerColor);
            }
          }
          playerPositions = positionCalc.calculateNewPlayerPositions(this.match, doubleSpeedColors);
        }

        // Only propagate positions that are resolved numbers
        const sanitizedPositions: Record<PlayerColor, number> = {} as Record<PlayerColor, number>;
        (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
          const pos = playerPositions[color];
          if (typeof pos === 'number') {
            sanitizedPositions[color] = pos;
          }
        });

        this.match.updatePlayers(sanitizedPositions);
        this.match.updateBoard(sanitizedPositions);

        const playerPoints = circuitsCheck.getPlayerPoints(this.match);

        const clearSpecials: number[] = [];
        (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
          try {
            const playerPositionSquare = this.match.getBoard().getSquare(sanitizedPositions[color]);
            if (playerPositionSquare.getGetPointsSpecial()) {
              for (let i = 0; i < this.match.getBoard().getSquares().length; i++) {
                const square = this.match.getBoard().getSquares()[i];
                if (square.getColor() === color) {
                  playerPoints[color].push(square);
                }
              }
              playerPositionSquare.setGetPointsSpecial(false);
              clearSpecials.push(playerPositionSquare.getId());
            }
            if (playerPositionSquare.getDoubleSpeedSpecial()) {
              this.match
                .getPlayerByColor(color)
                .startDoubleSpeedSpecial(this.match.getBoard().getDoubleSpeedDuration());
              playerPositionSquare.setDoubleSpeedSpecial(false);
              clearSpecials.push(playerPositionSquare.getId());
            }
          } catch (err) {
            this.errorHandler(this.match, err);
          }
        });

        (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
          try {
            this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
          } catch (err) {
            this.errorHandler(this.match, err);
          }
        });

        const clearSquares: { id: number; color: PlayerColor }[] = [];
        (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
          for (let i = 0; i < playerPoints[color].length; i++) {
            clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
            playerPoints[color][i].setColor('');
          }
        });

        const specials = randomSpecials.getSpecials(this.match);
        this.match.updateSpecials(specials);

        this.emitter.sendUpdateBoardEvent(this.match, specials);
        this.emitter.sendClearSquaresEvent(this.match, clearSquares, clearSpecials);
        this.emitter.sendUpdateScoreEvent(this.match);
      }
    };
    const tickerInterval = setInterval(tick, 250);
  }
}

// Keep CommonJS compatibility for existing require() usages
module.exports = { MatchEngine };
