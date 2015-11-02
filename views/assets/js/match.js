function prepareMatch(board, thisColor, players){
  // ONLY TO FAKE TRAFFIC
  globalColor = thisColor;

  console.log(board);
  var rows = board.height;
  var cols = board.width;
  var squareID = 0;

  //$('#board').append('<h3>Your color is ' + thisColor + '!</h3>');

  var table = '<table>'
  for(var i=0; i<rows; i++){
    table += '<tr>'
    for(var j=0; j<cols; j++){
      table += '<td id="square' + squareID + '"';
      if(board.board[squareID].color==='red'){
        table +=' style="background-color: rgb(21, 179, 171)"';
      }
      else if(board.board[squareID].color==='blue'){
        table +=' style="background-color: rgb(79, 193, 223)"';
      }
      else if(board.board[squareID].color==='orange'){
        table +=' style="background-color: rgb(250, 184, 35)"';
      }
      else if(board.board[squareID].color==='green'){
        table +=' style="background-color: rgb(229, 51, 127)"';
      }
      table += '></td>';
      squareID++;
    }
    table += '</tr>';
  }
  table += "</table>"
  $('#board').append(table);

  for(var i = 0; i<players.length; i++){
    var div = '<td class="' + players[i].color + 'Score"><br/>';
    div += players[i].name;
    div += '<br/>'
    div += '<span id="' + players[i].color + 'Score">0</span><br/><br/></td>';
    $('#scores').append(div);
  }


  // Delete the "player has joined list"
  $( "#list" ).remove();
}

function updateBoard(data){
  for(var i=0; i<data.board.length; i++){
     var elementSelector = '#square' + i;
     switch(data.board[i].color){
       case 'red':
         $(elementSelector).css( "background-color", '#e5337f');
         break;
       case 'blue':
         $(elementSelector).css( "background-color", '#4fc1df');
         break;
       case 'orange':
         $(elementSelector).css( "background-color", '#fab823');
         break;
       case 'green':
         $(elementSelector).css( "background-color", '#15b3ab');
         break;
        case '':
          $(elementSelector).css( "background-color", '');
          break;
     }
  }
  $('#countdown').html(data.duration);
}

function updateScore(data){
  if(parseInt($('#blueScore').text()) !== data.scores.blue && data.scores.blue > 0){
    $('table td').filter(function() {
    var match = 'rgb(79, 193, 223)'; // match background-color: blue
    if($(this).css('background-color') == match){
      return $(this);
    }
  }).css('background-color', '#469ab0');
  }
  if(parseInt($('#orangeScore').text()) !== data.scores.orange && data.scores.orange > 0){
    $('table td').filter(function() {
    var match = 'rgb(250, 184, 35)'; // match background-color: orange
    return ( $(this).css('background-color') == match );
  }).css('background-color', '#c29225');
  }
  if(parseInt($('#greenScore').text()) !== data.scores.green && data.scores.green > 0){
    $('table td').filter(function() {
    var match = 'rgb(21, 179, 171)'; // match background-color: green
    return ( $(this).css('background-color') == match );
  }).css('background-color', '#1a8a84');
  }
  if(parseInt($('#redScore').text()) !== data.scores.red && data.scores.red > 0){
    $('table td').filter(function() {
    var match = 'rgb(229, 51, 127)'; // match background-color: red
    return ( $(this).css('background-color') == match );
  }).css('background-color', '#ab215c');
  }
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
  // ONLY TO FAKE TRAFFIC
  // if its not the blue player change direction every 600ms randomly just to cause some traffic
  if(globalColor!=='blue'){
    setInterval(function(){
      var r = Math.floor(Math.random() * 3);
      switch(r){
        case 0:
         if(direction!=='left'){
           direction = 'left';
          }
          else{
            direction = 'down';
          }
          break;
        case 1:
        if(direction!=='up'){
          direction = 'up';
         }
         else{
           direction = 'right';
         }
          break;
        case 2:
        if(direction!=='right'){
          direction = 'right';
         }
         else{
           direction = 'up';
         }
          break;
        case 3:
        if(direction!=='down'){
          direction = 'down';
         }
         else{
           direction = 'left';
         }
          break;
      }
    }, 600);
  }
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
var globalColor; //ONLY TO FAKE TRAFFIC - GETS SET IN PREPAREMATCH AND USED IN SETKEYLISTENERS
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

  // Received every tick to update the board state
  matchSockets.on('updateBoard', updateBoard);

  // Received every tick to update the player scores
  matchSockets.on('updateScore', updateScore);

  // Received every second (x times) as soon as four players are in the room
  matchSockets.on('countdown', countdown);
});
