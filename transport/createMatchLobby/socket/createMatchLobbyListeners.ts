import { Socket } from 'socket.io';
import { createMatchLobbySocketController } from './createMatchLobbySocketController';
import { socketValidationMiddleware } from '../../util/socket/socketValidationMiddleware';
import { schemas } from '../../util/validation';
import type { RegisterPlayerLobbyParams } from '../../util/validation';

export function respond(socket: Socket): void {
  const controller = createMatchLobbySocketController;

  socket.use(
    socketValidationMiddleware({
      registerPlayerLobby: schemas.registerPlayerLobbyParams,
    })
  );

  socket.on('registerPlayerLobby', function (playerInfo: unknown) {
    controller.handleRegisterPlayerLobby(playerInfo as RegisterPlayerLobbyParams, socket.id);
  });

  socket.on('matchStartInitiation', function () {
    controller.handleMatchStartInitiation(socket.id);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnectLobby(socket.id);
  });
}
