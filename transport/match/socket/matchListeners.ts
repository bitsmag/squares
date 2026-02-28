import { Socket } from 'socket.io';
import type { MatchSocketController } from './matchSocketController';
import { socketValidationMiddleware } from '../../util/socket/socketValidationMiddleware';
import { schemas } from '../../util/validation';
import type { RegisterPlayerAndStartMatchWhenReadyDTO } from '../../../shared/dto/socket/incoming/matchSocketDtos';

export function createMatchListeners(controller: MatchSocketController) {
  return function respond(socket: Socket): void {
    socket.use(
      socketValidationMiddleware({
        registerPlayerAndStartMatchWhenReady: schemas.registerPlayerAndStartMatchWhenReadyParams,
      })
    );

    socket.on('registerPlayerAndStartMatchWhenReady', function (playerInfo: unknown) {
      controller.handleRegisterPlayerAndStartMatchWhenReady(
        playerInfo as RegisterPlayerAndStartMatchWhenReadyDTO,
        socket.id
      );
    });

    socket.on('disconnect', function () {
      controller.handleDisconnectMatch(socket.id);
    });

    socket.on('goLeft', function () {
      controller.handleDirection('left', socket.id);
    });

    socket.on('goUp', function () {
      controller.handleDirection('up', socket.id);
    });

    socket.on('goRight', function () {
      controller.handleDirection('right', socket.id);
    });

    socket.on('goDown', function () {
      controller.handleDirection('down', socket.id);
    });
  };
}
