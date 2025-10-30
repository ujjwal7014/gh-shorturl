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
