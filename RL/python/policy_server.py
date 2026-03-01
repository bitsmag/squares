from __future__ import annotations

from typing import Any, Dict

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from stable_baselines3 import PPO

from squares_env import SquaresEnv


class ObservationModel(BaseModel):
    board: list[dict[str, Any]]
    agent: dict[str, Any]
    scores: dict[str, Any]
    duration: float | int


app = FastAPI()

# Load trained policy once at startup
MODEL_PATH = "ppo_squares2.zip"
model = PPO.load(MODEL_PATH)

# Dummy env instance to reuse the encoding logic
_env_dummy = SquaresEnv()


def _encode_obs_from_raw(raw_obs: Dict[str, Any]) -> Dict[str, np.ndarray]:
    # Reuse the same encoding that was used during training
    return _env_dummy._encode_obs(raw_obs)  # type: ignore[attr-defined]


@app.post("/act")
def act(obs: ObservationModel) -> Dict[str, int]:
    """Return an action for a given raw observation.

    Request body must match the RlObservation JSON shape emitted by the
    Node RL wrapper (RL/rlEnv.ts). Response is a simple {"action": int}.
    """
    raw_obs: Dict[str, Any] = obs.model_dump()
    encoded_obs = _encode_obs_from_raw(raw_obs)
    action, _ = model.predict(encoded_obs, deterministic=False)
    return {"action": int(action)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
