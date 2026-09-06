#!/usr/bin/env python3
"""
Halye Power: Playwright Automation & Live Testing Engine
Provides autonomous browser automation, DOM inspection, testing, screenshot generation,
and script execution.
"""
import sys
import json
import time
import asyncio
from playwright.async_api import async_playwright

async def run_automation(target_url_or_script: str, mode: str = "auto", timeout_sec: int = 25):
    start = time.time()
    result = {
        "success": False,
        "mode": mode,
        "target": target_url_or_script,
        "title": "",
        "url": "",
        "status": 0,
        "headings": [],
        "links_count": 0,
        "buttons_count": 0,
        "inputs_count": 0,
        "console_logs": [],
        "errors": [],
        "durationMs": 0,
        "summary": ""
    }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                has_touch=True,
                is_mobile=True
            )
            page = await context.new_page()

            page.on("console", lambda msg: result["console_logs"].append(f"[{msg.type}] {msg.text}"))
            page.on("pageerror", lambda err: result["errors"].append(str(err)))

            # Determine if target is a URL or custom HTML / code
            if target_url_or_script.startswith("http://") or target_url_or_script.startswith("https://") or target_url_or_script.startswith("file://"):
                response = await page.goto(target_url_or_script, timeout=timeout_sec * 1000, wait_until="domcontentloaded")
                result["status"] = response.status if response else 200
                result["url"] = page.url
            elif target_url_or_script.strip().startswith("<") or "<html" in target_url_or_script or "<body" in target_url_or_script:
                await page.set_content(target_url_or_script, timeout=timeout_sec * 1000)
                result["url"] = "about:blank(html)"
                result["status"] = 200
            else:
                # Treat as search query or navigate to localhost / default
                test_url = "http://127.0.0.1:3000"
                response = await page.goto(test_url, timeout=timeout_sec * 1000, wait_until="domcontentloaded")
                result["status"] = response.status if response else 200
                result["url"] = test_url

            # Extract page metadata
            result["title"] = await page.title()
            
            # Extract elements for verification
            h1s = await page.eval_on_selector_all("h1, h2, h3", "elements => elements.map(e => e.innerText.trim()).filter(Boolean).slice(0, 10)")
            result["headings"] = h1s
            
            links = await page.eval_on_selector_all("a", "elements => elements.length")
            result["links_count"] = links
            
            buttons = await page.eval_on_selector_all("button, [role='button']", "elements => elements.length")
            result["buttons_count"] = buttons
            
            inputs = await page.eval_on_selector_all("input, textarea, select", "elements => elements.length")
            result["inputs_count"] = inputs

            # Interactive Touch Simulation (Touch Tap & Gestures)
            touch_actions = []
            try:
                # Dispatched touch tap to primary UI element if available
                first_btn = await page.query_selector("button, [role='button'], a")
                if first_btn and await first_btn.is_visible():
                    await first_btn.tap()
                    touch_actions.append("Dispatched touch tap to interactive DOM element")
                else:
                    # Generic touch gesture at center coordinates
                    await page.touchscreen.tap(300, 300)
                    touch_actions.append("Dispatched touchscreen coordinate tap at (300, 300)")
            except Exception as touch_err:
                touch_actions.append(f"Touch simulation note: {str(touch_err)}")

            result["touch_actions"] = touch_actions

            await browser.close()

            result["success"] = len(result["errors"]) == 0
            result["durationMs"] = round((time.time() - start) * 1000, 2)
            result["summary"] = f"Playwright automation successfully inspected & touched '{result['title'] or result['url']}' ({result['durationMs']}ms). Verified {buttons} buttons, {inputs} inputs, {links} links with active touch emulation."
            return result

    except Exception as ex:
        result["success"] = False
        result["durationMs"] = round((time.time() - start) * 1000, 2)
        result["errors"].append(str(ex))
        result["summary"] = f"Playwright automation encountered an error: {str(ex)}"
        return result

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
    mode = sys.argv[2] if len(sys.argv) > 2 else "auto"
    res = asyncio.run(run_automation(target, mode))
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
