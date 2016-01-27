var direction;

var socket = io();
var matchSockets = io.connect('/matchSockets');

matchSockets.on('connect', function () {
  matchSockets.emit('connectionInfo', playerInfo);

  matchSockets.on('connectedPlayers', function(data){
    for(var i=0; i < data.playerNames.length; i++){
      $('#connectionList').append($('<li>').text(data.playerNames[i] + ' connected to the match'));
    }
  });

  matchSockets.on('playerConnected', function(connectedPlayer){
    $('#connectionList').append($('<li>').text(connectedPlayer.playerName + ' connected to the match'));
  });

  matchSockets.on('playerDisconnected', function(disconnectedPlayer){
    $('#connectionList').append($('<li>').text(disconnectedPlayer.playerName + ' disconnected from the match'));
  });

  matchSockets.on('matchCreatorDisconnected', function(){
    $('#connectionList').append($('<li class="warning">The host disconnected from this match. The match was canceled!</li>'));
    $('#connectionList').append($('<br>'));
    $('#connectionList').append($('<a href="/">Create a new match or try to join another match.</a>'));
  });

  matchSockets.on('prepareMatch', prepareMatch);

  matchSockets.on('updateBoard', updateBoard);

  matchSockets.on('clearSquares', clearSquares);

  matchSockets.on('updateScore', updateScore);

  matchSockets.on('countdown', countdown);

  matchSockets.on('matchEnd', matchEnd);

  matchSockets.on('fatalError', function(){
    matchSockets.disconnect();
    alert('There went something horribly wrong. Pleas reload the page or try to create a new match.')
  });
});

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

  $('#infoDiv').empty();
  $('#infoDiv').append('<table id="scores"></table><h2 id="countdown">...</h2>');

  for(var i = 0; i<data.players.length; i++){
    var div = '<td id="' + data.players[i].playerColor + 'Score"><br/><span class="name" class="underlined">';
    div += data.players[i].playerName;
    div += '</span><br><br>'
    div += '<span class="score">0</span><br/><br/></td>';
    $('#scores').append(div);
  }
}

function updateBoard(data){
  // Animations
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

    if(elementColor!==colors[i]){
      $(elementSelector).append('<div class="' + elementColor + '2' + colors[i] + '_' + data.playerStatuses[colors[i]].dir + '"></div><div class="static' + colors[i] + '_' + data.playerStatuses[colors[i]].dir + '"></div>');
      clearFlipAnimationAfterTimeout(elementSelector, i);
    }
    else{
      $(elementSelector).addClass('still_' + data.playerStatuses[colors[i]].dir);
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
  $('#timer').html(data.duration);
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
  $('#blueScore > .score').html(data.scores.blue);
  $('#orangeScore > .score').html(data.scores.orange);
  $('#greenScore > .score').html(data.scores.green);
  $('#redScore > .score').html(data.scores.red);
}

function countdown(data){
  if(data.countdownDuration===0){
    setKeyListener();
    startDirectionEmits();
    $('#countdown').html('GO!');
    setTimeout(function() {
      $('#countdown').remove();
      $('#infoDiv').append('<h2 id="timer"></h2>');
    }, 1500);
  }
  else{
    $('#countdown').html(data.countdownDuration);
  }
}

function matchEnd(){
  var congratsDiv = '<div id="congratsDiv" class="form-style-8"><h2>Congratulations ' + playerInfo.playerName + '</h2>';

  var scores = [];
  $('#scores > td').each(function() {
    scores[scores.length] = $('.score', this).html();
  });
  scores = scores.sort();

  var place;
  $('#scores > td').each(function() {
    if($('.name', this).html() === playerInfo.playerName){
      place = scores.indexOf($('.score', this).html());
      place = scores.length - place;
    }
  });

  congratsDiv += '</h2><div id="congratsSpinner"><img src="/img/cup.svg"/><br><span>' + place + '.</span></div><br><a href="/">Create a new match!</a>'
  $('#board').append(congratsDiv);
  $('#timer').html('...');
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
