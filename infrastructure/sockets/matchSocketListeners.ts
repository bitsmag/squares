import { Socket } from 'socket.io';
import { MatchSocketController } from '../../controllers/sockets/matchSocketController';

export function respond(socket: Socket): void {
  
  const controller = new MatchSocketController();

  socket.on('connectionInfo', function (playerInfo: unknown) {
    controller.handleConnectionInfo(playerInfo, socket);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnect(socket);
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
