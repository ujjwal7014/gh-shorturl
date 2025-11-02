// src/api/triggerAction.js
export async function triggerShortenAction(longUrl) {
  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ longUrl }),
    });

    return await res.json();
  } catch (e) {
    console.error("Error calling shorten API:", e);
    return { error: e.message };
  }
}

// src/api/triggerCreateShortUrl.js
export async function triggerCreateShortUrl(longUrl) {
  try {
    const res = await fetch("/api/create-shorturl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ longUrl }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Request failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creating short URL:", error);
    return { error: error.message };
  }
}
