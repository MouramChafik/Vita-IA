import VitaLogo from "./vita/VitaLogo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 pb-24 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <VitaLogo className="h-6 w-6" />
          <span className="font-semibold text-ink">Vita Mutuelle</span>
        </div>
        <p className="max-w-xl">
          Projet de démonstration. Vita Mutuelle est une mutuelle fictive, les garanties et tarifs sont des exemples.
          Les réponses de l&apos;assistant s&apos;appuient sur des documents publics.
        </p>
      </div>
    </footer>
  );
}
