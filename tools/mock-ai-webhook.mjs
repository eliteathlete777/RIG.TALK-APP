// Lokalny mock webhooka n8n do testów js/ai.js (etap E10) — nie jest częścią aplikacji produkcyjnej.
import http from 'node:http';

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS'){
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }
  let body = '';
  req.on('data', (c) => body += c);
  req.on('end', () => {
    let payload = {};
    try { payload = JSON.parse(body); } catch (e) {}
    const score = payload.user_text?.toLowerCase().includes('possible') ? 88 : 40;
    const responseBody = {
      ok: true,
      score,
      corrected: payload.user_text || '',
      natural: "Yes, that's possible. We just need one more day.",
      tip_pl: 'Testowa odpowiedź mocka.',
      new_chunk: '',
    };
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(responseBody));
  });
});

const PORT = 5178;
server.listen(PORT, () => console.log('mock-ai-webhook listening on ' + PORT));
