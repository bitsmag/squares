import { manager } from '../domain/models/matchesManager';

export type DisconnectionSource =
  | { type: 'HOST_LEFT' }
  | { type: 'GUEST_LEFT' }
  | { type: 'LOBBY_CLOSED' };

export class CreateMatchLobbyService {
  handleMatchStartInitiation(matchId: string): void {
    const match = manager.getMatch(matchId);
    match.setStartInitiated(true);
  }

  handleDisconnectLobby(matchId: string, playerName: string): DisconnectionSource {
    const match = manager.getMatch(matchId);
    if (match.isStartInitiated()) {
      // when match start is initiated players get redirected to match and a new connection gets established, not to worry...
      return { type: 'LOBBY_CLOSED' };
    } else {
      // if disconnect was not due to match start, we need to handle it
      const player = match.getPlayer(playerName);
      if (player.isHost()) {
        match.removePlayer(player);
        match.destroy();
        return { type: 'HOST_LEFT' };
      } else {
        match.removePlayer(player);
        return { type: 'GUEST_LEFT' };
      }
    }
  }
}

export const createMatchLobbyService = new CreateMatchLobbyService();
