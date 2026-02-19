import { Socket } from 'socket.io';
import { MatchSocketController } from '../../controllers/sockets/matchSocketController';

export function respond(socket: Socket): void {
  
  const controller = new MatchSocketController();

  socket.on('registerPlayerMatch', function (playerInfo: unknown) {
    controller.handleRegisterPlayerAndStartMatch(playerInfo, socket);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnectMatch(socket);
  });

  socket.on('goLeft', function () {
    controller.handleDirection('left');
  });

  socket.on('goUp', function () {
    controller.handleDirection('up');
  });

  socket.on('goRight', function () {
    controller.handleDirection('right');
  });

  socket.on('goDown', function () {
    controller.handleDirection('down');
  });
}
