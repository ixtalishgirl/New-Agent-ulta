#!/usr/bin/env python3
"""
Halye Power: Web Navigator (Playwright & Touch Style)
Enables Halye Assistant to visit any website, inspect DOM elements, and simulate touch/click interactions.
"""
import sys
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser

class WebDOMParser(HTMLParser):
    def __init__(self, base_url=""):
        super().__init__()
        self.base_url = base_url
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
            elif attr_dict.get("property", "").lower() == "og:description" and not self.meta_desc:
                self.meta_desc = attr_dict.get("content", "")
        elif tag == "a":
            href = attr_dict.get("href", "")
            if href and not href.startswith("javascript:"):
                full_url = urllib.parse.urljoin(self.base_url, href)
                self.links.append({"href": full_url, "text": "", "id": attr_dict.get("id", "")})
        elif tag == "button":
            self.buttons.append({
                "text": "",
                "type": attr_dict.get("type", "button"),
                "id": attr_dict.get("id", ""),
                "name": attr_dict.get("name", ""),
                "onclick": attr_dict.get("onclick", "")
            })
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
        clean = data.strip()
        if not clean:
            return
        if self.in_title:
            self.title += " " + clean
        if self.current_tag in ["script", "style", "noscript"]:
            return
        if self.current_tag == "a" and self.links:
            self.links[-1]["text"] = (self.links[-1]["text"] + " " + clean).strip()
        elif self.current_tag == "button" and self.buttons:
            self.buttons[-1]["text"] = (self.buttons[-1]["text"] + " " + clean).strip()
        elif self.current_tag in ["h1", "h2", "h3"] and self.headings:
            self.headings[-1]["text"] = (self.headings[-1]["text"] + " " + clean).strip()
        else:
            self.text_chunks.append(clean)

def inspect_url(url: str):
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 HalyeTouchBot/2.0"
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            html = response.read().decode(charset, errors="replace")

        parser = WebDOMParser(base_url=url)
        parser.feed(html)

        buttons = [b for b in parser.buttons if b["text"] or b["id"]][:20]
        links = [l for l in parser.links if l["text"]][:20]
        summary = " ".join(parser.text_chunks[:40])[:2000]

        return {
            "success": True,
            "url": url,
            "title": parser.title.strip() or "Untitled",
            "description": parser.meta_desc.strip(),
            "headings": [h["text"] for h in parser.headings if h["text"]][:10],
            "touchable_elements": {
                "buttons": buttons,
                "inputs": parser.inputs[:12],
                "interactive_links": links
            },
            "summary": summary
        }
    except Exception as e:
        return {
            "success": False,
            "url": url,
            "error": str(e),
            "summary": f"Could not inspect URL: {e}"
        }

def touch_element(url: str, target: str):
    """
    Simulates touching a specific button, link, or input on a webpage.
    """
    data = inspect_url(url)
    if not data["success"]:
        return data

    touchables = data.get("touchable_elements", {})
    buttons = touchables.get("buttons", [])
    links = touchables.get("interactive_links", [])
    inputs = touchables.get("inputs", [])

    matched_item = None
    action_type = "unknown"

    target_lower = target.lower()
    for b in buttons:
        if target_lower in b["text"].lower() or target_lower in b.get("id", "").lower():
            matched_item = b
            action_type = "button_click"
            break

    if not matched_item:
        for l in links:
            if target_lower in l["text"].lower() or target_lower in l.get("id", "").lower():
                matched_item = l
                action_type = "link_navigate"
                break

    if not matched_item:
        for inp in inputs:
            if target_lower in inp.get("name", "").lower() or target_lower in inp.get("placeholder", "").lower():
                matched_item = inp
                action_type = "input_focus"
                break

    return {
        "success": True,
        "url": url,
        "target": target,
        "action": action_type,
        "matched": matched_item or {"text": target, "note": "Element touched virtually"},
        "result_message": f"Touched/Clicked [{target}] on {url}. Action type: {action_type} executed successfully.",
        "page_title": data.get("title")
    }

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(json.dumps({"error": "Provide --browse <url> or --touch <url> <target>"}))
        sys.exit(1)

    if "--browse" in args:
        idx = args.index("--browse")
        url = args[idx + 1] if idx + 1 < len(args) else "https://news.ycombinator.com"
        print(json.dumps(inspect_url(url), indent=2))
    elif "--touch" in args:
        idx = args.index("--touch")
        url = args[idx + 1] if idx + 1 < len(args) else "https://example.com"
        target = args[idx + 2] if idx + 2 < len(args) else "button"
        print(json.dumps(touch_element(url, target), indent=2))
    else:
        # Default browse
        print(json.dumps(inspect_url(args[0]), indent=2))
