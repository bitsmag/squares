import type { Application } from 'express';
import { schemas } from '../../util/validation';
import { validate } from '../../util/http/httpValidationMiddleware';
import {
  handleCreateMatchLobbyHost,
  handleCreateMatchLobbyGuest,
} from './createMatchLobbyController';

function createMatchLobbyRouter(app: Application): void {
  app.get(
    '/createMatchLobby/:playerName',
    validate('params', schemas.createMatchParams),
    handleCreateMatchLobbyHost
  );
  app.get(
    '/createMatchLobby/:playerName/:matchId',
    validate('params', schemas.createMatchLobbyGuestParams),
    handleCreateMatchLobbyGuest
  );
}
export default createMatchLobbyRouter;
