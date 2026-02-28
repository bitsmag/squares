import { Socket } from 'socket.io';
import { createMatchLobbySocketController } from './createMatchLobbySocketController';
import { socketValidationMiddleware } from '../../util/socket/socketValidationMiddleware';
import { schemas } from '../../util/validation';
import type { RegisterPlayerLobbyDTO } from '../../../shared/dto/socket/incoming/createMatchLobbySocketDtos';

export function respond(socket: Socket): void {
  const controller = createMatchLobbySocketController;

  socket.use(
    socketValidationMiddleware({
      registerPlayerLobby: schemas.registerPlayerLobbyParams,
    })
  );

  socket.on('registerPlayerLobby', function (playerInfo: unknown) {
    controller.handleRegisterPlayerLobby(playerInfo as RegisterPlayerLobbyDTO, socket.id);
  });

  socket.on('matchStartInitiation', function () {
    controller.handleMatchStartInitiation(socket.id);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnectLobby(socket.id);
  });
}
