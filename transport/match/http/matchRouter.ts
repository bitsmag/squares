import type { Application } from 'express';
import { schemas } from '../../util/validation';
import { validate } from '../../util/http/httpValidationMiddleware';
import { handleGetMatch } from './matchController';
import type { GetMatchRequestDTO } from '../../../shared/dto/http/matchHttpDtos';

function matchRouter(app: Application): void {
  app.get<GetMatchRequestDTO>('/match/:matchId/:playerId', validate<GetMatchRequestDTO>('params', schemas.matchRouteParams), handleGetMatch);
}
export default matchRouter;
