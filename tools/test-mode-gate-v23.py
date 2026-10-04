from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = "http://127.0.0.1:5179"
SCREENSHOT = Path("mode-gate-v23-preview.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(ROOT, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    assert page.locator('[data-screen="wybor"]').is_visible()
    assert page.locator('[data-mode-select]').count() == 2
    page.screenshot(path=str(SCREENSHOT), full_page=True)

    page.locator('[data-mode-select="assembly"]').click()
    assert page.locator('[data-screen="stoisko"]').is_visible()
    assert not page.locator('#bottomNav').is_visible()
    assert page.locator('#stoiskoRoot .mz-tile').count() == 13

    page.locator('#modeChange').click()
    page.locator('[data-mode-select="english"]').click()
    assert page.locator('[data-screen="baza"]').is_visible()
    assert page.locator('#bottomNav').is_visible()
    assert page.locator('#bottomNav .nav-item').count() == 4
    assert not page.locator('[data-nav="stoisko"]').count()
    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert not errors, errors
    print({"gate_options": 2, "assembly_isolated": True, "english_nav_items": 4, "page_errors": errors})
    browser.close()
