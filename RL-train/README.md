# RL Training

This directory contains everything needed to train reinforcement learning agents for Squares, separate from the live game runtime.

## Structure

- `endpoints/`
  - `rlEnv.ts` &mdash; Headless training environment that wraps the game engine in a `reset`/`step` API.
  - `rlRouter.ts` &mdash; Express router mounting `POST /rl/reset` and `POST /rl/step` on the Node server.
- `python/`
  - `squares_env.py` &mdash; Gymnasium `SquaresEnv` that talks to the `/rl` HTTP endpoints.
  - `train_ppo.py` &mdash; Script to train a PPO policy using Stable-Baselines3.
  - `requirements.txt` &mdash; Python dependencies for training.

The Node app mounts these routes in the main server (see `index.ts`), but they are intended only for offline/headless training.

## Manual Testing via curl

You can hit the RL endpoints directly for quick manual testing.

### Reset

```bash
curl -X POST http://localhost:3000/rl/reset \
   -H "Content-Type: application/json" \
   -d '{}' \
   | jq
```

### Step

```bash
curl -X POST http://localhost:3000/rl/step \
   -H "Content-Type: application/json" \
   -d '{"sessionId":"aa97d8b8-8989-4e4e-b406-68b19fe862a3","action":2}' \
   | jq
```

Actions are:
```bash
0: keep direction
1: left
2: up
3: right
4: down
```

To visualize the board in the terminal, you can pipe the response through this `jq` script:

```bash
jq -r '
   def bg(c):
      if c == "" or c == null then "\u001b[0m" + "  "
      elif c == "blue"   then "\u001b[44m" + "  "   # blue background
      elif c == "orange" then "\u001b[48;5;208m" + "  " # 256-color orange
      elif c == "green"  then "\u001b[42m" + "  "   # green background
      elif c == "red"    then "\u001b[41m" + "  "   # red background
      else "\u001b[47m" + "  "                      # fallback: gray/white
      end;

   .obs.board
   | group_by(.y) | sort_by(.[0].y)
   | map( sort_by(.x)
            | map(bg(.color) + "\u001b[0m")
            | join("")
      )
   | join("\n")
'
```

## Running Training

1. **Start the Node server** (from the project root):

   ```bash
   npm install
   npm run build   # if you have a build step
   npm start       # or: node dist/index.js / ts-node index.ts
   ```

   By default the server listens on `http://localhost:3000` and exposes `POST /rl/reset` and `POST /rl/step`.

2. **Create and activate a Python virtualenv** (recommended) and install training deps:

   ```bash
   cd RL-train/python
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run PPO training**:

   ```bash
   python train_ppo.py
   ```

   - A model file such as `ppo_squares.zip` will be written next to `train_ppo.py`.

   ```bash
   tensorboard --logdir ./tb_logs
   ```
   
## Notes

- The training environment can play the agent **against multiple bot opponents**. Opponent behavior comes from an external bot server (see `../bot-server`). If the bot-server is not running the model trains without opponents. 

## Environment Variables 

### Python
- `SQUARES_BASE_URL` (optional)
   - Base URL of the Squares Node server for the headless RL API.
   - Used by `train_ppo.py` to point the Gym environment at the correct server.
   - Defaults to `http://localhost:3000`.
- `SQUARES_MODEL_PATH` (optional)
   - Filesystem path for reading/writing the PPO model checkpoint.
   - Used by `train_ppo.py`.
   - Defaults to `ppo_squares2.zip` in the current working directory.

### Node
- `BOT_SERVER_URL` (optional)
   - URL for the external bot server used as opponents during RL training (this is also the one used for bot decisions in real matches)
   - Used by `endpoints/rlEnv.ts`.
   - Defaults to `http://localhost:8000/act`.