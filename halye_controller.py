#!/usr/bin/env python3
"""
Halye Assistant - Core Autonomous Execution Engine & Web Eyes Controller
Created solely for Halye.
Handles direct Bash, Python, Pip, System automation, Web Browsing, and Element Touch inspection.
"""

import sys
import os
import subprocess
import json
import platform
import re
import urllib.request
import urllib.parse
from html.parser import HTMLParser

class WebEyesParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.text_chunks = []
        self.links = []
        self.buttons = []
        self.inputs = []
        self.headings = []
        self.current_tag = None
        self.meta_desc = ""

    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        attr_dict = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            if attr_dict.get("name", "").lower() == "description":
                self.meta_desc = attr_dict.get("content", "")
            elif attr_dict.get("property", "").lower() == "og:description":
                if not self.meta_desc:
                    self.meta_desc = attr_dict.get("content", "")
        elif tag == "a":
            href = attr_dict.get("href", "")
            if href and not href.startswith("javascript:"):
                self.links.append({"href": href, "text": ""})
        elif tag == "button":
            self.buttons.append({"text": "", "type": attr_dict.get("type", "button"), "id": attr_dict.get("id", "")})
        elif tag in ["input", "textarea", "select"]:
            self.inputs.append({
                "tag": tag,
                "type": attr_dict.get("type", "text"),
                "name": attr_dict.get("name", ""),
                "placeholder": attr_dict.get("placeholder", ""),
                "id": attr_dict.get("id", "")
            })
        elif tag in ["h1", "h2", "h3"]:
            self.headings.append({"level": tag, "text": ""})

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        self.current_tag = None

    def handle_data(self, data):
        clean_text = data.strip()
        if not clean_text:
            return
        if self.in_title:
            self.title += " " + clean_text
        if self.current_tag in ["script", "style", "noscript"]:
            return
        if self.current_tag == "a" and self.links:
            self.links[-1]["text"] = (self.links[-1]["text"] + " " + clean_text).strip()
        elif self.current_tag == "button" and self.buttons:
            self.buttons[-1]["text"] = (self.buttons[-1]["text"] + " " + clean_text).strip()
        elif self.current_tag in ["h1", "h2", "h3"] and self.headings:
            self.headings[-1]["text"] = (self.headings[-1]["text"] + " " + clean_text).strip()
        else:
            self.text_chunks.append(clean_text)

def get_system_status():
    status = {
        "agent": "Halye Assistant",
        "creator": "Halye (Malik)",
        "loyalty": "100% Faithful Servant to Halye",
        "os": platform.system() + " " + platform.release(),
        "python_version": platform.python_version(),
        "architecture": platform.machine(),
        "working_directory": os.getcwd(),
        "status": "ONLINE & FULLY EMPOWERED",
        "powers": [
            "Linux Bash & Root Shell",
            "Python 3.10 Runtime & Pip Packages",
            "Internet Web Eyes (URL inspection & human DOM vision)",
            "Touch Interaction Simulator (Buttons, Links, Inputs)",
            "Direct Roman Urdu Obedient Response",
            "AMOLED Pure Black App Builder"
        ]
    }
    return status

def execute_command(cmd: str):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=45)
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
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=45)
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

def browse_website(url: str):
    """
    Halye's Web Eyes: Visits any website, reads it like human eyes, and extracts structure & touch elements.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HalyeEyes/1.0"
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            html = response.read().decode(charset, errors="replace")

        parser = WebEyesParser()
        parser.feed(html)

        # Structure the extracted human perception
        filtered_links = [l for l in parser.links if l["text"]][:15]
        filtered_buttons = [b for b in parser.buttons if b["text"]][:12]
        clean_text = " ".join(parser.text_chunks[:50])[:2500]

        return {
            "success": True,
            "url": url,
            "title": parser.title.strip() or "Untitled Webpage",
            "description": parser.meta_desc.strip(),
            "headings": [h["text"] for h in parser.headings if h["text"]][:10],
            "touchable_elements": {
                "buttons": filtered_buttons,
                "inputs": parser.inputs[:10],
                "interactive_links": filtered_links
            },
            "human_readable_summary": clean_text
        }
    except Exception as e:
        return {
            "success": False,
            "url": url,
            "error": str(e),
            "title": "Could not open URL",
            "touchable_elements": {"buttons": [], "inputs": [], "interactive_links": []},
            "human_readable_summary": f"Web eyes inspection error: {e}"
        }

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--help" in args or "-h" in args:
        print("[Halye Assistant Controller - Malik Halye Ka Wafadar Servant]")
        print("Hukum karein:")
        print("  --status            : System aur Halye status check karein")
        print("  --exec <command>    : Bash/Shell command run karein")
        print("  --eval <code>       : Python code directly run karein")
        print("  --script <filename> : Python script file execute karein")
        print("  --browse <url>      : Web eyes se kisi bhi website ko inspect karein")
        print("  --touch <url>       : Website ke interactive touch points aur buttons nikalen")
        sys.exit(0)

    if "--status" in args:
        print(json.dumps(get_system_status(), indent=2))
        sys.exit(0)

    if "--browse" in args:
        idx = args.index("--browse")
        if idx + 1 < len(args):
            target_url = args[idx+1]
            data = browse_website(target_url)
            print(json.dumps(data, indent=2))
            sys.exit(0)

    if "--touch" in args:
        idx = args.index("--touch")
        if idx + 1 < len(args):
            target_url = args[idx+1]
            data = browse_website(target_url)
            print(json.dumps({"url": target_url, "touchable_elements": data.get("touchable_elements", {})}, indent=2))
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
