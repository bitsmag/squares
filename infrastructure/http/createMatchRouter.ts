import type { Application } from 'express';
import * as validation from '../middleware/validation';
import { handleCreateMatch } from '../../controllers/createMatchController';

function createMatchRouter(app: Application): void {
  app.get(
    '/createMatch/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    handleCreateMatch
  );
}
export default createMatchRouter;
