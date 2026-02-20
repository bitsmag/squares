import * as matchSocketEmitters from '../transport/match/socket/matchEmitters';
import type { Match } from '../domain/models/match';

export class MatchStartCoordinator {
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly defaultCountdownMs = 3000; // 3s

  startCountdown(match: Match, durationMs?: number): void {
    const matchId = match.getId();
    if (this.timers.has(matchId)) return; // already counting down
    const dur = durationMs ?? this.defaultCountdownMs;

    const cb = () => {
      // when timer expires, start with whoever is currently connected
      try {
        matchSocketEmitters.sendPrepareMatchEvent(match);
        match.setActive(true);
        match.getEngine().startMatch();
      } catch (err) {
        // ignore here; errors handled elsewhere
      }
      this.timers.delete(matchId);
    };

    const t = setTimeout(cb, dur);
    this.timers.set(matchId, t);
  }

  cancelCountdown(matchId: string): void {
    const t = this.timers.get(matchId);
    if (t) clearTimeout(t);
    this.timers.delete(matchId);
  }
}

export const matchStartCoordinator = new MatchStartCoordinator();
