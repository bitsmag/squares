# Bot Server

This directory contains the standalone Python service that serves actions for bot players at game runtime, using a trained RL policy.

It is intentionally separate from the training code in `RL-train` so that runtime dependencies stay minimal and the domain code does not depend on training modules.

## Structure

- `bot_server.py` &mdash; FastAPI application exposing `POST /act` and `POST /act/{bot_id}`.
- `models/` &mdash; Place to store trained model files (for example `ppo_squares2.zip`).
- `requirements.txt` &mdash; Python dependencies for the bot server.

## API

- `POST /act`
   - Uses the **default bot model** (bot id `"1"`).
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

- `POST /act/{bot_id}`
   - Uses the model associated with the given `bot_id` (`"1"`, `"2"`, `"3"` or `"4"`).
   - Request/response shape is identical to `POST /act`.

The observation encoder in `bot_server.py` mirrors the training encoder but is implemented locally so this service does **not** import the Gym environment from `RL-train`.

## Running the Bot Server

1. **Create and activate a Python virtualenv** (recommended) and install deps:

   ```bash
   cd bot-server
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Place the trained model files** under `models/`:

    - The server supports up to **four bot ids**: `1`, `2`, `3`, `4`.
    - Bot `1` is required and must have a model:
       - Configure via `BOT_MODEL_1_PATH` (for example `models/001_no-opponent/ppo_squares.zip`).
    - Bots `2`–`4` are optional:
       - Configure via `BOT_MODEL_2_PATH`, `BOT_MODEL_3_PATH`, `BOT_MODEL_4_PATH`.
       - If no model is provided for an id, that bot silently falls back to bot `1`'s model.
    - Optional VecNormalize stats can be provided via `BOT_VECNORM_1_PATH` … `BOT_VECNORM_4_PATH`.

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

    - Bot players are selected by **name**:
       - `bot1`, `bot2`, `bot3`, `bot4` → call `POST /act/1`, `/act/2`, `/act/3`, `/act/4` respectively.
       - Any other `bot*` name falls back to bot `1`.

With this setup you can run multiple bots with different models (e.g. solo-trained vs opponent-trained) and watch them compete in the normal game UI.