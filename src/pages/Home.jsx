import { useState } from "react";
import { triggerCreateShortUrl } from "../api/triggerAction";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [shortLink, setShortLink] = useState("");

  const handleCreateShortUrl = async () => {
    if (!url.trim()) return;

    setStatus("Creating short URL...");
    try {
      const result = await triggerCreateShortUrl(url);

      if (result.error) {
        setStatus("❌ Error: " + result.error);
        return;
      }

      setStatus("✅ Short URL created successfully!");
      setShortLink(`https://${result.shortUrl}`);
    } catch (err) {
      console.error("Error:", err);
      setStatus("❌ Error: " + err.message);
    }
  };

  const handleCopy = async () => {
    if (shortLink) {
      await navigator.clipboard.writeText(shortLink);
      setStatus("📋 Copied to clipboard!");
    }
  };

  const handleOpen = () => {
    if (shortLink) {
      window.open(shortLink, "_blank");
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1>🔗 GitHub ShortURL</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a long URL"
        style={{
          width: "60%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
      <button
        onClick={handleCreateShortUrl}
        style={{
          marginLeft: "10px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "8px",
          background: "#007BFF",
          color: "white",
          cursor: "pointer",
        }}
      >
        Shorten
      </button>

      <p style={{ marginTop: "20px" }}>{status}</p>

      {shortLink && (
        <div style={{ marginTop: "10px" }}>
          <span style={{ fontWeight: "bold", marginRight: "10px" }}>
            {shortLink}
          </span>
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 10px",
              marginRight: "8px",
              border: "none",
              borderRadius: "6px",
              background: "#6C757D",
              color: "white",
              cursor: "pointer",
            }}
          >
            Copy
          </button>
          <button
            onClick={handleOpen}
            style={{
              padding: "6px 10px",
              border: "none",
              borderRadius: "6px",
              background: "#28A745",
              color: "white",
              cursor: "pointer",
            }}
          >
            Open Link
          </button>
        </div>
      )}
    </div>
  );
}
