import type { NextFunction, Request, Response } from 'express';

export type GetMatchParams = { matchCreatorFlag: 't' | 'f'; matchId: string; playerName: string };

export function handleGetMatch(req: Request<GetMatchParams>, res: Response, next: NextFunction): void {
  const { matchId, playerName } = req.params;
  res.render('match.html', { matchId: matchId, playerName: playerName });
}
