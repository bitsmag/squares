const { matchId, playerId, playerName } = window.APP_DATA;

const playerPositions = { blue: null, orange: null, green: null, red: null };

const matchSockets = io.connect('/matchSockets');

matchSockets.on('connect', function () {
  matchSockets.emit('registerPlayerAndStartMatchWhenReady', { matchId, playerId });

  matchSockets.on('prepareMatch', prepareMatch);
  matchSockets.on('updateBoard', updateBoard);
  matchSockets.on('clearSquares', clearSquares);
  matchSockets.on('updateScore', updateScore);
  matchSockets.on('countdown', countdown);
  matchSockets.on('matchEnd', matchEnd);
  matchSockets.on('fatalError', function () {
    matchSockets.disconnect();
    alert('There went something horribly wrong. Please start a new match.');
  });
});

function prepareMatch(data) {
  const rows = data.board.height;
  const cols = data.board.width;
  let squareId = 0;

  // Create board
  let table = '<table>';
  for (let i = 0; i < rows; i++) {
    table += '<tr>';
    for (let j = 0; j < cols; j++) {
      table += '<td><div class="square" id="square' + squareId + '"';
      if (data.board.squares[squareId].color === 'red') {
        table += ' style="background-color: rgb(229, 51, 127)"';
      } else if (data.board.squares[squareId].color === 'blue') {
        table += ' style="background-color: rgb(79, 193, 223)"';
      } else if (data.board.squares[squareId].color === 'orange') {
        table += ' style="background-color: rgb(250, 184, 35)"';
      } else if (data.board.squares[squareId].color === 'green') {
        table += ' style="background-color: rgb(21, 179, 171)"';
      } else {
        table += ' style="background-color: rgb(200, 200, 200)"';
      }
      table += '></div></td>';
      squareId++;
    }
    table += '</tr>';
  }
  table += '</table>';
  $('#board').append(table);

  // Create Score-div
  $('#infoDiv').empty();
  $('#infoDiv').append('<table id="scores"></table><h2 id="countdown">...</h2>');
  for (let i = 0; i < data.players.length; i++) {
    let div = '<td id="' + data.players[i].playerColor + 'Score"><br/><span class="name underlined">';
    div += data.players[i].playerName;
    div += '</span><br><br>';
    div += '<span class="score">0</span><br/><br/></td>';
    $('#scores').append(div);
  }
}

function updateBoard(data) {
  // Animations
  const colors = ['blue', 'orange', 'green', 'red'];
  const playerRgb = {
    blue: 'rgb(79, 193, 223)',
    orange: 'rgb(250, 184, 35)',
    green: 'rgb(21, 179, 171)',
    red: 'rgb(229, 51, 127)',
  };
  const borderRgb = {
    blue: 'rgb(27, 125, 151)',
    orange: 'rgb(175, 122, 4)',
    green: 'rgb(11, 91, 87)',
    red: 'rgb(113, 14, 57)',
  };

  for (let i = 0; i < colors.length; i++) {
    if (playerPositions[colors[i]] !== data.playerStatuses[colors[i]].pos) {
      const oldSquareSelector = '#square' + playerPositions[colors[i]];
      $(oldSquareSelector).css('border-color', '#C8C8C8');

      playerPositions[colors[i]] = data.playerStatuses[colors[i]].pos;
      const elementSelector = '#square' + data.playerStatuses[colors[i]].pos;

      let elementColor;
      if ($(elementSelector).css('background-color') == playerRgb.blue) {
        elementColor = 'blue';
      } else if ($(elementSelector).css('background-color') == playerRgb.orange) {
        elementColor = 'orange';
      } else if ($(elementSelector).css('background-color') == playerRgb.green) {
        elementColor = 'green';
      } else if ($(elementSelector).css('background-color') == playerRgb.red) {
        elementColor = 'red';
      } else {
        elementColor = 'white';
      }

      $(elementSelector).css('border-color', borderRgb[colors[i]]);
      const animDuration = data.playerStatuses[colors[i]].doubleSpeed ? 0.25 : 0.5;
      const anim = `${data.playerStatuses[colors[i]].dir} ${animDuration}s 1 ease-in-out, ${elementColor}2${colors[i]} ${animDuration}s 1 ease-in-out`;
      $(elementSelector).css('animation', anim);
      clearFlipAnimationAfterTimeout(elementSelector, i, animDuration);
    }
  }

  function clearFlipAnimationAfterTimeout(elementSelector, i, animDuration) {
    const timeout = animDuration === 0.25 ? 250 : 500;
    setTimeout(function () {
      $(elementSelector).css('background-color', playerRgb[colors[i]]);
      $(elementSelector).css('animation', 'none');
    }, timeout);
  }

  // Specials
  let elementSelector = '#square' + data.specials.doubleSpeed[0];
  $(elementSelector).addClass('doubleSpeed');
  elementSelector = '#square' + data.specials.getPoints[0];
  $(elementSelector).addClass('getPoints');

  // Timer
  $('#timer').html(data.duration);
}

function clearSquares(data) {
  function clearSquaresAfterTimeout() {
    setTimeout(function () {
      for (let i = 0; i < data.clearSquares.length; i++) {
        const elementSelector = '#square' + data.clearSquares[i].id;
        $(elementSelector).css('background-color', 'rgb(200, 200, 200)');
      }
    }, 500);
  }

  function doClearSquaresAnimation() {
    // Thanks https://codepen.io/Mamboleoo/pen/JjdXPgR
    const amount = 6;
    for (let i = 0; i < data.clearSquares.length; i++) {
      const elementSelector = '#square' + data.clearSquares[i].id;
      for (let j = 0; j < amount; j++) {
        const x = $(elementSelector)[0].getBoundingClientRect().left + 25;
        const y = $(elementSelector)[0].getBoundingClientRect().top + 25;
        popParticle(x, y + window.scrollY, data.clearSquares[i].color);
      }
    }
  }

  doClearSquaresAnimation();
  clearSquaresAfterTimeout();

  // Clear specials
  for (let i = 0; i < data.clearSpecials.length; i++) {
    const elementSelector = '#square' + data.clearSpecials[i];
    $(elementSelector).removeClass('doubleSpeed');
    $(elementSelector).removeClass('getPoints');
  }
}

function popParticle(x, y, color) {
  const particle = document.createElement('particle');
  document.body.appendChild(particle);
  const width = Math.floor(Math.random() * 30 + 8);
  const height = width;
  const destinationX = (Math.random() - 0.5) * 300;
  const destinationY = (Math.random() - 0.5) * 300;
  const rotation = Math.random() * 520;
  const delay = Math.random() * 100;
  let particleColor = 0;
  switch (color) {
    case 'blue':
      particleColor = 193;
      break;
    case 'orange':
      particleColor = 42;
      break;
    case 'green':
      particleColor = 155;
      break;
    case 'red':
      particleColor = 334;
      break;
  }

  particle.style.background = `hsl(${Math.random() * 50 + particleColor}, 70%, 60%)`;
  particle.style.border = '1px solid white';

  particle.style.width = `${width}px`;
  particle.style.height = `${height}px`;
  const animation = particle.animate(
    [
      {
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(0deg)`,
        opacity: 1,
      },
      {
        transform: `translate(-50%, -50%) translate(${x + destinationX}px, ${y + destinationY}px) rotate(${rotation}deg)`,
        opacity: 0,
      },
    ],
    {
      duration: Math.random() * 1000 + 1000,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      delay: delay,
    }
  );
  animation.onfinish = function (e) {
    e.srcElement.effect.target.remove();
  };
}

function updateScore(data) {
  $('#blueScore > .score').html(data.scores.blue);
  $('#orangeScore > .score').html(data.scores.orange);
  $('#greenScore > .score').html(data.scores.green);
  $('#redScore > .score').html(data.scores.red);
}

function countdown(data) {
  if (data.countdownDuration === 0) {
    setKeyListener();
    $('#countdown').html('GO!');
    setTimeout(function () {
      $('#countdown').remove();
      $('#infoDiv').append('<h2 id="timer"></h2>');
    }, 1500);
  } else {
    $('#countdown').html(data.countdownDuration);
  }
}

function matchEnd() {
  let congratsDiv = '<div id="congratsDiv" class="form-style-8"><h2>Congratulations ' + playerName + '</h2>';

  const scores = [];
  $('#scores > td').each(function () {
    scores[scores.length] = $('.score', this).html();
  });
  const sorted = scores.sort((a, b) => Number(a) - Number(b));

  let place;
  $('#scores > td').each(function () {
    if ($('.name', this).html() === playerName) {
      place = sorted.indexOf($('.score', this).html());
      place = sorted.length - place;
    }
  });

  congratsDiv += '</h2><div id="congratsSpinner"><img src="/img/cup.svg"/><br><span>' + place + '.</span></div><br><a href="/">Start a new match now!</a>';
  $('#board').append(congratsDiv);
  $('#timer').html('...');
}

function setKeyListener() {
  $(window).keydown(function (event) {
    switch (event.keyCode) {
      case 37:
        matchSockets.emit('goLeft');
        break;
      case 38:
        matchSockets.emit('goUp');
        break;
      case 39:
        matchSockets.emit('goRight');
        break;
      case 40:
        matchSockets.emit('goDown');
        break;
    }
  });
}
