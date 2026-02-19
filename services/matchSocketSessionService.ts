import { manager } from '../models/matchesManager';
import * as matchSocketEmitters from '../infrastructure/sockets/matchSocketEmitters';
import socketErrorHandler from '../infrastructure/middleware/socketErrorHandler';
import { socketSessionRegistry } from './socketSessionRegistry';
import { matchStartCoordinator } from './matchStartCoordinator';
import type { Match } from '../models/match';
import type { Player } from '../models/player';
import type { Socket } from 'socket.io';

export class MatchSocketSessionService {
  private match: Match | undefined;
  private player: Player | undefined;
  

  registerConnection(matchId: string, playerName: string, socket: Socket): void {
    try {
      this.match = manager.getMatch(matchId);
      this.player = this.match.getPlayer(playerName);
    } catch (err) {
      socketErrorHandler(this.match, err, 'MatchSocketSessionService.registerConnection');
      return;
    }

    if (!this.player || !this.match) return;

    this.player.setSocket(socket);
    socketSessionRegistry.register(socket, '/matchSockets', matchId, playerName);

    if (this.player.isMatchCreator()) {
      const expected = this.match.getPlayers().length;
      if (socketSessionRegistry.areAllPlayersConnected(matchId, expected, '/matchSockets')) {
        matchSocketEmitters.sendPrepareMatchEvent(this.match);
        this.match.setActive(true);
        this.match.getEngine().startMatch();
      } else {
        // start a short countdown; coordinator will start when ready or timeout
        matchStartCoordinator.startCountdown(this.match);
      }
    } else {
      const data = { playerNames: [] as string[] };
      for (let i = 0; i < this.match.getPlayers().length; i++) {
        data.playerNames.push(this.match.getPlayers()[i].getName());
      }
      const sock = this.player.getSocket();
      if (sock) sock.emit('connectedPlayers', data);
      matchSocketEmitters.sendPlayerConnectedEvent(this.match, this.player);
      // notify coordinator that a player joined; it may trigger immediate start
      matchStartCoordinator.notifyPlayerConnected(this.match);
    }
  }

  handleDisconnect(socket: Socket): void {
    // unregister session
    const session = socketSessionRegistry.unregister(socket);
    if (!session || !session.matchId || !session.playerName) return;

    try {
      const match = manager.getMatch(session.matchId);
      const player = match.getPlayer(session.playerName);
      match.removePlayer(player);
      matchSocketEmitters.sendPlayerDisconnectedEvent(match, player);
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err, 'MatchSocketSessionService.handleDisconnect');
    }
  }

  setDirection(direction: 'left' | 'up' | 'right' | 'down'): void {
    if (this.player) {
      this.player.setActiveDirection(direction);
    }
  }
}
