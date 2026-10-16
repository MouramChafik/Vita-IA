// Illustrations des produits, dessinées en SVG dans la palette du site.
// Le thème est déduit du nom du produit (jeunes, senior, revenus...) ou, à défaut, de ses garanties.

export type Theme = "sante" | "jeunes" | "senior" | "revenus" | "deces" | "autonomie" | "optique" | "dentaire";

export function themeFor(name: string, categories: string[] = []): Theme {
  const n = name.toLowerCase();
  if (/jeune|étudiant|etudiant/.test(n)) return "jeunes";
  if (/senior|retrait/.test(n)) return "senior";
  if (/revenu|indemn|arrêt|arret|incapacit/.test(n)) return "revenus";
  if (/décès|deces|obsèque|obseque/.test(n)) return "deces";
  if (/autonomie|dépendance|dependance/.test(n)) return "autonomie";
  if (/optique|lunette/.test(n)) return "optique";
  if (/dentaire/.test(n)) return "dentaire";
  if (categories.length === 1 && categories[0] === "optique") return "optique";
  if (categories.length === 1 && categories[0] === "dentaire") return "dentaire";
  return "sante";
}

const BG: Record<Theme, string> = {
  sante: "#dcefe8",
  jeunes: "#e8e7fd",
  senior: "#fbe7dc",
  revenus: "#e6eef7",
  deces: "#ece8f3",
  autonomie: "#e3f1e6",
  optique: "#e8e7fd",
  dentaire: "#e6f2f4",
};

const INK = "#0f2a2e";
const TEAL = "#0b6e5e";
const VITA = "#4f46e5";
const CORAL = "#f2a48a";

function Scene({ theme }: { theme: Theme }) {
  switch (theme) {
    case "jeunes": // sac à dos et basket
      return (
        <>
          <rect x="112" y="52" width="70" height="88" rx="22" fill={VITA} />
          <rect x="126" y="92" width="42" height="30" rx="8" fill="#fff" opacity=".9" />
          <path d="M132 52c0-14 30-14 30 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M190 138h52c8 0 12-6 10-12l-4-10c-10 0-22-4-30-12h-20z" fill={CORAL} />
          <path d="M190 138h62" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="92" cy="58" r="10" fill={TEAL} opacity=".5" />
          <circle cx="258" cy="62" r="6" fill={VITA} opacity=".4" />
        </>
      );
    case "senior": // lunettes et tasse
      return (
        <>
          <circle cx="126" cy="96" r="24" fill="none" stroke={INK} strokeWidth="6" />
          <circle cx="190" cy="96" r="24" fill="none" stroke={INK} strokeWidth="6" />
          <path d="M150 94c4-6 12-6 16 0M102 92l-16-8M214 92l16-8" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <rect x="226" y="120" width="40" height="34" rx="8" fill={CORAL} />
          <path d="M266 128c12 0 12 18 0 18" fill="none" stroke={CORAL} strokeWidth="5" />
          <path d="M238 112c0-8 6-8 6-16M252 112c0-8 6-8 6-16" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" opacity=".6" />
        </>
      );
    case "revenus": // portefeuille et pièces
      return (
        <>
          <rect x="94" y="64" width="120" height="78" rx="14" fill={INK} />
          <rect x="166" y="88" width="56" height="30" rx="10" fill={TEAL} />
          <circle cx="182" cy="103" r="6" fill="#fff" />
          <path d="M106 64l70-22 10 22" fill="#fff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <circle cx="244" cy="128" r="16" fill={CORAL} />
          <circle cx="250" cy="104" r="12" fill={CORAL} opacity=".7" />
        </>
      );
    case "deces": // parapluie qui protège une famille
      return (
        <>
          <path d="M96 98a64 50 0 0 1 128 0z" fill={VITA} />
          <path d="M160 48v6M160 98v40c0 10 14 10 14 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="132" cy="122" r="9" fill={TEAL} />
          <rect x="122" y="132" width="20" height="18" rx="8" fill={TEAL} />
          <circle cx="190" cy="126" r="7" fill={CORAL} />
          <rect x="182" y="134" width="16" height="16" rx="6" fill={CORAL} />
        </>
      );
    case "autonomie": // maison et main qui soutient
      return (
        <>
          <path d="M116 92l44-36 44 36v44h-88z" fill={TEAL} />
          <rect x="148" y="106" width="24" height="30" rx="4" fill="#fff" />
          <path d="M84 150c20 0 36-10 56-10h60c10 0 10 14 0 14h-30" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <circle cx="232" cy="70" r="12" fill={CORAL} />
        </>
      );
    case "optique":
      return (
        <>
          <rect x="96" y="76" width="56" height="42" rx="18" fill="#fff" stroke={INK} strokeWidth="6" />
          <rect x="168" y="76" width="56" height="42" rx="18" fill="#fff" stroke={INK} strokeWidth="6" />
          <path d="M152 92c4-6 12-6 16 0" fill="none" stroke={INK} strokeWidth="6" />
          <path d="M110 90l12 12M182 90l12 12" stroke={VITA} strokeWidth="4" strokeLinecap="round" opacity=".5" />
        </>
      );
    case "dentaire":
      return (
        <>
          <path d="M132 60c14-8 22 2 28 2s14-10 28-2c16 10 8 36 2 52-4 12-6 30-14 30-6 0-8-24-16-24s-10 24-16 24c-8 0-10-18-14-30-6-16-14-42 2-52z" fill="#fff" stroke={INK} strokeWidth="5" />
          <circle cx="236" cy="66" r="8" fill={TEAL} opacity=".6" />
          <path d="M228 66h16M236 58v16" stroke="#fff" strokeWidth="3" />
        </>
      );
    default: // santé : cœur et stéthoscope
      return (
        <>
          <path d="M160 140s-50-28-50-62c0-16 12-28 27-28 10 0 18 6 23 14 5-8 13-14 23-14 15 0 27 12 27 28 0 34-50 62-50 62z" fill={TEAL} />
          <path d="M138 92h12l6-12 8 24 6-12h14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M226 54v34c0 18-14 26-26 26" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="226" cy="50" r="8" fill={CORAL} />
        </>
      );
  }
}

export default function ProductIllustration({ theme, className = "" }: { theme: Theme; className?: string }) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" fill={BG[theme]} />
      <circle cx="40" cy="160" r="60" fill="#fff" opacity=".35" />
      <circle cx="300" cy="20" r="46" fill="#fff" opacity=".35" />
      <Scene theme={theme} />
    </svg>
  );
}
