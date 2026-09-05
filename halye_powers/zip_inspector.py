#!/usr/bin/env python3
"""
Halye Power: ZIP Archive Inspector & Manager
Inspects contents inside zip files, unzips/extracts, and creates zip archives.
"""
import sys
import os
import json
import zipfile
from datetime import datetime

def inspect_zip(zip_path: str):
    if not os.path.exists(zip_path):
        return {"success": False, "error": f"File not found: {zip_path}"}

    if not zipfile.is_zipfile(zip_path):
        return {"success": False, "error": f"Not a valid zip archive: {zip_path}"}

    try:
        entries = []
        total_uncompressed = 0
        total_compressed = 0

        with zipfile.ZipFile(zip_path, 'r') as zf:
            for info in zf.infolist():
                dt = datetime(*info.date_time).strftime("%Y-%m-%d %H:%M:%S")
                total_uncompressed += info.file_size
                total_compressed += info.compress_size
                ratio = round((1.0 - (info.compress_size / max(info.file_size, 1))) * 100, 1) if info.file_size > 0 else 0
                entries.append({
                    "filename": info.filename,
                    "is_dir": info.is_dir(),
                    "file_size": info.file_size,
                    "compress_size": info.compress_size,
                    "compression_ratio": f"{ratio}%",
                    "date_time": dt,
                })

        return {
            "success": True,
            "archive_name": os.path.basename(zip_path),
            "archive_path": zip_path,
            "total_files": len(entries),
            "total_uncompressed_bytes": total_uncompressed,
            "total_compressed_bytes": total_compressed,
            "total_size_formatted": f"{round(total_uncompressed / 1024, 2)} KB",
            "files": entries
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def extract_zip(zip_path: str, extract_to: str = ""):
    if not os.path.exists(zip_path):
        return {"success": False, "error": f"File not found: {zip_path}"}

    if not extract_to:
        base_name = os.path.splitext(os.path.basename(zip_path))[0]
        extract_to = os.path.join(os.path.dirname(zip_path) or ".", f"{base_name}_extracted")

    try:
        os.makedirs(extract_to, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(extract_to)

        extracted_files = []
        for root, dirs, files in os.walk(extract_to):
            for file in files:
                rel = os.path.relpath(os.path.join(root, file), extract_to)
                extracted_files.append(rel)

        return {
            "success": True,
            "message": f"Successfully extracted archive to: {extract_to}",
            "extract_path": extract_to,
            "extracted_count": len(extracted_files),
            "files": extracted_files
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def create_zip(zip_path: str, items_to_zip: list):
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for item in items_to_zip:
                if os.path.isfile(item):
                    zf.write(item, os.path.basename(item))
                elif os.path.isdir(item):
                    for root, dirs, files in os.walk(item):
                        for f in files:
                            full_path = os.path.join(root, f)
                            rel_path = os.path.relpath(full_path, os.path.dirname(item))
                            zf.write(full_path, rel_path)

        return {
            "success": True,
            "message": f"Created zip archive: {zip_path}",
            "zip_path": zip_path,
            "size_bytes": os.path.getsize(zip_path)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--help" in args:
        print(json.dumps({
            "usage": "python3 zip_inspector.py [--list <file.zip> | --extract <file.zip> [out_dir] | --create <out.zip> <item1> ...]"
        }))
        sys.exit(0)

    if args[0] == "--list" or args[0] == "-l":
        target = args[1] if len(args) > 1 else ""
        print(json.dumps(inspect_zip(target), indent=2))
    elif args[0] == "--extract" or args[0] == "-x":
        target = args[1] if len(args) > 1 else ""
        out_dir = args[2] if len(args) > 2 else ""
        print(json.dumps(extract_zip(target, out_dir), indent=2))
    elif args[0] == "--create" or args[0] == "-c":
        out_zip = args[1] if len(args) > 1 else "archive.zip"
        items = args[2:]
        print(json.dumps(create_zip(out_zip, items), indent=2))
    else:
        # Default assume target is a zip file to inspect
        print(json.dumps(inspect_zip(args[0]), indent=2))
