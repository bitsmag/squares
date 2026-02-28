import type { Application } from 'express';
import { schemas } from '../../utilities/validation';
import { validate } from '../../utilities/http/httpValidationMiddleware';
import { createHandleGetMatch } from './matchController';
import type { GetMatchRequestDTO } from '../../../shared/dto/http/matchHttpDtos';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';

function matchRouter(app: Application, matchesManager: MatchesManager): void {
  const handleGetMatch = createHandleGetMatch(matchesManager);
  app.get<GetMatchRequestDTO>(
    '/match/:matchId/:playerId',
    validate<GetMatchRequestDTO>('params', schemas.matchRouteParams),
    handleGetMatch
  );
}
export default matchRouter;
