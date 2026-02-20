import { Socket } from 'socket.io';
import { createMatchLobbySocketController } from './createMatchLobbySocketController';

export function respond(socket: Socket): void {
  const controller = createMatchLobbySocketController;

  socket.on('registerPlayerLobby', function (playerInfo: unknown) {
    controller.registerPlayerLobby(playerInfo, socket);
  });

  socket.on('matchStartInitiation', function (matchId: unknown) {
    controller.handleMatchStartInitiation(matchId);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnectLobby(socket);
  });
}
