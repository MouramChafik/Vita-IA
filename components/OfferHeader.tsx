// En-tête d'une offre (organisme) : badge, nom, source, actions.
import DocumentActions from "./DocumentActions";
import AskVitaButton from "./vita/AskVitaButton";
import type { Offer } from "@/lib/offers";

export default function OfferHeader({ offer, headingLevel = 2 }: { offer: Offer; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm">
          {offer.base ? (
            <span className="rounded-full bg-teal-soft px-2.5 py-1 font-medium text-teal">Offre de base</span>
          ) : (
            <span className="rounded-full bg-vita-soft px-2.5 py-1 font-medium text-vita">
              Ajouté depuis l&apos;extraction
              {offer.publishedAt && ` le ${new Date(offer.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
            </span>
          )}
        </p>
        <Heading className="mt-3 text-3xl font-bold">
          {offer.table.organisme}
          {offer.table.annee ? <span className="font-medium text-muted"> {offer.table.annee}</span> : null}
        </Heading>
        <p className="mt-1 text-sm text-muted">
          Source :{" "}
          <a href={offer.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
            {offer.source.title}
          </a>
          {offer.source.pageCount ? `, ${offer.source.pageCount} page${offer.source.pageCount > 1 ? "s" : ""}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <AskVitaButton
          question={`Quelles sont les principales garanties de ${offer.table.organisme} ?`}
          className="rounded-full bg-vita px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Demander à Vita
        </AskVitaButton>
        {offer.documentId && <DocumentActions id={offer.documentId} title={offer.source.title} />}
      </div>
    </div>
  );
}
