import type { Request, Response } from 'express';
import { Match } from '../../models/match';
import { manager } from '../../models/matchesManager';
import { Player } from '../../models/player';

export type CreateMatchParams = { playerName: string};
export type CreateMatchGuestParams = { playerName: string, matchId: string };

export function handleCreateMatch(req: Request<CreateMatchParams>, res: Response): void {
  const playerName = req.params.playerName;
  const newMatch = new Match();
  // Player constructor registers itself with the match
  new Player(playerName, newMatch, true);
  res.render('createMatch.html', {
  appData: {
    matchId: newMatch.getId(),
    playerName,
    isHost: true,
    lobbyMessage: 'Your match is ready! \n\n Invite up to three friends to play by sharing your match ID (' + newMatch.getId() + ')',
  },
  });
}

export function handleCreateMatchGuest(req: Request<CreateMatchGuestParams>, res: Response): void {
  const playerName = req.params.playerName;
  let match = manager.getMatch(req.params.matchId);
  // Player constructor registers itself with the match
  new Player(playerName, match, false);
  res.render("createMatch.html", {
  appData: {
    matchId: match.getId(),
    playerName,
    isHost: false,
    lobbyMessage: "You have joined the match! \n\n Waiting for the host to start the game.",
  },
});
}
