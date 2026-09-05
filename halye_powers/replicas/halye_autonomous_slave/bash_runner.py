#!/usr/bin/env python3
"""
Halye Power: Bash & Root Linux Shell
Executes shell commands directly with output stream capturing.
"""
import sys
import time
import subprocess
import json

def run_bash(cmd: str):
    start = time.time()
    try:
        res = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=40,
            executable="/bin/bash"
        )
        duration_ms = round((time.time() - start) * 1000, 2)
        return {
            "success": res.returncode == 0,
            "command": cmd,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exitCode": res.returncode,
            "durationMs": duration_ms
        }
    except Exception as e:
        duration_ms = round((time.time() - start) * 1000, 2)
        return {
            "success": False,
            "command": cmd,
            "stdout": "",
            "stderr": str(e),
            "exitCode": 1,
            "durationMs": duration_ms
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        cmd = "uname -a && python3 --version && pip --version"
    else:
        cmd = " ".join(sys.argv[1:])
    result = run_bash(cmd)
    print(json.dumps(result, indent=2))
