import type { NextFunction, Request, Response } from 'express';

export type GetMatchParams = { matchCreatorFlag: 't' | 'f'; matchId: string; playerId: string };

export function handleGetMatch(
  req: Request<GetMatchParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const { matchId, playerId } = req.params;
    res.render('match.html', {
      appData: {
        matchId: matchId,
        playerId: playerId,
      },
    });
  } catch (err) {
    next(err);
  }
}
