#!/usr/bin/env python3
"""
Halye Power: Autonomous Self-Modification & Tool Evolver
Allows Halye Assistant to inspect, patch, enhance, and evolve its own code and tool scripts.
"""
import sys
import os
import json
import py_compile
import datetime

POWERS_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTRY_FILE = os.path.join(POWERS_DIR, "registry.json")

def load_registry():
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_registry(registry):
    with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

def self_diagnose():
    """Diagnoses all scripts in halye_powers for syntax or runtime issues."""
    reports = []
    total = 0
    passed = 0
    failed = 0

    for fname in os.listdir(POWERS_DIR):
        if fname.endswith(".py"):
            total += 1
            fpath = os.path.join(POWERS_DIR, fname)
            try:
                py_compile.compile(fpath, doraise=True)
                passed += 1
                reports.append({"file": fname, "status": "OK", "error": None})
            except py_compile.PyCompileError as e:
                failed += 1
                reports.append({"file": fname, "status": "SYNTAX_ERROR", "error": str(e)})

    return {
        "success": failed == 0,
        "action": "self_diagnose",
        "total_scripts": total,
        "healthy_scripts": passed,
        "faulty_scripts": failed,
        "details": reports,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

def patch_power(target_file: str, new_code: str):
    """Safely patches an existing power script after verifying python syntax."""
    if not target_file.endswith(".py"):
        target_file += ".py"
    
    # Strip directory if provided to stay inside halye_powers
    base_name = os.path.basename(target_file)
    fpath = os.path.join(POWERS_DIR, base_name)

    temp_path = fpath + ".tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(new_code)
        
        # Verify syntax before applying
        py_compile.compile(temp_path, doraise=True)

        # Syntax verified, overwrite
        os.replace(temp_path, fpath)

        return {
            "success": True,
            "action": "patch_power",
            "file": base_name,
            "bytes_written": len(new_code),
            "message": f"Power '{base_name}' successfully self-modified and verified."
        }
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        return {
            "success": False,
            "action": "patch_power",
            "file": base_name,
            "error": str(e),
            "message": f"Syntax verification failed: {e}. Original code preserved."
        }

def list_powers():
    reg = load_registry()
    return {
        "success": True,
        "total_powers": len(reg),
        "powers": reg
    }

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--help" in args:
        print(json.dumps({
            "usage": "power_self_modifier.py [--diagnose | --list | --patch <file> <code_str>]"
        }))
        sys.exit(0)

    if "--diagnose" in args:
        print(json.dumps(self_diagnose(), indent=2))
        sys.exit(0)

    if "--list" in args:
        print(json.dumps(list_powers(), indent=2))
        sys.exit(0)

    if "--patch" in args:
        idx = args.index("--patch")
        if idx + 2 < len(args):
            tgt = args[idx + 1]
            code = args[idx + 2]
            print(json.dumps(patch_power(tgt, code), indent=2))
        else:
            print(json.dumps({"error": "Usage: --patch <file> <code_str>"}))
            sys.exit(1)
        sys.exit(0)

    # Default to diagnose
    print(json.dumps(self_diagnose(), indent=2))
