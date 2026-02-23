import type { Match } from '../../../domain/models/match';
import { broadcastToMatch } from '../../util/socket/transport';
import type { LobbyPlayersDTO } from '../../../shared/dto/lobbyDtos';

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

export function sendFatalErrorEvent(match: Match): void {
  broadcastToMatch(match.id, '/createMatchSockets', 'fatalError');
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
