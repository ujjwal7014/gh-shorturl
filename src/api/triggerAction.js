export async function triggerShortenAction(longUrl) {
    const repoOwner = "ujjwal7014";
    const repoName = "gh-shorturl";
    const workflowFile = "shorten.yml";
  
    const res = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${import.meta.env.VITE_GH_TOKEN}`,
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            long_url: longUrl,
          },
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error("Failed to trigger shorten action");
    }
  
    return true;
  }
  