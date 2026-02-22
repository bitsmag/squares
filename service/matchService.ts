import { manager } from '../domain/models/matchesManager';
import * as matchSocketEmitters from '../transport/match/socket/matchEmitters';
import { matchPresenceService } from './matchPresenceService';
import { matchStartCoordinator } from './matchStartCoordinator';

export class MatchService {
  startMatchWhenPlayersAreConnected(matchId: string): void {
    const match = manager.getMatch(matchId);
    const expected = match.getPlayers().length;
    if (matchPresenceService.areAllPlayersConnected(matchId, expected)) {
      matchStartCoordinator.cancelCountdown(matchId);
      matchSocketEmitters.sendPrepareMatchEvent(match);
      matchStartCoordinator.startMatch(match);
    } else {
      matchStartCoordinator.startMatchWithCountdown(match);
    }
  }

  setDirection(
    matchId: string,
    playerId: string,
    direction: 'left' | 'up' | 'right' | 'down'
  ): void {
    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);

    player.setActiveDirection(direction);
  }

  removePlayer(matchId: string, playerId: string): void {
    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);
    match.removePlayer(player);
  }
}

export const matchService = new MatchService();
