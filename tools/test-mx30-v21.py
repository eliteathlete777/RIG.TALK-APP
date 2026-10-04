from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = "http://127.0.0.1:5179"
SCREENSHOT = Path("mx30-v21-preview.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(ROOT, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    page.locator('[data-mode-select="assembly"]').click()
    page.get_by_role("button", name="MX30 + LED").click()
    page.get_by_text("MX30 + TRANSPARENT LED", exact=True).wait_for()
    assert page.locator(".mx-step").count() == 10
    assert "8 × 4 m" in page.locator(".mx-hero").inner_text()
    assert "64" in page.locator(".mx-hero").inner_text()
    page.locator(".mx-step .check-row input").first.check()
    page.reload(wait_until="networkidle")
    page.locator('[data-mode-select="assembly"]').click()
    page.get_by_role("button", name="MX30 + LED").click()
    assert page.locator(".mx-step .check-row input").first.is_checked()
    page.screenshot(path=str(SCREENSHOT), full_page=True)

    page.locator("#modeChange").click()
    page.locator('[data-mode-select="english"]').click()
    page.locator("#quickAddPhrase").click()
    page.locator('[data-field="pl"]').fill("Sprawdź port drugi")
    page.locator('[data-field="en"]').fill("Check port two")
    page.locator('[data-save]').click()
    custom = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1')).custom")
    assert any(item["en"] == "Check port two" for item in custom)

    page.locator('[data-nav="biblioteka"]').click()
    page.get_by_placeholder("Szukaj PL / EN…").fill("Check port two")
    page.get_by_text("Check port two", exact=True).wait_for()
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator('button[aria-label="Usuń na zawsze"]').click()
    page.wait_for_timeout(100)
    state = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1'))")
    assert not state["custom"]
    assert state["deleted"]

    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert not errors, errors
    print({"mx30_sections": 10, "custom_add_delete": True, "persistent_check": True, "page_errors": errors})
    browser.close()
