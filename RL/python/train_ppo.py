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

    # Simple single-process vectorized env
    env = DummyVecEnv([make_env(base_url)])

    # MultiInputPolicy because our observation is a Dict("board", "status")
    model = PPO(
        "MultiInputPolicy",
        env,
        verbose=1,
    )

    # Adjust timesteps as needed
    model.learn(total_timesteps=100_000)

    # Save the trained policy
    model.save("ppo_squares")

    env.close()


if __name__ == "__main__":
    main()
