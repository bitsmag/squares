import { Socket } from 'socket.io';
import type { CreateMatchLobbySocketController } from './lobbySocketController';
import { socketValidationMiddleware } from '../../utilities/socket/socketValidationMiddleware';
import { schemas } from '../../utilities/validation';
import type { RegisterPlayerLobbyDTO } from '../../../shared/dto/socket/incoming/lobbySocketDtos';

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
