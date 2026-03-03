from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

import os
import pickle

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import VecNormalize


class ObservationModel(BaseModel):
	board: list[dict[str, Any]]
	agent: dict[str, Any]
	scores: dict[str, Any]
	duration: float | int


app = FastAPI()


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


def _encode_obs(raw_obs: Dict[str, Any], vecnorm: Optional[VecNormalize]) -> Dict[str, np.ndarray]:
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

	if vecnorm is not None:
		try:
			obs_dict = {"board": board, "status": status}
			obs_dict = _apply_vecnormalize(vecnorm, obs_dict)
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


def _load_model_bundle(bot_id: str, default_model_path: str) -> Optional[Tuple[PPO, Optional[VecNormalize]]]:
	"""Load a PPO model and optional VecNormalize stats for a given bot id.

	Model and VecNormalize paths are configured via environment variables:
	- BOT_MODEL_<ID>_PATH (required for id 1, optional for 2-4)
	- BOT_VECNORM_<ID>_PATH (optional; defaults next to the model file)
	"""

	model_env_key = f"BOT_MODEL_{bot_id}_PATH"
	model_path = os.environ.get(model_env_key, default_model_path)
	if not os.path.exists(model_path):
		print(f"[bot-server] No model found for id '{bot_id}' at '{model_path}', skipping.")
		return None

	print(f"[bot-server] Loading model for id '{bot_id}' from '{model_path}'")
	model = PPO.load(model_path)
	model_base = os.path.splitext(model_path)[0]

	vecnorm_env_key = f"BOT_VECNORM_{bot_id}_PATH"
	default_vec_path = f"{model_base}_vecnormalize.pkl"
	vecnorm_path = os.environ.get(vecnorm_env_key, default_vec_path)
	vecnorm = _load_vecnormalize(vecnorm_path)
	if vecnorm is not None:
		print(f"[bot-server] Loaded VecNormalize stats for id '{bot_id}' from '{vecnorm_path}'")

	return model, vecnorm


# Fixed bot ids 1-4. Bot 1 is required; 2-4 fall back to 1 if not configured.
BOT_IDS = ["1", "2", "3", "4"]

MODELS: Dict[str, Tuple[PPO, Optional[VecNormalize]]] = {}

# First, load required bot 1.
bundle1 = _load_model_bundle("1", default_model_path="models/bot1.zip")
if bundle1 is None:
	raise RuntimeError("[bot-server] Failed to load required bot model for id '1' (BOT_MODEL_1_PATH).")
MODELS["1"] = bundle1

# Other bots: default to bot1's model if not configured.
for _bot_id in ["2", "3", "4"]:
	bundle = _load_model_bundle(_bot_id, default_model_path="models/bot1.zip")
	if bundle is None:
		# Fallback to bot 1's model and vecnorm.
		MODELS[_bot_id] = MODELS["1"]
		print(f"[bot-server] Using bot '1' as fallback for id '{_bot_id}'")
	else:
		MODELS[_bot_id] = bundle

DEFAULT_BOT_ID = "1"


def _act_for_id(bot_id: str, obs: ObservationModel) -> Dict[str, int]:
	"""Shared implementation to produce an action for a given bot id."""
	if bot_id not in MODELS:
		raise HTTPException(status_code=404, detail=f"Unknown bot id '{bot_id}'")
	model, vecnorm = MODELS[bot_id]
	raw_obs: Dict[str, Any] = obs.model_dump()
	encoded_obs = _encode_obs(raw_obs, vecnorm)
	action, _ = model.predict(encoded_obs, deterministic=False)
	return {"action": int(action)}


@app.post("/act")
def act_default(obs: ObservationModel) -> Dict[str, int]:
	"""Return an action using the default bot model.

	Request body must match the RlObservation JSON shape emitted by the
	Node code (botService / RL-train endpoints). Response is a simple
	{"action": int}.
	"""

	return _act_for_id(DEFAULT_BOT_ID, obs)


@app.post("/act/{bot_id}")
def act_with_id(bot_id: str, obs: ObservationModel) -> Dict[str, int]:
	"""Return an action using the model associated with the given bot id."""
	return _act_for_id(bot_id, obs)


if __name__ == "__main__":
	import uvicorn

	# Run with reduced logging: warning level, no per-request access logs.
	uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning", access_log=False)
