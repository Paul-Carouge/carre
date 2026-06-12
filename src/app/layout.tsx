import type { Metadata } from "next"
import { Space_Grotesk, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ForumHeader } from "@/components/ForumHeader"
import { GSAPProvider } from "@/components/GSAPProvider"

const space = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const geist = Geist({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] })
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] })

export const metadata: Metadata = {
  title: "4by4 — Forum",
  description: "Un forum brut, structuré, sans distraction.",
  openGraph: { title: "4by4 — Forum", description: "Un forum brut, structuré, sans distraction.", type: "website" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${space.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <GSAPProvider>
          <ForumHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border mt-20 py-8 text-center text-xs text-muted-foreground font-mono">
            4by4 · Forum communautaire
          </footer>
        </GSAPProvider>
      </body>
    </html>
  )
}
