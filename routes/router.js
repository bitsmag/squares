'use strict';
const path = require('path');
const validation = require('../middleware/validation');
const match = require('../models/match');
const player = require('../models/player');
const matchesManager = require('../models/matchesManager');

module.exports = function (app) {
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
  });

  app.get(
    '/createMatch/:playerName',
    validation.validate('params', validation.schemas.createMatchParams),
    function (req, res) {
      const playerName = req.params.playerName;
      const newMatch = new match.Match();
      const error = false;
      const _newPlayer = new player.Player(playerName, newMatch, true);
      if (!error) {
        // Send back HTML
        res.render('createMatch.html', {
          matchId: newMatch.getId(),
          playerName: playerName,
        });
      }
    }
  );

  app.get(
    '/match/:matchCreatorFlag/:matchId/:playerName',
    validation.validate('params', validation.schemas.matchRouteParams),
    function (req, res, next) {
      const matchCreatorFlag = req.params.matchCreatorFlag;
      const matchId = req.params.matchId;
      const playerName = req.params.playerName;

      let matchObj;
      try {
        matchObj = matchesManager.manager.getMatch(matchId);
      } catch (err) {
        return next(err);
      }
      if (!matchObj) return next(new Error('matchNotFound'));
      if (matchCreatorFlag === 't') {
        if (!matchObj.isActive() && playerName === matchObj.getMatchCreator().getName()) {
          matchObj.setActive(true);
          res.render('match.html', { matchId: matchId, playerName: playerName });
        } else {
          res.render('error.html', {
            errorMessage: 'There was a unknown issue - please try again.',
          });
        }
      } else if (matchCreatorFlag === 'f') {
        try {
          const _newPlayer = new player.Player(playerName, matchObj, false);
          return res.render('match.html', { matchId: matchId, playerName: playerName });
        } catch (err) {
          // Attach user-friendly message for common domain errors and delegate to error handler
          if (err && err.message === 'matchIsFull') err.userMessage = "Sorry, you're too late. The match is full already.";
          else if (err && err.message === 'matchIsActive') err.userMessage = "Sorry, you're too late. The match has already started.";
          else if (err && err.message === 'nameInUse')
            err.userMessage = 'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
          return next(err);
        }
      } else {
        res.render('error.html', {
          errorMessage: 'There was a unknown issue - please try again.',
        });
      }
    }
  );
};
