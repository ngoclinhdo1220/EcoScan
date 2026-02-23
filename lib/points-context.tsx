"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface ScanHistoryEntry {
  id: string
  item_vi: string
  item_en: string
  brand: string | null
  category_vi: string
  category_en: string
  material: string
  points: number
  txHash: string
  timestamp: number
}

export interface RankLevel {
  name_vi: string
  name_en: string
  minPoints: number
  color: string
  bgColor: string
}

export const rankLevels: RankLevel[] = [
  { name_vi: "Xanh L\u00e1", name_en: "Green", minPoints: 0, color: "text-[#22c55e]", bgColor: "bg-[#22c55e]/10" },
  { name_vi: "B\u1ea1c", name_en: "Silver", minPoints: 500, color: "text-[#94a3b8]", bgColor: "bg-[#94a3b8]/10" },
  { name_vi: "V\u00e0ng", name_en: "Gold", minPoints: 1500, color: "text-[#fbbf24]", bgColor: "bg-[#fbbf24]/10" },
  { name_vi: "Kim C\u01b0\u01a1ng", name_en: "Diamond", minPoints: 3000, color: "text-[#60a5fa]", bgColor: "bg-[#60a5fa]/10" },
  { name_vi: "Huy\u1ec1n Tho\u1ea1i", name_en: "Legend", minPoints: 5000, color: "text-[#f97316]", bgColor: "bg-[#f97316]/10" },
]

export function getRank(points: number, lang: "vi" | "en"): RankLevel {
  for (let i = rankLevels.length - 1; i >= 0; i--) {
    if (points >= rankLevels[i].minPoints) return rankLevels[i]
  }
  return rankLevels[0]
}

export function getNextRank(points: number): RankLevel | null {
  for (const level of rankLevels) {
    if (points < level.minPoints) return level
  }
  return null
}

interface PointsContextType {
  userPoints: number
  addPoints: (pts: number) => void
  totalScans: number
  addScan: () => void
  scanHistory: ScanHistoryEntry[]
  addScanEntry: (entry: Omit<ScanHistoryEntry, "id" | "timestamp">) => void
}

const defaultHistory: ScanHistoryEntry[] = [
  { id: "h1", item_vi: "Chai n\u01b0\u1edbc Lavie 500ml PET", item_en: "Lavie 500ml PET Bottle", brand: "Lavie", category_vi: "Nh\u1ef1a", category_en: "Plastic", material: "plastic", points: 15, txHash: "0x7a3f...c912", timestamp: Date.now() - 2 * 3600000 },
  { id: "h2", item_vi: "Lon Coca-Cola 330ml", item_en: "Coca-Cola Can 330ml", brand: "Coca-Cola", category_vi: "Kim lo\u1ea1i", category_en: "Metal", material: "metal", points: 20, txHash: "0x8b2e...d847", timestamp: Date.now() - 5 * 3600000 },
  { id: "h3", item_vi: "B\u00e1o gi\u1ea5y", item_en: "Newspaper", brand: null, category_vi: "Gi\u1ea5y", category_en: "Paper", material: "paper", points: 10, txHash: "0x4c1d...e593", timestamp: Date.now() - 24 * 3600000 },
  { id: "h4", item_vi: "Chai Heineken 330ml", item_en: "Heineken Bottle 330ml", brand: "Heineken", category_vi: "Th\u1ee7y tinh", category_en: "Glass", material: "glass", points: 18, txHash: "0x9f5a...b261", timestamp: Date.now() - 24 * 3600000 },
  { id: "h5", item_vi: "Chai Sting PET 330ml", item_en: "Sting PET 330ml", brand: "PepsiCo", category_vi: "Nh\u1ef1a", category_en: "Plastic", material: "plastic", points: 15, txHash: "0x2d8c...f734", timestamp: Date.now() - 48 * 3600000 },
]

const PointsContext = createContext<PointsContextType>({
  userPoints: 1920,
  addPoints: () => {},
  totalScans: 47,
  addScan: () => {},
  scanHistory: defaultHistory,
  addScanEntry: () => {},
})

export function PointsProvider({ children }: { children: ReactNode }) {
  const [userPoints, setUserPoints] = useState(1920)
  const [totalScans, setTotalScans] = useState(47)
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>(defaultHistory)

  const addPoints = useCallback((pts: number) => {
    setUserPoints(prev => prev + pts)
  }, [])

  const addScan = useCallback(() => {
    setTotalScans(prev => prev + 1)
  }, [])

  const addScanEntry = useCallback((entry: Omit<ScanHistoryEntry, "id" | "timestamp">) => {
    const newEntry: ScanHistoryEntry = {
      ...entry,
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    }
    setScanHistory(prev => [newEntry, ...prev])
  }, [])

  return (
    <PointsContext.Provider value={{ userPoints, addPoints, totalScans, addScan, scanHistory, addScanEntry }}>
      {children}
    </PointsContext.Provider>
  )
}

export function usePoints() {
  return useContext(PointsContext)
}
