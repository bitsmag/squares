from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Any


def load_samples(samples_path: Path) -> list[Dict[str, Any]]:
    if not samples_path.exists():
        raise FileNotFoundError(f"samples file not found: {samples_path}")

    samples: list[Dict[str, Any]] = []
    with samples_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                samples.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return samples


def summarize(samples: list[Dict[str, Any]]) -> None:
    if not samples:
        print("No samples loaded.")
        return

    n = len(samples)
    print(f"Loaded {n} samples")

    # Actions
    action_counts: Counter[int] = Counter()
    rewards = []

    # Reward components
    sum_components: Dict[str, float] = defaultdict(float)
    count_nonzero: Dict[str, int] = defaultdict(int)

    picked_double_speed = 0
    has_double_speed = 0

    for s in samples:
        action = int(s.get("action", 0))
        action_counts[action] += 1

        r = float(s.get("normalized_reward", 0.0))
        rewards.append(r)

        rb = s.get("reward_breakdown") or {}
        for key, value in rb.items():
            if isinstance(value, (int, float)):
                v = float(value)
                sum_components[key] += v
                if v != 0.0:
                    count_nonzero[key] += 1

        if rb.get("pickedDoubleSpeed"):
            picked_double_speed += 1
        if rb.get("hasDoubleSpeed"):
            has_double_speed += 1

    # Print actions
    print("\nAction distribution:")
    for action, count in sorted(action_counts.items()):
        frac = count / n
        print(f"  action {action}: {count} ({frac:.1%})")

    # Reward stats
    mean_reward = sum(rewards) / n
    min_reward = min(rewards)
    max_reward = max(rewards)
    print("\nNormalized reward (VecNormalize output):")
    print(f"  mean: {mean_reward:.4f}")
    print(f"  min : {min_reward:.4f}")
    print(f"  max : {max_reward:.4f}")

    # Component stats
    if sum_components:
        print("\nReward component sums (backend breakdown):")
        for key in sorted(sum_components.keys()):
            total = sum_components[key]
            nonzero = count_nonzero.get(key, 0)
            avg = total / n
            avg_nonzero = total / nonzero if nonzero > 0 else 0.0
            print(
                f"  {key}: total={total:.4f}, avg/step={avg:.4f}, "
                f"avg/when_nonzero={avg_nonzero:.4f}, nonzero_steps={nonzero}"
            )

    print("\nDouble-speed stats:")
    print(f"  steps with pickedDoubleSpeed: {picked_double_speed}")
    print(f"  steps with hasDoubleSpeed   : {has_double_speed}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze Squares RL training samples (actions and reward breakdowns) "
            "from a samples.jsonl file in a run directory."
        )
    )
    parser.add_argument(
        "run_dir",
        type=str,
        help=(
            "Path to a run directory under runs/ (containing samples.jsonl), "
            "or directly to a samples.jsonl file."
        ),
    )
    args = parser.parse_args()

    path = Path(args.run_dir)
    if path.is_dir():
        samples_path = path / "samples.jsonl"
    else:
        samples_path = path

    samples = load_samples(samples_path)
    summarize(samples)


if __name__ == "__main__":
    main()
