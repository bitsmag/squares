import type { Application } from 'express';
import * as validation from '../middleware/validation';
import { handleGetMatch } from '../../controllers/http/matchController';

function matchRouter(app: Application): void {
  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validation.validate('params', validation.schemas.matchRouteParams),
    handleGetMatch
  );
}
export default matchRouter;
