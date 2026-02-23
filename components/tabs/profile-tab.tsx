"use client"

import { useI18n } from "@/lib/i18n"
import { usePoints, getRank } from "@/lib/points-context"
import { Leaf, Gift, TreePine, Hash, Clock, Star, Share2, LogIn, ChevronRight, ShieldCheck, Award, Coffee, ShoppingBag, Bike, Droplets } from "lucide-react"

const vouchers = [
  { name_vi: "Starbucks Ly Xanh", name_en: "Starbucks Green Cup", points: 200, icon: Coffee, color: "bg-primary/10 text-primary" },
  { name_vi: "Grab Chuy\u1ebfn Eco", name_en: "Grab Eco Ride", points: 150, icon: Bike, color: "bg-accent/10 text-accent-foreground" },
  { name_vi: "Shopee T\u00fai Eco", name_en: "Shopee Eco Bag", points: 100, icon: ShoppingBag, color: "bg-[#fbbf24]/10 text-[#92400e]" },
  { name_vi: "Aquafina Refill", name_en: "Aquafina Refill", points: 80, icon: Droplets, color: "bg-[#3b82f6]/10 text-[#1d4ed8]" },
]

const scanHistory = [
  { item_vi: "Chai Lavie 500ml PET", item_en: "Lavie 500ml PET", brand: "Lavie", points: 15, hash: "0x7a3f...c912", time_vi: "10:30 SA", time_en: "10:30 AM" },
  { item_vi: "Lon Coca-Cola 330ml", item_en: "Coca-Cola Can 330ml", brand: "Coca-Cola", points: 20, hash: "0x8b2e...d847", time_vi: "09:15 SA", time_en: "09:15 AM" },
  { item_vi: "H\u1ed9p s\u1eefa Vinamilk 1L", item_en: "Vinamilk 1L Carton", brand: "Vinamilk", points: 12, hash: "0x4c1d...e593", time_vi: "H\u00f4m qua", time_en: "Yesterday" },
  { item_vi: "Chai Heineken 330ml", item_en: "Heineken Bottle 330ml", brand: "Heineken", points: 18, hash: "0x9f5a...b261", time_vi: "H\u00f4m qua", time_en: "Yesterday" },
  { item_vi: "Chai Sting PET 330ml", item_en: "Sting PET 330ml", brand: "PepsiCo", points: 15, hash: "0x2d8c...f734", time_vi: "2 ng\u00e0y tr\u01b0\u1edbc", time_en: "2 days ago" },
]

export function ProfileTab() {
  const { t, lang } = useI18n()
  const { userPoints } = usePoints()
  const currentRank = getRank(userPoints, lang)

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-2xl bg-card backdrop-blur-sm border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xl font-bold">
            {"L\u0110"}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{"Linh \u0110\u1ed7"}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{t("greenAmbassador")} - {lang === "vi" ? currentRank.name_vi : currentRank.name_en}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Leaf className="w-3 h-3 text-primary" />
              <span className="text-sm font-bold text-foreground">{userPoints.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {t("ecoPoints")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0068ff]/10 text-[#0068ff] font-semibold text-xs border border-[#0068ff]/20 hover:bg-[#0068ff]/20 transition-colors">
          <LogIn className="w-4 h-4" />
          {t("loginZalo")}
        </button>
        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-xs border border-primary/20 hover:bg-primary/20 transition-colors">
          <Share2 className="w-4 h-4" />
          {t("shareZalo")}
        </button>
      </div>

      {/* Eco Vouchers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">{t("ecoVouchers")}</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {vouchers.map((v, i) => (
            <div
              key={i}
              className="rounded-xl bg-card backdrop-blur-sm border border-border p-3 hover:border-primary/30 transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${v.color}`}>
                <v.icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">{lang === "vi" ? v.name_vi : v.name_en}</p>
              <div className="flex items-center gap-1 mt-1">
                <Leaf className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary">{v.points} {t("points")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plant a Tree */}
      <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <TreePine className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-foreground">{t("plantTree")}</p>
          <p className="text-xs text-muted-foreground">500 {t("ecoPoints")} = 1 {lang === "vi" ? "c\u00e2y" : "tree"}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Scan History with Blockchain */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">{t("history")}</h3>
          <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full bg-primary/10">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-medium text-primary">Blockchain</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {scanHistory.map((scan, i) => (
            <div
              key={i}
              className="rounded-xl bg-card backdrop-blur-sm border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lang === "vi" ? scan.item_vi : scan.item_en}</p>
                  <p className="text-xs text-muted-foreground">{scan.brand} &middot; {lang === "vi" ? scan.time_vi : scan.time_en}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Leaf className="w-3 h-3 text-primary" />
                  <span className="text-sm font-bold text-primary">+{scan.points}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                <Hash className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">{t("txHash")}: {scan.hash}</span>
                <Star className="w-2.5 h-2.5 text-primary/50 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
