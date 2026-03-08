from __future__ import annotations

import os

from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback
from stable_baselines3.common.logger import configure
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize

from squares_env import SquaresEnv


def make_env(base_url: str = "http://localhost:3000"):
	"""Factory to create a fresh monitored SquaresEnv instance."""

	def _init():
		env = SquaresEnv(base_url=base_url)
		env = Monitor(env)
		return env

	return _init


class SnapshotCallback(BaseCallback):
	"""Periodically save model and VecNormalize stats during training.

	This helps you recover intermediate checkpoints and inspect progress
	without waiting for the full training run to finish.
	"""

	def __init__(self, save_freq: int, model_base: str, vecnorm_path: str, verbose: int = 1):
		super().__init__(verbose)
		self.save_freq = save_freq
		self.model_base = model_base
		self.vecnorm_path = vecnorm_path

	def _on_step(self) -> bool:  # type: ignore[override]
		if self.n_calls % self.save_freq != 0:
			return True

		step = int(self.num_timesteps)
		model_path = f"{self.model_base}_step{step}.zip"
		self.model.save(model_path)

		# If the env is VecNormalize, persist its stats as well.
		env = self.training_env
		if isinstance(env, VecNormalize):
			env.save(self.vecnorm_path.replace(".pkl", f"_step{step}.pkl"))

		if self.verbose:
			print(f"[train_ppo] Saved snapshot at step {step} -> '{model_path}'")

		return True


def main() -> None:
	# Ensure the Node server is running on the given base_url/port.
	base_url = os.environ.get("SQUARES_BASE_URL", "http://localhost:3000")
	model_path = os.environ.get("SQUARES_MODEL_PATH", "ppo_squares.zip")
	model_base = model_path.replace(".zip", "")
	vecnorm_path = f"{model_base}_vecnormalize.pkl"
	log_dir = os.environ.get("SQUARES_TB_LOGDIR", "./tb_logs")

	# PPO hyperparameters configurable via environment variables, with sensible defaults.
	def _get_int(name: str, default: int) -> int:
		value = os.environ.get(name)
		if value is None:
			return default
		try:
			return int(value)
		except ValueError:
			return default

	def _get_float(name: str, default: float) -> float:
		value = os.environ.get(name)
		if value is None:
			return default
		try:
			return float(value)
		except ValueError:
			return default

	learning_rate = _get_float("SQUARES_LEARNING_RATE", 3e-4)
	n_steps = _get_int("SQUARES_N_STEPS", 2048)
	batch_size = _get_int("SQUARES_BATCH_SIZE", 512)
	gamma = _get_float("SQUARES_GAMMA", 0.995)
	gae_lambda = _get_float("SQUARES_GAE_LAMBDA", 0.95)
	clip_range = _get_float("SQUARES_CLIP_RANGE", 0.2)
	ent_coef = _get_float("SQUARES_ENT_COEF", 0.04)
	vf_coef = _get_float("SQUARES_VF_COEF", 0.5)
	max_grad_norm = _get_float("SQUARES_MAX_GRAD_NORM", 0.5)
	total_timesteps = _get_int("SQUARES_TOTAL_TIMESTEPS", 5_000_000)

	# Simple single-process vectorized env, wrapped with VecNormalize
	raw_env = DummyVecEnv([make_env(base_url)])
	if os.path.exists(vecnorm_path):
		# Load existing normalisation statistics
		print(f"[train_ppo] Loading VecNormalize stats from '{vecnorm_path}'")
		env = VecNormalize.load(vecnorm_path, raw_env)
		env.training = True
		env.norm_reward = True
	else:
		print("[train_ppo] Creating new VecNormalize wrapper")
		env = VecNormalize(raw_env, norm_obs=True, norm_reward=True, clip_obs=10.0)

	# MultiInputPolicy because our observation is a Dict("board", "status")
	model_file = f"{model_base}.zip"
	if os.path.exists(model_file):
		# Continue training from an existing checkpoint
		print(f"[train_ppo] Continuing training from existing model at '{model_file}'")
		model = PPO.load(model_file, env=env)
		# Reconfigure logger so TensorBoard logs go to log_dir
		new_logger = configure(log_dir, ["stdout", "tensorboard"])
		model.set_logger(new_logger)
	else:
		# Start a new model from scratch
		print("[train_ppo] No existing model found; starting from scratch")
		model = PPO(
			"MultiInputPolicy",
			env,
			learning_rate=learning_rate,
			n_steps=n_steps,
			batch_size=batch_size,
			gamma=gamma,
			gae_lambda=gae_lambda,
			clip_range=clip_range,
			ent_coef=ent_coef,
			vf_coef=vf_coef,
			max_grad_norm=max_grad_norm,
			verbose=1,
			tensorboard_log=log_dir,
		)

	# Adjust timesteps as needed; also save periodic snapshots and TensorBoard logs.
	save_freq = int(os.environ.get("SQUARES_SNAPSHOT_FREQ", "200000"))
	callback = SnapshotCallback(save_freq=save_freq, model_base=model_base, vecnorm_path=vecnorm_path)
	model.learn(total_timesteps=total_timesteps, callback=callback, tb_log_name=model_base)

	# Save (or overwrite) the trained policy and normalisation stats
	model.save(model_base)
	env.save(vecnorm_path)

	env.close()


if __name__ == "__main__":
	main()
