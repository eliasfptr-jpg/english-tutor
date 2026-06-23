export function onRequestGet(context) {
  return new Response(JSON.stringify({ healthy: true, opencode_server: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
