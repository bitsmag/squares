import { Socket } from 'socket.io';
import type { CreateMatchLobbySocketController } from './createMatchLobbySocketController';
import { socketValidationMiddleware } from '../../util/socket/socketValidationMiddleware';
import { schemas } from '../../util/validation';
import type { RegisterPlayerLobbyDTO } from '../../../shared/dto/socket/incoming/createMatchLobbySocketDtos';

export function createCreateMatchLobbyListeners(controller: CreateMatchLobbySocketController) {
  return function respond(socket: Socket): void {
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
  };
}
