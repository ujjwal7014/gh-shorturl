/* eslint-disable no-undef */
// api/shorten.js
export default async function handler(req, res) {
    try {
      const body = await req.json(); // Parse body
      const longUrl = body.longUrl;
  
      if (!longUrl) {
        return res.status(400).json({ error: "Missing longUrl" });
      }
  
      const response = await fetch(
        "https://api.github.com/repos/ujjwal7014/gh-shorturl/actions/workflows/shorten.yml/dispatches",
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
          body: JSON.stringify({
            ref: "main", // or master, depending on your branch
            inputs: { long_url: longUrl },
          }),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: "GitHub API failed",
          details: errorText,
        });
      }
  
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Serverless error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  