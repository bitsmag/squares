import type { Application } from 'express';
import { schemas } from '../../util/validation';
import { validate } from '../../util/http/httpValidationMiddleware';
import { handleCreateMatchLobbyHost, handleCreateMatchLobbyGuest } from './createMatchLobbyController';
import type { CreateMatchLobbyHostRequestDTO, CreateMatchLobbyGuestRequestDTO } from '../../../shared/dto/http/createMatchLobbyHttpDtos';

function createMatchLobbyRouter(app: Application): void {
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
