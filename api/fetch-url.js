export default async function handler(req, res) {
  try {
    const { commitHash } = req.query;
    if (!commitHash) {
      return res.status(400).json({ error: "Missing commit hash" });
    }

    const repoOwner = "ujjwal7014";
    const repoName = "gh-shorturl";
    const patchUrl = `https://github.com/${repoOwner}/${repoName}/commit/${commitHash}.patch`;

    console.log("Fetching patch from:", patchUrl);

    const response = await fetch(patchUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error("GitHub fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        patchUrl,
      });
      return res
        .status(response.status)
        .json({ error: "Failed to fetch patch from GitHub" });
    }

    // Extract commit message from the patch file
    const match = text.match(/^Subject: \[PATCH\] (.+)$/m);
    if (match && match[1]) {
      let longUrl = match[1].trim();

      // If the URL doesn't start with http:// or https://, add http://
      if (!/^https?:\/\//i.test(longUrl)) {
        longUrl = "http://" + longUrl;
      }

      console.log("Redirecting to:", longUrl);
      return res.status(200).json({ longUrl });
    }

    throw new Error("URL not found in patch");
  } catch (err) {
    console.error("Error in fetch-url handler:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}
