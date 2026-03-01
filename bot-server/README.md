# Bot Server

This directory contains the standalone Python service that serves actions for bot players at game runtime, using a trained RL policy.

It is intentionally separate from the training code in `RL-train` so that runtime dependencies stay minimal and the domain code does not depend on training modules.

## Structure

- `bot_server.py` &mdash; FastAPI application exposing `POST /act`.
- `models/` &mdash; Place to store trained model files (for example `ppo_squares2.zip`).
- `requirements.txt` &mdash; Python dependencies for the bot server.

## API

- `POST /act`
  - **Request body**: a JSON object matching the observation shape produced by the Node backend (see `domain/engine/utilities/botService.ts`):
    - `board`: list of `{ id, x, y, color, doubleSpeedSpecial, getPointsSpecial }`
    - `agent`: `{ color, pos, dir, doubleSpeed, score }`
    - `scores`: per-color score object
    - `duration`: remaining match duration
  - **Response**: `{ "action": number }`, where action is:
    - `0` &mdash; keep direction
    - `1` &mdash; left
    - `2` &mdash; up
    - `3` &mdash; right
    - `4` &mdash; down

The observation encoder in `bot_server.py` mirrors the training encoder but is implemented locally so this service does **not** import the Gym environment from `RL-train`.

## Running the Bot Server

1. **Create and activate a Python virtualenv** (recommended) and install deps:

   ```bash
   cd bot-server
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Place the trained model file** (e.g. `ppo_squares2.zip`) where `bot_server.py` expects it:

   - By default, `bot_server.py` loads `ppo_squares2.zip` from the current working directory.
   - A common pattern is to keep models in the local `models/` directory and start the server from there, or adjust the path in `bot_server.py` to point at `models/ppo_squares2.zip`.

3. **Start the server**:

   ```bash
   # Simple entry point
   python bot_server.py

   # Or via uvicorn
   uvicorn bot_server:app --host 0.0.0.0 --port 8000
   ```

4. **Configure the Node backend to talk to it**:

   - The Node code uses the environment variable `BOT_SERVER_URL` (see `domain/engine/utilities/botService.ts`).
   - If unset, it defaults to `http://localhost:8000/act`.
   - Example:

     ```bash
     export BOT_SERVER_URL="http://localhost:8000/act"
     npm start
     ```

With this setup, any player whose name starts with `bot` will have its direction chosen by this bot server on each tick.