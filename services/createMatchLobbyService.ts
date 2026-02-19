import { manager } from '../models/matchesManager';
import * as createMatchLobbyEmitters from '../infrastructure/sockets/createMatchLobbyEmitters';
import { sessionStore } from '../infrastructure/sockets/sessionStore';
import socketErrorHandler from '../infrastructure/middleware/socketErrorHandler';
import type { Match } from '../models/match';
import type { Player } from '../models/player';
import type { Socket } from 'socket.io';

export class CreateMatchLobbyService {

  handlerRegisterPlayer(matchId: string, playerName: string, socket: Socket): void {
    let match: Match | undefined = undefined;
    let player: Player | undefined = undefined;
    try {
      match = manager.getMatch(matchId);
      player = match.getPlayer(playerName); 
    } catch (err) {
      socketErrorHandler(match, err);
      return;
    }
    if (!player) return;
    player.setSocket(socket);
    // register session globally (store both name and id)
    sessionStore.register(socket, '/createMatchSockets', matchId, playerName, player.getId());
    createMatchLobbyEmitters.sendPlayerConnectedEvent(match, player);
  }

  handleMatchStartInitiation(matchId: string): void {
    try {
      const match = manager.getMatch(matchId);
      match.setStartInitiated(true);
      createMatchLobbyEmitters.sendMatchStartInitiationEvent(match);
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err);
    }
}

  handleDisconnectLobby(socket: Socket): void {
    // unregister session and get session info
    const session = sessionStore.unregister(socket);
    if (!session || !session.matchId || !session.playerName) return;

    try {
      const match = manager.getMatch(session.matchId);
      if (match.isStartInitiated()) return; // when match start is initiated players get redirected to match and new socket connection gets established, not to worry...
      
      const player = match.getPlayer(session.playerName);
      if (player.isHost()) {
        createMatchLobbyEmitters.sendHostDisconnectedEvent(match);
        match.removePlayer(player);
        match.destroy();
      } else {
        match.removePlayer(player);
        createMatchLobbyEmitters.sendPlayerDisconnectedEvent(match, player);
      }
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err);
    }
  }


}
