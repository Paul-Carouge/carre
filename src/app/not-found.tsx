import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4 font-mono">Erreur</p>
        <div className="font-display text-8xl font-bold text-primary mb-4">404</div>
        <h1 className="font-display text-xl font-bold mb-3">Page introuvable</h1>
        <p className="text-[13px] text-muted-foreground mb-6">Cette page n&apos;existe pas.</p>
        <Link href="/"><Button className="rounded-lg bg-primary hover:bg-primary/90 text-sm h-9 font-semibold">Retour au forum</Button></Link>
      </div>
    </div>
  )
}
