import { matchPresenceService } from './matchPresenceService';
import * as matchSocketEmitters from '../infrastructure/sockets/matchEmitters';
import type { Match } from '../models/match';

export class MatchStartCoordinator {
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly defaultCountdownMs = 10000; // 10s

  startCountdown(match: Match, durationMs?: number): void {
    const matchId = match.getId();
    if (this.timers.has(matchId)) return; // already counting down
    const dur = durationMs ?? this.defaultCountdownMs;

    const cb = () => {
      // when timer expires, start with whoever is currently connected
      try {
        matchSocketEmitters.sendPrepareMatchEvent(match);
        match.getEngine().startMatch();
      } catch (err) {
        // ignore here; errors handled elsewhere
      }
      this.timers.delete(matchId);
    };

    const t = setTimeout(cb, dur);
    this.timers.set(matchId, t);
  }

  notifyPlayerConnected(match: Match): void {
    const matchId = match.getId();
    if (!this.timers.has(matchId)) return;
    const expected = match.getPlayers().length;
    if (matchPresenceService.areAllPlayersReady(matchId, expected)) {
      // cancel timer and start immediately
      const t = this.timers.get(matchId);
      if (t) clearTimeout(t);
      this.timers.delete(matchId);
      try {
        matchSocketEmitters.sendPrepareMatchEvent(match);
        match.getEngine().startMatch();
      } catch (err) {
        // ignore here
      }
    }
  }

  cancelCountdown(matchId: string): void {
    const t = this.timers.get(matchId);
    if (t) clearTimeout(t);
    this.timers.delete(matchId);
  }
}

export const matchStartCoordinator = new MatchStartCoordinator();
