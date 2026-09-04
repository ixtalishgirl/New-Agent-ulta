#!/usr/bin/env python3
"""
Halye Assistant - Core Autonomous Execution Engine
Created solely by Halye.
Handles direct Bash, Python, Pip, and System automation tasks.
"""

import sys
import os
import subprocess
import json
import platform

def get_system_status():
    status = {
        "agent": "Halye Assistant",
        "creator": "Halye",
        "os": platform.system() + " " + platform.release(),
        "python_version": platform.python_version(),
        "architecture": platform.machine(),
        "working_directory": os.getcwd(),
        "status": "ONLINE",
        "mode": "Direct Hard-Way Execution (Roman Urdu / Commands)",
    }
    return status

def execute_command(cmd: str):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return {
            "command": cmd,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exit_code": res.returncode
        }
    except Exception as e:
        return {
            "command": cmd,
            "stdout": "",
            "stderr": str(e),
            "exit_code": 1
        }

def execute_python_code(code: str):
    try:
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=30)
        return {
            "code": code,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exit_code": res.returncode
        }
    except Exception as e:
        return {
            "code": code,
            "stdout": "",
            "stderr": str(e),
            "exit_code": 1
        }

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--help" in args or "-h" in args:
        print("[Halye Assistant Controller]")
        print("Hukum karein:")
        print("  --status            : System aur Halye status check karein")
        print("  --exec <command>    : Bash/Shell command run karein")
        print("  --eval <code>       : Python code directly run karein")
        print("  --script <filename> : Python script file execute karein")
        sys.exit(0)

    if "--status" in args:
        print(json.dumps(get_system_status(), indent=2))
        sys.exit(0)

    if "--exec" in args:
        idx = args.index("--exec")
        if idx + 1 < len(args):
            cmd = " ".join(args[idx+1:])
            res = execute_command(cmd)
            if res["stdout"]:
                print(res["stdout"], end="")
            if res["stderr"]:
                print(res["stderr"], file=sys.stderr, end="")
            sys.exit(res["exit_code"])

    if "--eval" in args:
        idx = args.index("--eval")
        if idx + 1 < len(args):
            code = " ".join(args[idx+1:])
            res = execute_python_code(code)
            if res["stdout"]:
                print(res["stdout"], end="")
            if res["stderr"]:
                print(res["stderr"], file=sys.stderr, end="")
            sys.exit(res["exit_code"])

    if "--script" in args:
        idx = args.index("--script")
        if idx + 1 < len(args):
            filename = args[idx+1]
            res = execute_command(f"{sys.executable} {filename}")
            if res["stdout"]:
                print(res["stdout"], end="")
            if res["stderr"]:
                print(res["stderr"], file=sys.stderr, end="")
            sys.exit(res["exit_code"])
