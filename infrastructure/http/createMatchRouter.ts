import path from 'path';
import type { Application, Request, Response } from 'express';
import * as validation from '../middleware/validation';
import { Match } from '../../models/match';
import { Player } from '../../models/player';

const projectRoot = process.cwd();
const viewsPath = path.join(projectRoot, 'views');

type CreateMatchParams = { playerName: string };

function createMatchRouter(app: Application): void {
  app.get(
    '/createMatch/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    function (req: Request<CreateMatchParams>, res: Response) {
      const playerName = req.params.playerName;
      const newMatch = new Match();
      // Player constructor registers itself with the match
      new Player(playerName, newMatch, true);
      res.render('createMatch.html', {
        matchId: newMatch.getId(),
        playerName: playerName,
      });
    }
  );
}
export default createMatchRouter;
