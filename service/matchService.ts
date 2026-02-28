import { manager } from '../domain/models/matchesManager';
import type { Direction } from '../domain/models/direction';
import * as matchSocketEmitters from '../transport/match/socket/matchEmitters';
import { MatchPresenceService } from './matchPresenceService';
import { MatchStartCoordinator } from './matchStartCoordinator';

export class MatchService {
  constructor(private readonly presenceService: MatchPresenceService, private readonly startCoordinator: MatchStartCoordinator) {}

  startMatchWhenPlayersAreConnected(matchId: string): void {
    const match = manager.getMatch(matchId);
    const expected = match.players.length;
    if (this.presenceService.areAllPlayersConnected(matchId, expected)) {
      this.startCoordinator.cancelCountdown(matchId);
      matchSocketEmitters.sendPrepareMatchEvent(match);
      this.startCoordinator.startMatch(match);
    } else {
      this.startCoordinator.startMatchWithCountdown(match);
    }
  }

  setDirection(matchId: string, playerId: string, direction: Direction): void {
    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);

    player.activeDirection = direction;
  }

  removePlayer(matchId: string, playerId: string): void {
    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);
    match.removePlayer(player);
  }
}
