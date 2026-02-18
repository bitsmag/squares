import path from 'path';
import type { Application, Request, Response, NextFunction } from 'express';
import * as validation from '../middleware/validation';
import { Match } from '../models/match';
import { Player } from '../models/player';
import { manager } from '../models/matchesManager';

type UserError = Error & { userMessage?: string };
type CreateMatchParams = { playerName: string };
type MatchRouteParams = { matchCreatorFlag: 't' | 'f'; matchId: string; playerName: string };

const router = function (app: Application): void {
  app.get('/', function (_req: Request, res: Response) {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
  });

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

  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validation.validate('params', validation.schemas.matchRouteParams),
    function (req: Request<MatchRouteParams>, res: Response, next: NextFunction) {
      const { matchCreatorFlag, matchId, playerName } = req.params;

      let matchObj: Match | undefined;
      try {
        matchObj = manager.getMatch(matchId);
      } catch (err) {
        return next(err);
      }
      if (!matchObj) return next(new Error('matchNotFound'));

      if (matchCreatorFlag === 't') {
        if (!matchObj.isActive() && playerName === matchObj.getMatchCreator().getName()) {
          matchObj.setActive(true);
          res.render('match.html', { matchId: matchId, playerName: playerName });
          return;
        }
        const e: UserError = Object.assign(new Error('unknown'), {
          userMessage: 'There was an unknown issue - please try again.',
        });
        return next(e);
      }

      if (matchCreatorFlag === 'f') {
        try {
          new Player(playerName, matchObj, false);
          return res.render('match.html', { matchId: matchId, playerName: playerName });
        } catch (err) {
          const error = err as UserError;
          if (error && error.message === 'matchIsFull')
            error.userMessage = "Sorry, you're too late. The match is full already.";
          else if (error && error.message === 'matchIsActive')
            error.userMessage = "Sorry, you're too late. The match has already started.";
          else if (error && error.message === 'nameInUse')
            error.userMessage =
              'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
          return next(error);
        }
      }

      const e: UserError = Object.assign(new Error('unknown'), {
        userMessage: 'There was an unknown issue - please try again.',
      });
      return next(e);
    }
  );
};

export default router;
