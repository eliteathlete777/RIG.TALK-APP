from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.locator('[data-mode-select="english"]').click()
    page.locator('[data-nav="kurs"]').click()
    page.wait_for_selector('.bootcamp-block')
    blocks = page.locator('.bootcamp-block').count()
    active = page.locator('.bootcamp-block.active').count()
    headline = page.locator('.bootcamp-hero h2').inner_text()
    clock = page.locator('.bootcamp-clock').inner_text()
    page.screenshot(path="bootcamp-preview.png", full_page=True)
    page.locator('.bootcamp-block.active .btn').click()
    session_active = page.locator('[data-screen="session"].active').count() == 1
    session_text = page.locator('#sessionBody').inner_text()
    print({
        "headline": headline,
        "countdown": clock,
        "blocks": blocks,
        "one_active_block": active == 1,
        "session_started": session_active,
        "session_has_content": len(session_text) > 20,
        "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
        "page_errors": errors,
    })
    browser.close()
