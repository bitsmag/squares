function prepareMatch(data){
  var rows = data.board.height;
  var cols = data.board.width;
  var squareId = 0;

  var table = '<table>'
  for(var i=0; i<rows; i++){
    table += '<tr>'
    for(var j=0; j<cols; j++){
      table += '<td><div class="square" id="square' + squareId + '"';
      if(data.board.squares[squareId].color==='red'){
        table +=' style="background-color: rgb(229, 51, 127)"';
      }
      else if(data.board.squares[squareId].color==='blue'){
        table +=' style="background-color: rgb(79, 193, 223)"';
      }
      else if(data.board.squares[squareId].color==='orange'){
        table +=' style="background-color: rgb(250, 184, 35)"';
      }
      else if(data.board.squares[squareId].color==='green'){
        table +=' style="background-color: rgb(21, 179, 171)"';
      }
      else{
        table +=' style="background-color: rgb(200, 200, 200)"';
      }
      table += '></div></td>';
      squareId++;
    }
    table += '</tr>';
  }
  table += "</table>"
  $('#board').append(table);

  for(var i = 0; i<data.players.length; i++){
    var div = '<td class="' + data.players[i].playerColor + 'Score"><br/>';
    div += data.players[i].playerName;
    div += '<br/>'
    div += '<span id="' + data.players[i].playerColor + 'Score">0</span><br/><br/></td>';
    $('#scores').append(div);
  }

  // Delete the "player has joined list"
  $('#waitingDiv').remove();
}

function updateBoard(data){
  // Make animations
  var colors = ['blue', 'orange', 'green', 'red'];
  for(i=0; i<colors.length; i++){
    var elementSelector = '#square' + data.playerStatuses[colors[i]].pos;


    var elementColor;
    var rgb = {blue: 'rgb(79, 193, 223)', orange: 'rgb(250, 184, 35)', green: 'rgb(21, 179, 171)', red: 'rgb(229, 51, 127)'};
    if ($(elementSelector).css('background-color') == rgb['blue']){
      elementColor = 'blue';
    }
    else if ($(elementSelector).css('background-color') == rgb['orange']){
      elementColor = 'orange';
    }
    else if ($(elementSelector).css('background-color') == rgb['green']){
      elementColor = 'green';
    }
    else if ($(elementSelector).css('background-color') == rgb['red']){
      elementColor = 'red';
    }
    else {
      elementColor = 'white';
    }
    // Only if the square does not have this color already....
    if(elementColor!==colors[i]){
      console.log(data);
      $(elementSelector).append('<div class="' + elementColor + '2' + colors[i] + '_' + data.playerStatuses[colors[i]].dir + '"></div><div class="static' + colors[i] + '_' + data.playerStatuses[colors[i]].dir + '"></div>');
      clearFlipAnimationAfterTimeout(elementSelector, i);
    }
    else{
      $(elementSelector).addClass('still_'+data.playerStatuses[colors[i]].dir);
      clearStillFlipAnimationAfterTimeout(elementSelector, i);
    }
  }

  function clearFlipAnimationAfterTimeout(elementSelector, i){
    setTimeout(
      function(){
        $(elementSelector).css('background-color', rgb[colors[i]]);
        $(elementSelector).empty();
      }, 500);
  }
  function clearStillFlipAnimationAfterTimeout(elementSelector, i){
    setTimeout(
      function(){
        $(elementSelector).removeClass('still_'+data.playerStatuses[colors[i]].dir);
      }, 500);
  }

  $('#countdown').html(data.duration);
}

function clearSquares(data){
  function clearSquaresAfterTimeout(){
    setTimeout(
      function(){
        for(var i=0; i<data.clearSquares.length; i++){
          var elementSelector = '#square' + data.clearSquares[i];
          $(elementSelector).css( "background-color", 'rgb(200, 200, 200)');
        }
      }, 500);
  }
  clearSquaresAfterTimeout();
}

function updateScore(data){
  $('#blueScore').html(data.scores.blue);
  $('#orangeScore').html(data.scores.orange);
  $('#greenScore').html(data.scores.green);
  $('#redScore').html(data.scores.red);
}

function countdown(data){
  if(data.countdownDuration===0){
    setKeyListener();
    startDirectionEmits();
    $('#countdown').html('GO!');
    setTimeout(function() {
      $('#countdown').html('');
    }, 1500);
  }
  else{
    $('#countdown').html(data.countdownDuration);
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
          matchSockets.emit('goLeft');
          break;
        case 'up':
          matchSockets.emit('goUp');
          break;
        case 'right':
          matchSockets.emit('goRight');
          break;
        case 'down':
          matchSockets.emit('goDown');
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

  matchSockets.on('fatalError', function(){
    matchSockets.disconnect();
    alert('There went something horribly wrong. Pleas reload the page or try to create a new match.')
  });

  // Received as a response of connectionInfo - gives a list of all players which are already connected
  matchSockets.on('connectedPlayers', function(data){
    for(var i=0; i < data.playerNames.length; i++){
      $('#list').append($('<li>').text(data.playerNames[i] + ' connected to the match'));
    }
  });

  // Received when a player connects to the room
  matchSockets.on('playerConnected', function(connectedPlayer){
    $('#list').append($('<li>').text(connectedPlayer.playerName + ' connected to the match'));
  });

  matchSockets.on('playerDisconnected', function(disconnectedPlayer){
    $('#list').append($('<li>').text(disconnectedPlayer.playerName + ' disconnected from the match'));
  });

  matchSockets.on('matchCreatorDisconnected', function(){
    $('#list').append($('<li class="warning">').text('The host disconnected from this match, therefore the match is canceled!'));
  });

  // Received when four players are in the room
  matchSockets.on('prepareMatch', prepareMatch);

  // Received every tick to update the board state
  matchSockets.on('updateBoard', updateBoard);

  // Received every tick to update the board state
  matchSockets.on('clearSquares', clearSquares);

  // Received every tick to update the player scores
  matchSockets.on('updateScore', function(data){setTimeout(updateScore(data), 600)}); // Wait 600ms to complete animation

  // Received every second (x times) as soon as four players are in the room
  matchSockets.on('countdown', countdown);

});
