import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Erreur</p>
        <div className="font-display text-8xl font-bold tracking-tighter text-primary mb-6">404</div>
        <h1 className="font-display text-xl font-bold tracking-tight mb-3">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm">
            Retour
          </Button>
        </Link>
      </div>
    </div>
  )
}
