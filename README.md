# Carré — Le forum

Forum personnel élégant, construit avec Next.js 16, Tailwind v4 et Supabase.

## 🎨 Design

- **Palette** : Noir charbon (#0D0D12) + Or (#D4A040)
- **Typographie** : Playfair Display (titres) + DM Sans (corps) + JetBrains Mono (code)
- **Style** : Dark-mode natif, cartes glass, bordures subtiles, animations GSAP

## 🚀 Déploiement

```bash
npm install
npm run dev    # Développement
npm run build  # Build production
```

## 🗄️ Base de données

### Option 1 — Dashboard Supabase (recommandé)

1. Aller sur https://supabase.com/dashboard/project/zxnfagxjilltrecojdco/sql/new
2. Copier le contenu de `schema.sql`
3. Cliquer "Run"

### Option 2 — CLI Supabase

```bash
npx supabase login
npx supabase link --project-ref zxnfagxjilltrecojdco
npx supabase db push
```

## 📋 Structure

```
src/
  app/            — Pages (App Router)
  components/     — Composants React
  lib/            — Utilitaires, types, clients Supabase
schema.sql       — Schéma complet (tables, RLS, seeds)
```

## 🔑 Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=https://zxnfagxjilltrecojdco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```
