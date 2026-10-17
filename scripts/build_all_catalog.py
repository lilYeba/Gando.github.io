import subprocess
import sys

scripts = [
    "scripts/generate_batch_4_6.py",
    "scripts/generate_batch_7_9.py",
    "scripts/generate_batch_10_12.py",
    "scripts/generate_batch_13_15.py"
]

for s in scripts:
    res = subprocess.run([sys.executable, s], capture_output=True, text=True, encoding="utf-8")
    print(s, res.stdout.strip() if res.returncode == 0 else f"ERROR: {res.stderr}")
