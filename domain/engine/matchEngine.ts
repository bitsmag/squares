import { computeTick } from './utilities/tickRules';
import type { Match } from '../models/match';
import type { MatchEventPublisher } from './matchEvents';

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
          const result = computeTick(this.match, tickCount);

          this.publisher.publish({
            type: 'TICK_PROCESSED',
            match: this.match,
            specials: result.specials,
            clearSquares: result.clearSquares,
            clearSpecials: result.clearSpecials,
          });
        } catch (err) {
          this.match.active = false;
          clearInterval(tickerInterval);
          this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
        }
      }
    };
    const tickerInterval = setInterval(tick, 250);
  }
}
