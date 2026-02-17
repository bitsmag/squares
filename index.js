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
  function (req, res) {
    const matchCreatorFlag = req.params.matchCreatorFlag;
    const matchId = req.params.matchId;
    const playerName = req.params.playerName;

    let matchObj;
    let error = false;
    try {
      matchObj = matchesManager.manager.getMatch(matchId);
    } catch (err) {
      error = true;
      if (err.message === 'matchNotFound') {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'The match you are looking for was not found.',
        });
      } else {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'There was a unknown issue - please try again.',
        });
      }
    }
    if (!error) {
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
        let createError = false;
        try {
          const _newPlayer = new player.Player(playerName, matchObj, false);
        } catch (err) {
          createError = true;
          if (err.message === 'matchIsFull') {
            res.render(__dirname + '/views/error.html', {
              errorMessage: "Sorry, you're too late. The match is full already.",
            });
          } else if (err.message === 'matchIsActive') {
            res.render(__dirname + '/views/error.html', {
              errorMessage: "Sorry, you're too late. The match has already started.",
            });
          } else if (err.message === 'nameInUse') {
            res.render(__dirname + '/views/error.html', {
              errorMessage:
                'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.',
            });
          } else {
            res.render(__dirname + '/views/error.html', {
              errorMessage: 'There was a unknown issue - please try again.',
            });
          }
        }
        if (!createError) {
          res.render(__dirname + '/views/match.html', { matchId: matchId, playerName: playerName });
        }
      } else {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'There was a unknown issue - please try again.',
        });
      }
    }
  }
);

// 404
app.use(function (req, res, _next) {
  res.status(404).sendFile(__dirname + '/views/404.html');
});

http.listen(app.get('port'), function () {
  console.log('listening on *:' + app.get('port'));
});
