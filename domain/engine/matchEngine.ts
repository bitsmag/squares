import { computeTick } from './tickRules';
import type { Match } from '../entities/match';
import type { MatchEventPublisher } from './matchEvents';
import type { ClockProvider, ClockHandle } from './utilities/clockProvider';
import { DefaultClockProvider } from './utilities/clockProvider';
import type { Player } from '../entities/player';
import type { PlayerColor } from '../valueObjects/valueObjects';
import { getBotAction } from '../../RL/policyClient';

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
  private botDecisionInProgress = false;

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
        // Trigger asynchronous bot direction updates; do not await here so
        // the game loop stays on its regular tick schedule.
        this.updateBotDirections().catch(() => {
          // Errors are swallowed here; bots will simply keep their last
          // direction if the policy server is unavailable.
        });

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

  private async updateBotDirections(): Promise<void> {
    if (this.botDecisionInProgress) {
      return;
    }
    this.botDecisionInProgress = true;

    try {
      const bots = this.match.players.filter((p) => isBotPlayer(p));
      const tasks = bots.map(async (player) => {
        const dir = await getBotAction(this.match, player.color as PlayerColor);
        if (!this.match.active) {
          return;
        }
        if (dir !== null) {
          player.activeDirection = dir;
        }
      });

      await Promise.all(tasks);
    } finally {
      this.botDecisionInProgress = false;
    }
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

function isBotPlayer(player: Player): boolean {
  // Simple convention-based bot detection: any player whose name starts
  // with "bot" (case-insensitive) is treated as a bot controlled by the
  // policy server.
  return player.name.toLowerCase().startsWith('bot');
}

