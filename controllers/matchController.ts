import type { NextFunction, Request, Response } from 'express';
import {
  getUserMessage,
  joinGuest,
  MatchAccessError,
  startHost,
} from '../services/matchAccessService';

export type MatchRouteParams = { matchCreatorFlag: 't' | 'f'; matchId: string; playerName: string };

export function handleGetMatch(
  req: Request<MatchRouteParams>,
  res: Response,
  next: NextFunction
): void {
  const { matchCreatorFlag, matchId, playerName } = req.params;
  try {
    const result =
      matchCreatorFlag === 't'
        ? startHost(matchId, playerName)
        : joinGuest(matchId, playerName);
    res.render('match.html', { matchId: result.matchId, playerName: result.playerName });
  } catch (err) {
    if (err instanceof MatchAccessError) {
      const userMessage = getUserMessage(err.code);
      const userError = Object.assign(new Error(err.code), { userMessage });
      return next(userError);
    }
    return next(err);
  }
}
