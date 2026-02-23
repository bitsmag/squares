import type { NextFunction, Request, Response } from 'express';
import type { GetMatchRequestDTO, MatchAppDataDTO } from '../../../shared/dto/http/matchHttpDtos';

export type GetMatchParams = GetMatchRequestDTO;

export function handleGetMatch(
  req: Request<GetMatchParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const { matchId, playerId } = req.params;
    const appData: MatchAppDataDTO = { matchId, playerId };
    res.render('match.html', { appData });
  } catch (err) {
    next(err);
  }
}
