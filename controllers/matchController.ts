import * as positionCalc from './matchTicker/positionCalc';
import * as circuitsCheck from './matchTicker/circuitsCheck';
import * as randomSpecials from './matchTicker/randomSpecials';
import * as matchSocketService from '../services/matchSocketService';
import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Match } from '../models/match';

type PlayerPositions = Record<string, number>;

export class MatchController {
  match: Match;

  constructor(match: Match) {
    this.match = match;
  }

  startMatch(): void {
    const countdownDurationDecrementInterval = setInterval(() => {
      if (!this.match.isActive()) {
        clearInterval(countdownDurationDecrementInterval);
      } else {
        this.match.countdownDurationDecrement();
        matchSocketService.sendCountdownEvent(this.match);
        if (this.match.getCountdownDuration() === 0) {
          clearInterval(countdownDurationDecrementInterval);
          this.timer(this.match.getDuration());
          this.matchTicker();
        }
      }
    }, 1000);
  }

  timer(_duration: number): void {
    const durationDecrementInterval = setInterval(() => {
      if (!this.match.isActive()) {
        clearInterval(durationDecrementInterval);
      } else {
        this.match.durationDecrement();
        if (this.match.getDuration() === 0) {
          clearInterval(durationDecrementInterval);
          this.match.setActive(false);
        }
      }
    }, 1000);
  }

  matchTicker(): void {
    let tickCount = 0;
    const tick = () => {
      tickCount++;
      if (!this.match.isActive()) {
        matchSocketService.sendMatchEndEvent(this.match);
        clearInterval(tickerInterval);
      } else {
        let playerPositions: PlayerPositions;
        if (tickCount % 2 !== 0) {
          const activeColors: string[] = [];
          const players = this.match.getPlayers();
          for (let i = 0; i < players.length; i++) {
            activeColors.push(players[i].getColor());
          }
          playerPositions = positionCalc.calculateNewPlayerPositions(this.match, activeColors);
        } else {
          const doubleSpeedColors: string[] = [];
          const players = this.match.getPlayers();
          for (let i = 0; i < players.length; i++) {
            if (players[i].getDoubleSpeedSpecial()) {
              doubleSpeedColors.push(players[i].getColor());
            }
          }
          playerPositions = positionCalc.calculateNewPlayerPositions(this.match, doubleSpeedColors);
        }

        this.match.updatePlayers(playerPositions);
        this.match.updateBoard(playerPositions);

        const playerPoints: Record<string, any[]> = circuitsCheck.getPlayerPoints(this.match);

        const clearSpecials: any[] = [];
        Object.keys(playerPositions).forEach((color) => {
          try {
            const playerPositionSquare = this.match.getBoard().getSquare(playerPositions[color]);
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
              this.match.getPlayerByColor(color).startDoubleSpeedSpecial(this.match.getBoard().getDoubleSpeedDuration());
              playerPositionSquare.setDoubleSpeedSpecial(false);
              clearSpecials.push(playerPositionSquare.getId());
            }
          } catch (err) {
            socketErrorHandler(this.match, err, 'match.Controller.matchTicker()');
          }
        });

        Object.keys(playerPositions).forEach((color) => {
          try {
            this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
          } catch (err) {
            socketErrorHandler(this.match, err, 'match.Controller.matchTicker()');
          }
        });

        const clearSquares: any[] = [];
        Object.keys(playerPositions).forEach((color) => {
          for (let i = 0; i < playerPoints[color].length; i++) {
            clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
            playerPoints[color][i].setColor('');
          }
        });

        const specials = randomSpecials.getSpecials(this.match);
        this.match.updateSpecials(specials);

        matchSocketService.sendUpdateBoardEvent(this.match, specials);
        matchSocketService.sendClearSquaresEvent(this.match, clearSquares, clearSpecials);
        matchSocketService.sendUpdateScoreEvent(this.match);
      }
    };
    const tickerInterval = setInterval(tick, 250);
  }
}

// Keep CommonJS compatibility for existing require() usages
module.exports = { MatchController } as any;
