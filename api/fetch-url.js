// api/fetch-url.js
// Vercel API handler: given ?commitHash=<hashOrUrl>
// - if commitHash is a URL, normalize & return it
// - otherwise treat as a commit SHA, fetch commit patch from GitHub,
//   extract the commit message (which should contain the original long URL), normalize it and return it.
// returns JSON: { longUrl: string }

function isLikelyUrl(s) {
  return /^https?:\/\//i.test(s) || /^[\w-]+\.[\w.-]+/.test(s);
}

function normalizeUrl(raw) {
  if (!raw) return raw;
  let url = raw.trim();

  // Remove surrounding angle brackets: <http://...>
  if (url.startsWith("<") && url.endsWith(">")) {
    url = url.slice(1, -1).trim();
  }

  // Convert GitHub blob links to raw content
  const githubBlob = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
  if (githubBlob) {
    const [, owner, repo, ref, path] = githubBlob;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  }

  // Convert GitHub blob links with line anchors
  const githubBlobWithHash = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^#]+)(#.+)?$/
  );
  if (githubBlobWithHash) {
    const [, owner, repo, ref, path] = githubBlobWithHash;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  }

  // Keep raw GitHub/Gist links as-is
  if (
    url.includes("raw.githubusercontent.com") ||
    url.includes("gist.githubusercontent.com")
  ) {
    return url;
  }

  // Convert Google Drive share links → direct download
  let m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  }
  m = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m) {
    return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  }

  m = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) {
    return url; // folder — keep as-is
  }

  // Keep sandbox or online IDE links as-is
  if (
    /codesandbox\.io|stackblitz\.com|replit\.com|sandbox\.io|glitch\.com/.test(url)
  ) {
    return url;
  }

  // Add https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  return url;
}

async function fetchCommitPatch(owner, repo, hash, token) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${hash}`;
  const headers = {
    Accept: "application/vnd.github.v3.patch",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(apiUrl, { headers });
  if (res.ok) {
    return await res.text();
  }

  // Fallback to .patch URL
  const fallback = `https://github.com/${owner}/${repo}/commit/${hash}.patch`;
  res = await fetch(fallback, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.ok) {
    return await res.text();
  }

  const errText = await res.text().catch(() => "");
  throw new Error(`Failed to fetch commit patch (api:${res.status}) ${errText}`);
}

export default async function handler(req, res) {
  try {
    const rawParam = String(req.query.commitHash || "").trim();
    if (!rawParam) {
      return res.status(400).json({ error: "Missing commitHash parameter" });
    }

    // If a full URL is passed, normalize & return
    if (isLikelyUrl(rawParam)) {
      const normalized = normalizeUrl(rawParam);
      return res.status(200).json({ longUrl: normalized });
    }

    // Otherwise treat as commit hash
    const repoOwner = process.env.GITHUB_OWNER || "ujjwal7014";
    const repoName = process.env.GITHUB_REPO || "gh-shorturl";
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;

    let patchText;
    try {
      patchText = await fetchCommitPatch(repoOwner, repoName, rawParam, token);
    } catch (err) {
      console.error("Error fetching commit patch:", err.message || err);
      return res
        .status(502)
        .json({ error: "Failed to fetch commit patch", details: String(err.message || err) });
    }

    // Try extracting commit message (URL)
    let longUrlMatch =
      patchText.match(/^Subject:\s*\[PATCH\]\s*(.+)$/m) ||
      patchText.match(/^Subject:\s*(.+)$/m) ||
      patchText.match(/\n\n(.+?)\n\n/s);

    if (!longUrlMatch || !longUrlMatch[1]) {
      console.error("URL not found in patch text (no Subject match)");
      return res.status(404).json({
        error: "URL not found in patch",
        sample: patchText.slice(0, 200),
      });
    }

    let extracted = longUrlMatch[1].trim();

    if (extracted.includes("\n")) {
      extracted =
        extracted
          .split("\n")
          .map((s) => s.trim())
          .find(Boolean) || extracted.split("\n")[0];
    }

    const normalized = normalizeUrl(extracted);
    console.log("Commit -> extracted URL:", extracted, "normalized:", normalized);

    return res.status(200).json({ longUrl: normalized });
  } catch (err) {
    console.error("Unexpected error in fetch-url handler:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: String(err.message || err) });
  }
}
