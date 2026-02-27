import * as positionCalc from './utilities/positionCalc';
import type { PlayerPositions as RawPlayerPositions } from './utilities/positionCalc';
import * as circuitsCheck from './utilities/circuitsCheck';
import * as randomSpecials from './utilities/randomSpecials';
import type { Match } from '../models/match';
import type { PlayerColor } from '../models/colors';
import type { ClearedSquare, MatchEventPublisher, MatchSpecials } from './matchEvents';

type PlayerPositions = RawPlayerPositions;

type TickResult = {
  specials: MatchSpecials;
  clearSquares: ClearedSquare[];
  clearSpecials: number[];
};

export class MatchEngine {
  match: Match;
  private publisher: MatchEventPublisher;

  constructor(match: Match, publisher: MatchEventPublisher) {
    this.match = match;
    this.publisher = publisher;
  }

  startMatch(): void {
    const countdownDurationDecrementInterval = setInterval(() => {
      if (!this.match.active) {
        clearInterval(countdownDurationDecrementInterval);
      } else {
        this.match.countdownDurationDecrement();
        this.publisher.publish({ type: 'COUNTDOWN_TICKED', match: this.match });
        if (this.match.countdownDuration === 0) {
          clearInterval(countdownDurationDecrementInterval);
          this.timer();
          this.matchTicker();
        }
      }
    }, 1000);
  }

  timer(): void {
    const durationDecrementInterval = setInterval(() => {
      if (!this.match.active) {
        clearInterval(durationDecrementInterval);
      } else {
        this.match.durationDecrement();
        if (this.match.duration === 0) {
          clearInterval(durationDecrementInterval);
          this.match.active = false;
          this.publisher.publish({ type: 'MATCH_DURATION_EXPIRED', match: this.match });
        }
      }
    }, 1000);
  }

  matchTicker(): void {
    let tickCount = 0;
    const tick = () => {
      tickCount++;
      if (!this.match.active) {
        this.publisher.publish({ type: 'MATCH_ENDED', match: this.match });
        clearInterval(tickerInterval);
      } else {
        try {
          const result = this.computeTick(tickCount);

          this.publisher.publish({
            type: 'TICK_PROCESSED',
            match: this.match,
            specials: result.specials,
            clearSquares: result.clearSquares,
            clearSpecials: result.clearSpecials,
          });
        } catch (err) {
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
        }
      }
    };
    const tickerInterval = setInterval(tick, 250);
  }

  private computeTick(tickCount: number): TickResult {
    const movingColors = this.getMovingColorsForTick(tickCount);
    const playerPositions = this.calculatePlayerPositionsForTick(movingColors);
    const sanitizedPositions = this.sanitizePlayerPositions(playerPositions);
    this.applyPlayerPositions(sanitizedPositions);

    const playerPoints = this.calculatePlayerPoints();
    const { clearSquares, clearSpecials } = this.applyPointsAndSpecials(
      sanitizedPositions,
      playerPoints
    );

    const specials = this.applyRandomSpecials();
    return { specials, clearSquares, clearSpecials };
  }

  private getMovingColorsForTick(tickCount: number): PlayerColor[] {
    const players = this.match.players;
    if (tickCount % 2 !== 0) {
      const activeColors: PlayerColor[] = [];
      for (let i = 0; i < players.length; i++) {
        activeColors.push(players[i].color as PlayerColor);
      }
      return activeColors;
    }

    const doubleSpeedColors: PlayerColor[] = [];
    for (let i = 0; i < players.length; i++) {
      if (players[i].doubleSpeedSpecial) {
        doubleSpeedColors.push(players[i].color as PlayerColor);
      }
    }
    return doubleSpeedColors;
  }

  private calculatePlayerPositionsForTick(movingColors: PlayerColor[]): PlayerPositions {
    return positionCalc.calculateNewPlayerPositions(this.match, movingColors);
  }

  private sanitizePlayerPositions(
    playerPositions: PlayerPositions
  ): Record<PlayerColor, number> {
    const sanitizedPositions: Record<PlayerColor, number> = {} as Record<PlayerColor, number>;
    (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
      const pos = playerPositions[color];
      if (typeof pos === 'number') {
        sanitizedPositions[color] = pos;
      }
    });
    return sanitizedPositions;
  }

  private applyPlayerPositions(sanitizedPositions: Record<PlayerColor, number>): boolean {
    this.match.updatePlayers(sanitizedPositions);
    this.match.updateBoard(sanitizedPositions);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private calculatePlayerPoints(): any {
    return circuitsCheck.getPlayerPoints(this.match);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyPointsAndSpecials(
    sanitizedPositions: Record<PlayerColor, number>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playerPoints: any
  ): { clearSquares: ClearedSquare[]; clearSpecials: number[] } {
    const clearSpecials: number[] = [];
    (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
      const playerPositionSquare = this.match.board.getSquare(sanitizedPositions[color]);
      if (playerPositionSquare.hasGetPointsSpecial) {
        for (let i = 0; i < this.match.board.squares.length; i++) {
          const square = this.match.board.squares[i];
          if (square.color === color) {
            playerPoints[color].push(square);
          }
        }
        playerPositionSquare.hasGetPointsSpecial = false;
        clearSpecials.push(playerPositionSquare.id);
      }
      if (playerPositionSquare.doubleSpeedSpecial) {
        this.match
          .getPlayerByColor(color)
          .startDoubleSpeedSpecial(this.match.board.doubleSpeedDuration);
        playerPositionSquare.doubleSpeedSpecial = false;
        clearSpecials.push(playerPositionSquare.id);
      }
    });

    (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
      this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
    });

    const clearSquares: ClearedSquare[] = [];
    (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
      for (let i = 0; i < playerPoints[color].length; i++) {
        clearSquares.push({ id: playerPoints[color][i].id, color: color });
        playerPoints[color][i].color = '';
      }
    });

    return { clearSquares, clearSpecials };
  }

  private applyRandomSpecials(): MatchSpecials {
    const specials = randomSpecials.getSpecials(this.match);
    this.match.updateSpecials(specials);
    return specials;
  }
}
