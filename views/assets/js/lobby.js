const { matchId, playerId, playerName, isHost, lobbyMessage } = window.APP_DATA;

/*CLICKHANDLER*/
$('#initiateMatchStartBtn').click(function () {
  lobbySockets.emit('matchStartInitiation', { matchId });
  lobbySockets.disconnect();
  window.location.replace('/match/' + matchId + '/' + playerId);
});

/*SOCKETS*/

const lobbySockets = io.connect('/lobbySockets');
lobbySockets.on('connect', function () {
  lobbySockets.emit('registerPlayerLobby', { matchId, playerId, playerName, isHost });

  lobbySockets.on('playerConnected', function (connectedPlayers) {
    $('#playerTable').find('[id$="PlayerName"], [id$="PlayerStatus"]').empty();

    for (let i = 0; i < connectedPlayers.players.length; i++) {
      const playerName = connectedPlayers.players[i].playerName;
      const playerColor = connectedPlayers.players[i].playerColor;

      if (playerColor === 'red') {
        $('#redPlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#redPlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'blue') {
        $('#bluePlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#bluePlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'green') {
        $('#greenPlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#greenPlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'orange') {
        $('#orangePlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#orangePlayerStatus').html(' <span class="status connected">Connected</span>');
      }

      if ($('#redPlayerName').is(':empty')) {
        $('#redPlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
      }
      if ($('#bluePlayerName').is(':empty')) {
        $('#bluePlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
      }
      if ($('#greenPlayerName').is(':empty')) {
        $('#greenPlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
      }
      if ($('#orangePlayerName').is(':empty')) {
        $('#orangePlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
      }
    }
  });

  lobbySockets.on('hostDisconnected', function () {
    $('#lobbyMessage').remove();
    $('#playerTable').remove();
    $('#cancelMessage').html(
      '<div class="alert-soft-red"><strong>The lobby has been closed by the host.</strong></div><div class="alert-link"><a href="/">Start a new match now!</a></div>'
    );

    $('#connectionList').append($('<li class="warning">The host disconnected from this match. The match was canceled!</li>'));
    $('#connectionList').append($('<br>'));
    $('#connectionList').append($('<a href="/">Start a new match now!</a>'));
  });

  lobbySockets.on('playerDisconnected', function (connectedPlayers) {
    $('#playerTable').find('[id$="PlayerName"], [id$="PlayerStatus"]').empty();

    for (let i = 0; i < connectedPlayers.players.length; i++) {
      const playerName = connectedPlayers.players[i].playerName;
      const playerColor = connectedPlayers.players[i].playerColor;

      if (playerColor === 'red') {
        $('#redPlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#redPlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'blue') {
        $('#bluePlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#bluePlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'green') {
        $('#greenPlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#greenPlayerStatus').html(' <span class="status connected">Connected</span>');
      } else if (playerColor === 'orange') {
        $('#orangePlayerName').html(' <span style="font-weight: bold;">' + playerName + '</span>');
        $('#orangePlayerStatus').html(' <span class="status connected">Connected</span>');
      }
    }

    if ($('#redPlayerName').is(':empty')) {
      $('#redPlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
    }
    if ($('#bluePlayerName').is(':empty')) {
      $('#bluePlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
    }
    if ($('#greenPlayerName').is(':empty')) {
      $('#greenPlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
    }
    if ($('#orangePlayerName').is(':empty')) {
      $('#orangePlayerName').html('<span style="font-size:small; font-weight: lighter">Waiting for player...</span>');
    }
  });

  lobbySockets.on('matchStartInitiation', function () {
    lobbySockets.disconnect();
    window.location.replace('/match/' + matchId + '/' + playerId);
  });

  lobbySockets.on('fatalError', function () {
    lobbySockets.disconnect();
    alert('There went something horribly wrong. Please start a new match.');
  });
});
