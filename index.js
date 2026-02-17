'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const swig = require('swig');

const createMatchSockets = require('./sockets/createMatchSockets');
const matchSockets = require('./sockets/matchSockets');
const matchesManager = require('./models/matchesManager');
const match = require('./models/match');
const player = require('./models/player');
const validation = require('./middleware/validation');

// Set swig as the template engine for html files
app.engine('html', swig.renderFile);
// Express cache is active, no nee for swig-cahce
swig.setDefaults({ cache: false });
// Set path for static files
app.use(express.static(__dirname + '/views/assets'));
// Set Port (heroku-style)
app.set('port', process.env.PORT || 3000);

/*
 * SOCKETS
 */

const _createMatchSocketsConnection = io
  .of('/createMatchSockets')
  .on('connection', function (socket) {
    createMatchSockets.respond(socket);
  });

const _matchSocketsConnection = io.of('/matchSockets').on('connection', function (socket) {
  matchSockets.respond(socket, io);
});

/*
 * ROUTES
 */

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
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
      res.render(__dirname + '/views/createMatch.html', {
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
          res.render(__dirname + '/views/match.html', { matchId: matchId, playerName: playerName });
        } else {
          res.render(__dirname + '/views/error.html', {
            errorMessage: 'There was a unknown issue - please try again.',
          });
        }
      } else if (matchCreatorFlag === 'f') {
        try {
          const _newPlayer = new player.Player(playerName, matchObj, false);
          return res.render(__dirname + '/views/match.html', { matchId: matchId, playerName: playerName });
        } catch (err) {
          // Attach user-friendly message for common domain errors and delegate to error handler
          if (err && err.message === 'matchIsFull') err.userMessage = "Sorry, you're too late. The match is full already.";
          else if (err && err.message === 'matchIsActive') err.userMessage = "Sorry, you're too late. The match has already started.";
          else if (err && err.message === 'nameInUse')
            err.userMessage = 'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
          return next(err);
        }
      } else {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'There was a unknown issue - please try again.',
        });
      }
    }
);

// 404
app.use(function (req, res, _next) {
  res.status(404).sendFile(__dirname + '/views/404.html');
});

// Centralized error handler
app.use(require('./middleware/errorHandler'));

http.listen(app.get('port'), function () {
  console.log('listening on *:' + app.get('port'));
});
