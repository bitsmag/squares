import type { NextFunction, Request, Response } from 'express';
import { LobbyService } from '../../../service/lobbyService';
import { SocketMatchEventPublisher } from '../../match/socket/matchEventPublisher';
import type { LobbyHostRequestDTO, LobbyGuestRequestDTO, LobbyAppDataDTO } from '../../../shared/dto/http/lobbyHttpDtos';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';

export type LobbyParams = LobbyHostRequestDTO;
export type LobbyGuestParams = LobbyGuestRequestDTO;

export function createLobbyController(matchesManager: MatchesManager) {
  const matchEventPublisher = new SocketMatchEventPublisher(matchesManager);
  const lobbyService = new LobbyService(matchesManager, matchEventPublisher);

  function handleLobbyHost(req: Request<LobbyParams>, res: Response, next: NextFunction): void {
    try {
      const { matchId, playerId } = lobbyService.processLobbyHost(req.params.playerName);
      const appData: LobbyAppDataDTO = {
        matchId,
        playerId,
        playerName: req.params.playerName,
        isHost: true,
        lobbyMessage: 'Your match is ready! \n\n Invite up to three friends to play by sharing your match ID (' + matchId + ')',
      };
      res.render('lobby.html', { appData });
    } catch (err) {
      next(err);
    }
  }

  function handleLobbyGuest(req: Request<LobbyGuestParams>, res: Response, next: NextFunction): void {
    try {
      const { matchId, playerId } = lobbyService.processLobbyGuest(req.params.matchId, req.params.playerName);
      const appData: LobbyAppDataDTO = {
        matchId,
        playerId,
        playerName: req.params.playerName,
        isHost: false,
        lobbyMessage: 'You have joined the match! \n\n Waiting for the host to start the game.',
      };
      res.render('lobby.html', { appData });
    } catch (err) {
      next(err);
    }
  }

  return { handleLobbyHost: handleLobbyHost, handleLobbyGuest: handleLobbyGuest };
}
