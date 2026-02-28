import type { NextFunction, Request, Response } from 'express';
import { CreateMatchLobbyService } from '../../../service/createMatchLobbyService';
import { SocketMatchEventPublisher } from '../../match/socket/matchEventPublisher';
import type { CreateMatchLobbyHostRequestDTO, CreateMatchLobbyGuestRequestDTO, CreateMatchLobbyAppDataDTO } from '../../../shared/dto/http/createMatchLobbyHttpDtos';

export type CreateMatchLobbyParams = CreateMatchLobbyHostRequestDTO;
export type CreateMatchLobbyGuestParams = CreateMatchLobbyGuestRequestDTO;

const matchEventPublisher = new SocketMatchEventPublisher();
const createMatchLobbyService = new CreateMatchLobbyService(matchEventPublisher);

export function handleCreateMatchLobbyHost(req: Request<CreateMatchLobbyParams>, res: Response, next: NextFunction): void {
  try {
    const { matchId, playerId } = createMatchLobbyService.processCreateMatchLobbyHost(req.params.playerName);
    const appData: CreateMatchLobbyAppDataDTO = {
      matchId,
      playerId,
      playerName: req.params.playerName,
      isHost: true,
      lobbyMessage: 'Your match is ready! \n\n Invite up to three friends to play by sharing your match ID (' + matchId + ')',
    };
    res.render('createMatch.html', { appData });
  } catch (err) {
    next(err);
  }
}

export function handleCreateMatchLobbyGuest(req: Request<CreateMatchLobbyGuestParams>, res: Response, next: NextFunction): void {
  try {
    const { matchId, playerId } = createMatchLobbyService.processCreateMatchLobbyGuest(req.params.matchId, req.params.playerName);
    const appData: CreateMatchLobbyAppDataDTO = {
      matchId,
      playerId,
      playerName: req.params.playerName,
      isHost: false,
      lobbyMessage: 'You have joined the match! \n\n Waiting for the host to start the game.',
    };
    res.render('createMatch.html', { appData });
  } catch (err) {
    next(err);
  }
}
