import type { NextFunction, Request, Response } from 'express';
import { createMatchLobbyService } from '../../../service/createMatchLobbyService';

export type CreateMatchLobbyParams = { playerName: string };
export type CreateMatchLobbyGuestParams = { playerName: string; matchId: string };

export function handleCreateMatchLobbyHost(
  req: Request<CreateMatchLobbyParams>,
  res: Response,
  next: NextFunction
): void {
  try {
    const matchId = createMatchLobbyService.processCreateMatchLobbyHost(req.params.playerName);
    res.render('createMatch.html', {
      appData: {
        matchId: matchId,
        playerName: req.params.playerName,
        isHost: true,
        lobbyMessage:
          'Your match is ready! \n\n Invite up to three friends to play by sharing your match ID (' +
          matchId +
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
    const matchId = createMatchLobbyService.processCreateMatchLobbyGuest(
      req.params.matchId,
      req.params.playerName
    );
    res.render('createMatch.html', {
      appData: {
        matchId: matchId,
        playerName: req.params.playerName,
        isHost: false,
        lobbyMessage: 'You have joined the match! \n\n Waiting for the host to start the game.',
      },
    });
  } catch (err) {
    next(err);
  }
}
