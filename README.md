![alt-text](https://cdn.jsdelivr.net/gh/bitsmag/squares@master/views/assets/img/logo.svg "SQUARES")

SQUARES is a small real‑time multiplayer web game inspired by
[Crash Bash – Pogo Painter](https://www.youtube.com/watch?v=Cq7yoWxOuBU).
Players move around a grid, claim squares with their color, and compete to
control as much of the board as possible before the timer runs out.

The server is built with Node.js, TypeScript, Express, and Socket.IO. The
codebase is organised into a domain / service / transport layering to
keep the game rules independent from HTTP and WebSocket details.

You can try it out here here: <http://squares-env.eba-ahjhmhaf.us-west-2.elasticbeanstalk.com>

## Getting Started

```bash
npm install
npm start     # start the game server on http://localhost:3000
```

## Project Structure (Backend)

- `domain/` – core game model and engine (board, match, players, tick rules).
- `service/` – application services for lobbies, match lifecycle, and presence.
- `transport/` – HTTP routes and Socket.IO controllers, validation, and error handling.
- `test/` – unit and integration tests for the core game logic.

## Reinforcement Learning & Bots

This repo also contains optional tooling for reinforcement‑learning agents and
runtime bots:

- Training pipeline: see [RL-train/README.md](RL-train/README.md) for how to expose a headless `/rl` API from the Node server and train PPO agents via Gymnasium/Stable-Baselines3.
- Runtime bot server: see [bot-server/README.md](bot-server/README.md) for how to run a separate Python service that controls in-game bot players via HTTP.