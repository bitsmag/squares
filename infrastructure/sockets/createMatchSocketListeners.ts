import { Socket } from 'socket.io';
import { CreateMatchSocketController } from '../../controllers/sockets/createMatchSocketController';

export function respond(socket: Socket): void {
  const controller = new CreateMatchSocketController(socket);

  socket.on('connectionInfo', function (playerInfo: unknown) {
    controller.handleConnectionInfo(playerInfo);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnect();
  });

  socket.on('startBtnClicked', function () {
    controller.handleStartClicked();
  });
}
