import { manager } from '../models/matchesManager';
import * as matchSocketEmitters from '../infrastructure/sockets/matchSocketEmitters';
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
  }

  handleEarlyDisconnect(): void {
    if (this.match && this.player) {
      matchSocketEmitters.sendMatchCreatorDisconnectedEvent(this.match);
      this.match.removePlayer(this.player);
      this.match.destroy();
    }
  }
}
