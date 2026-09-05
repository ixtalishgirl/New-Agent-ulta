#!/usr/bin/env python3
"""
Halye Power: Python 3 Code Execution Engine
Runs any python statement, expression, or code block with execution telemetry.
"""
import sys
import time
import subprocess
import json

def run_python(code: str):
    start = time.time()
    try:
        res = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=30
        )
        duration_ms = round((time.time() - start) * 1000, 2)
        return {
            "success": res.returncode == 0,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exitCode": res.returncode,
            "durationMs": duration_ms
        }
    except Exception as e:
        duration_ms = round((time.time() - start) * 1000, 2)
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "exitCode": 1,
            "durationMs": duration_ms
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        code = "print('Halye Python 3 Engine Online. System OK.')"
    else:
        code = " ".join(sys.argv[1:])
    result = run_python(code)
    print(json.dumps(result, indent=2))
