import { Socket } from 'socket.io';
import { CreateMatchLobbySocketController } from '../../controllers/sockets/createMatchSocketController';

export function respond(socket: Socket): void {

  const controller = new CreateMatchLobbySocketController();

  socket.on('registerPlayerLobby', function (playerInfo: unknown) {
    controller.registerPlayerLobby(playerInfo, socket);
  });

  socket.on('matchStartInitiation', function (matchId: unknown) {
    controller.handleMatchStartInitiation(matchId);
  });

  socket.on('disconnect', function () {
    controller.handleDisconnectLobby(socket);
  });
}
