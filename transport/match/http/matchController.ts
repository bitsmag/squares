import type { NextFunction, Request, Response } from 'express';
import type { GetMatchRequestDTO, MatchAppDataDTO } from '../../../shared/dto/http/matchHttpDtos';
import { manager } from '../../../domain/models/matchesManager';

export type GetMatchParams = GetMatchRequestDTO;

export function handleGetMatch(
  req: Request<GetMatchParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const { matchId, playerId } = req.params;
    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);
    const appData: MatchAppDataDTO = { matchId, playerId, playerName: player.name };
    res.render('match.html', { appData });
  } catch (err) {
    next(err);
  }
}
