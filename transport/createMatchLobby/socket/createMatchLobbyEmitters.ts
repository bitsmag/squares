import type { Match } from '../../../domain/models/match';
import { broadcastToMatch } from '../../util/socket/transport';
import type { LobbyPlayersDTO } from '../../../shared/dto/lobbyDtos';

export function sendPlayerConnectedEvent(match: Match): void {
  const data: LobbyPlayersDTO = {
    matchId: match.id,
    players: [] as LobbyPlayersDTO['players'],
  };
  for (let i = 0; i < match.players.length; i++) {
    data.players[i] = {
      playerName: match.players[i].name,
      playerColor: match.players[i].color,
    };
  }
  broadcastToMatch(match.id, '/createMatchSockets', 'playerConnected', data);
  broadcastToMatch(match.id, '/createMatchSockets', 'playerConnected', data);
}

export function sendPlayerDisconnectedEvent(match: Match): void {
  const data: LobbyPlayersDTO = {
    matchId: match.id,
    players: [] as LobbyPlayersDTO['players'],
  };
  for (let i = 0; i < match.players.length; i++) {
    data.players[i] = {
      playerName: match.players[i].name,
      playerColor: match.players[i].color,
    };
  }
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
