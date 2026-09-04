#!/usr/bin/env python3
"""
Halye Power: Pip Package Manager
Enables installing, listing, and inspecting python packages dynamically.
"""
import sys
import subprocess
import json

def pip_action(action: str, package: str = ""):
    if action == "list":
        res = subprocess.run([sys.executable, "-m", "pip", "list", "--format=json"], capture_output=True, text=True)
        if res.returncode == 0:
            try:
                packages = json.loads(res.stdout)
                return {"success": True, "packages": packages, "total": len(packages)}
            except Exception:
                pass
        return {"success": True, "stdout": res.stdout}

    elif action == "install" and package:
        cmd = [sys.executable, "-m", "pip", "install", "--break-system-packages", package]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        return {
            "success": res.returncode == 0,
            "package": package,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exitCode": res.returncode
        }

    elif action == "show" and package:
        cmd = [sys.executable, "-m", "pip", "show", package]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return {
            "success": res.returncode == 0,
            "package": package,
            "stdout": res.stdout
        }

    return {"success": False, "error": "Invalid pip action. Use: list, install <pkg>, or show <pkg>"}

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(json.dumps(pip_action("list"), indent=2))
    elif args[0] == "install" and len(args) > 1:
        print(json.dumps(pip_action("install", args[1]), indent=2))
    elif args[0] == "show" and len(args) > 1:
        print(json.dumps(pip_action("show", args[1]), indent=2))
    else:
        print(json.dumps(pip_action(args[0], args[1] if len(args) > 1 else ""), indent=2))
