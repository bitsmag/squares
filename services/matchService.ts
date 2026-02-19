import { manager } from '../models/matchesManager';
import * as matchSocketEmitters from '../infrastructure/sockets/matchEmitters';
import socketErrorHandler from '../infrastructure/middleware/socketErrorHandler';
import { sessionStore } from '../infrastructure/sockets/sessionStore';
import { matchPresenceService } from './matchPresenceService';
import { matchStartCoordinator } from './matchStartCoordinator';
import type { Match } from '../models/match';
import type { Player } from '../models/player';
import type { Socket } from 'socket.io';

export class MatchService {
  private match: Match | undefined;
  private player: Player | undefined;

  handleRegisterPlayerAndStartMatch(matchId: string, playerName: string, socket: Socket): void {
    
    // Register Player
    let match: Match | undefined = undefined;
    let player: Player | undefined = undefined;
    try {
      match = manager.getMatch(matchId);
      player = match.getPlayer(playerName);
    } catch (err) {
      socketErrorHandler(match, err);
      return;
    }
    if (!player || !match) return;
    player.setSocket(socket);
    this.match = match;
    this.player = player;
    // register session globally (store both name and id)
    sessionStore.register(socket, '/matchSockets', matchId, playerName, player.getId());

    // Start Match
    const expected = match.getPlayers().length;
    if (matchPresenceService.areAllPlayersReady(matchId, expected)) {
      matchStartCoordinator.cancelCountdown(matchId);
      matchSocketEmitters.sendPrepareMatchEvent(match);
       match.setActive(true);
       match.getEngine().startMatch();
     } else {
       matchStartCoordinator.startCountdown(match);
     }
    
  }

  setDirection(direction: 'left' | 'up' | 'right' | 'down'): void {
    if (this.player) {
      this.player.setActiveDirection(direction);
    }
  }

  handleDisconnectMatch(socket: Socket): void {
    // unregister session
    const session = sessionStore.unregister(socket);
    if (!session || !session.matchId || !session.playerName) return;

    try {
      const match = manager.getMatch(session.matchId);
      const player = match.getPlayer(session.playerName);
      match.removePlayer(player);
    } catch (err) {
      socketErrorHandler(undefined as unknown as Match, err);
    }
  }
}
