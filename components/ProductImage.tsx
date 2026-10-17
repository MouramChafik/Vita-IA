// Affichage d'une photo de produit (licence Unsplash), optimisée par next/image.
// Le choix de la photo se fait dans lib/photos.ts (thème + attribution sans doublon).
import Image from "next/image";
import type { Photo } from "@/lib/photos";

// sizes : largeur affichée selon l'écran, pour que next/image serve la bonne taille
export default function ProductImage({
  photo,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  photo: Photo;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-teal-soft ${className}`}>
      <Image src={`${photo.src}?auto=format&fit=crop&w=1600&q=75`} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
