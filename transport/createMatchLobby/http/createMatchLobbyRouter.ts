import type { Application } from 'express';
import { schemas } from '../../util/validation';
import { validate } from '../../util/http/httpValidationMiddleware';
import { createCreateMatchLobbyController } from './createMatchLobbyController';
import type {
  CreateMatchLobbyHostRequestDTO,
  CreateMatchLobbyGuestRequestDTO,
} from '../../../shared/dto/http/createMatchLobbyHttpDtos';
import type { MatchesManager } from '../../../domain/models/matchesManager';

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
