var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var swig  = require('swig');

var createMatchSockets = require('./clientInterface/createMatchSockets');
var matchSockets = require('./clientInterface/matchSockets');
var matchesManager = require('./models/matchesManager');
var match = require('./models/match');
var player = require('./models/player');

// Set swig as the template engine
app.engine('html', swig.renderFile);
app.set('view engine', 'swig');
// Swig caches the templates -> no need that express caches them too
app.set('view cache', false);
// Get statoc filse serverd like "/js/match.js"
app.use(express.static(__dirname + '/views/assets'));

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
  // Create new Match
  var newMatch = new match.Match();
  // Add matchCreator as new Player
  var newPlayer = new player.Player(req.params.playerName, newMatch.id, true);
  newMatch.addPlayer(newPlayer);
  // Send back html
  res.render(__dirname + '/views/createMatch.html', {matchID: newMatch.id,
                                  playerName: req.params.playerName});
});

app.get('/joinMatch/:matchID/:playerName', function(req, res){
  var enquiredMatch = matchesManager.manager.getMatch(req.params.matchID);
  // If match exists create new player and add it to the match. Send info to client.
  if(enquiredMatch){
    var newPlayer = new player.Player(req.params.playerName, req.params.matchID, false);
    enquiredMatch.addPlayer(newPlayer);
    res.send({matchID: req.params.matchID,
              playerName: req.params.playerName}) // TODO dont send the data back as the client already has this information
  }
  else{
    res.send(null);
  }
});

app.get('/match/:matchID/:playerName', function(req, res){
  // Send back the match.html
  res.render(__dirname + '/views/match.html', { matchID: req.params.matchID,
                                  playerName: req.params.playerName});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
