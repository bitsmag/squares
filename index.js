"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let swig  = require('swig');

let createMatchSockets = require('./sockets/createMatchSockets');
let matchSockets = require('./sockets/matchSockets');
let matchesManager = require('./models/matchesManager');
let match = require('./models/match');
let player = require('./models/player');

// Set swig as the template engine for html files
app.engine('html', swig.renderFile);
// Express cache is active, no nee for swig-cahce
swig.setDefaults({ cache: false });
// Set path for static files
app.use(express.static(__dirname + '/views/assets'));
// Set Port (heroku-style)
app.set('port', (process.env.PORT || 3000));

/*
  * SOCKETS
  */

let createMatchSocketsConnection = io
  .of('/createMatchSockets')
  .on('connection', function (socket) {
    createMatchSockets.respond(socket);
  });

let matchSocketsConnection = io
  .of('/matchSockets')
  .on('connection', function (socket) {
    matchSockets.respond(socket ,io);
  });


/*
  * ROUTES
  */

app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/createMatch/:playerName', function(req, res){
  //Filter all non alphanumeric values in params
  let playerName = req.params.playerName;
  playerName = playerName.replace(/[^a-zA-Z0-9]/g, '');
  if(playerName.lenght>12){
    playerName = playerName.string.substring(0, 12);
  }

  if(playerName===''){
    res.status(500).send('Your name must contain only alphanumeric characters.');
  }
  else {
    let newMatch = new match.Match();
    let error = false;
    // try {
      let newPlayer = new player.Player(playerName, newMatch, true);
    // }
    // catch(err){
    //   error = true;
    //   res.status(500).send('There was a unknown issue - please try again.');
    //   newMatch.destroy();
    //   console.warn(err.message + ' // index/createMatch/:playerName');
    //   console.trace();
    // }
    if(!error) {
      //Send back HTML
      res.render(__dirname + '/views/createMatch.html', {matchId: newMatch.getId(), playerName: playerName});
    }
  }
});

app.get('/match/:matchCreatorFlag/:matchId/:playerName', function(req, res){
  // Filter all non alphanumeric values in params
  let matchCreatorFlag = req.params.matchCreatorFlag;
  matchCreatorFlag = matchCreatorFlag.replace(/[^a-zA-Z0-9]/g, '');
  let matchId = req.params.matchId;
  matchId = matchId.replace(/[^a-zA-Z0-9]/g, '');
  let playerName = req.params.playerName;
  playerName = playerName.replace(/[^a-zA-Z0-9]/g, '');
  if(playerName.lenght>12){
    playerName = playerName.substring(0, 12);
  }

  let match;
  let error = false;
  try {
    match = matchesManager.manager.getMatch(matchId);
  }
  catch(err){
    error = true;
    if(err.message==='matchNotFound'){
      res.status(500).send('The match you are looking for was not found.');
    }
    else{
      res.status(500).send('There was a unknown issue - please try again.');
    }
  }
  if(!error){
    // If the matchCreator requests this page, the player
    // object already exists (was created in /createMatch).
    // Otherwise the player-object must be created.
    if(matchCreatorFlag==='t'){
      if(!match.isActive() && playerName===match.getMatchCreator().getName()){
        match.setActive(true);
        res.render(__dirname + '/views/match.html', { matchId: matchId,
                                        playerName: playerName});
      }
      else{
        res.status(500).send('There was a unknown issue - please try again.');
      }
    }
    else if(matchCreatorFlag==='f'){
      if(playerName===''){
        res.status(500).send('Please use only alphanumeric chars in your name.');
      }
      else {
        let error = false;
        try {
          let newPlayer = new player.Player(playerName, match, false);
        }
        catch(err){
          error = true;
          if(err.message === 'matchIsFull'){
            res.status(500).send('Sorry, you\'re too late. The match is full already.');
          }
          else if(err.message === 'matchIsStarted'){
            res.status(500).send('Sorry, you\'re too late. The match has already started.');
          }
          else if(err.message === 'nameInUse'){
            res.status(500).send('Sorry, it seems that your name is already used by another player. Please choose a diffrent name.');
          }
          else{
            res.status(500).send('There was a unknown issue - please try again.');
          }
        }
        if(!error) {
          res.render(__dirname + '/views/match.html', { matchId: matchId,
                                          playerName: playerName});
        }
      }
    }
    else {
      res.status(500).send('There was a unknown issue - please try again.');
    }
  }
});

http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
});
