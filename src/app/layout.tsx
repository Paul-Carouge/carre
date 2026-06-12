import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
})

const geist = Geist({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] })
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] })

export const metadata: Metadata = {
  title: "4by4 — Forum",
  description: "Un forum structuré, brut, sans algorithme.",
  openGraph: {
    title: "4by4 — Forum",
    description: "Un forum structuré, brut, sans algorithme.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
