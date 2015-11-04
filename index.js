var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var swig  = require('swig');
var bodyParser = require("body-parser");

var createMatchSockets = require('./clientInterface/createMatchSockets');
var matchSockets = require('./clientInterface/matchSockets');
var matchesManager = require('./models/matchesManager');
var match = require('./models/match');
var player = require('./models/player');
var createMatch = require('./controllers/createMatch');

// Set swig as the template engine
app.engine('html', swig.renderFile);
app.set('view engine', 'swig');
// Swig caches the templates -> no need that express caches them too
app.set('view cache', false);
// Set Port (heroku-style)
app.set('port', (process.env.PORT || 3000));
// Get statoc filse serverd like "/js/match.js"
app.use(express.static(__dirname + '/views/assets'));
// Send failure page in case of error
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Sorry, something went wrong :(');
});
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));



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

app.post('/nameCheck', function (req, res) {
  //Filter all non alphanumeric values
  var playerName = req.body.playerName;
  playerName = playerName.replace(/\W/g, '');
  //Send back clean name
  res.send(playerName);
});

app.get('/createMatch/:playerName', function(req, res){
  //Filter all non alphanumeric values
  var playerName = req.params.playerName;
  playerName = playerName.replace(/\W/g, '');
  //Create match
  var matchID = createMatch.createMatch(playerName);
  //Send back HTML
  res.render(__dirname + '/views/createMatch.html', {matchID: matchID, playerName: playerName});
});

app.post('/joinMatch', function(req, res){
  //Filter all non alphanumeric values
  var matchID = req.body.matchID;
  matchID = matchID.replace(/\W/g, '');
  var playerName = req.body.playerName;
  playerName = playerName.replace(/\W/g, '');
  //Join match
  var joinMatch = createMatch.joinMatch(matchID, playerName);
  //Handle errors
  if(joinMatch instanceof Error){
    console.log(joinMatch);
    if(joinMatch.message==='nameAlreadyInUse'){
      res.status(418).json({ error: 'nameAlreadyInUse'});
    }
    else if(joinMatch.message==='matchNotFound'){
      res.status(418).json({ error: 'matchNotFound'});
    }
    else if(joinMatch.message==='matchIsFull'){
      res.status(418).json({ error: 'matchIsFull'});
    }
    else{
      res.status(418).json({ error: 'unknownError'});
    }
  }
  //Success
  else{
    res.send({matchID: matchID, playerName: playerName})
  }
});

app.get('/match/:matchID/:playerName', function(req, res){
  //Filter all non alphanumeric values
  var matchID = req.params.matchID;
  matchID = matchID.replace(/\W/g, '');
  var playerName = req.params.playerName;
  playerName = playerName.replace(/\W/g, '');

  //Check if match and player exist
  var errorOccured = false;

  var enquiredMatch = matchesManager.manager.getMatch(matchID);
  // Check if match with given matchID exists
  if(enquiredMatch instanceof Error){
    errorOccured = true;
    if(enquiredMatch.message==='matchNotFound'){
      res.status(500).send('We could not find the match you are looking for.');
    }
    else{
      res.status(500).send('There was a unknown issue - please try again.');
    }
  }
  else{
    var enquiringPlayer = enquiredMatch.getPlayer(playerName);
    // Check if player with given name exists
    if(enquiringPlayer instanceof Error){
      errorOccured = true;
      if(enquiringPlayer.message==='playerNotFound'){
        res.status(500).send('We could not find your player in this match.');
      }
      else{
        res.status(500).send('There was a unknown issue - please try again.');
      }
    }
  }

  // Everything fine (both exists)
  if(!errorOccured){
    res.render(__dirname + '/views/match.html', { matchID: req.params.matchID,
                                  playerName: req.params.playerName});
  }
});

http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
});
