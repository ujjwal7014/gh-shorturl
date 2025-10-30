export default async function handler(request, response) {
    console.log("Incoming request:", request.method);
  
    if (request.method !== "POST") {
      console.warn("Invalid method:", request.method);
      return response.status(405).json({ error: "Method not allowed" });
    }
  
    try {
      const { longUrl } = request.body || {};
  
      if (!longUrl) {
        return response.status(400).json({ error: 'Missing "longUrl"' });
      }
  
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return response.status(500).json({ error: "GitHub token not configured" });
      }
  
      const repoOwner = "ujjwal-kr"; // change this to your GitHub username/org
      const repoName = "gh-shorturl"; // change this to your repo name
      const workflowFileName = "shorten.yml"; // your GitHub Actions workflow filename
  
      console.log("Triggering GitHub workflow...");
      const ghResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFileName}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main", // or your branch name
            inputs: { longUrl },
          }),
        }
      );
  
      const ghResultText = await ghResponse.text();
  
      if (!ghResponse.ok) {
        console.error(
          "GitHub workflow trigger failed",
          ghResponse.status,
          ghResultText
        );
        return response.status(ghResponse.status).json({
          error: "Failed to trigger workflow",
          details: ghResultText,
        });
      }
  
      console.log("GitHub workflow triggered successfully");
      return response.status(200).json({
        message: "GitHub workflow triggered successfully",
        data: JSON.parse(ghResultText || "{}"),
      });
    } catch (err) {
      console.error("Server error:", err);
      return response
        .status(500)
        .json({ error: "Internal server error", details: err.message });
    }
  }
  