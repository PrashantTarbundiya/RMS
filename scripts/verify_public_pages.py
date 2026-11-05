import os
import sys
import json
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    {"name": "mobile_320", "width": 320, "height": 640},
    {"name": "mobile_375", "width": 375, "height": 667},
    {"name": "mobile_430", "width": 430, "height": 932},
    {"name": "tablet_768", "width": 768, "height": 1024},
    {"name": "desktop_1366", "width": 1366, "height": 768},
    {"name": "desktop_1440", "width": 1440, "height": 900},
    {"name": "desktop_1920", "width": 1920, "height": 1080},
]

PAGES = [
    {"name": "landing", "path": "/"},
    {"name": "docs", "path": "/docs"},
    {"name": "support", "path": "/support"},
    {"name": "privacy", "path": "/privacy-policy"},
    {"name": "terms", "path": "/terms"},
]

OUTPUT_DIR = r"C:\Users\VATSAL\.gemini\antigravity\brain\5ba10db1-1d6b-413a-92c2-6513e6675101"

def run_checks():
    results = []
    base_url = "http://localhost:5173"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for pg in PAGES:
            print(f"\n--- Checking Page: {pg['name']} ({pg['path']}) ---")
            for vp in VIEWPORTS:
                context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
                page = context.new_page()
                
                url = f"{base_url}{pg['path']}"
                try:
                    response = page.goto(url, wait_until="networkidle", timeout=15000)
                    page.wait_for_timeout(500)
                    
                    # Evaluate horizontal overflow
                    overflow_info = page.evaluate("""() => {
                        const body = document.body;
                        const docEl = document.documentElement;
                        const scrollW = Math.max(body.scrollWidth, docEl.scrollWidth);
                        const clientW = window.innerWidth;
                        const hasOverflow = scrollW > clientW;
                        return {
                            scrollWidth: scrollW,
                            innerWidth: clientW,
                            hasOverflow: hasOverflow,
                            diff: scrollW - clientW
                        };
                    }""")
                    
                    status = "PASS" if not overflow_info["hasOverflow"] else f"FAIL (+{overflow_info['diff']}px)"
                    print(f"[{pg['name']} @ {vp['name']} ({vp['width']}x{vp['height']})]: {status} (scrollWidth: {overflow_info['scrollWidth']}, innerWidth: {overflow_info['innerWidth']})")
                    
                    # Capture screenshot for 375px and 1440px
                    if vp["name"] in ["mobile_375", "desktop_1440"]:
                        screenshot_path = os.path.join(OUTPUT_DIR, f"{pg['name']}_{vp['name']}.png")
                        page.screenshot(path=screenshot_path, full_page=False)
                        print(f"   -> Screenshot saved: {screenshot_path}")
                        
                    results.append({
                        "page": pg["name"],
                        "viewport": vp["name"],
                        "width": vp["width"],
                        "passed": not overflow_info["hasOverflow"],
                        "scrollWidth": overflow_info["scrollWidth"],
                        "innerWidth": overflow_info["innerWidth"]
                    })
                except Exception as e:
                    print(f"[{pg['name']} @ {vp['name']}]: ERROR: {e}")
                    results.append({
                        "page": pg["name"],
                        "viewport": vp["name"],
                        "width": vp["width"],
                        "passed": False,
                        "error": str(e)
                    })
                finally:
                    context.close()
                    
        browser.close()
        
    failures = [r for r in results if not r.get("passed", False)]
    print("\n================ SUMMARY ================")
    print(f"Total Tests Run: {len(results)}")
    print(f"Passed: {len(results) - len(failures)}")
    print(f"Failed: {len(failures)}")
    if failures:
        print("Failures:")
        for f in failures:
            print(f"  - {f['page']} @ {f['viewport']}: scrollWidth={f.get('scrollWidth')}, innerWidth={f.get('innerWidth')}")
    else:
        print("ALL VIEWPORTS AND PAGES PASSED WITH 0px HORIZONTAL OVERFLOW!")

if __name__ == "__main__":
    run_checks()

