import type { Metadata } from "next"
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ForumHeader } from "@/components/ForumHeader"
import { Sidebar } from "@/components/Sidebar"

const dmSerif = DM_Serif_Display({
  variable: "--font-display", subsets: ["latin"], weight: "400",
})
const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] })
const jetbrains = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] })

export const metadata: Metadata = {
  title: "4by4 — Forum",
  description: "Un forum propre, sans distraction.",
  openGraph: { title: "4by4 — Forum", description: "Un forum propre, sans distraction.", type: "website" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${dmSerif.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ForumHeader />
        <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
        <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground font-mono">
          4by4 · Forum propulsé par la communauté
        </footer>
      </body>
    </html>
  )
}
