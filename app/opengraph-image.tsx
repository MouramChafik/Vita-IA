// Image de partage (LinkedIn, X, Slack...) : 1200 x 630, générée au build avec next/og.
// Elle reprend la promesse du site : une réponse avec la page du document en source.
import { ImageResponse } from "next/og";

export const alt = "Vita Mutuelle : demandez combien vous serez remboursé, Vita vous montre la page du document";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f2f7f4", padding: 64, fontFamily: "sans-serif" }}>
        {/* Gauche : marque et promesse */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "#0b6e5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="52" height="52" viewBox="0 0 40 40">
                <path d="M5 21h7l3-6 5 14 5-18 3 10h7" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#0f2a2e" }}>Vita Mutuelle</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 62, fontWeight: 800, color: "#0f2a2e", lineHeight: 1.05, letterSpacing: -2 }}>
              Combien serez-vous remboursé ?
            </span>
            <span style={{ fontSize: 62, fontWeight: 800, color: "#0b6e5e", lineHeight: 1.05, letterSpacing: -2, marginTop: 8 }}>
              Vita vous montre la page.
            </span>
          </div>
          <span style={{ fontSize: 24, color: "#4b6468" }}>Assistant IA santé, réponses sourcées</span>
        </div>

        {/* Droite : exemple de réponse sourcée */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, marginLeft: 48, gap: 18 }}>
          <div style={{ alignSelf: "flex-end", background: "#0f2a2e", color: "#fff", fontSize: 24, padding: "18px 24px", borderRadius: 24, maxWidth: 420 }}>
            Dermatologue en secteur 2, formule Équilibre ?
          </div>
          <div style={{ display: "flex", flexDirection: "column", background: "#fff", border: "2px solid #d5e3dd", borderRadius: 24, padding: 24, gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#4f46e5" }}>Vita</span>
            <span style={{ fontSize: 24, color: "#0f2a2e", lineHeight: 1.35 }}>
              La Sécurité sociale verse 14,10 € et la mutuelle complète de 18,40 €. Il vous reste 27,50 €.
            </span>
            <span style={{ alignSelf: "flex-start", fontSize: 18, fontWeight: 600, color: "#0b6e5e", background: "#dcefe8", padding: "8px 14px", borderRadius: 10 }}>
              Tableau des garanties, page 2
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
