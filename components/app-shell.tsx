"use client"

import { useState } from "react"
import { I18nProvider, useI18n } from "@/lib/i18n"
import { PointsProvider } from "@/lib/points-context"
import { AppHeader } from "./app-header"
import { BottomNav } from "./bottom-nav"
import { HomeTab } from "./tabs/home-tab"
import { ScanTab } from "./tabs/scan-tab"
import { MapTab } from "./tabs/map-tab"
import { SaasTab } from "./tabs/saas-tab"
import { ProfileTab } from "./tabs/profile-tab"

type Tab = "home" | "scan" | "map" | "saas" | "profile"

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <AppHeader />
      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
        {activeTab === "home" && <HomeTab onTabChange={setActiveTab} />}
        {activeTab === "scan" && <ScanTab />}
        {activeTab === "map" && <MapTab />}
        {activeTab === "saas" && <SaasTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {/* Footer */}
      <div className="px-4 pb-20 text-center">
        <p className="text-[9px] text-muted-foreground leading-relaxed">{t("poweredBy")}</p>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export function AppShell() {
  return (
    <I18nProvider>
      <PointsProvider>
        <AppContent />
      </PointsProvider>
    </I18nProvider>
  )
}
