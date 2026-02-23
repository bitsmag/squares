import * as positionCalc from './utilities/positionCalc';
import type { PlayerPositions as RawPlayerPositions } from './utilities/positionCalc';
import type { PlayerColor } from '../models/player';
import * as circuitsCheck from './utilities/circuitsCheck';
import * as randomSpecials from './utilities/randomSpecials';
import type { Match } from '../models/match';
import type { ClearedSquare, MatchEventPublisher, MatchSpecials } from './matchEvents';

type PlayerPositions = RawPlayerPositions;

export class MatchEngine {
  match: Match;
  private publisher: MatchEventPublisher;

  constructor(match: Match, publisher: MatchEventPublisher) {
    this.match = match;
    this.publisher = publisher;
  }

  startMatch(): void {
    const countdownDurationDecrementInterval = setInterval(() => {
      if (!this.match.isActive()) {
        clearInterval(countdownDurationDecrementInterval);
      } else {
        this.match.countdownDurationDecrement();
        this.publisher.publish({ type: 'COUNTDOWN_TICKED', match: this.match });
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
        this.publisher.publish({ type: 'MATCH_ENDED', match: this.match });
        clearInterval(tickerInterval);
      } else {
        let playerPositions: PlayerPositions;
        try {
          if (tickCount % 2 !== 0) {
            const activeColors: PlayerColor[] = [];
            const players = this.match.getPlayers();
            for (let i = 0; i < players.length; i++) {
              activeColors.push(players[i].getColor());
            }
            playerPositions = positionCalc.calculateNewPlayerPositions(this.match, activeColors);
          } else {
            const doubleSpeedColors: PlayerColor[] = [];
            const players = this.match.getPlayers();
            for (let i = 0; i < players.length; i++) {
              if (players[i].getDoubleSpeedSpecial()) {
                doubleSpeedColors.push(players[i].getColor());
              }
            }
            playerPositions = positionCalc.calculateNewPlayerPositions(
              this.match,
              doubleSpeedColors
            );
          }
        } catch (err) {
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          return;
        }

        // Only propagate positions that are resolved numbers
        const sanitizedPositions: Record<PlayerColor, number> = {} as Record<PlayerColor, number>;
        (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
          const pos = playerPositions[color];
          if (typeof pos === 'number') {
            sanitizedPositions[color] = pos;
          }
        });

        try {
          this.match.updatePlayers(sanitizedPositions);
          this.match.updateBoard(sanitizedPositions);
        } catch (err) {
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          return;
        }

        let playerPoints;
        try {
          playerPoints = circuitsCheck.getPlayerPoints(this.match);
        } catch (err) {
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          return;
        }

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
            this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          }
        });

        (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
          try {
            this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
          } catch (err) {
            this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          }
        });

        const clearSquares: ClearedSquare[] = [];
        (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
          for (let i = 0; i < playerPoints[color].length; i++) {
            clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
            playerPoints[color][i].setColor('');
          }
        });

        let specials: MatchSpecials;
        try {
          specials = randomSpecials.getSpecials(this.match);
          this.match.updateSpecials(specials);
        } catch (err) {
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
          return;
        }

        this.publisher.publish({
          type: 'TICK_PROCESSED',
          match: this.match,
          specials,
          clearSquares,
          clearSpecials,
        });
      }
    };
    const tickerInterval = setInterval(tick, 250);
  }
}
