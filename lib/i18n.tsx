"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type Lang = "vi" | "en"

type Translations = {
  [key: string]: { vi: string; en: string }
}

const translations: Translations = {
  home: { vi: "Trang ch\u1ee7", en: "Home" },
  scan: { vi: "Qu\u00e9t", en: "Scan" },
  map: { vi: "B\u1ea3n \u0111\u1ed3", en: "Map" },
  saas: { vi: "Qu\u1ea3n tr\u1ecb", en: "SaaS" },
  profile: { vi: "C\u00e1 nh\u00e2n", en: "Profile" },
  greeting: { vi: "Ch\u00e0o Linh \u0110\u1ed7", en: "Hello Linh \u0110\u1ed7" },
  ecoPoints: { vi: "\u0110i\u1ec3m Eco", en: "Eco-points" },
  leaderboard: { vi: "B\u1ea3ng x\u1ebfp h\u1ea1ng \u0110\u1ea1i s\u1ee9 Xanh", en: "Green Ambassador Leaderboard" },
  offlineMsg: { vi: "D\u1eef li\u1ec7u s\u1ebd \u0111\u01b0\u1ee3c \u0111\u1ed3ng b\u1ed9 khi c\u00f3 m\u1ea1ng", en: "Data will sync once online" },
  offlineMode: { vi: "Ch\u1ebf \u0111\u1ed9 ngo\u1ea1i tuy\u1ebfn", en: "Offline Mode" },
  scanTitle: { vi: "M\u00e1y qu\u00e9t AI", en: "AI Scanner" },
  scanInstructions: { vi: "H\u01b0\u1edbng camera v\u00e0o r\u00e1c", en: "Point camera at waste" },
  startScan: { vi: "B\u1eaft \u0111\u1ea7u qu\u00e9t", en: "Start Scan" },
  scanning: { vi: "\u0110ang qu\u00e9t...", en: "Scanning..." },
  itemDetected: { vi: "Ph\u00e1t hi\u1ec7n r\u00e1c th\u1ea3i", en: "Waste Detected" },
  product: { vi: "S\u1ea3n ph\u1ea9m", en: "Product" },
  category: { vi: "Lo\u1ea1i", en: "Category" },
  brand: { vi: "Th\u01b0\u01a1ng hi\u1ec7u", en: "Brand" },
  groupRecyclable: { vi: "T\u00e1i ch\u1ebf \u0111\u01b0\u1ee3c", en: "Recyclable" },
  groupOrganic: { vi: "H\u1eefu c\u01a1", en: "Organic" },
  groupResidual: { vi: "R\u00e1c c\u00f2n l\u1ea1i", en: "Residual" },
  disposalTip: { vi: "H\u01b0\u1edbng d\u1eabn x\u1eed l\u00fd", en: "Disposal Tip" },
  photoConfirm: { vi: "X\u00e1c nh\u1eadn b\u1eb1ng \u1ea3nh", en: "Photo Confirmation" },
  photoConfirmDesc: { vi: "Ch\u1ee5p \u1ea3nh r\u00e1c trong th\u00f9ng \u0111\u1ec3 x\u00e1c minh", en: "Take a photo of waste in the bin to verify" },
  confirmDisposal: { vi: "X\u00e1c nh\u1eadn x\u1eed l\u00fd", en: "Confirm Disposal" },
  earnedPoints: { vi: "\u0110\u00e3 nh\u1eadn \u0111\u01b0\u1ee3c", en: "Earned" },
  points: { vi: "\u0111i\u1ec3m", en: "points" },
  collectionMap: { vi: "B\u1ea3n \u0111\u1ed3 thu gom", en: "Collection Map" },
  findNearest: { vi: "T\u00ecm g\u1ea7n nh\u1ea5t", en: "Find Nearest" },
  recyclingHub: { vi: "Trung t\u00e2m t\u00e1i ch\u1ebf", en: "Recycling Hub" },
  eWasteBin: { vi: "Th\u00f9ng r\u00e1c \u0111i\u1ec7n t\u1eed", en: "E-waste Bin" },
  dashboard: { vi: "B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n", en: "Dashboard" },
  eprReport: { vi: "B\u00e1o c\u00e1o EPR", en: "EPR Report" },
  esgIndex: { vi: "Ch\u1ec9 s\u1ed1 ESG", en: "ESG Index" },
  buildingManager: { vi: "Qu\u1ea3n l\u00fd t\u00f2a nh\u00e0", en: "Building Manager" },
  corporate: { vi: "Doanh nghi\u1ec7p", en: "Corporate" },
  schedulePickup: { vi: "\u0110\u1eb7t l\u1ecbch thu gom", en: "Schedule Pickup" },
  rewards: { vi: "Ph\u1ea7n th\u01b0\u1edfng", en: "Rewards" },
  plantTree: { vi: "Tr\u1ed3ng c\u00e2y", en: "Plant a Tree" },
  history: { vi: "L\u1ecbch s\u1eed", en: "History" },
  txHash: { vi: "M\u00e3 giao d\u1ecbch", en: "Tx Hash" },
  loginZalo: { vi: "\u0110\u0103ng nh\u1eadp v\u1edbi Zalo", en: "Login with Zalo" },
  shareZalo: { vi: "Chia s\u1ebb l\u00ean Zalo", en: "Share to Zalo" },
  settings: { vi: "C\u00e0i \u0111\u1eb7t", en: "Settings" },
  wasteVolume: { vi: "Kh\u1ed1i l\u01b0\u1ee3ng r\u00e1c", en: "Waste Volume" },
  co2Reduced: { vi: "CO\u2082 \u0111\u00e3 gi\u1ea3m", en: "CO\u2082 Reduced" },
  totalScans: { vi: "T\u1ed5ng l\u01b0\u1ee3t qu\u00e9t", en: "Total Scans" },
  thisWeek: { vi: "Tu\u1ea7n n\u00e0y", en: "This Week" },
  thisMonth: { vi: "Th\u00e1ng n\u00e0y", en: "This Month" },
  pickupType: { vi: "Lo\u1ea1i thu gom", en: "Pickup Type" },
  battery: { vi: "Pin", en: "Battery" },
  eWaste: { vi: "R\u00e1c \u0111i\u1ec7n t\u1eed", en: "E-waste" },
  bulkyWaste: { vi: "R\u00e1c c\u1ed3ng k\u1ec1nh", en: "Bulky Waste" },
  hazardous: { vi: "R\u00e1c nguy h\u1ea1i", en: "Hazardous" },
  address: { vi: "\u0110\u1ecba ch\u1ec9", en: "Address" },
  submitRequest: { vi: "G\u1eedi y\u00eau c\u1ea7u", en: "Submit Request" },
  level: { vi: "C\u1ea5p \u0111\u1ed9", en: "Level" },
  greenAmbassador: { vi: "\u0110\u1ea1i s\u1ee9 Xanh", en: "Green Ambassador" },
  ecoVouchers: { vi: "Voucher Eco", en: "Eco Vouchers" },
  poweredBy: { vi: "H\u1ed7 tr\u1ee3 b\u1edfi ResNet-50 AI & Blockchain. Tu\u00e2n th\u1ee7 Lu\u1eadt B\u1ea3o v\u1ec7 M\u00f4i tr\u01b0\u1eddng Vi\u1ec7t Nam 2020", en: "Powered by ResNet-50 AI & Blockchain. Compliant with Vietnam Environmental Protection Law 2020" },
  verified: { vi: "\u0110\u00e3 x\u00e1c minh", en: "Verified" },
  unidentifiedBrand: { vi: "Th\u01b0\u01a1ng hi\u1ec7u ch\u01b0a x\u00e1c \u0111\u1ecbnh", en: "Unidentified Brand" },
  helpUsLearn: { vi: "Gi\u00fap ch\u00fang t\u00f4i h\u1ecdc", en: "Help us learn" },
  newBrandDetected: { vi: "Th\u01b0\u01a1ng hi\u1ec7u m\u1edbi ph\u00e1t hi\u1ec7n!", en: "New brand detected!" },
  isThisCorrect: { vi: "\u0110\u00e2y l\u00e0 lo\u1ea1i v\u1eadt li\u1ec7u n\u00e0o?", en: "What material is this?" },
  confirm: { vi: "X\u00e1c nh\u1eadn", en: "Confirm" },
  thankYou: { vi: "C\u1ea3m \u01a1n b\u1ea1n!", en: "Thank you!" },
  learningData: { vi: "D\u1eef li\u1ec7u \u0111\u00e3 \u0111\u01b0\u1ee3c ghi nh\u1eadn.", en: "Data has been recorded." },
  shape: { vi: "H\u00ecnh d\u1ea1ng", en: "Shape" },
  materialType: { vi: "V\u1eadt li\u1ec7u", en: "Material" },
  navigate: { vi: "Ch\u1ec9 \u0111\u01b0\u1eddng", en: "Navigate" },
  plastic: { vi: "Nh\u1ef1a", en: "Plastic" },
  glass: { vi: "Th\u1ee7y tinh", en: "Glass" },
  paper: { vi: "Gi\u1ea5y", en: "Paper" },
  metal: { vi: "Kim lo\u1ea1i", en: "Metal" },
  organic: { vi: "H\u1eefu c\u01a1", en: "Organic" },
  today: { vi: "H\u00f4m nay", en: "Today" },
  yesterday: { vi: "H\u00f4m qua", en: "Yesterday" },
  quickActions: { vi: "Thao t\u00e1c nhanh", en: "Quick Actions" },
  weeklyGoal: { vi: "M\u1ee5c ti\u00eau tu\u1ea7n", en: "Weekly Goal" },
  scanNow: { vi: "Qu\u00e9t ngay", en: "Scan Now" },
  viewMap: { vi: "Xem b\u1ea3n \u0111\u1ed3", en: "View Map" },
  requestPickup: { vi: "Y\u00eau c\u1ea7u thu gom", en: "Request Pickup" },
  redeemPoints: { vi: "Quy \u0111\u1ed5i \u0111i\u1ec3m", en: "Redeem Points" },
}

interface I18nContextType {
  lang: Lang
  toggleLang: () => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: "vi",
  toggleLang: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi")

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "vi" ? "en" : "vi"))
  }, [])

  const t = useCallback(
    (key: string) => {
      const entry = translations[key]
      if (!entry) return key
      return entry[lang]
    },
    [lang]
  )

  return <I18nContext.Provider value={{ lang, toggleLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
