"use client"

import { useI18n } from "@/lib/i18n"
import { MapPin, Navigation, Recycle, Zap, Search, CheckCircle2 } from "lucide-react"
import { useState } from "react"

const collectionPoints = [
  { id: 1, name: "URENCO Green Hub", type: "recycling", address: "45 Nguyen Trai, Thanh Xuan, Ha Noi", distance: "0.8 km", verified: true, lat: 21.003, lng: 105.82 },
  { id: 2, name: "VinEco Collection Point", type: "recycling", address: "112 Le Van Luong, Cau Giay, Ha Noi", distance: "1.2 km", verified: true, lat: 21.007, lng: 105.79 },
  { id: 3, name: "E-waste Smart Bin #47", type: "ewaste", address: "Royal City, 72A Nguyen Trai", distance: "1.5 km", verified: true, lat: 20.998, lng: 105.815 },
  { id: 4, name: "Green Point Keangnam", type: "recycling", address: "Keangnam Landmark, Pham Hung", distance: "2.1 km", verified: true, lat: 21.015, lng: 105.78 },
  { id: 5, name: "E-waste Drop-off Center", type: "ewaste", address: "88 Tran Duy Hung, Cau Giay", distance: "2.4 km", verified: false, lat: 21.009, lng: 105.795 },
]

export function MapTab() {
  const { t, lang } = useI18n()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "recycling" | "ewaste">("all")

  const filtered = collectionPoints.filter((p) => {
    if (filter === "all") return true
    return p.type === filter
  }).filter((p) => {
    if (!search) return true
    return p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h2 className="text-lg font-bold text-foreground">{t("collectionMap")}</h2>

      {/* Map Placeholder */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#e8f5e9] border border-border">
        {/* Simulated map with dots */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 400 200" className="w-full h-full" aria-hidden="true">
            {/* Grid lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="rgba(80,200,120,0.15)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="200" stroke="rgba(80,200,120,0.15)" strokeWidth="0.5" />
            ))}
            {/* Roads */}
            <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(80,200,120,0.3)" strokeWidth="2" />
            <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(80,200,120,0.3)" strokeWidth="2" />
            <line x1="50" y1="0" x2="350" y2="200" stroke="rgba(80,200,120,0.2)" strokeWidth="1" />
          </svg>
        </div>

        {/* Collection point markers */}
        {collectionPoints.slice(0, 4).map((p, i) => (
          <div
            key={p.id}
            className="absolute"
            style={{ left: `${20 + i * 18}%`, top: `${25 + (i % 2 === 0 ? 0 : 30)}%` }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
              p.type === "recycling" ? "bg-primary text-primary-foreground" : "bg-[#fbbf24] text-foreground"
            }`}>
              {p.type === "recycling" ? <Recycle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            <div className="w-2 h-2 rounded-full bg-primary/30 mx-auto -mt-1 animate-ping" />
          </div>
        ))}

        {/* User location */}
        <div className="absolute left-[45%] top-[50%]">
          <div className="w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-white shadow-lg" />
          <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 absolute -top-2 -left-2 animate-ping" />
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[9px] text-foreground font-medium">{t("recyclingHub")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            <span className="text-[9px] text-foreground font-medium">{t("eWasteBin")}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("findNearest")}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "recycling", "ewaste"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f === "all" ? (lang === "vi" ? "T\u1ea5t c\u1ea3" : "All") : f === "recycling" ? t("recyclingHub") : t("eWasteBin")}
          </button>
        ))}
      </div>

      {/* Points List */}
      <div className="flex flex-col gap-2">
        {filtered.map((point) => (
          <div
            key={point.id}
            className="flex items-start gap-3 p-4 rounded-xl bg-card backdrop-blur-sm border border-border"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              point.type === "recycling" ? "bg-primary/10 text-primary" : "bg-[#fbbf24]/10 text-[#92400e]"
            }`}>
              {point.type === "recycling" ? <Recycle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-foreground truncate">{point.name}</h4>
                {point.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{point.address}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-medium text-primary">{point.distance}</span>
                <button className="flex items-center gap-1 text-xs font-medium text-accent-foreground hover:text-primary transition-colors">
                  <Navigation className="w-3 h-3" />
                  {t("navigate")}
                </button>
              </div>
            </div>
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
