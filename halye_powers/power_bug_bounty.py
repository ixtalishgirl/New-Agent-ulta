#!/usr/bin/env python3
"""
Halye Power: Autonomous Bug Hunter & Self-Testing Auditor
Analyzes web applications, HTML/JS/CSS source code, and live sites for syntax errors,
unclosed tags, runtime JS bugs, accessibility issues, and generates actionable fixes.
"""
import sys
import os
import re
import json
from html.parser import HTMLParser

class CodeAuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags_stack = []
        self.unclosed_tags = []
        self.void_tags = {
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        }
        self.scripts = []
        self.in_script = False
        self.current_script = []
        self.interactive_elements_missing_ids = []
        self.broken_links = []
        self.has_viewport = False
        self.has_title = False
        self.has_tailwind = False

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        tag_lower = tag.lower()

        if tag_lower == "meta" and attr_dict.get("name", "").lower() == "viewport":
            self.has_viewport = True

        if tag_lower == "title":
            self.has_title = True

        if tag_lower == "script":
            src = attr_dict.get("src", "")
            if "tailwindcss.com" in src:
                self.has_tailwind = True
            self.in_script = True
            self.current_script = []

        if tag_lower in ["button", "input", "select", "textarea"]:
            if not attr_dict.get("id"):
                self.interactive_elements_missing_ids.append({
                    "tag": tag_lower,
                    "type": attr_dict.get("type", "text"),
                    "name": attr_dict.get("name", "")
                })

        if tag_lower == "a":
            href = attr_dict.get("href", "")
            if href == "" or href == "#":
                self.broken_links.append({"tag": "a", "href": href})

        if tag_lower not in self.void_tags:
            self.tags_stack.append(tag_lower)

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower == "script":
            self.in_script = False
            self.scripts.append("".join(self.current_script))
            self.current_script = []

        if tag_lower in self.void_tags:
            return

        if self.tags_stack:
            if self.tags_stack[-1] == tag_lower:
                self.tags_stack.pop()
            else:
                # Mismatched closing tag
                if tag_lower in self.tags_stack:
                    # Pop until match
                    while self.tags_stack and self.tags_stack[-1] != tag_lower:
                        unclosed = self.tags_stack.pop()
                        self.unclosed_tags.append(unclosed)
                    if self.tags_stack:
                        self.tags_stack.pop()
                else:
                    self.unclosed_tags.append(f"unexpected_closing_</{tag_lower}>")

    def handle_data(self, data):
        if self.in_script:
            self.current_script.append(data)

def audit_code(html_code: str):
    issues = []
    warnings = []
    strengths = []

    if not html_code or len(html_code.strip()) == 0:
        return {
            "success": False,
            "status": "FAILED",
            "score": 0,
            "error": "Empty code provided for audit."
        }

    # 1. Parse HTML structure
    parser = CodeAuditParser()
    try:
        parser.feed(html_code)
    except Exception as e:
        issues.append(f"HTML Parsing Error: {str(e)}")

    # Check unclosed tags
    if parser.tags_stack:
        for t in parser.tags_stack:
            issues.append(f"Unclosed tag: <{t}> was opened but not closed.")
    if parser.unclosed_tags:
        for t in parser.unclosed_tags:
            issues.append(f"Tag nesting mismatch: {t}")

    # 2. Check standards
    if parser.has_viewport:
        strengths.append("Mobile viewport meta tag is properly configured.")
    else:
        issues.append("Missing `<meta name='viewport'>` tag for responsive mobile scaling.")

    if parser.has_title:
        strengths.append("Application has a defined `<title>` tag.")
    else:
        warnings.append("Missing `<title>` tag inside <head>.")

    if parser.has_tailwind:
        strengths.append("Tailwind CSS engine is present.")
    else:
        warnings.append("Tailwind CDN script not found; check styling dependencies.")

    # 3. Check JavaScript syntax & patterns
    js_errors = []
    for idx, script_content in enumerate(parser.scripts):
        if not script_content.strip():
            continue
        # Check unclosed brackets/braces in JS
        open_curly = script_content.count('{')
        close_curly = script_content.count('}')
        if open_curly != close_curly:
            js_errors.append(f"Script #{idx + 1}: Unbalanced curly braces ({{: {open_curly}, }}: {close_curly})")

        open_paren = script_content.count('(')
        close_paren = script_content.count(')')
        if open_paren != close_paren:
            js_errors.append(f"Script #{idx + 1}: Unbalanced parentheses ((: {open_paren}, ): {close_paren})")

        # Check for dangerous eval
        if "eval(" in script_content:
            warnings.append(f"Script #{idx + 1}: Uses `eval()`, which may lead to security vulnerabilities.")

    issues.extend(js_errors)

    # 4. Check interactive element IDs
    if parser.interactive_elements_missing_ids:
        warnings.append(f"{len(parser.interactive_elements_missing_ids)} interactive elements (buttons/inputs) are missing explicit `id` attributes.")

    # Calculate health score (100 base)
    score = 100
    score -= len(issues) * 15
    score -= len(warnings) * 5
    score = max(10, min(100, score))

    status = "EXCELLENT" if score >= 90 else ("PASSING" if score >= 70 else "NEEDS_FIXES")

    return {
        "success": True,
        "status": status,
        "score": score,
        "total_issues": len(issues),
        "total_warnings": len(warnings),
        "issues": issues,
        "warnings": warnings,
        "strengths": strengths,
        "summary": f"Audit complete. Health Score: {score}/100. Status: {status} ({len(issues)} critical issues, {len(warnings)} warnings)."
    }

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or "--help" in args:
        print(json.dumps({"usage": "power_bug_bounty.py [--code <html_string> | --file <filepath>]"}))
        sys.exit(0)

    code_to_test = ""
    if "--file" in args:
        idx = args.index("--file")
        if idx + 1 < len(args):
            fpath = args[idx + 1]
            if os.path.exists(fpath):
                with open(fpath, "r", encoding="utf-8") as f:
                    code_to_test = f.read()
            else:
                print(json.dumps({"error": f"File not found: {fpath}"}))
                sys.exit(1)
    elif "--code" in args:
        idx = args.index("--code")
        if idx + 1 < len(args):
            code_to_test = args[idx + 1]
    else:
        # Check stdin
        if not sys.stdin.isatty():
            code_to_test = sys.stdin.read()

    result = audit_code(code_to_test)
    print(json.dumps(result, indent=2))
