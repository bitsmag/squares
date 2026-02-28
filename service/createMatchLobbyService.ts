import { manager } from '../domain/models/matchesManager';
import { Player } from '../domain/models/player';
import { MatchEngine } from '../domain/engine/matchEngine';
import type { MatchEventPublisher } from '../domain/engine/matchEvents';
import type { PlayerColor } from '../domain/models/colors';

export type DisconnectionSource = { type: 'HOST_LEFT' } | { type: 'GUEST_LEFT' } | { type: 'LOBBY_CLOSED' };

export class CreateMatchLobbyService {
  constructor(private readonly eventPublisher: MatchEventPublisher) {}

  processMatchStartInitiation(matchId: string): void {
    const match = manager.getMatch(matchId);
    match.startInitiated = true;
  }

  processDisconnectLobby(matchId: string, playerId: string): DisconnectionSource {
    const match = manager.getMatch(matchId);
    if (match.startInitiated) {
      // when match start is initiated players get redirected to match and a new connection gets established, not to worry...
      return { type: 'LOBBY_CLOSED' };
    } else {
      // if disconnect was not due to match start, we need to handle it
      const player = match.getPlayerById(playerId);
      if (player.host) {
        match.removePlayer(player);
        manager.destroyMatch(match);
        return { type: 'HOST_LEFT' };
      } else {
        match.removePlayer(player);
        return { type: 'GUEST_LEFT' };
      }
    }
  }

  processCreateMatchLobbyHost(playerName: string): { matchId: string; playerId: string } {
    const match = manager.createMatch();
    const engine = new MatchEngine(match, this.eventPublisher);
    match.engine = engine;
    const { color, position } = this.allocateColorAndPosition(match);
    const player = new Player(playerName, color, position, true);
    match.addPlayer(player);
    return { matchId: match.id, playerId: player.id };
  }

  processCreateMatchLobbyGuest(matchId: string, playerName: string): { matchId: string; playerId: string } {
    const match = manager.getMatch(matchId);
    const { color, position } = this.allocateColorAndPosition(match);
    const player = new Player(playerName, color, position, false);
    match.addPlayer(player);
    return { matchId: match.id, playerId: player.id };
  }

  private allocateColorAndPosition(match: import('../domain/models/match').Match): {
    color: PlayerColor;
    position: number;
  } {
    const availableColors: PlayerColor[] = ['blue', 'orange', 'green', 'red'];
    const players = match.players;

    for (let i = 0; i < players.length; i++) {
      const index = availableColors.indexOf(players[i].color);
      if (index > -1) {
        availableColors.splice(index, 1);
      }
    }

    if (availableColors.length === 0) {
      throw new Error('matchIsFull');
    }

    const color = availableColors[0];
    const position = match.board.startSquares[color];

    return { color, position };
  }
}
