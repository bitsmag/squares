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

app.get('/createMatch/:playerName', function (req, res) {
  //Filter all non alphanumeric values in params
  let playerName = req.params.playerName;
  playerName = playerName.replace(/[^a-zA-Z0-9]/g, '');
  if (playerName.length > 12) {
    playerName = playerName.substring(0, 12);
  }

  if (playerName === '') {
    res.render(__dirname + '/views/error.html', {
      errorMessage: 'Your name must contain only alphanumeric characters.',
    });
  } else {
    const newMatch = new match.Match();
    const error = false;
    // try {
    const _newPlayer = new player.Player(playerName, newMatch, true);
    // }
    // catch(err){
    //   error = true;
    //   res.status(500).send('There was a unknown issue - please try again.');
    //   newMatch.destroy();
    //   console.warn(err.message + ' // index/createMatch/:playerName');
    //   console.trace();
    // }
    if (!error) {
      //Send back HTML
      res.render(__dirname + '/views/createMatch.html', {
        matchId: newMatch.getId(),
        playerName: playerName,
      });
    }
  }
});

app.get('/match/:matchCreatorFlag/:matchId/:playerName', function (req, res) {
  // Filter all non alphanumeric values in params
  let matchCreatorFlag = req.params.matchCreatorFlag;
  matchCreatorFlag = matchCreatorFlag.replace(/[^a-zA-Z0-9]/g, '');
  let matchId = req.params.matchId;
  matchId = matchId.replace(/[^a-zA-Z0-9]/g, '');
  let playerName = req.params.playerName;
  playerName = playerName.replace(/[^a-zA-Z0-9]/g, '');
  if (playerName.length > 12) {
    playerName = playerName.substring(0, 12);
  }

  let match;
  let error = false;
  try {
    match = matchesManager.manager.getMatch(matchId);
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
    // If the matchCreator requests this page, the player
    // object already exists (was created in /createMatch).
    // Otherwise the player-object must be created.
    if (matchCreatorFlag === 't') {
      if (!match.isActive() && playerName === match.getMatchCreator().getName()) {
        match.setActive(true);
        res.render(__dirname + '/views/match.html', { matchId: matchId, playerName: playerName });
      } else {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'There was a unknown issue - please try again.',
        });
      }
    } else if (matchCreatorFlag === 'f') {
      if (playerName === '') {
        res.render(__dirname + '/views/error.html', {
          errorMessage: 'Please use only alphanumeric chars in your name.',
        });
      } else {
        let error = false;
        try {
          const _newPlayer = new player.Player(playerName, match, false);
        } catch (err) {
          error = true;
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
        if (!error) {
          res.render(__dirname + '/views/match.html', { matchId: matchId, playerName: playerName });
        }
      }
    } else {
      res.render(__dirname + '/views/error.html', {
        errorMessage: 'There was a unknown issue - please try again.',
      });
    }
  }
});

// 404
app.use(function (req, res, _next) {
  res.status(404).sendFile(__dirname + '/views/404.html');
});

http.listen(app.get('port'), function () {
  console.log('listening on *:' + app.get('port'));
});
