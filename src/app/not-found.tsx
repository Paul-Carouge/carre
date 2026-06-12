import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="section-number mb-6">Erreur</p>
        <div className="font-display text-9xl font-extrabold tracking-tighter text-primary mb-6">404</div>
        <h1 className="font-display text-xl font-bold tracking-tight mb-3">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Cette page n&apos;existe pas.</p>
        <Link href="/"><Button className="rounded-full bg-primary hover:bg-primary/90 font-semibold text-sm">Retour au forum</Button></Link>
      </div>
    </div>
  )
}
