from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 375, "height": 812})
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto("http://127.0.0.1:5179", wait_until="networkidle")
    page.locator('[data-mode-select="english"]').click()
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
    card_visible_initially = card.is_visible()
    semantic_buttons_visible = page.get_by_role("button", name="JESZCZE NIE", exact=False).is_visible() and page.get_by_role("button", name="UMIEM →").is_visible()
    remove_button_visible = page.get_by_role("button", name="★ USUŃ Z ULUBIONYCH").is_visible()
    arrow_buttons_visible = page.get_by_role("button", name="Poprzedni zwrot").count() == 1 and page.get_by_role("button", name="Następny zwrot").count() == 1
    before = card.locator('.flashcard-text').inner_text()
    card.click()
    after = card.locator('.flashcard-text').inner_text()
    first_front = before
    page.get_by_role("button", name="UMIEM →").click()
    second_front = card.locator('.flashcard-text').inner_text()
    first_rating = page.evaluate("Object.values(JSON.parse(localStorage.getItem('rigtalk.v1')).cards)[0]?.reps")
    box = card.bounding_box()
    page.mouse.move(box["x"] + box["width"] * 0.7, box["y"] + box["height"] * 0.5)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * 0.2, box["y"] + box["height"] * 0.5, steps=6)
    page.mouse.up()
    swipe_rating_count = len(page.evaluate("Object.keys(JSON.parse(localStorage.getItem('rigtalk.v1')).cards)"))
    cards_mode_saved = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1')).ui.favoritesMode") == "cards"
    page.screenshot(path="favorites-preview.png", full_page=True)
    print({
        "favorites_tab_active": page.locator('#libTabs [data-value="ulubione"].active').count() == 1,
        "list_mode_has_three": list_rows_before == 3,
        "remove_from_list": list_rows_after_remove == 2,
        "cards_switch_active": page.get_by_role("button", name="FISZKI", exact=True).get_attribute("class") == "active",
        "card_visible": card_visible_initially,
        "flip_changes_text": before != after,
        "good_changes_card": first_front != second_front,
        "good_saved_to_srs": first_rating == 1,
        "swipe_left_saved_to_srs": swipe_rating_count == 2,
        "cards_mode_saved": cards_mode_saved,
        "semantic_buttons": semantic_buttons_visible,
        "arrow_buttons": arrow_buttons_visible,
        "remove_button": remove_button_visible,
        "horizontal_overflow": page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
        "page_errors": errors,
    })
    browser.close()
