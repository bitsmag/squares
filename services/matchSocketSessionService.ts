import { manager } from '../models/matchesManager';
import * as matchSocketEmitters from '../infrastructure/sockets/matchSocketEmitters';
import socketErrorHandler from '../infrastructure/middleware/socketErrorHandler';
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

    if (this.player.isMatchCreator()) {
      matchSocketEmitters.sendPrepareMatchEvent(this.match);
      this.match.getEngine().startMatch();
    } else {
      const data = { playerNames: [] as string[] };
      for (let i = 0; i < this.match.getPlayers().length; i++) {
        data.playerNames.push(this.match.getPlayers()[i].getName());
      }
      const sock = this.player.getSocket();
      if (sock) sock.emit('connectedPlayers', data);
      matchSocketEmitters.sendPlayerConnectedEvent(this.match, this.player);
    }
  }

  handleDisconnect(): void {
    if (this.match && this.player) {
      this.match.removePlayer(this.player);
      matchSocketEmitters.sendPlayerDisconnectedEvent(this.match, this.player);
    }
  }

  setDirection(direction: 'left' | 'up' | 'right' | 'down'): void {
    if (this.player) {
      this.player.setActiveDirection(direction);
    }
  }
}
