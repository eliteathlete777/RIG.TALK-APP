# RIG TALK: AI Check — workflow n8n

Ten plik (`rig-talk-ai-check.workflow.json`) to gotowy do importu workflow n8n realizujący PLAN.md §3.3.
Nie mam dostępu do Twojego n8n ani do klucza Anthropic API, więc **nie mogę tego samodzielnie wdrożyć i przetestować na żywo** — poniżej masz dokładne kroki (5 minut).

## Import
1. W n8n: **Workflows → Import from File** → wybierz `rig-talk-ai-check.workflow.json`.
2. Otwórz węzeł **Call Claude Haiku**.
3. Przy polu Credential kliknij **Create New** → typ **Header Auth**:
   - Name (nagłówka): `x-api-key`
   - Value: Twój klucz z `console.anthropic.com` (zaczyna się od `sk-ant-...`)
4. Zapisz credential, przypisz go do węzła (zastąp `PASTE_YOUR_CREDENTIAL_ID_HERE`).
5. Kliknij **Active** (przełącznik w prawym górnym rogu), żeby webhook działał bez otwartego edytora.
6. Skopiuj produkcyjny URL webhooka z węzła **Webhook** (Production URL) i porównaj z tym w `js/ai.js`:
   `https://n8n.srv1055997.hstgr.cloud/webhook/rig-talk-check` — jeśli Twój URL się różni, zaktualizuj `WEBHOOK_URL` w `js/ai.js`.

## Test ręczny (curl)
```bash
curl -X POST https://n8n.srv1055997.hstgr.cloud/webhook/rig-talk-check \
  -H "Content-Type: application/json" \
  -d '{"task_pl":"Klient pyta, czy ekran może wisieć nad wejściem. Odpowiedz.","user_text":"Yes it is possible we need one more day","level":1}'
```
Oczekiwana odpowiedź (przykład):
```json
{"ok":true,"score":88,"corrected":"Yes, it is possible. We need one more day.","natural":"Yes, that's possible. We just need one more day.","tip_pl":"Dodaj przecinek i \"that's\" zamiast \"it is\" — brzmi bardziej naturalnie."}
```

## Koszt i limity
- Model: `claude-haiku-4-5-20251001` — tani i szybki, odpowiedni do korekty krótkich zdań.
- Limit 30 zapytań/dzień jest wymuszany po stronie aplikacji (`js/ai.js`), nie w n8n — to tylko ochrona przed przypadkowym zbyt częstym klikaniem, nie limit kosztowy sam w sobie. Jeśli chcesz twardy limit kosztowy, dodaj go w n8n (np. licznik w Data Table) albo ustaw budżet w panelu Anthropic.

## Co było testowane bez tego workflow
Zweryfikowałem `js/ai.js` (kształt żądania/odpowiedzi, wygaszanie przycisku offline, limit dzienny) względem lokalnego mocka HTTP o identycznym kontrakcie — patrz `PROGRESS.md`, etap E10. Po imporcie i aktywacji tego workflow prawdziwe zapytania z aplikacji zadziałają bez zmian w kodzie.
