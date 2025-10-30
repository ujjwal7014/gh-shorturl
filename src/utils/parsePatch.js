export async function fetchOriginalUrl(commitHash) {
    const repoOwner = "your-github-username";
    const repoName = "gh-shorturl";
  
    const patchUrl = `https://github.com/${repoOwner}/${repoName}/commit/${commitHash}.patch`;
  
    const res = await fetch(patchUrl);
    const text = await res.text();
  
    // Commit message appears in the patch header as "Subject: [long URL]"
    const match = text.match(/^Subject: \[PATCH\] (.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
    throw new Error("URL not found in patch");
  }
  