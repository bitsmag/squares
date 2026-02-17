"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const helmet_1 = __importDefault(require("helmet"));
const createMatchSockets = __importStar(require("./sockets/createMatchSockets"));
const matchSockets = __importStar(require("./sockets/matchSockets"));
const router_1 = __importDefault(require("./routes/router"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer);
// Use project root for assets so compiled dist build can find original files
const projectRoot = process.cwd();
const viewsPath = path_1.default.join(projectRoot, 'views');
// Configure Nunjucks for templates
app.set('views', viewsPath);
app.set('view engine', 'html');
nunjucks_1.default.configure(viewsPath, { autoescape: true, express: app, noCache: true });
// Security headers: disable HSTS (for local development) and set explicit CSP
app.use((0, helmet_1.default)({ hsts: false }));
// Remove Strict-Transport-Security if present (safety in case of older middleware)
app.use((req, res, next) => {
    try {
        res.removeHeader('Strict-Transport-Security');
    }
    catch (_e) {
        // ignore
    }
    next();
});
// Configure an explicit Content Security Policy (no upgrade-insecure-requests)
app.use(helmet_1.default.contentSecurityPolicy({
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
}));
// Parse bodies with small limits
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Set path for static files
app.use(express_1.default.static(path_1.default.join(viewsPath, 'assets')));
// Serve local copy of jquery from node_modules to avoid external HTTPS requests
app.use('/js', express_1.default.static(path_1.default.join(projectRoot, 'node_modules', 'jquery', 'dist')));
// Set Port (heroku-style)
const port = Number(process.env.PORT) || 3000;
app.set('port', port);
/*
 * SOCKETS
 */
io.of('/createMatchSockets').on('connection', (socket) => {
    createMatchSockets.respond(socket);
});
io.of('/matchSockets').on('connection', (socket) => {
    matchSockets.respond(socket);
});
/*
 * ROUTES
 */
(0, router_1.default)(app);
// 404
app.use((req, res) => {
    res.status(404).sendFile(path_1.default.join(viewsPath, '404.html'));
});
// Centralized error handler
app.use(errorHandler_1.default);
httpServer.listen(app.get('port'), () => {
    console.log('listening on *:' + app.get('port'));
});
