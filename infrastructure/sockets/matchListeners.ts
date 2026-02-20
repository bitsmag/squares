import { Socket } from 'socket.io';
import { matchSocketController } from '../../controllers/sockets/matchSocketController';

export function respond(socket: Socket): void {
  const controller = matchSocketController;

  socket.on('registerPlayerMatch', function (playerInfo: unknown) {
    controller.handleRegisterPlayerAndStartMatch(playerInfo, socket);
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
}
