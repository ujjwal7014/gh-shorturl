// api/create-shorturl.js
export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { longUrl } = request.body || {};
    if (!longUrl) {
      return response.status(400).json({ error: 'Missing "longUrl"' });
    }

    const owner = process.env.GITHUB_OWNER || "ujjwal7014";
    const repo = process.env.GITHUB_REPO || "gh-shorturl";
    const token = process.env.GITHUB_TOKEN;
    const branch = process.env.GITHUB_REF || "main";

    if (!token) {
      console.error("❌ Missing GitHub Token");
      return response
        .status(500)
        .json({ error: "GitHub token not configured" });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // Step 1️⃣: Get the latest commit on main
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers }
    );
    if (!refRes.ok)
      throw new Error(`Failed to fetch latest ref: ${refRes.statusText}`);
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // Step 2️⃣: Get commit details to find its tree
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers }
    );
    if (!commitRes.ok)
      throw new Error(`Failed to fetch commit: ${commitRes.statusText}`);
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 3️⃣: Create a new commit with no file change (same tree)
    const commitMessage = longUrl;
    const createCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: baseTreeSha,
          parents: [latestCommitSha],
        }),
      }
    );

    const newCommit = await createCommitRes.json();
    if (!createCommitRes.ok)
      throw new Error(newCommit.message || "Failed to create commit");

    // Step 4️⃣: Update branch reference
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: newCommit.sha,
          force: false,
        }),
      }
    );

    if (!updateRefRes.ok) throw new Error("Failed to update branch reference");

    // Step 5️⃣: Return short URL
    const commitHash = newCommit.sha;
    const shortHash = commitHash.substring(0, 7); // 7 chars is standard short hash
    const shortUrl = `${request.headers.host}/${shortHash}`;

    return response.status(200).json({ shortUrl, commitHash: shortHash });
  } catch (err) {
    console.error("Error in create-shorturl:", err);
    return response.status(500).json({ error: err.message });
  }
}
