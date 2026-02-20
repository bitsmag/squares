import type { Application } from 'express';
import * as validation from '../../util/validation';
import { handleGetMatch } from './matchController';

function matchRouter(app: Application): void {
  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validation.validate('params', validation.schemas.matchRouteParams),
    handleGetMatch
  );
}
export default matchRouter;
