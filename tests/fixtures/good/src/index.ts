export default {
  async fetch(request: Request, env: { CACHE: KVNamespace }): Promise<Response> {
    const hit = await env.CACHE.get("key");
    return new Response(hit ?? "miss");
  },
};
