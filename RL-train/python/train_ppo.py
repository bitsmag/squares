from __future__ import annotations

import json
import os
import platform
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import gymnasium as gym
import numpy as np
from dotenv import load_dotenv
from stable_baselines3 import PPO
import stable_baselines3 as sb3
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
	# Load environment variables from a local .env file if present.
	# This lets you configure training via RL-train/python/.env without
	# exporting everything in your shell.
	load_dotenv()

	# Ensure the Node server is running on the given base_url/port.
	base_url = os.environ.get("SQUARES_BASE_URL", "http://localhost:3000")

	# Per-run directory structure under runs/
	runs_root = Path(os.environ.get("SQUARES_RUNS_DIR", "./runs"))
	run_name = os.environ.get("SQUARES_RUN_NAME")
	if not run_name:
		timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
		run_name = f"squares_run_{timestamp}"
	run_dir = runs_root / run_name
	checkpoints_dir = run_dir / "checkpoints"
	tb_log_dir = run_dir / "tb_logs"
	run_dir.mkdir(parents=True, exist_ok=True)
	checkpoints_dir.mkdir(parents=True, exist_ok=True)
	tb_log_dir.mkdir(parents=True, exist_ok=True)

	# TensorBoard logs go into this run's directory
	log_dir = str(tb_log_dir)

	# Optional: resume from an existing model / VecNormalize state
	start_model_path = os.environ.get("SQUARES_START_MODEL_PATH")
	start_vecnorm_path = os.environ.get("SQUARES_START_VECNORM_PATH")
	final_model_path = run_dir / "model_final.zip"
	final_vecnorm_path = run_dir / "vecnormalize_final.pkl"

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
	if start_vecnorm_path and os.path.exists(start_vecnorm_path):
		# Load VecNormalize stats from an explicitly provided path (e.g. a previous run).
		print(f"[train_ppo] Loading VecNormalize stats from '{start_vecnorm_path}'")
		env = VecNormalize.load(start_vecnorm_path, raw_env)
		env.training = True
		env.norm_reward = True
	elif final_vecnorm_path.exists():
		# Resume from this run's previous VecNormalize state if present.
		print(f"[train_ppo] Loading VecNormalize stats from '{final_vecnorm_path}'")
		env = VecNormalize.load(str(final_vecnorm_path), raw_env)
		env.training = True
		env.norm_reward = True
	else:
		print("[train_ppo] Creating new VecNormalize wrapper")
		env = VecNormalize(raw_env, norm_obs=True, norm_reward=True, clip_obs=10.0)

	# MultiInputPolicy because our observation is a Dict("board", "status")
	started_from_checkpoint = bool(start_model_path and os.path.exists(start_model_path))
	if started_from_checkpoint:
		# Continue training from an existing checkpoint
		print(f"[train_ppo] Continuing training from existing model at '{start_model_path}'")
		model = PPO.load(start_model_path, env=env)
		# Optionally override key hyperparameters from the current environment
		# configuration so you can tune training without restarting from scratch.
		model.learning_rate = learning_rate
		model.n_steps = n_steps
		model.batch_size = batch_size
		model.gamma = gamma
		model.gae_lambda = gae_lambda
		model.clip_range = clip_range
		model.ent_coef = ent_coef
		model.vf_coef = vf_coef
		model.max_grad_norm = max_grad_norm
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
	snapshot_model_base = str(checkpoints_dir / "model")
	snapshot_vecnorm_path = str(checkpoints_dir / "vecnormalize.pkl")
	callback = SnapshotCallback(
		save_freq=save_freq,
		model_base=snapshot_model_base,
		vecnorm_path=snapshot_vecnorm_path,
	)

	# Persist run configuration and environment metadata alongside the model.
	config = {
		"run_id": run_name,
		"run_dir": str(run_dir),
		"started_at": datetime.now().isoformat(),
		"base_url": base_url,
		"total_timesteps": total_timesteps,
		"save_freq": save_freq,
		"started_from_checkpoint": started_from_checkpoint,
		"parent_model_path": start_model_path if started_from_checkpoint else None,
		"parent_vecnormalize_path": start_vecnorm_path if (start_vecnorm_path and os.path.exists(start_vecnorm_path)) else None,
		"ppo_hyperparams": {
			"learning_rate": learning_rate,
			"n_steps": n_steps,
			"batch_size": batch_size,
			"gamma": gamma,
			"gae_lambda": gae_lambda,
			"clip_range": clip_range,
			"ent_coef": ent_coef,
			"vf_coef": vf_coef,
			"max_grad_norm": max_grad_norm,
		},
		"env_variables": {k: v for k, v in os.environ.items() if k.startswith("SQUARES_") or k.startswith("RL_")},
	}
	config_path = run_dir / "config.json"
	with config_path.open("w", encoding="utf-8") as f:
		json.dump(config, f, indent=2, sort_keys=True)

	# Collect basic environment and code metadata for reproducibility.
	metadata: dict[str, object] = {
		"created_at": datetime.now().isoformat(),
		"python": sys.version,
		"platform": platform.platform(),
		"libraries": {
			"stable_baselines3": getattr(sb3, "__version__", "unknown"),
			"gymnasium": getattr(gym, "__version__", "unknown"),
			"numpy": np.__version__,
		},
	}
	repo_root = Path(__file__).resolve().parents[2]
	try:
		git_commit = (
			subprocess.run(
				["git", "rev-parse", "HEAD"], cwd=repo_root, check=True, capture_output=True, text=True
			)
			.stdout.strip()
		)
		git_status = subprocess.run(
			["git", "status", "--porcelain"], cwd=repo_root, check=True, capture_output=True, text=True
		).stdout.strip()
		metadata["git"] = {
			"root": str(repo_root),
			"commit": git_commit,
			"dirty": bool(git_status),
		}
	except Exception:
		# Git metadata is optional
		pass
	metadata_path = run_dir / "metadata.json"
	with metadata_path.open("w", encoding="utf-8") as f:
		json.dump(metadata, f, indent=2, sort_keys=True)

	model.learn(total_timesteps=total_timesteps, callback=callback, tb_log_name=run_name)

	# Save (or overwrite) the trained policy and normalisation stats inside the run directory
	model.save(str(final_model_path))
	env.save(str(final_vecnorm_path))

	env.close()


if __name__ == "__main__":
	main()
