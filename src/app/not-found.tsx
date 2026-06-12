import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6 font-display font-bold text-or">404</div>
        <h1 className="font-display text-2xl font-semibold mb-3">
          Page introuvable
        </h1>
        <p className="text-text-secondary mb-8 max-w-sm mx-auto">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link href="/" className="btn-primary text-sm inline-flex">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
