import type { NextFunction, Request, Response } from 'express';
import { Match } from '../../../domain/models/match';
import { manager } from '../../../domain/models/matchesManager';
import { Player } from '../../../domain/models/player';

export type CreateMatchLobbyParams = { playerName: string };
export type CreateMatchLobbyGuestParams = { playerName: string; matchId: string };

export function handleCreateMatchLobbyHost(
  req: Request<CreateMatchLobbyParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const playerName = req.params.playerName;
    const newMatch = new Match();
    new Player(playerName, newMatch, true);
    res.render('createMatch.html', {
      appData: {
        matchId: newMatch.getId(),
        playerName,
        isHost: true,
        lobbyMessage:
          'Your match is ready! \n\n Invite up to three friends to play by sharing your match ID (' +
          newMatch.getId() +
          ')',
      },
    });
  } catch (err) {
    next(err);
  }
}

export function handleCreateMatchLobbyGuest(
  req: Request<CreateMatchLobbyGuestParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const playerName = req.params.playerName;
    let match = manager.getMatch(req.params.matchId);
    new Player(playerName, match, false);
    res.render('createMatch.html', {
      appData: {
        matchId: match.getId(),
        playerName,
        isHost: false,
        lobbyMessage: 'You have joined the match! \n\n Waiting for the host to start the game.',
      },
    });
  } catch (err) {
    next(err);
  }
}
