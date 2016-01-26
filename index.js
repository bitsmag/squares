var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var swig  = require('swig');

var createMatchSockets = require('./sockets/createMatchSockets');
var matchSockets = require('./sockets/matchSockets');
var matchesManager = require('./models/matchesManager');
var match = require('./models/match');
var player = require('./models/player');

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

var createMatchSocketsConnection = io
  .of('/createMatchSockets')
  .on('connection', function (socket) {
    createMatchSockets.respond(socket);
  });

var matchSocketsConnection = io
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
  var playerName = req.params.playerName;
  playerName = playerName.replace(/\W/g, '');

  if(playerName===''){
    res.status(500).send('Your name must contain only alphanumeric characters.');
  }
  else {
    var newMatch = new match.Match();
    var error = false;
    // try {
      var newPlayer = new player.Player(playerName, newMatch, true);
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
  var matchCreatorFlag = req.params.matchCreatorFlag;
  matchCreatorFlag = matchCreatorFlag.replace(/\W/g, '');
  var matchId = req.params.matchId;
  matchId = matchId.replace(/\W/g, '');
  var playerName = req.params.playerName;
  playerName = playerName.replace(/\W/g, '');

  var match;
  var error = false;
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
        var error = false;
        try {
          var newPlayer = new player.Player(playerName, match, false);
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
