export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // === [UPLOAD] ===
    if (request.method === "PUT" && pathname.startsWith("/upload/")) {
      const key = pathname.replace("/upload/", "");
      if (!key || key.includes("..") || key.startsWith(".")) {
        return new Response("Invalid key", { status: 400 });
      }

      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      const body = await request.arrayBuffer();

      await env.R2.put(key, body, {
        httpMetadata: {
          contentType,
        },
      });

      const url = `https://${request.headers.get("host")}/${key}`;
      return new Response(JSON.stringify({ success: true, url }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // === [GET CDN] ===
    if (request.method === "GET") {
      const key = decodeURIComponent(pathname.slice(1));
      if (!key || key.includes("..") || key.startsWith(".")) {
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
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
