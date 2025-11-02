import { useState } from "react";
import { triggerCreateShortUrl } from "../api/triggerAction";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [shortLink, setShortLink] = useState("");

  // const handleShorten = async () => {
  //   if (!url.trim()) return;

  //   setStatus("Shortening...");
  //   try {
  //     await triggerShortenAction(url);
  //     setStatus("✅ Successfully triggered! Check your repo for new commit.");
  //     setShortLink("The short link will appear once the Action completes.");
  //   } catch (err) {
  //     setStatus("❌ Error: " + err.message);
  //   }
  // };

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

  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
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
      {shortLink && <p>{shortLink}</p>}
      
    </div>
  );
}
