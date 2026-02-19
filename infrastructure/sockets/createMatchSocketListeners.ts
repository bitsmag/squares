import { Socket } from 'socket.io';
import { CreateMatchSocketController } from '../../controllers/sockets/createMatchSocketController';

export function respond(socket: Socket): void {

  const controller = new CreateMatchSocketController();

  socket.on('connectionInfo', function (playerInfo: unknown) {
    controller.handleConnectionInfo(playerInfo, socket);
  });

  socket.on('connectionInfoGuest', function (playerInfo: unknown) {
    controller.handleConnectionInfoGuest(playerInfo, socket);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnect(socket);
  });

  socket.on('matchStartInitiation', function (matchId: unknown) {
    controller.handleMatchStartInitiation(matchId);
  });
}
