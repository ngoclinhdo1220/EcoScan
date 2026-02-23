"use client"

import { useI18n } from "@/lib/i18n"
import { usePoints, rankLevels, getRank, getNextRank } from "@/lib/points-context"
import { Leaf, ScanLine, MapPin, Truck, Gift, TrendingUp, Trophy, Star, Zap, Target, ChevronRight, Award } from "lucide-react"

function timeAgo(vi: string, en: string, lang: string) {
  return lang === "vi" ? vi : en
}

function fmtNum(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const leaderboard = [
  { name: "Minh Anh", points: 2850, avatar: "MA" },
  { name: "Thu Trang", points: 2340, avatar: "TT" },
  { name: "Linh \u0110\u1ed7", points: 1920, avatar: "L\u0110" },
  { name: "Duc Huy", points: 1750, avatar: "DH" },
  { name: "Ngoc Mai", points: 1520, avatar: "NM" },
]

function formatTimeAgo(ts: number, lang: "vi" | "en") {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return lang === "vi" ? "V\u1eeba xong" : "Just now"
  if (mins < 60) return lang === "vi" ? `${mins} ph\u00fat tr\u01b0\u1edbc` : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return lang === "vi" ? `${hrs} gi\u1edd tr\u01b0\u1edbc` : `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return lang === "vi" ? "H\u00f4m qua" : "Yesterday"
  return lang === "vi" ? `${days} ng\u00e0y tr\u01b0\u1edbc` : `${days}d ago`
}

interface HomeTabProps {
  onTabChange: (tab: "home" | "scan" | "map" | "saas" | "profile") => void
}

export function HomeTab({ onTabChange }: HomeTabProps) {
  const { t, lang } = useI18n()
  const { userPoints, totalScans, scanHistory } = usePoints()
  const currentRank = getRank(userPoints, lang)
  const nextRank = getNextRank(userPoints)

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Greeting & Points */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#059669] p-5 text-primary-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 -ml-6 -mb-6" />
        <div className="relative">
          <p className="text-sm font-medium opacity-90">{t("greeting")} {"👋"}</p>
          <h2 className="text-2xl font-bold mt-1 text-balance">{t("greenAmbassador")}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex flex-col">
              <span className="text-xs opacity-80">{t("ecoPoints")}</span>
              <div className="flex items-center gap-1.5">
                <Leaf className="w-5 h-5" />
                <span className="text-3xl font-bold tracking-tight">{fmtNum(userPoints)}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col">
              <span className="text-xs opacity-80">{t("level")}</span>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4" />
                <span className="text-lg font-bold">{lang === "vi" ? currentRank.name_vi : currentRank.name_en}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">{t("weeklyGoal")}</span>
          </div>
          <span className="text-xs text-primary font-bold">{Math.min(12 + (totalScans - 47), 20)}/20</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${Math.min(100, ((12 + (totalScans - 47)) / 20) * 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {Math.max(0, 20 - (12 + (totalScans - 47))) > 0
            ? (lang === "vi" ? `C\u00f2n ${Math.max(0, 20 - (12 + (totalScans - 47)))} l\u1ea7n qu\u00e9t n\u1eefa \u0111\u1ec3 \u0111\u1ea1t m\u1ee5c ti\u00eau tu\u1ea7n` : `${Math.max(0, 20 - (12 + (totalScans - 47)))} more scans to reach this week's goal`)
            : (lang === "vi" ? "\u0110\u00e3 \u0111\u1ea1t m\u1ee5c ti\u00eau tu\u1ea7n!" : "Weekly target achieved!")}
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-foreground text-sm mb-3">{t("quickActions")}</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: ScanLine, label: t("scanNow"), color: "bg-primary/10 text-primary", tab: "scan" as const },
            { icon: MapPin, label: t("viewMap"), color: "bg-accent/10 text-accent-foreground", tab: "map" as const },
            { icon: Truck, label: t("requestPickup"), color: "bg-[#fbbf24]/10 text-[#92400e]", tab: "saas" as const },
            { icon: Gift, label: t("redeemPoints"), color: "bg-[#f97316]/10 text-[#9a3412]", tab: "profile" as const },
          ].map(({ icon: Icon, label, color, tab }) => (
            <button
              key={label}
              onClick={() => onTabChange(tab)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card backdrop-blur-sm border border-border hover:border-primary/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">{t("history")}</h3>
          <span className="text-xs text-primary font-medium">{t("today")}</span>
        </div>
        <div className="flex flex-col gap-2">
          {scanHistory.slice(0, 3).map((scan) => (
            <div
              key={scan.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card backdrop-blur-sm border border-border"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{lang === "vi" ? scan.item_vi : scan.item_en}</p>
                <p className="text-xs text-muted-foreground">{lang === "vi" ? scan.category_vi : scan.category_en} &middot; {formatTimeAgo(scan.timestamp, lang)}</p>
              </div>
              <span className="text-sm font-bold text-primary">+{scan.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">{t("leaderboard")}</h3>
        </div>
        <div className="rounded-xl bg-card backdrop-blur-sm border border-border overflow-hidden">
          {leaderboard.map((user, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < leaderboard.length - 1 ? "border-b border-border" : ""
              } ${user.name === "Linh \u0110\u1ed7" ? "bg-primary/5" : ""}`}
            >
              <span className={`w-6 text-center font-bold text-sm ${
                i === 0 ? "text-[#fbbf24]" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-[#f97316]" : "text-muted-foreground"
              }`}>
                {i + 1}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                user.name === "Linh \u0110\u1ed7" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
                {user.avatar}
              </div>
              <span className={`flex-1 text-sm font-medium ${
                user.name === "Linh \u0110\u1ed7" ? "text-primary" : "text-foreground"
              }`}>
                {user.name} {user.name === "Linh \u0110\u1ed7" && <span className="text-xs text-muted-foreground">{lang === "vi" ? "(b\u1ea1n)" : "(you)"}</span>}
              </span>
              <div className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-primary" />
                <span className="text-sm font-semibold text-foreground">{fmtNum(user.name === "Linh \u0110\u1ed7" ? userPoints : user.points)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rank Levels */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">{lang === "vi" ? "C\u1ea5p \u0111\u1ed9 \u0110\u1ea1i s\u1ee9 Xanh" : "Ambassador Rank Levels"}</h3>
        </div>
        <div className="rounded-xl bg-card backdrop-blur-sm border border-border overflow-hidden">
          {rankLevels.map((level, i) => {
            const isCurrentRank = currentRank.minPoints === level.minPoints
            const isAchieved = userPoints >= level.minPoints
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < rankLevels.length - 1 ? "border-b border-border" : ""
                } ${isCurrentRank ? "bg-primary/5" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${level.bgColor} ${level.color}`}>
                  <Star className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCurrentRank ? "text-primary" : "text-foreground"}`}>
                      {lang === "vi" ? level.name_vi : level.name_en}
                    </span>
                    {isCurrentRank && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {lang === "vi" ? "Hi\u1ec7n t\u1ea1i" : "Current"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {level.minPoints === 0
                      ? (lang === "vi" ? "B\u1eaft \u0111\u1ea7u" : "Starting")
                      : `${fmtNum(level.minPoints)} ${lang === "vi" ? "\u0111i\u1ec3m" : "points"}`
                    }
                  </span>
                </div>
                {isAchieved && !isCurrentRank && (
                  <span className="text-xs text-primary font-semibold">{lang === "vi" ? "\u0110\u1ea1t" : "Done"}</span>
                )}
                {isCurrentRank && nextRank && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {nextRank.minPoints - userPoints} {lang === "vi" ? "\u0111i\u1ec3m n\u1eefa" : "more"}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalScans}</p>
          <p className="text-xs text-muted-foreground">{t("totalScans")}</p>
        </div>
        <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
          <Leaf className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">2.3kg</p>
          <p className="text-xs text-muted-foreground">{t("co2Reduced")}</p>
        </div>
      </div>
    </div>
  )
}
