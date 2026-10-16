import Link from "next/link";
import VitaLogo from "./vita/VitaLogo";

const NAV = [
  { href: "/#garanties", label: "Garanties" },
  { href: "/#documents", label: "Documents" },
  { href: "/assistant", label: "Assistant Vita" },
  { href: "/extraction", label: "Extraction" },
  { href: "/#questions", label: "Questions fréquentes" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <VitaLogo className="h-8 w-8 shrink-0" />
          <span className="font-[family-name:var(--font-bricolage)] whitespace-nowrap text-xl font-bold">
            Vita <span className="font-medium hidden text-muted sm:inline">Mutuelle</span>
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden gap-6 text-sm font-medium text-muted md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/#garanties" className="shrink-0 whitespace-nowrap rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
            <span className="sm:hidden">Formules</span>
            <span className="hidden sm:inline">Comparer les formules</span>
          </Link>

          {/* Menu mobile : <details> natif, s'ouvre et se ferme sans JavaScript */}
          <details className="group relative md:hidden">
            <summary
              aria-label="Ouvrir le menu"
              className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-ink/15"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h14" />
              </svg>
              <svg viewBox="0 0 20 20" className="hidden h-4 w-4 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </summary>
            <nav
              aria-label="Navigation mobile"
              className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-[0_20px_40px_-20px_rgba(15,42,46,0.4)]"
            >
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="block px-4 py-2.5 text-sm font-medium hover:bg-paper">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
