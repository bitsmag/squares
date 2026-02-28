import type { Application } from 'express';
import { schemas } from '../../utilities/validation';
import { validate } from '../../utilities/http/httpValidationMiddleware';
import { createCreateMatchLobbyController } from './lobbyController';
import type {
  CreateMatchLobbyHostRequestDTO,
  CreateMatchLobbyGuestRequestDTO,
} from '../../../shared/dto/http/lobbyHttpDtos';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';

function createMatchLobbyRouter(app: Application, matchesManager: MatchesManager): void {
  const { handleCreateMatchLobbyHost, handleCreateMatchLobbyGuest } =
    createCreateMatchLobbyController(matchesManager);

  app.get<CreateMatchLobbyHostRequestDTO>(
    '/createMatchLobby/:playerName',
    validate<CreateMatchLobbyHostRequestDTO>('params', schemas.createMatchLobbyHostParams),
    handleCreateMatchLobbyHost
  );
  app.get<CreateMatchLobbyGuestRequestDTO>(
    '/createMatchLobby/:playerName/:matchId',
    validate<CreateMatchLobbyGuestRequestDTO>('params', schemas.createMatchLobbyGuestParams),
    handleCreateMatchLobbyGuest
  );
}
export default createMatchLobbyRouter;
