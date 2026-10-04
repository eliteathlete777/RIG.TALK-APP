from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.locator('[data-mode-select="english"]').click()

    deadline = page.locator("#daysLeft").inner_text()
    next_action = page.locator("#nextActionRoot .next-action")
    readiness = next_action.locator(".eyebrow").inner_text()
    next_action_visible_initially = next_action.is_visible()

    page.locator('[data-nav="kurs"]').click()
    page.get_by_role("button", name="PRÓBA", exact=True).click()
    simulation_visible = page.locator('[data-screen="kurs"].active .simulation-card').is_visible()
    page.get_by_role("button", name="POKAŻ MODEL").click()
    model_lines = page.locator(".simulation-answer").count()
    page.get_by_role("button", name="STANĄŁEM").click()
    second_situation = "SYTUACJA 2" in page.locator(".simulation-meta").inner_text()

    page.locator('[data-nav="czerwone"]').click()
    search = page.get_by_placeholder("Co chcesz powiedzieć? Szukaj PL / EN…")
    search.fill("panel")
    search_results = page.locator("#czerwoneRoot .card").count()

    manifest = page.evaluate("fetch('manifest.webmanifest').then(r => r.json())")
    page.screenshot(path="mission-upgrade-preview.png", full_page=True)
    print({
        "deadline_uses_hours": "H" in deadline,
        "next_action_visible": next_action_visible_initially,
        "readiness_visible": "GOTOWOŚĆ" in readiness,
        "simulation_visible": simulation_visible,
        "simulation_model_lines": model_lines,
        "simulation_advances": second_situation,
        "on_site_search_results": search_results,
        "manifest_name": manifest.get("name"),
        "manifest_start_url": manifest.get("start_url"),
        "manifest_targets_rig_talk": manifest.get("start_url") == "https://elite-athlete.shop/rig-talk/",
        "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
        "page_errors": errors,
    })
    browser.close()
