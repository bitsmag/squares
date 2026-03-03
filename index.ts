import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import nunjucks from 'nunjucks';
import helmet from 'helmet';
import { initSocketMessaging } from './transport/utilities/socket/socketMessaging';
import { MatchesManager } from './domain/runtime/matchesManager';
import { initSocketErrorHandler } from './transport/utilities/socket/socketErrorHandler';
import { createLobbySocketController } from './transport/lobby/socket/lobbySocketController';
import { createMatchSocketController } from './transport/match/socket/matchSocketController';
import { createLobbyListeners } from './transport/lobby/socket/lobbyListeners';
import { createMatchListeners } from './transport/match/socket/matchListeners';
import lobbyRouter from './transport/lobby/http/lobbyRouter';
import matchRouter from './transport/match/http/matchRouter';
import { createRlRouter } from './RL-train/endpoints/rlRouter';
import errorHandler from './transport/utilities/http/httpErrorHandler';

// Log unexpected errors that might otherwise crash the process
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // let Docker/systemd restart the process
});

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);
initSocketMessaging(io);

// Application-wide single instance of the matches manager
const matchesManager = new MatchesManager();
initSocketErrorHandler(matchesManager);

// Socket controllers & listeners wired with injected dependencies
const lobbySocketController = createLobbySocketController(matchesManager);
const respondLobbySockets = createLobbyListeners(lobbySocketController);

const matchSocketController = createMatchSocketController(matchesManager);
const respondMatchSockets = createMatchListeners(matchSocketController);
// Use project root for assets so compiled dist build can find original files
const projectRoot = process.cwd();
const viewsPath = path.join(projectRoot, 'views');

// Configure Nunjucks for templates
app.set('views', viewsPath);
app.set('view engine', 'html');
nunjucks.configure(viewsPath, { autoescape: true, express: app, noCache: true });

// Security: headers - disable HSTS (for local development) and set explicit CSP
app.use(helmet({ hsts: false }));

// Security: Remove Strict-Transport-Security if present (safety in case of older middleware)
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    res.removeHeader('Strict-Transport-Security');
  } catch (_e) {
    // ignore
  }
  next();
});

// Security: Configure an explicit Content Security Policy (no upgrade-insecure-requests)
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
app.use(express.static(path.join(viewsPath, 'assets')));
app.use('/js', express.static(path.join(projectRoot, 'node_modules', 'jquery', 'dist')));

// Set Port
const port = Number(process.env.PORT) || 3000;
app.set('port', port);

// Sockets
io.of('/lobbySockets').on('connection', (socket: Socket) => {
  respondLobbySockets(socket);
});

io.of('/matchSockets').on('connection', (socket: Socket) => {
  respondMatchSockets(socket);
});

// Routes
app.get('/', function (_req: Request, res: Response) {
  res.sendFile(path.join(viewsPath, 'index.html'));
});

lobbyRouter(app, matchesManager);
matchRouter(app, matchesManager);

// RL HTTP API for headless training
app.use('/rl', createRlRouter());

app.use((req: Request, res: Response) => {
  res.status(404).sendFile(path.join(viewsPath, '404.html'));
});

app.use(errorHandler);

// Start server
httpServer.listen(app.get('port'), () => {
  console.log('listening on *:' + app.get('port'));
});
