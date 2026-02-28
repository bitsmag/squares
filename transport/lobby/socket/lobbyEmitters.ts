import type { Match } from '../../../domain/entities/match';
import { broadcastToMatch } from '../../utilities/socket/socketMessaging';
import type { LobbyPlayersDTO } from '../../../shared/dto/socket/outgoing/lobbyDtos';

export function sendPlayerConnectedEvent(match: Match): void {
  const data = toLobbyPlayersDTO(match);
  broadcastToMatch(match.id, '/createMatchSockets', 'playerConnected', data);
}

export function sendPlayerDisconnectedEvent(match: Match): void {
  const data = toLobbyPlayersDTO(match);
  broadcastToMatch(match.id, '/createMatchSockets', 'playerDisconnected', data);
}

export function sendHostDisconnectedEvent(matchId: string): void {
  broadcastToMatch(matchId, '/createMatchSockets', 'hostDisconnected');
}

export function sendMatchStartInitiationEvent(match: Match): void {
  broadcastToMatch(match.id, '/createMatchSockets', 'matchStartInitiation');
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
