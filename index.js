'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const nunjucks = require('nunjucks');
const helmet = require('helmet');

const createMatchSockets = require('./sockets/createMatchSockets');
const matchSockets = require('./sockets/matchSockets');
// application routes and further wiring are defined in ./routes

// Configure Nunjucks for templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
nunjucks.configure('views', { autoescape: true, express: app, noCache: true });
// Security headers: disable HSTS (for local development) and set explicit CSP
app.use(helmet({ hsts: false }));
// Remove Strict-Transport-Security if present (safety in case of older middleware)
app.use(function (req, res, next) {
  try {
    res.removeHeader('Strict-Transport-Security');
  } catch (e) {
    // ignore
  }
  next();
});
// Configure an explicit Content Security Policy (no upgrade-insecure-requests)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  })
);
// Parse bodies with small limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Set path for static files
app.use(express.static(__dirname + '/views/assets'));
// Serve local copy of jquery from node_modules to avoid external HTTPS requests
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
// Set Port (heroku-style)
app.set('port', process.env.PORT || 3000);

/*
 * SOCKETS
 */

const _createMatchSocketsConnection = io
  .of('/createMatchSockets')
  .on('connection', function (socket) {
    createMatchSockets.respond(socket);
  });

const _matchSocketsConnection = io.of('/matchSockets').on('connection', function (socket) {
  matchSockets.respond(socket, io);
});

/*
 * ROUTES
 */
require('./routes/router')(app);

// 404
app.use(function (req, res, _next) {
  res.status(404).sendFile(__dirname + '/views/404.html');
});

// Centralized error handler
app.use(require('./middleware/errorHandler'));

http.listen(app.get('port'), function () {
  console.log('listening on *:' + app.get('port'));
});
