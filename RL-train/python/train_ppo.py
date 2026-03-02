from __future__ import annotations

import os

from stable_baselines3 import PPO
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv

from squares_env import SquaresEnv


def make_env(base_url: str = "http://localhost:3000"):
	"""Factory to create a fresh monitored SquaresEnv instance."""

	def _init():
		env = SquaresEnv(base_url=base_url)
		env = Monitor(env)
		return env

	return _init


def main() -> None:
	# Ensure the Node server is running on the given base_url/port.
	base_url = os.environ.get("SQUARES_BASE_URL", "http://localhost:3000")
	model_path = os.environ.get("SQUARES_MODEL_PATH", "ppo_squares4.zip")

	# Simple single-process vectorized env
	env = DummyVecEnv([make_env(base_url)])

	# MultiInputPolicy because our observation is a Dict("board", "status")
	if os.path.exists(model_path):
		# Continue training from an existing checkpoint
		print(f"[train_ppo] Continuing training from existing model at '{model_path}'")
		model = PPO.load(model_path, env=env)
	else:
		# Start a new model from scratch
		print("[train_ppo] No existing model found; starting from scratch")
		model = PPO(
			"MultiInputPolicy",
			env,
			verbose=1,
			ent_coef=0.015,
		)

	# Adjust timesteps as needed
	model.learn(total_timesteps=4_000_000)

	# Save (or overwrite) the trained policy
	model.save(model_path.replace(".zip", ""))

	env.close()


if __name__ == "__main__":
	main()
