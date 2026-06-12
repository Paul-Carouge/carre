import type { Metadata } from "next"
import { Space_Grotesk, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ForumHeader } from "@/components/ForumHeader"
import { Sidebar } from "@/components/Sidebar"

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
        <ForumHeader />
        <div className="flex-1 flex max-w-6xl mx-auto w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 border-l border-border">{children}</main>
        </div>
        <footer className="border-t border-border mt-10 py-5 text-center text-[11px] text-muted-foreground font-mono">
          4by4 · Forum communautaire
        </footer>
      </body>
    </html>
  )
}
