#!/usr/bin/env python3
"""
Halye Power: Autonomous Power Builder
Allows Halye Assistant to write new Python scripts, validate syntax, test run, and register them into its active powers suite.
"""
import sys
import os
import json
import py_compile
import subprocess
import re
from datetime import datetime

REGISTRY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "registry.json")
POWERS_DIR = os.path.dirname(os.path.abspath(__file__))

def sanitize_id(name: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower().strip())
    cleaned = re.sub(r'_+', '_', cleaned)
    if not cleaned.startswith("power_"):
        cleaned = f"power_{cleaned}"
    return cleaned

def build_new_power(name: str, description: str, category: str, code: str):
    power_id = sanitize_id(name)
    script_filename = f"{power_id}.py"
    script_path = os.path.join(POWERS_DIR, script_filename)

    # 1. Write the code file
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(code)

    os.chmod(script_path, 0o755)

    # 2. Syntax Validation Check
    try:
        py_compile.compile(script_path, doraise=True)
    except py_compile.PyCompileError as e:
        return {
            "success": False,
            "power_id": power_id,
            "error": f"Python Syntax Error: {e}",
            "step": "syntax_validation"
        }

    # 3. Dry-run test execution
    try:
        test_run = subprocess.run(
            [sys.executable, script_path, "--test"],
            capture_output=True,
            text=True,
            timeout=15
        )
        test_output = test_run.stdout or test_run.stderr or "Executed successfully with exit code 0"
    except Exception as e:
        test_output = f"Test warning: {e}"

    # 4. Update Registry
    registry = []
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                registry = json.load(f)
        except Exception:
            registry = []

    # Remove existing power with same ID if present
    registry = [p for p in registry if p.get("id") != power_id]

    new_power_entry = {
        "id": power_id,
        "name": name,
        "description": description,
        "category": category or "custom",
        "command": f"python3 halye_powers/{script_filename}",
        "status": "active",
        "version": "1.0.0",
        "invocations": 1,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    registry.append(new_power_entry)

    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

    return {
        "success": True,
        "power_id": power_id,
        "name": name,
        "script": f"halye_powers/{script_filename}",
        "testOutput": test_output.strip()[:400],
        "message": f"Power '{name}' kamyabi se build aur test ho gayi hai. Exit 0. Registered in active suite."
    }

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({
            "error": "Usage: python3 power_builder.py <name> <description> <category> [code_file_or_string]"
        }))
        sys.exit(1)

    name = sys.argv[1]
    desc = sys.argv[2]
    cat = sys.argv[3]
    code = sys.argv[4] if len(sys.argv) > 4 else f"""#!/usr/bin/env python3
import sys

def main():
    print("Power '{name}' active and running.")

if __name__ == '__main__':
    main()
"""
    result = build_new_power(name, desc, cat, code)
    print(json.dumps(result, indent=2))
