import type { Match } from '../domain/entities/match';
import type { MatchEventPublisher } from '../domain/engine/matchEvents';

// Default delay before automatically starting a match (in milliseconds).
const DEFAULT_MATCH_START_COUNTDOWN_MS = 3000; // 3 seconds

export class MatchStartCoordinator {
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly eventPublisher: MatchEventPublisher) {}

  startMatchWithCountdown(match: Match, durationMs?: number): void {
    const matchId = match.id;
    if (this.timers.has(matchId)) return; // already counting down
    const dur = durationMs ?? DEFAULT_MATCH_START_COUNTDOWN_MS;

    const cb = () => {
      // when timer expires, start with whoever is currently connected
      this.eventPublisher.publish({ type: 'MATCH_PREPARE_REQUESTED', match });
      this.startMatch(match);
      this.timers.delete(matchId);
    };

    const t = setTimeout(cb, dur);
    this.timers.set(matchId, t);
  }

  startMatch(match: Match): void {
    match.active = true;
    match.engine.startMatch();
  }

  cancelCountdown(matchId: string): void {
    const t = this.timers.get(matchId);
    if (t) clearTimeout(t);
    this.timers.delete(matchId);
  }
}
