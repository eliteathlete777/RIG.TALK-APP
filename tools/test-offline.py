from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready")
    page.reload(wait_until="networkidle")
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    cache_names = page.evaluate("caches.keys()")
    context.set_offline(True)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector("#nextActionRoot .next-action")
    print({
        "cache_v20_present": "rigtalk-v20" in cache_names,
        "offline_title": page.title(),
        "offline_next_action": page.locator("#nextActionRoot .next-action").is_visible(),
        "offline_status": page.locator("#offlineState").inner_text(),
        "page_errors": errors,
    })
    browser.close()
