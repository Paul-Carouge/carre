import type { Metadata } from "next"
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Carré — Le forum",
  description: "Un espace de discussion élégant et minimaliste.",
  openGraph: {
    title: "Carré — Le forum",
    description: "Un espace de discussion élégant et minimaliste.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-noir text-text-primary">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
