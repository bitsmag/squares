import { manager } from '../domain/models/matchesManager';
import * as matchSocketEmitters from '../transport/match/socket/matchEmitters';
import { matchPresenceService } from './matchPresenceService';
import { matchStartCoordinator } from './matchStartCoordinator';
import type { Match } from '../domain/models/match';
import type { Player } from '../domain/models/player';

export class MatchService {
  handleRegisterPlayerAndStartMatch(matchId: string, playerName: string): void {
    let match = manager.getMatch(matchId);
    const expected = match.getPlayers().length;
    if (matchPresenceService.areAllPlayersConnected(matchId, expected)) {
      matchStartCoordinator.cancelCountdown(matchId);
      matchSocketEmitters.sendPrepareMatchEvent(match);
      match.setActive(true);
      match.getEngine().startMatch();
    } else {
      matchStartCoordinator.startCountdown(match);
    }
  }

  setDirection(
    matchId: string,
    playerId: string,
    direction: 'left' | 'up' | 'right' | 'down'
  ): void {
    let match: Match | undefined = undefined;
    let player: Player | undefined = undefined;
    match = manager.getMatch(matchId);
    player = match.getPlayerById(playerId);

    player.setActiveDirection(direction);
  }

  handleDisconnectMatch(matchId: string, playerId: string): void {
    let match: Match | undefined = undefined;
    let player: Player | undefined = undefined;
    match = manager.getMatch(matchId);
    player = match.getPlayerById(playerId);
    match.removePlayer(player);
  }
}

export const matchService = new MatchService();

// presence checks moved to MatchPresenceService
