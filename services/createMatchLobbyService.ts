import { manager } from '../models/matchesManager';
import * as matchSocketEmitters from '../infrastructure/sockets/matchSocketEmitters';
import * as createMatchSocketEmitters from '../infrastructure/sockets/createMatchScoketEmitters';
import { socketSessionRegistry } from './socketSessionRegistry';
import socketErrorHandler from '../infrastructure/middleware/socketErrorHandler';
import type { Match } from '../models/match';
import type { Player } from '../models/player';
import type { Socket } from 'socket.io';

export class CreateMatchLobbyService {
  private match: Match | undefined;
  private player: Player | undefined;

  registerHost(matchId: string, socket: Socket): void {
    try {
      this.match = manager.getMatch(matchId);
      this.player = this.match.getMatchCreator();
    } catch (err) {
      socketErrorHandler(this.match, err, 'CreateMatchLobbyService.registerHost');
      return;
    }
    if (!this.player) return;
    this.player.setSocket(socket);
    // register session globally
    socketSessionRegistry.register(socket, '/createMatchSockets', matchId, this.player.getName());
    createMatchSocketEmitters.sendPlayerConnectedEvent(this.match, this.player);
  }

  registerGuest(matchId: string, playerName: string, socket: Socket): void {
    try {
      this.match = manager.getMatch(matchId);
      this.player = this.match.getPlayer(playerName);
    } catch (err) {
      socketErrorHandler(this.match, err, 'CreateMatchLobbyService.registerGuest');
      return;
    }
    if (!this.player) return;
    this.player.setSocket(socket);
    // register session globally
    socketSessionRegistry.register(socket, '/createMatchSockets', matchId, playerName);
    createMatchSocketEmitters.sendPlayerConnectedEvent(this.match, this.player);
  }

  handleEarlyDisconnect(socket: Socket): void {
    // unregister session and get session info
    const session = socketSessionRegistry.unregister(socket);
    if (!session || !session.matchId || !session.playerName) return;

    try {
      const match = manager.getMatch(session.matchId);
      if (match.isStartInitiated()) return; // when match gets initiated players get redirected to match and new socket connection gets established, so ignore disconnects after match start initiation
      const player = match.getPlayer(session.playerName);
      if (player.isMatchCreator()) {
        createMatchSocketEmitters.sendMatchCreatorDisconnectedEvent(match);
        match.removePlayer(player);
        match.destroy();
      } else {
        // fallback safety: treat as guest disconnect
        match.removePlayer(player);
        createMatchSocketEmitters.sendPlayerDisconnectedEvent(match, player);
      }
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err, 'CreateMatchLobbyService.handleEarlyDisconnect');
    }
  }

  handleMatchStartInitiation(matchId: string): void {
    try {
      const match = manager.getMatch(matchId);
      match.setStartInitiated(true);
      createMatchSocketEmitters.sendMatchStartInitiationEvent(match);
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err, 'CreateMatchLobbyService.handleMatchStartInitiation');
    }
}
}
