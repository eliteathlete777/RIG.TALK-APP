from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = "http://127.0.0.1:5179"
SCREENSHOT = Path("guided-learning-v22-preview.png")

VOICE_STUB = """
window.__RIG_TEST_WAIT_SECONDS = 0;
class TestUtterance {
  constructor(text) { this.text = text; this.rate = 1; this.lang = ''; }
}
Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: TestUtterance, configurable: true });
Object.defineProperty(window, 'speechSynthesis', { value: {
  onvoiceschanged: null,
  cancel() {},
  getVoices() { return [{ name: 'Offline English Test', lang: 'en-GB', localService: true }]; },
  speak(utterance) { setTimeout(() => utterance.onend && utterance.onend(), 0); }
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
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")

    page.locator('[data-mode-select="english"]').click()
    page.locator("#btn5min").click()
    card = page.locator(".guided-learning")
    card.wait_for()
    phonetic = card.locator(".guided-phonetic").inner_text()
    assert phonetic.startswith("[ ") and len(phonetic) > 5
    assert "GŁOS OFFLINE" in card.locator(".guided-voice").inner_text()
    page.wait_for_function("document.querySelectorAll('.guided-rounds span.done').length === 3")
    confirm = card.locator(".guided-confirm input")
    assert confirm.is_visible()
    first_phrase = card.locator(".guided-en").inner_text()
    page.screenshot(path=str(SCREENSHOT), full_page=True)
    confirm.evaluate("el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }")
    page.locator(".guided-learning").wait_for()
    second_phrase = page.locator(".guided-learning .guided-en").inner_text()
    assert second_phrase != first_phrase
    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert not errors, errors
    print({
        "three_rounds": True,
        "rate_label": page.locator(".guided-learning .eyebrow").inner_text(),
        "phonetic": phonetic,
        "auto_advance": True,
        "page_errors": errors,
    })
    browser.close()
