"use client";
// Barre de navigation collante de la page /garanties : un groupe de pastilles par organisme.
// La pastille du produit visible à l'écran est mise en évidence (IntersectionObserver).

import { useEffect, useRef, useState } from "react";

export type NavGroup = { organisme: string; products: { anchor: string; label: string }[] };

export default function ProductNav({ groups }: { groups: NavGroup[] }) {
  const [active, setActive] = useState(groups[0]?.products[0]?.anchor);
  const barRef = useRef<HTMLDivElement>(null);

  // Repère le produit dont le haut est dans la zone de lecture (sous la barre)
  useEffect(() => {
    const anchors = groups.flatMap((g) => g.products.map((p) => p.anchor));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    anchors.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [groups]);

  // Garde la pastille active visible quand la barre défile horizontalement (mobile)
  useEffect(() => {
    barRef.current?.querySelector(`[data-anchor="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav aria-label="Produits" className="sticky top-[61px] z-30 -mx-4 border-b border-line bg-paper/95 backdrop-blur sm:-mx-6">
      <div ref={barRef} className="flex items-center gap-6 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6">
        {groups.map((g) => (
          <div key={g.organisme} className="flex shrink-0 items-center gap-1.5">
            <span className="mr-1 whitespace-nowrap text-xs font-medium text-muted">{g.organisme}</span>
            {g.products.map((p) => (
              <a
                key={p.anchor}
                href={`#${p.anchor}`}
                data-anchor={p.anchor}
                aria-current={active === p.anchor ? "location" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                  active === p.anchor ? "bg-ink font-semibold text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink/30"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
