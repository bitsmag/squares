import type { Application } from 'express';
import * as validation from '../middleware/validation';
import { handleCreateMatchLobbyHost, handleCreateMatchLobbyGuest } from '../../controllers/http/createMatchLobbyController';

function createMatchLobbyRouter(app: Application): void {
  app.get(
    '/createMatchLobby/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    handleCreateMatchLobbyHost
  );
    app.get(
    '/createMatchLobby/:playerName/:matchId',
    validation.validate('params', validation.schemas.createMatchLobbyGuestParams),
    handleCreateMatchLobbyGuest
  );
}
export default createMatchLobbyRouter;
