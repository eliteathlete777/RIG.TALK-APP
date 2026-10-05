from playwright.sync_api import sync_playwright

ROOT = "http://127.0.0.1:5180"

VOICE_STUB = """
window.__RIG_TEST_WAIT_SECONDS = 60;
Object.defineProperty(navigator, 'wakeLock', { value: {
  requests: 0,
  request: async function() { this.requests++; return { release: async () => {} }; }
}, configurable: true });
"""

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    page.add_init_script(VOICE_STUB)
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(ROOT, wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    page.locator('[data-mode-select="english"]').click()
    assert page.locator(".handsfree-panel").is_visible()
    page.locator("#playlistStage").select_option("rigging")
    page.locator("#startPlaylistBtn").click()
    page.locator(".guided-learning").wait_for()
    state = page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1'))")
    assert len(state["activeLearning"]["queue"]) == 31
    assert state["activeLearning"]["listeningOnly"] is True
    assert page.locator(".guided-controls button").count() == 4
    assert page.evaluate("navigator.wakeLock.requests") >= 1
    assert page.locator(".guided-voice").inner_text()

    audio_status = page.request.get(ROOT + "/assets/audio/phrases/p-rig-01.wav")
    assert audio_status.ok and len(audio_status.body()) > 1000
    page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready")
    page.wait_for_function("async () => !!(await caches.match('assets/audio/phrases/p-rig-01.wav'))")

    page.locator('[data-guided="pause"]').click()
    assert "PAUZA" in page.locator(".guided-status").inner_text()
    page.locator('[data-guided="pause"]').click()
    page.locator('[data-guided="next"]').click()
    assert page.evaluate("JSON.parse(localStorage.getItem('rigtalk.v1')).activeLearning.cursor") == 1

    page.on("dialog", lambda dialog: dialog.accept())
    page.locator("#sessionExit").click()
    if not page.locator("#settingsBtn").is_visible():
        page.locator('[data-mode-select="english"]').click()
    page.locator("#settingsBtn").click()
    assert page.locator("#settingRepeatCount").is_visible()
    assert page.locator("#transferCode").is_visible()
    page.locator("#copyTransferBtn").click()
    assert len(page.locator("#transferCode").input_value()) > 100

    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert not errors, errors
    print("v40 OK: 151 zwrotow, 30 rigging, audio offline, odsluch != opanowanie, Wake Lock, transfer i mobile")
    browser.close()
