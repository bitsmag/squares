import path from 'path';
import * as validation from '../middleware/validation';
import { Match } from '../models/match';
import { Player } from '../models/player';
import { manager } from '../models/matchesManager';

const router = function (app: any) {
  app.get('/', function (_req: any, res: any) {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
  });

  app.get(
    '/createMatch/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    function (req: any, res: any) {
      const playerName = req.params.playerName;
      const newMatch = new Match();
      const _newPlayer = new Player(playerName, newMatch, true);
      res.render('createMatch.html', {
        matchId: newMatch.getId(),
        playerName: playerName,
      });
    }
  );

  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validation.validate('params', validation.schemas.matchRouteParams),
    function (req: any, res: any, next: any) {
      const matchCreatorFlag = req.params.matchCreatorFlag;
      const matchId = req.params.matchId;
      const playerName = req.params.playerName;

      let matchObj;
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
        } else {
          const e: any = new Error('unknown');
          e.userMessage = 'There was an unknown issue - please try again.';
          return next(e);
        }
      } else if (matchCreatorFlag === 'f') {
        try {
          const _newPlayer = new Player(playerName, matchObj, false);
          return res.render('match.html', { matchId: matchId, playerName: playerName });
        } catch (err: any) {
          if (err && err.message === 'matchIsFull')
            err.userMessage = "Sorry, you're too late. The match is full already.";
          else if (err && err.message === 'matchIsActive')
            err.userMessage = "Sorry, you're too late. The match has already started.";
          else if (err && err.message === 'nameInUse')
            err.userMessage =
              'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
          return next(err);
        }
      } else {
        const e: any = new Error('unknown');
        e.userMessage = 'There was an unknown issue - please try again.';
        return next(e);
      }
    }
  );
};

export default router;
