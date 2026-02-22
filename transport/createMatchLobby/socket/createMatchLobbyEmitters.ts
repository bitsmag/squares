import type { Match } from '../../../domain/models/match';
import { broadcastToMatch } from '../../util/socket/transport';

export function sendPlayerConnectedEvent(match: Match): void {
  const data = {
    matchId: match.getId(),
    players: [] as { playerName: string; playerColor: string }[],
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  broadcastToMatch(match.getId(), '/createMatchSockets', 'playerConnected', data);
}

export function sendPlayerDisconnectedEvent(match: Match): void {
  const data = {
    matchId: match.getId(),
    players: [] as { playerName: string; playerColor: string }[],
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  broadcastToMatch(match.getId(), '/createMatchSockets', 'playerDisconnected', data);
}

export function sendHostDisconnectedEvent(matchId: string): void {
  broadcastToMatch(matchId, '/createMatchSockets', 'hostDisconnected');
}

export function sendMatchStartInitiationEvent(match: Match): void {
  broadcastToMatch(match.getId(), '/createMatchSockets', 'matchStartInitiation');
}

export function sendFatalErrorEvent(match: Match): void {
  broadcastToMatch(match.getId(), '/createMatchSockets', 'fatalError');
}
