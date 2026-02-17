/*CLICKHANDLER*/
$('#startMatchBtn').click(function () {
    createMatchSockets.emit('startBtnClicked');
    createMatchSockets.disconnect();
    window.location.replace('/match/t/' + playerInfo.matchId + '/' + playerInfo.playerName);
});
/*SOCKETS*/
const createMatchSockets = io.connect('/createMatchSockets');
createMatchSockets.on('connect', function () {
    createMatchSockets.emit('connectionInfo', playerInfo);
    createMatchSockets.on('playerConnected', function (_connectedPlayer) {
        // Do something
    });
    createMatchSockets.on('playerDisconnected', function (_disconnectedPlayer) {
        // Do something
    });
    createMatchSockets.on('fatalError', function () {
        createMatchSockets.disconnect();
        alert('There went something horribly wrong. Please start a new match.');
    });
});
