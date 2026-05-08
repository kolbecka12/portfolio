// Netlify Function — proxy photo uploads to GitHub API
// GITHUB_TOKEN is set as an environment variable in Netlify dashboard, never exposed to the browser.

const REPO = "kolbecka12/portfolio";
const BRANCH = "main";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { gallery, filename, content } = body;
  if (!gallery || !filename || !content) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing gallery, filename, or content" }),
    };
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `images/${gallery}/${Date.now()}-${safeName}`;

  const ghRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
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
    return {
      statusCode: ghRes.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || `GitHub error ${ghRes.status}` }),
    };
  }

  // raw.githubusercontent.com is available immediately after commit (no deploy wait)
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  return {
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  };
};
