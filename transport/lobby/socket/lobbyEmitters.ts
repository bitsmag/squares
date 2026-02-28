import type { Match } from '../../../domain/entities/match';
import { broadcastToMatch } from '../../utilities/socket/socketMessaging';
import type { LobbyPlayersDTO } from '../../../shared/dto/socket/lobbySocketDtos';

export function sendPlayerConnectedEvent(match: Match): void {
  const data = toLobbyPlayersDTO(match);
  broadcastToMatch(match.id, '/lobbySockets', 'playerConnected', data);
}

export function sendPlayerDisconnectedEvent(match: Match): void {
  const data = toLobbyPlayersDTO(match);
  broadcastToMatch(match.id, '/lobbySockets', 'playerDisconnected', data);
}

export function sendHostDisconnectedEvent(matchId: string): void {
  broadcastToMatch(matchId, '/lobbySockets', 'hostDisconnected');
}

export function sendMatchStartInitiationEvent(match: Match): void {
  broadcastToMatch(match.id, '/lobbySockets', 'matchStartInitiation');
}

function toLobbyPlayersDTO(match: Match): LobbyPlayersDTO {
  return {
    matchId: match.id,
    players: match.players.map((player) => ({
      playerName: player.name,
      playerColor: player.color,
    })),
  };
}
