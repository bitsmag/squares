import type { NextFunction, Request, Response } from 'express';
import type { GetMatchRequestDTO, MatchAppDataDTO } from '../../../shared/dto/http/matchHttpDtos';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';

export type GetMatchParams = GetMatchRequestDTO;

export function createHandleGetMatch(matchesManager: MatchesManager) {
  return function handleGetMatch(req: Request<GetMatchParams>, res: Response, next: NextFunction): void {
    try {
      const { matchId, playerId } = req.params;
      const match = matchesManager.getMatch(matchId);
      const player = match.getPlayerById(playerId);
      const appData: MatchAppDataDTO = { matchId, playerId, playerName: player.name };
      res.render('match.html', { appData });
    } catch (err) {
      next(err);
    }
  };
}
