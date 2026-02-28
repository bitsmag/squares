import { computeTick } from './tickRules';
import type { Match } from '../entities/match';
import type { MatchEventPublisher } from './matchEvents';
import type { ClockProvider, ClockHandle } from './utilities/clockProvider';
import { DefaultClockProvider } from './utilities/clockProvider';

const COUNTDOWN_INTERVAL_MS = 1000;
const DURATION_INTERVAL_MS = 1000;
const TICK_INTERVAL_MS = 250;

export class MatchEngine {
  private readonly match: Match;
  private readonly publisher: MatchEventPublisher;
  private readonly clock: ClockProvider;

  private countdownHandle: ClockHandle | null = null;
  private durationHandle: ClockHandle | null = null;
  private tickerHandle: ClockHandle | null = null;

  constructor(match: Match, publisher: MatchEventPublisher, clock: ClockProvider = DefaultClockProvider) {
    this.match = match;
    this.publisher = publisher;
    this.clock = clock;
  }

  startMatch(): void {
    this.startCountdown();
    this.startDurationTimer();
    this.startTicker();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdownHandle = this.clock.setInterval(() => {
      if (!this.match.active) {
        this.clearCountdown();
        return;
      }

      this.match.countdownDurationDecrement();
      this.publisher.publish({ type: 'COUNTDOWN_TICKED', match: this.match });

      if (this.match.countdownDuration === 0) {
        this.clearCountdown();
      }
    }, COUNTDOWN_INTERVAL_MS);
  }

  private startDurationTimer(): void {
    this.clearDurationTimer();
    this.durationHandle = this.clock.setInterval(() => {
      if (!this.match.active) {
        this.clearDurationTimer();
        return;
      }

      this.match.durationDecrement();

      if (this.match.duration === 0) {
        this.clearDurationTimer();
        this.match.active = false;
      }
    }, DURATION_INTERVAL_MS);
  }

  private startTicker(): void {
    this.clearTicker();
    let tickCount = 0;

    this.tickerHandle = this.clock.setInterval(() => {
      tickCount++;

      if (!this.match.active) {
        this.publisher.publish({ type: 'MATCH_ENDED', match: this.match });
        this.clearTicker();
        return;
      }

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
        this.clearTicker();
        this.publisher.publish({ type: 'FATAL_ERROR', match: this.match, error: err });
      }
    }, TICK_INTERVAL_MS);
  }

  private clearCountdown(): void {
    if (this.countdownHandle) {
      this.countdownHandle.clear();
      this.countdownHandle = null;
    }
  }

  private clearDurationTimer(): void {
    if (this.durationHandle) {
      this.durationHandle.clear();
      this.durationHandle = null;
    }
  }

  private clearTicker(): void {
    if (this.tickerHandle) {
      this.tickerHandle.clear();
      this.tickerHandle = null;
    }
  }
}
