// Cloudflare Worker — proxy photo uploads to GitHub API
// The GITHUB_TOKEN secret is set in Cloudflare dashboard, never exposed to the browser.
//
// Deploy steps:
//   1. Go to cloudflare.com → Workers & Pages → Create → Worker
//   2. Paste this file, click Deploy
//   3. Go to Settings → Variables → Add Secret: GITHUB_TOKEN = your PAT
//   4. Copy the worker URL (e.g. https://ak-upload.yourname.workers.dev)
//   5. Paste that URL into pages-admin.jsx where UPLOAD_WORKER_URL is defined

const REPO = "kolbecka12/portfolio";
const BRANCH = "main";
const ALLOWED_ORIGIN = "https://kolbecka12.github.io";

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin || ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    const { gallery, filename, content } = body;

    if (!gallery || !filename || !content) {
      return new Response(JSON.stringify({ error: "Missing gallery, filename, or content" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `images/${gallery}/${Date.now()}-${safeName}`;

    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "ak-portfolio-uploader",
        },
        body: JSON.stringify({
          message: `Upload ${gallery}/${safeName}`,
          content, // raw base64, no data: prefix
          branch: BRANCH,
        }),
      }
    );

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.message || `GitHub error ${ghRes.status}` }), {
        status: ghRes.status, headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    const url = `https://kolbecka12.github.io/portfolio/${path}`;
    return new Response(JSON.stringify({ url }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  },
};
