"use client"

import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      if (isSignUp) {
        const { data, error: se } = await supabase.auth.signUp({ email, password, options: { data: { username, display_name: username } } })
        if (se) throw se
        if (data.user) await supabase.from("profiles").insert({ id: data.user.id, username, display_name: username })
        router.push("/"); router.refresh()
      } else {
        const { error: si } = await supabase.auth.signInWithPassword({ email, password })
        if (si) throw si
        router.push(redirect); router.refresh()
      }
    } catch (err: any) { setError(err.message || "Erreur") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-4xl font-extrabold tracking-tighter text-foreground">
            4by<span className="text-primary">4</span>
          </Link>
          <p className="text-muted-foreground text-[11px] mt-2 font-mono uppercase tracking-wider">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg px-4 py-3">{error}</div>}
          {isSignUp && <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required minLength={3}
            placeholder="Nom d'utilisateur" className="panel-offwhite text-sm h-10 rounded-xl" />}
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="Email" className="panel-offwhite text-sm h-10 rounded-xl" />
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            placeholder="Mot de passe" className="panel-offwhite text-sm h-10 rounded-xl" />
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary hover:bg-primary/90 font-semibold h-10 text-sm">
            {loading ? "…" : isSignUp ? "Créer le compte" : "Se connecter"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            {isSignUp ? "Déjà inscrit ?" : "Pas de compte ?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
              {isSignUp ? "Se connecter" : "S'inscrire"}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
