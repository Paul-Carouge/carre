"use client"

import { useEffect, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function GSAPProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])
  return <>{children}</>
}
