import type { Request, Response } from 'express';
import { Match } from '../../models/match';
import { Player } from '../../models/player';

export type CreateMatchParams = { playerName: string };

export function handleCreateMatch(req: Request<CreateMatchParams>, res: Response): void {
  const playerName = req.params.playerName;
  const newMatch = new Match();
  // Player constructor registers itself with the match
  new Player(playerName, newMatch, true);
  res.render('createMatch.html', {
    matchId: newMatch.getId(),
    playerName,
  });
}
