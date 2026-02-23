"use client"

import { useI18n } from "@/lib/i18n"
import { Home, ScanLine, MapPin, LayoutDashboard, User } from "lucide-react"

type Tab = "home" | "scan" | "map" | "saas" | "profile"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; icon: typeof Home; labelKey: string }[] = [
  { id: "home", icon: Home, labelKey: "home" },
  { id: "map", icon: MapPin, labelKey: "map" },
  { id: "scan", icon: ScanLine, labelKey: "scan" },
  { id: "saas", icon: LayoutDashboard, labelKey: "saas" },
  { id: "profile", icon: User, labelKey: "profile" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/90 border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id
          const isScan = id === "scan"
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isScan ? "" : isActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={t(labelKey)}
            >
              {isScan ? (
                <div
                  className={`flex items-center justify-center w-12 h-12 -mt-5 rounded-full shadow-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-primary/80 text-primary-foreground"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              )}
              <span className={`text-[10px] font-medium ${isScan ? (isActive ? "text-primary" : "text-muted-foreground") : ""}`}>
                {t(labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
