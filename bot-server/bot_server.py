from __future__ import annotations

from typing import Any, Dict, Optional

import os
import pickle

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import VecNormalize


class ObservationModel(BaseModel):
	board: list[dict[str, Any]]
	agent: dict[str, Any]
	scores: dict[str, Any]
	duration: float | int


app = FastAPI()

MODEL_PATH = os.environ.get("BOT_MODEL_PATH", "models/ppo_squares.zip")
MODEL_BASE = os.path.splitext(MODEL_PATH)[0]
VECNORM_PATH = os.environ.get("BOT_VECNORM_PATH", f"{MODEL_BASE}_vecnormalize.pkl")

model = PPO.load(MODEL_PATH)


def _load_vecnormalize(path: str) -> Optional[VecNormalize]:
	"""Load VecNormalize stats if available, otherwise return None."""
	if not os.path.exists(path):
		return None
	try:
		with open(path, "rb") as f:
			vecnorm = pickle.load(f)
		if not isinstance(vecnorm, VecNormalize):
			return None
		# Do not update stats or rewards at runtime
		vecnorm.training = False
		vecnorm.norm_reward = False
		return vecnorm
	except Exception:
		return None


VECNORM: Optional[VecNormalize] = _load_vecnormalize(VECNORM_PATH)


def _encode_obs(raw_obs: Dict[str, Any]) -> Dict[str, np.ndarray]:
	"""Encode raw observation JSON into tensors for the PPO policy.

	This mirrors the training-time encoding logic but is implemented
	independently so the runtime bot server does not depend on the
	training environment module.
	"""

	board_shape = (7, 9, 9)
	board = np.zeros(board_shape, dtype=np.float32)

	agent_color = raw_obs["agent"]["color"]

	color_map: Dict[str, int] = {
		"": 0,
		agent_color: 1,
	}
	next_idx = 2
	for sq in raw_obs["board"]:
		c = sq["color"]
		if c not in color_map and c != "":
			if next_idx <= 4:
				color_map[c] = next_idx
				next_idx += 1

	for sq in raw_obs["board"]:
		x = int(sq["x"])
		y = int(sq["y"])
		c = sq["color"]

		color_idx = color_map.get(c, 0)
		if 0 <= color_idx <= 4:
			board[color_idx, y, x] = 1.0

		if sq["doubleSpeedSpecial"]:
			board[5, y, x] = 1.0
		if sq["getPointsSpecial"]:
			board[6, y, x] = 1.0

	agent = raw_obs["agent"]
	pos = int(agent["pos"])
	dir_str = agent["dir"]
	double_speed = 1.0 if agent["doubleSpeed"] else 0.0
	score = float(agent["score"])

	dir_idx_map: Dict[Any, int] = {
		None: 0,
		"left": 1,
		"up": 2,
		"right": 3,
		"down": 4,
	}
	dir_idx = float(dir_idx_map.get(dir_str, 0))

	width = board_shape[2]
	x = float(pos % width)
	y = float(pos // width)

	status = np.array([x, y, dir_idx, double_speed, score], dtype=np.float32)

	if VECNORM is not None:
		try:
			obs_dict = {"board": board, "status": status}
			obs_dict = _apply_vecnormalize(VECNORM, obs_dict)
			board = obs_dict["board"]
			status = obs_dict["status"]
		except Exception:
			pass

	return {"board": board, "status": status}


def _apply_vecnormalize(vecnorm: VecNormalize, obs: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
	"""Apply VecNormalize-style observation normalization to a single dict obs."""
	normalized: Dict[str, np.ndarray] = {}
	# VecNormalize stores per-key RunningMeanStd objects in obs_rms
	for key, value in obs.items():
		rms = getattr(vecnorm, "obs_rms", {}).get(key)  # type: ignore[union-attr]
		if rms is None:
			normalized[key] = value
			continue

		mean = rms.mean
		var = rms.var
		eps = getattr(vecnorm, "epsilon", 1e-8)
		clip = getattr(vecnorm, "clip_obs", np.inf)

		norm = (value - mean) / np.sqrt(var + eps)
		normalized[key] = np.clip(norm, -clip, clip)

	return normalized


@app.post("/act")
def act(obs: ObservationModel) -> Dict[str, int]:
	"""Return an action for a given raw observation.

	Request body must match the RlObservation JSON shape emitted by the
	Node code (botService / RL-train endpoints). Response is a simple
	{"action": int}.
	"""

	raw_obs: Dict[str, Any] = obs.model_dump()
	encoded_obs = _encode_obs(raw_obs)
	action, _ = model.predict(encoded_obs, deterministic=False)
	return {"action": int(action)}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host="0.0.0.0", port=8000)
