"use client"

import { useI18n } from "@/lib/i18n"
import { Leaf, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function AppHeader() {
  const { lang, toggleLang, t } = useI18n()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-sans font-bold text-foreground text-lg tracking-tight">EcoScan</span>
        </div>

        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              <WifiOff className="w-3 h-3" />
              <span>{t("offlineMode")}</span>
            </div>
          )}
          {isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Wifi className="w-3 h-3" />
            </div>
          )}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold hover:opacity-80 transition-opacity"
            aria-label="Toggle language"
          >
            <span className={`text-sm ${lang === "vi" ? "opacity-100" : "opacity-40"}`}>
              {"🇻🇳"}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className={`text-sm ${lang === "en" ? "opacity-100" : "opacity-40"}`}>
              {"🇬🇧"}
            </span>
          </button>
        </div>
      </div>
      {!isOnline && (
        <div className="mt-2 text-center text-xs text-muted-foreground max-w-lg mx-auto">
          {t("offlineMsg")}
        </div>
      )}
    </header>
  )
}
