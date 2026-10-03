from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.locator('[data-nav="biblioteka"]').click()
    stars = page.locator('#bibliotekaRoot .card .icon-box').filter(has_text='☆')
    for i in range(3):
        stars.nth(i).click()
    page.locator('#libTabs [data-value="ulubione"]').click()
    list_rows_before = page.locator('.favorite-list-row').count()
    page.locator('.favorite-list-remove').first.click()
    list_rows_after_remove = page.locator('.favorite-list-row').count()
    page.get_by_role("button", name="FISZKI", exact=True).click()
    card = page.locator('.favorite-flashcard')
    before = card.locator('.flashcard-text').inner_text()
    card.click()
    after = card.locator('.flashcard-text').inner_text()
    card.click()
    first_en = card.locator('.flashcard-text').inner_text()
    prev_disabled_at_start = page.get_by_role("button", name="← POPRZEDNIA").is_enabled() is False
    page.get_by_role("button", name="NASTĘPNA →").click()
    second_en = card.locator('.flashcard-text').inner_text()
    prev_enabled_after_next = page.get_by_role("button", name="← POPRZEDNIA").is_enabled()
    page.get_by_role("button", name="← POPRZEDNIA").click()
    returned_en = card.locator('.flashcard-text').inner_text()
    box = card.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.7, box["y"] + box["height"] * 0.5)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * 0.2, box["y"] + box["height"] * 0.5, steps=6)
    page.mouse.up()
    swiped_en = card.locator('.flashcard-text').inner_text()
    cards_mode_saved = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1')).ui.favoritesMode") == "cards"
    page.screenshot(path="favorites-preview.png", full_page=True)
    print({
        "favorites_tab_active": page.locator('#libTabs [data-value="ulubione"].active').count() == 1,
        "list_mode_has_three": list_rows_before == 3,
        "remove_from_list": list_rows_after_remove == 2,
        "cards_switch_active": page.get_by_role("button", name="FISZKI", exact=True).get_attribute("class") == "active",
        "card_visible": card.is_visible(),
        "flip_changes_text": before != after,
        "next_changes_card": first_en != second_en,
        "previous_returns_card": returned_en == first_en,
        "previous_disabled_at_start": prev_disabled_at_start,
        "previous_enabled_after_next": prev_enabled_after_next,
        "swipe_left_changes_card": swiped_en != returned_en,
        "cards_mode_saved": cards_mode_saved,
        "next_button": page.get_by_role("button", name="NASTĘPNA →").is_visible(),
        "remove_button": page.get_by_role("button", name="★ USUŃ Z ULUBIONYCH").is_visible(),
        "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
        "page_errors": errors,
    })
    browser.close()
