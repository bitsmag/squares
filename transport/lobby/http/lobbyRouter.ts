import type { Application } from 'express';
import { schemas } from '../../utilities/validation';
import { validate } from '../../utilities/http/httpValidationMiddleware';
import { createLobbyController } from './lobbyController';
import type {
  LobbyHostRequestDTO,
  LobbyGuestRequestDTO,
} from '../../../shared/dto/http/lobbyHttpDtos';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';

function lobbyRouter(app: Application, matchesManager: MatchesManager): void {
  const { handleLobbyHost: handleLobbyHost, handleLobbyGuest: handleLobbyGuest } =
    createLobbyController(matchesManager);

  app.get<LobbyHostRequestDTO>(
    '/lobby/create-match/:playerName',
    validate<LobbyHostRequestDTO>('params', schemas.lobbyHostParams),
    handleLobbyHost
  );
  app.get<LobbyGuestRequestDTO>(
    '/lobby/join-match/:matchId/:playerName',
    validate<LobbyGuestRequestDTO>('params', schemas.lobbyGuestParams),
    handleLobbyGuest
  );
}
export default lobbyRouter;
