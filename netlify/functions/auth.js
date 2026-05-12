// Netlify Function — verify admin password
// Set ADMIN_PASSWORD as an environment variable in Netlify dashboard

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

  const { password } = body;
  if (!password) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing password" }),
    };
  }

  console.log("Password env present:", !!process.env.ADMIN_PASSWORD);
  console.log("Password match:", password === process.env.ADMIN_PASSWORD);
  if (password !== process.env.ADMIN_PASSWORD) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Incorrect password" }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
