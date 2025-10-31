export async function fetchOriginalUrl(commitHash) {
  if (!commitHash) throw new Error("Missing commit hash");

  try {
    const res = await fetch(`/api/fetch-url?commitHash=${commitHash}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to fetch original URL:", data);
      throw new Error(data.error || "Failed to fetch original URL");
    }

    return data.longUrl;
  } catch (err) {
    console.error("Error fetching original URL:", err);
    throw err;
  }
}
