import type { Application } from 'express';
import * as validation from '../middleware/validation';
import { handleCreateMatch, handleCreateMatchGuest } from '../../controllers/http/createMatchController';

function createMatchRouter(app: Application): void {
  app.get(
    '/createMatch/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    handleCreateMatch
  );
    app.get(
    '/createMatch/:playerName/:matchId',
    validation.validate('params', validation.schemas.createMatchLobbyGuestParams),
    handleCreateMatchGuest
  );
}
export default createMatchRouter;
