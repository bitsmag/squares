import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import nunjucks from 'nunjucks';
import helmet from 'helmet';

import * as createMatchSockets from './infrastructure/sockets/createMatchLobbyListeners';
import * as matchSockets from './infrastructure/sockets/matchListeners';
import createMatchLobbyRouter from './infrastructure/http/createMatchLobbyRouter';
import matchRouter from './infrastructure/http/matchRouter';  
import errorHandler from './infrastructure/middleware/errorHandler';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

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
io.of('/createMatchSockets').on('connection', (socket: Socket) => {
  createMatchSockets.respond(socket);
});

io.of('/matchSockets').on('connection', (socket: Socket) => {
  matchSockets.respond(socket);
});

// Routes
app.get('/', function (_req: Request, res: Response) {
    res.sendFile(path.join(viewsPath, 'index.html'));
});

createMatchLobbyRouter(app);
matchRouter(app);

app.use((req: Request, res: Response) => {
  res.status(404).sendFile(path.join(viewsPath, '404.html'));
});

app.use(errorHandler);

// Start server
httpServer.listen(app.get('port'), () => {
  console.log('listening on *:' + app.get('port'));
});
