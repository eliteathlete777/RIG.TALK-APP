from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5180/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    page.set_default_timeout(180_000)
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(BASE, wait_until="domcontentloaded")
    page.wait_for_selector('[data-mode-select="assembly"]')
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector('[data-mode-select="assembly"]')

    page.locator('[data-mode-select="assembly"]').click()
    page.locator('[data-chapter="audio"]').click()
    page.wait_for_selector('[data-now]')

    tracks = page.locator('.mz-search-hit').count()
    assert tracks >= 160, f"Za mało nagrań w odtwarzaczu: {tracks}"
    audio = page.locator('audio')
    src = audio.get_attribute('src')
    assert src and src.endswith('.wav'), src
    first_audio = page.request.get(BASE + src)
    assert first_audio.ok and len(first_audio.body()) > 1000

    page.locator('[data-audio="next"]').click()
    page.wait_for_function("document.querySelector('audio').dataset.track !== 'audio-summary'")
    saved = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1')).ui.techAudio.index")
    assert saved == 1, saved
    assert page.evaluate("navigator.mediaSession && navigator.mediaSession.metadata && navigator.mediaSession.metadata.title")

    phrase_button = page.locator('.mz-search-hit').nth(67)
    phrase_button.click()
    page.wait_for_function("document.querySelector('audio').dataset.track.startsWith('phrase-')")
    phrase_src = audio.get_attribute('src')
    phrase_audio = page.request.get(BASE + phrase_src)
    assert phrase_audio.ok and len(phrase_audio.body()) > 1000

    page.evaluate("navigator.serviceWorker.ready")
    page.wait_for_function("""([technical, phrase]) => caches.open('rigtalk-v41').then(async cache =>
      Boolean(await cache.match(technical)) && Boolean(await cache.match(phrase)))""", arg=[src, phrase_src], timeout=180_000)
    cached = page.evaluate("""async ([technical, phrase]) => {
      const cache = await caches.open('rigtalk-v41');
      return Boolean(await cache.match(technical)) && Boolean(await cache.match(phrase));
    }""", [src, phrase_src])
    assert cached, "Nagrania nie znalazły się w pamięci offline"

    errors = [e for e in errors if "play() request was interrupted by a new load request" not in e]
    assert not errors, errors
    print(f"PASS tracks={tracks} technical_audio={src} phrase_audio={phrase_src} saved_index={saved} offline_cache={cached}")
    browser.close()
