// Logo Vita : un tracé de pouls (électrocardiogramme) dont le pic central forme un « V ».
export default function VitaLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--color-teal)" />
      <path
        className="pulse-path"
        pathLength={100}
        d="M5 21h7l3-6 5 14 5-18 3 10h7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
