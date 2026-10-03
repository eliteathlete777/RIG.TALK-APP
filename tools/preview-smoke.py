from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview-smoke.png"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812}, device_scale_factor=1)
    errors = []
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.screenshot(path=str(OUT), full_page=True)

    initial = {
        "title": page.title(),
        "screen": page.locator("[data-screen].active").get_attribute("data-screen"),
        "nav_items": page.locator("#bottomNav .nav-item").count(),
        "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
    }

    screens = {}
    for name in ("stoisko", "kurs", "czerwone", "biblioteka"):
        page.locator(f'[data-nav="{name}"]').click()
        page.wait_for_timeout(150)
        screens[name] = {
            "active": page.locator(f'[data-screen="{name}"].active').count() == 1,
            "text_length": len(page.locator(f'[data-screen="{name}"]').inner_text()),
        }

    page.locator('[data-nav="baza"]').click()
    page.locator("#btn5min").click()
    page.wait_for_timeout(200)
    session = {
        "active": page.locator('[data-screen="session"].active').count() == 1,
        "body_text_length": len(page.locator("#sessionBody").inner_text()),
    }
    page.locator("#sessionExit").click()

    print({"initial": initial, "screens": screens, "session": session, "errors": errors, "screenshot": str(OUT)})
    browser.close()
