from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:5179/"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())

    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.wait_for_timeout(1000)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.setItem('rigtalk.update-test', 'zachowane')")
    page.locator("[data-mode-select='english']").click()
    page.locator("#settingsBtn").click()

    button = page.locator("#updateBtn")
    assert button.is_visible(), "Brak przycisku aktualizacji w Ustawieniach"
    assert button.inner_text().strip().lower() == "aktualizuj bez utraty danych"

    button.click()
    page.wait_for_url("**/?update=*")
    page.wait_for_load_state("networkidle")

    assert page.evaluate("localStorage.getItem('rigtalk.update-test')") == "zachowane"
    assert page.locator("[data-screen='wybor']").is_visible()
    assert page.locator("#offlineState").inner_text() in {"OFFLINE GOTOWE", "OFFLINE ŁADUJE"}
    assert errors == [], f"Błędy strony: {errors}"
    assert page.evaluate("document.documentElement.scrollWidth") == 375

    print("PWA UPDATE v33 OK: przycisk widoczny, localStorage zachowany, świeży URL, 0 błędów, brak overflow")
    browser.close()
