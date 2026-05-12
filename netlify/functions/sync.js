// Netlify Function — write full gallery state to galleries.json in the repo
// Called after every gallery mutation (upload, delete, edit, reorder)

const REPO = "kolbecka12/portfolio";
const BRANCH = "main";
const FILE_PATH = "galleries.json";

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

  const { images } = body;
  if (!images) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing images" }),
    };
  }

  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "ak-portfolio-uploader",
  };

  // Get current SHA — required by GitHub API to update an existing file
  const getRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    { headers }
  );
  let sha;
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }

  const content = Buffer.from(JSON.stringify(images, null, 2)).toString("base64");

  const putRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Update gallery state",
        content,
        ...(sha ? { sha } : {}),
        branch: BRANCH,
      }),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    console.log("Sync error:", putRes.status, JSON.stringify(err));
    return {
      statusCode: putRes.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || `GitHub error ${putRes.status}` }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
