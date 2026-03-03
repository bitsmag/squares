import json
from typing import Any, Dict, Tuple

import numpy as np
import requests
import gymnasium as gym
from gymnasium import spaces


class SquaresEnv(gym.Env):
	"""Gymnasium-compatible environment for the Squares game.

	Talks to the Node server's /rl/reset and /rl/step HTTP endpoints
	exposed by the RL-train/endpoints/rlRouter.ts in this project.
	"""

	metadata = {"render_modes": ["human"], "render_fps": 4}

	def __init__(self, base_url: str = "http://localhost:3000", render_mode: str | None = None):
		super().__init__()
		self.base_url = base_url.rstrip("/")
		self.render_mode = render_mode

		# Actions: 0 = keep direction, 1 = left, 2 = up, 3 = right, 4 = down
		self.action_space = spaces.Discrete(5)

		# Observation: board (7 channels, 9x9) + status vector (5 scalars)
		# Channels:
		#   0..4: one-hot of color ['', agent, other1, other2, other3]
		#   5: doubleSpeedSpecial mask
		#   6: getPointsSpecial mask
		self.board_shape = (7, 9, 9)
		self.obs_board_space = spaces.Box(
			low=0.0, high=1.0, shape=self.board_shape, dtype=np.float32
		)

		# status: [x (0..8), y (0..8), dir_idx (0..4), doubleSpeed (0/1), score]
		# dir_idx: 0=none, 1=left, 2=up, 3=right, 4=down
		self.obs_status_space = spaces.Box(
			low=np.array([0, 0, 0, 0, 0], dtype=np.float32),
			high=np.array([8, 8, 4, 1, np.inf], dtype=np.float32),
			dtype=np.float32,
		)

		self.observation_space = spaces.Dict(
			{
				"board": self.obs_board_space,
				"status": self.obs_status_space,
			}
		)

		self._session_id: str | None = None
		self._last_score: float = 0.0
		self._last_raw_obs: Dict[str, Any] | None = None

	# ---- HTTP helpers ----

	def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
		url = f"{self.base_url}{path}"
		r = requests.post(url, json=payload, timeout=5.0)
		r.raise_for_status()
		return r.json()

	def _backend_reset(self) -> Dict[str, Any]:
		data = self._post("/rl/reset", {})
		self._session_id = data["sessionId"]
		return data["obs"]

	def _backend_step(self, action: int) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
		assert self._session_id is not None, "Session not initialized; call reset() first."
		data = self._post("/rl/step", {"sessionId": self._session_id, "action": int(action)})
		return data["obs"], float(data["reward"]), bool(data["done"]), data.get("info", {})

	# ---- Observation encoding ----

	def _encode_obs(self, raw_obs: Dict[str, Any]) -> Dict[str, np.ndarray]:
		"""Convert JSON obs from Node into tensors for SB3.

		raw_obs structure:
		  - board: list of {id, x, y, color, doubleSpeedSpecial, getPointsSpecial}
		  - agent: {color, pos, dir, doubleSpeed, score}
		  - scores: {blue, orange, green, red}
		  - duration: number
		"""
		agent_color = raw_obs["agent"]["color"]
		board = np.zeros(self.board_shape, dtype=np.float32)  # (C, H, W)

		# Map colors to indices: 0 empty, 1=agent, 2..4 = other colors
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

		# status vector
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

		width = self.board_shape[2]
		x = float(pos % width)
		y = float(pos // width)

		status = np.array([x, y, dir_idx, double_speed, score], dtype=np.float32)

		return {"board": board, "status": status}

	# ---- Gym API ----

	def reset(self, *, seed: int | None = None, options: Dict[str, Any] | None = None):
		super().reset(seed=seed)
		raw_obs = self._backend_reset()
		self._last_raw_obs = raw_obs
		self._last_score = float(raw_obs["agent"]["score"])
		obs = self._encode_obs(raw_obs)
		info: Dict[str, Any] = {}
		return obs, info

	def step(self, action: int):
		raw_obs, reward, done, info = self._backend_step(action)
		self._last_raw_obs = raw_obs

		# Backend reward is already score delta; we trust it here.
		self._last_score = float(raw_obs["agent"]["score"])

		obs = self._encode_obs(raw_obs)
		terminated = done
		truncated = False  # could use a max_steps cap if desired
		return obs, reward, terminated, truncated, info

	def render(self):
		if self.render_mode != "human" or self._last_raw_obs is None:
			return
		agent = self._last_raw_obs["agent"]
		duration = self._last_raw_obs["duration"]
		print(
			f"Agent pos={agent['pos']} dir={agent['dir']} "
			f"score={agent['score']} duration={duration}"
		)

	def close(self):
		# Nothing to close for a simple HTTP client
		pass
