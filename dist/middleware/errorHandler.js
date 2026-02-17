"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Centralized Express error handler
function errorHandler(err, req, res, _next) {
    const context = err.context || 'server';
    console.error('Error (%s):', context, err && err.stack ? err.stack : err);
    if (req && req.originalUrl && req.originalUrl.startsWith('/')) {
        if (err && err.message === 'matchNotFound') {
            return res.status(404).render('error.html', {
                errorMessage: 'The match you are looking for was not found.',
            });
        }
    }
    if (req && req.accepts && req.accepts('html')) {
        return res.status(err.status || 500).render('error.html', {
            errorMessage: err.userMessage || 'There was an unknown issue - please try again.',
        });
    }
    res.status(err.status || 500).json({ error: err.userMessage || 'Internal Server Error' });
}
exports.default = errorHandler;
module.exports = errorHandler;
