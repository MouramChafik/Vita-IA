// Icône pour l'écran d'accueil iPhone / iPad (PNG 180 x 180 généré au build)
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b6e5e" }}>
        <svg width="140" height="140" viewBox="0 0 40 40">
          <path d="M5 21h7l3-6 5 14 5-18 3 10h7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
