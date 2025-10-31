import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchOriginalUrl } from "../utils/parsePatch";

export default function Redirect() {
  const { id } = useParams();

  useEffect(() => {
    async function redirectNow() {
      try {
        const original = await fetchOriginalUrl(id);
        console.log("Original URL:", original);
        window.location.href = original;
      } catch (err) {
        console.error(err);
      }
    }
    redirectNow();
  }, [id]);

  return (
    <div style={{ textAlign: "center", paddingTop: "2rem" }}>
      <h2>Redirecting...</h2>
      <p>If you are not redirected, check the link or try again later.</p>
    </div>
  );
}
