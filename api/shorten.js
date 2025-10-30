// api/shorten.js
export default async function handler(request, response) {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method not allowed" });
    }
  
    try {
      const { longUrl } = request.body || {};
      if (!longUrl) {
        return response.status(400).json({ error: 'Missing "longUrl"' });
      }
  
      const token = process.env.GITHUB_TOKEN;
      const repoOwner = process.env.GITHUB_OWNER || "ujjwal7014";
      const repoName = process.env.GITHUB_REPO || "gh-shorturl";
      const workflowFile = process.env.GITHUB_WORKFLOW_FILE || "shorten.yml";
      const ref = process.env.GITHUB_REF || "main";
  
      if (!token) {
        console.error("Missing GITHUB_TOKEN env var");
        return response.status(500).json({ error: "GitHub token not configured" });
      }
  
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;
      console.log("Dispatching workflow:", apiUrl);
  
      const ghResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref,
          inputs: { long_url: longUrl }, // must match your workflow input name
        }),
      });
  
      console.log("GitHub response status:", ghResponse.status);
  
      // GitHub returns 204 No Content on success
      if (ghResponse.status === 204) {
        return response.status(200).json({ message: "Workflow dispatched" });
      }
  
      const text = await ghResponse.text();
      console.error("GitHub dispatch failed:", ghResponse.status, text);
      return response.status(ghResponse.status).json({
        error: "Failed to trigger workflow",
        details: text,
        suggestion:
          ghResponse.status === 404
            ? "Ensure .github/workflows/<file> exists on the target branch and token has workflow permissions"
            : undefined,
      });
    } catch (err) {
      console.error("Server error:", err);
      return response.status(500).json({ error: "Internal server error", details: err.message });
    }
  }
  