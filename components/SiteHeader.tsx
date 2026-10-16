import Link from "next/link";
import VitaLogo from "./vita/VitaLogo";

const NAV = [
  { href: "/#garanties", label: "Garanties" },
  { href: "/#documents", label: "Documents" },
  { href: "/assistant", label: "Assistant Vita" },
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
        <Link href="/#garanties" className="shrink-0 whitespace-nowrap rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
          <span className="sm:hidden">Formules</span>
          <span className="hidden sm:inline">Comparer les formules</span>
        </Link>
      </div>
    </header>
  );
}
