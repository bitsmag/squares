import { manager } from '../domain/models/matchesManager';
import { Player } from '../domain/models/player';
import { MatchEngine } from '../domain/engine/matchEngine';
import { SocketMatchEventPublisher } from '../transport/match/socket/matchEventPublisher';

export type DisconnectionSource =
  | { type: 'HOST_LEFT' }
  | { type: 'GUEST_LEFT' }
  | { type: 'LOBBY_CLOSED' };

export class CreateMatchLobbyService {
  processMatchStartInitiation(matchId: string): void {
    const match = manager.getMatch(matchId);
    match.setStartInitiated(true);
  }

  processDisconnectLobby(matchId: string, playerId: string): DisconnectionSource {
    const match = manager.getMatch(matchId);
    if (match.isStartInitiated()) {
      // when match start is initiated players get redirected to match and a new connection gets established, not to worry...
      return { type: 'LOBBY_CLOSED' };
    } else {
      // if disconnect was not due to match start, we need to handle it
      const player = match.getPlayerById(playerId);
      if (player.isHost()) {
        match.removePlayer(player);
        manager.destroyMatch(match);
        return { type: 'HOST_LEFT' };
      } else {
        match.removePlayer(player);
        return { type: 'GUEST_LEFT' };
      }
    }
  }

  processCreateMatchLobbyHost(playerName: string): { matchId: string, playerId: string } {
    const match = manager.createMatch();
    const publisher = new SocketMatchEventPublisher();
    const engine = new MatchEngine(match, publisher);
    match.setEngine(engine);
    const player = new Player(playerName, match, true);
    return { matchId: match.getId(), playerId: player.getId() };
  }

  processCreateMatchLobbyGuest(matchId: string, playerName: string): { matchId: string, playerId: string } {
    const match = manager.getMatch(matchId);
    const player = new Player(playerName, match, false);
    return { matchId: match.getId(), playerId: player.getId() };
  }
}
