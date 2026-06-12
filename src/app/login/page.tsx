"use client"

import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
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
  const sp = useSearchParams()
  const redirect = sp.get("redirect") || "/"
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
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-bold">4by4</Link>
          <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-wider">{isSignUp ? "Inscription" : "Connexion"}</p>
        </div>
        <div className="panel p-6 glow-terracotta">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg px-3 py-2">{error}</div>}
            {isSignUp && <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} placeholder="Nom d'utilisateur" className="bg-background border-border text-sm h-9 rounded-lg" />}
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="bg-background border-border text-sm h-9 rounded-lg" />
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mot de passe" className="bg-background border-border text-sm h-9 rounded-lg" />
            <Button type="submit" disabled={loading} className="w-full rounded-lg bg-primary hover:bg-primary/90 text-sm h-9 font-semibold">{loading ? "…" : isSignUp ? "Créer" : "Connexion"}</Button>
          </form>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          {isSignUp ? "Déjà inscrit ?" : "Pas de compte ?"}{" "}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">{isSignUp ? "Connexion" : "S'inscrire"}</button>
        </p>
      </div>
    </div>
  )
}
