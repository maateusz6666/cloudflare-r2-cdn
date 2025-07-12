export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));

    if (!key || key.startsWith(".") || key.includes("..")) {
      return new Response("Invalid request", { status: 400 });
    }

    const object = await env.R2.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*", 
        "ETag": object.httpMetadata?.etag || `"${key}"`,
      },
    });
  },
};
