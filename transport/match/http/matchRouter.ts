import type { Application } from 'express';
import { schemas } from '../../util/validation';
import { validate } from '../../util/http/httpValidationMiddleware';
import { handleGetMatch } from './matchController';

function matchRouter(app: Application): void {
  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validate('params', schemas.matchRouteParams),
    handleGetMatch
  );
}
export default matchRouter;
