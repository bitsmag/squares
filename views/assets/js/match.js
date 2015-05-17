function prepareMatch(board, thisColor){
  console.log(board);
  var rows = board.height;
  var cols = board.width;
  var squareID = 0;

  $('#board').append('<h3>Your color is ' + thisColor + '!</h3>');

  var table = '<table>'
  for(var i=0; i<rows; i++){
    table += '<tr>'
    for(var j=0; j<cols; j++){
      table += '<td id="square' + squareID + '">' + board.board[squareID].color + '</td>';
      squareID++;
    }
    table += '</tr>';
  }
  table += "</table>"
  $('#board').append(table);
  // Delete the "player has joined list"
  $( "#list" ).remove();
}

function tickUpdate(data){
  for(var i=0; i<data.board.length; i++){
    elementSelector = '#square' + i;
    $(elementSelector).html(data.board[i].color)
  }
  $('#countdown').html(data.duration);
  $('#blueScore').html(data.scores.blue);
  $('#orangeScore').html(data.scores.orange);
  $('#greenScore').html(data.scores.green);
  $('#redScore').html(data.scores.red);
}

function countdown(secondsLeft){
  if(secondsLeft===0){
    setKeyListener();
    startDirectionEmits();
    $('#countdown').html('GO!');
    setTimeout(function() {
      $('#countdown').html('');
    }, 1500);
  }
  else{
    $('#countdown').html(secondsLeft);
  }
}

function setKeyListener(){
  $(window).keydown(function(event){
    switch(event.keyCode){
      case 37:
        direction = 'left';
        break;
      case 38:
        direction = 'up';
        break;
      case 39:
        direction = 'right';
        break;
      case 40:
        direction = 'down'
        break;
    }
  });
}

function startDirectionEmits(){
    setInterval(function(){
      switch(direction){
        case 'left':
          matchSockets.emit('goLeft', playerInfo);
          break;
        case 'up':
          matchSockets.emit('goUp', playerInfo);
          break;
        case 'right':
          matchSockets.emit('goRight', playerInfo);
          break;
        case 'down':
          matchSockets.emit('goDown', playerInfo);
          break;
      }
    }, 100);
}


// TODO: GLOBAL VAR DIRECTION !!!
var direction;
// TODO: GLOBAL VAR DIRECTION !!!

var socket = io();
var matchSockets = io.connect('/matchSockets');

matchSockets.on('connect', function () {
  // Send the playerInfo as soon as
  matchSockets.emit('connectionInfo', playerInfo);

  // Received when a player connects to the room
  matchSockets.on('player connected', function(playerInfo){
    $('#list').append($('<li>').text('Player ' + playerInfo.playerName + ' with color ' + playerInfo.playerColor + ' connected to this match (' + playerInfo.matchID + ')'));
  });

  // Received when four players are in the room
  matchSockets.on('prepare match', prepareMatch);

  // Received when four players are in the room
  matchSockets.on('tickUpdate', tickUpdate);

  // Received every second (x times) as soon as four players are in the room
  matchSockets.on('countdown', countdown);
});
