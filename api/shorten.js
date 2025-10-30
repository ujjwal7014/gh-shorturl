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
      
      // First, try to get the workflow ID by listing workflows
      console.log("Fetching workflows list to find workflow ID...");
      const workflowsResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
          },
        }
      );

      let workflowId = "shorten.yml"; // filename as fallback
      console.log("Workflows response status:", workflowsResponse.status);
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        console.log("Workflows found:", JSON.stringify(workflowsData, null, 2));
        const shortenWorkflow = workflowsData.workflows.find(
          (w) => w.name === "Shorten URL" || w.path.includes("shorten.yml")
        );
        if (shortenWorkflow) {
          workflowId = shortenWorkflow.id; // Use numeric ID
          console.log("Found workflow ID:", workflowId);
        } else {
          console.log("Workflow not found in list. Available workflows:", workflowsData.workflows.map(w => ({ id: w.id, name: w.name, path: w.path })));
        }
      } else {
        const errorText = await workflowsResponse.text();
        console.error("Failed to fetch workflows:", workflowsResponse.status, errorText);
        // If we can't list workflows, try just the filename
        workflowId = "shorten.yml";
      }

      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`;
  
      console.log("Triggering GitHub workflow...", { apiUrl, repoOwner, repoName, workflowId });
      const ghResponse = await fetch(apiUrl,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main", // or your branch name
            inputs: { long_url: longUrl }, // GitHub input name is long_url
          }),
        }
      );
  
      const ghResultText = await ghResponse.text();
  
      if (!ghResponse.ok) {
        console.error(
          "GitHub workflow trigger failed",
          {
            status: ghResponse.status,
            statusText: ghResponse.statusText,
            url: apiUrl,
            error: ghResultText
          }
        );
        // Return more helpful error message
        const errorObj = JSON.parse(ghResultText || "{}");
        return response.status(ghResponse.status).json({
          error: "Failed to trigger workflow",
          details: ghResultText,
          suggestion: ghResponse.status === 404 
            ? "Make sure: 1) Workflow file exists in .github/workflows/ on main branch, 2) Token has 'workflow' permissions, 3) Repository name is correct"
            : errorObj.message || ghResultText,
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
  