"""Python prototype: zander_bit_log
Usage:
  python3 py/zander_bit_log.py --example

Logs JSONL entries to logs/bit_log.jsonl
"""
import os
import json
from datetime import datetime
import argparse
import uuid

LOGFILE = os.path.join(os.path.dirname(__file__), '..', 'logs', 'bit_log.jsonl')


def ensure_dir(path):
    d = os.path.dirname(path)
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


def decide_zander_bit(probs, threshold=1e-12):
    """Return 1 if any probability/amplitude > threshold, else 0."""
    return 1 if any(p > threshold for p in probs) else 0


def log_event(entry):
    ensure_dir(LOGFILE)
    with open(LOGFILE, 'a') as f:
        f.write(json.dumps(entry) + '\n')
    print(f"Logged {entry['event_id']} z={entry['zander_bit']}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--example', action='store_true')
    args = parser.parse_args()

    if args.example:
        example = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'event_id': str(uuid.uuid4()),
            'input_complexity': 2048,
            'probs': [0.0, 0.0, 1e-15, 0.0],
        }
        example['zander_bit'] = decide_zander_bit(example['probs'])
        example['payload_summary'] = {'note': 'tiny amplitude'} if example['zander_bit'] else None
        log_event(example)
