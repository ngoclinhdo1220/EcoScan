"use client"

import { useI18n } from "@/lib/i18n"
import { useState, useMemo } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Building2, Globe, ChevronLeft, ChevronRight, Send, BarChart3, PieChartIcon, TrendingDown, QrCode, FileText, CalendarDays, MapPin, Package, X, Truck } from "lucide-react"

// --- Static data ---
const eprData = [
  { brand: "Lavie", value: 320, category: "Plastic", sector: "Beverages", co2: 26240 },
  { brand: "Coca-Cola", value: 280, category: "Metal", sector: "Beverages", co2: 47600 },
  { brand: "Vinamilk", value: 195, category: "Paper", sector: "Dairy", co2: 3315 },
  { brand: "Pepsi", value: 160, category: "Metal", sector: "Beverages", co2: 27200 },
  { brand: "Heineken", value: 110, category: "Glass", sector: "Beverages", co2: 9460 },
  { brand: "Orion (Custas)", value: 85, category: "Paper", sector: "Food & Snacks", co2: 1445 },
  { brand: "Oishi", value: 72, category: "Plastic", sector: "Food & Snacks", co2: 5904 },
  { brand: "Trung Nguy\u00ean", value: 68, category: "Plastic", sector: "Beverages", co2: 5576 },
  { brand: "Acecook", value: 55, category: "Paper", sector: "Food & Snacks", co2: 935 },
  { brand: "Masan", value: 42, category: "Paper", sector: "Food & Snacks", co2: 714 },
  { brand: "Other/Local", value: 145, category: "Mixed", sector: "Mixed", co2: 11890 },
]

// Translation maps for data labels
const sectorLabel: Record<string, { vi: string; en: string }> = {
  "Beverages": { vi: "\u0110\u1ed3 u\u1ed1ng", en: "Beverages" },
  "Food & Snacks": { vi: "Th\u1ef1c ph\u1ea9m & B\u00e1nh k\u1eb9o", en: "Food & Snacks" },
  "Dairy": { vi: "S\u1eefa", en: "Dairy" },
  "Mixed": { vi: "H\u1ed7n h\u1ee3p", en: "Mixed" },
}
const categoryLabel: Record<string, { vi: string; en: string }> = {
  "Plastic": { vi: "Nh\u1ef1a", en: "Plastic" },
  "Metal": { vi: "Kim lo\u1ea1i", en: "Metal" },
  "Paper": { vi: "Gi\u1ea5y", en: "Paper" },
  "Glass": { vi: "Th\u1ee7y tinh", en: "Glass" },
  "Mixed": { vi: "H\u1ed7n h\u1ee3p", en: "Mixed" },
}
const brandLabel: Record<string, { vi: string; en: string }> = {
  "Other/Local": { vi: "\u0110\u1ecba ph\u01b0\u01a1ng/Kh\u00e1c", en: "Other/Local" },
}

const esgDataMap = {
  vi: [
    { name: "CO\u2082 gi\u1ea3m", value: 45 },
    { name: "N\u01b0\u1edbc ti\u1ebft ki\u1ec7m", value: 25 },
    { name: "N\u0103ng l\u01b0\u1ee3ng ti\u1ebft ki\u1ec7m", value: 20 },
    { name: "R\u00e1c chuy\u1ec3n h\u01b0\u1edbng", value: 10 },
  ],
  en: [
    { name: "CO\u2082 Saved", value: 45 },
    { name: "Water Saved", value: 25 },
    { name: "Energy Saved", value: 20 },
    { name: "Waste Diverted", value: 10 },
  ],
}

const wasteByBuilding = [
  { building: "Keangnam", plastic: 120, paper: 80, metal: 45, glass: 30 },
  { building: "Royal City", plastic: 95, paper: 110, metal: 35, glass: 25 },
  { building: "Vinhomes", plastic: 150, paper: 70, metal: 55, glass: 40 },
  { building: "Times City", plastic: 85, paper: 90, metal: 25, glass: 35 },
]

const COLORS = ["#50C878", "#2dd4bf", "#059669", "#fbbf24", "#f97316", "#3b82f6", "#a855f7", "#ec4899", "#64748b", "#ef4444", "#06b6d4"]

function fmtNum(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

type DashView = "building" | "corporate"

interface Booking {
  date: string
  timeSlot: string
  volume: number
  unit: "kg" | "tons"
  location: string
  notes: string
  priority: "normal" | "high"
  type: string
}

// --- Calendar helpers ---
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const monthNames = {
  vi: ["Th\u00e1ng 1", "Th\u00e1ng 2", "Th\u00e1ng 3", "Th\u00e1ng 4", "Th\u00e1ng 5", "Th\u00e1ng 6", "Th\u00e1ng 7", "Th\u00e1ng 8", "Th\u00e1ng 9", "Th\u00e1ng 10", "Th\u00e1ng 11", "Th\u00e1ng 12"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}

const dayHeaders = {
  vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
}

export function SaasTab() {
  const { t, lang } = useI18n()
  const [view, setView] = useState<DashView>("building")
  const [qrScanned, setQrScanned] = useState(false)
  const [qrLocation, setQrLocation] = useState("")

  // Calendar state
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  // Booking form state
  const [bookVolume, setBookVolume] = useState("")
  const [bookUnit, setBookUnit] = useState<"kg" | "tons">("kg")
  const [bookLocation, setBookLocation] = useState(qrScanned ? qrLocation : "")
  const [bookNotes, setBookNotes] = useState("")
  const [bookType, setBookType] = useState("battery")
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  // ESG dynamic metrics based on bookings
  const projectedWaste = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (b.unit === "tons" ? b.volume * 1000 : b.volume), 0)
  }, [bookings])

  // Sector aggregation for pie chart (lang-aware)
  const sectorData = useMemo(() => {
    const map: Record<string, number> = {}
    eprData.forEach(d => {
      const label = sectorLabel[d.sector]?.[lang] || d.sector
      map[label] = (map[label] || 0) + d.value
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [lang])

  // Translated EPR data for charts
  const eprDataLocalized = useMemo(() => {
    return eprData.map(d => ({
      ...d,
      brandLocalized: brandLabel[d.brand]?.[lang] || d.brand,
    }))
  }, [lang])

  // Calendar nav
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate())

  function submitBooking() {
    if (!selectedDate || !bookVolume) return
    const newBooking: Booking = {
      date: selectedDate,
      timeSlot: "",
      volume: parseFloat(bookVolume) || 0,
      unit: bookUnit,
      location: bookLocation,
      notes: bookNotes,
      priority: "normal",
      type: bookType,
    }
    setBookings(prev => [...prev, newBooking])
    setBookingSubmitted(true)
  }

  function getBookingsForDate(dateKey: string) {
    return bookings.filter(b => b.date === dateKey)
  }

  // QR scan simulation
  function handleQrScan() {
    const loc = "Keangnam Landmark, T\u1ea7ng H\u1ea7m B2, Khu C"
    setQrScanned(true)
    setQrLocation(loc)
    setBookLocation(loc)
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t("dashboard")}</h2>
        <button
          onClick={handleQrScan}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all ${
            qrScanned
              ? "bg-primary/10 border border-primary/20"
              : "bg-secondary border border-border hover:border-primary/30"
          }`}
        >
          <QrCode className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">
            {qrScanned
              ? (lang === "vi" ? "\u0110\u00e3 x\u00e1c minh v\u1ecb tr\u00ed" : "Location Verified")
              : (lang === "vi" ? "Qu\u00e9t QR v\u1ecb tr\u00ed" : "Scan QR Tag")}
          </span>
        </button>
      </div>

      {/* QR Location banner */}
      {qrScanned && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 animate-in fade-in slide-in-from-top-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">{lang === "vi" ? "V\u1ecb tr\u00ed \u0111\u00e3 x\u00e1c minh qua QR" : "QR-verified location"}</p>
            <p className="text-xs font-semibold text-foreground truncate">{qrLocation}</p>
          </div>
          <button onClick={() => { setQrScanned(false); setQrLocation("") }} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* View Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
        <button
          onClick={() => setView("building")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            view === "building" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          {t("buildingManager")}
        </button>
        <button
          onClick={() => setView("corporate")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            view === "corporate" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          {t("corporate")}
        </button>
      </div>

      {view === "building" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-3 text-center">
              <BarChart3 className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{fmtNum(1245 + projectedWaste)}</p>
              <p className="text-[10px] text-muted-foreground">{t("wasteVolume")} (kg)</p>
            </div>
            <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-3 text-center">
              <TrendingDown className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{fmtNum(380 + Math.round(projectedWaste * 0.3))}</p>
              <p className="text-[10px] text-muted-foreground">{t("co2Reduced")} (kg)</p>
            </div>
            <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-3 text-center">
              <FileText className="w-4 h-4 text-[#fbbf24] mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{847 + bookings.length}</p>
              <p className="text-[10px] text-muted-foreground">{t("totalScans")}</p>
            </div>
          </div>

          {/* Waste by Building Chart */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t("wasteVolume")} / {lang === "vi" ? "M\u00e3 t\u00f2a nh\u00e0" : "Building ID"}</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteByBuilding} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,200,120,0.1)" />
                  <XAxis dataKey="building" tick={{ fontSize: 10, fill: "#4a5568" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#4a5568" }} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid rgba(80,200,120,0.2)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="plastic" fill="#3b82f6" radius={[2, 2, 0, 0]} name={t("plastic")} />
                  <Bar dataKey="paper" fill="#fbbf24" radius={[2, 2, 0, 0]} name={t("paper")} />
                  <Bar dataKey="metal" fill="#a855f7" radius={[2, 2, 0, 0]} name={t("metal")} />
                  <Bar dataKey="glass" fill="#2dd4bf" radius={[2, 2, 0, 0]} name={t("glass")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Schedule Pickup Section */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("schedulePickup")}</h3>
            </div>

            {bookingSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">{lang === "vi" ? "Y\u00eau c\u1ea7u \u0111\u00e3 g\u1eedi!" : "Request submitted!"}</p>
                <p className="text-xs text-muted-foreground">{lang === "vi" ? "L\u1ecbch thu gom \u0111\u00e3 \u0111\u01b0\u1ee3c ghi nh\u1eadn." : "Pickup has been recorded."}</p>
                <button
                  onClick={() => { setBookingSubmitted(false); setBookVolume(""); setBookNotes(""); }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  {lang === "vi" ? "G\u1eedi l\u1ea1i" : "Submit another"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mini Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {lang === "vi" ? "Ch\u1ecdn ng\u00e0y" : "Select Date"}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button onClick={prevMonth} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <span className="text-[11px] font-semibold text-foreground min-w-[90px] text-center">
                        {monthNames[lang][calMonth]} {calYear}
                      </span>
                      <button onClick={nextMonth} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {dayHeaders[lang].map(d => (
                      <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground py-0.5">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const dateKey = formatDateKey(calYear, calMonth, day)
                      const isToday = dateKey === todayKey
                      const isSelected = dateKey === selectedDate
                      const dayBookings = getBookingsForDate(dateKey)
                      const hasBookings = dayBookings.length > 0

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30"
                              : isToday
                              ? "bg-primary/15 text-primary font-bold"
                              : hasBookings
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {day}
                          {hasBookings && !isSelected && (
                            <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Waste Category */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Package className="w-3 h-3" />
                    {t("pickupType")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: "battery", label: t("battery") },
                      { value: "ewaste", label: t("eWaste") },
                      { value: "bulky", label: t("bulkyWaste") },
                      { value: "hazardous", label: t("hazardous") },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setBookType(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          bookType === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-primary/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Amount */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {lang === "vi" ? "Kh\u1ed1i l\u01b0\u1ee3ng \u01b0\u1edbc t\u00ednh" : "Estimated Amount"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={bookVolume}
                      onChange={(e) => setBookVolume(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm outline-none border border-border focus:border-primary placeholder:text-muted-foreground"
                    />
                    <div className="flex items-center rounded-lg overflow-hidden border border-border">
                      <button
                        onClick={() => setBookUnit("kg")}
                        className={`px-3 py-2.5 text-xs font-semibold transition-all ${bookUnit === "kg" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                      >
                        kg
                      </button>
                      <button
                        onClick={() => setBookUnit("tons")}
                        className={`px-3 py-2.5 text-xs font-semibold transition-all ${bookUnit === "tons" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                      >
                        {lang === "vi" ? "t\u1ea5n" : "tons"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <MapPin className="w-3 h-3" />
                    {t("address")}
                    {qrScanned && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">QR</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={bookLocation}
                    onChange={(e) => setBookLocation(e.target.value)}
                    placeholder={lang === "vi" ? "Nh\u1eadp \u0111\u1ecba ch\u1ec9..." : "Enter address..."}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm outline-none border border-border focus:border-primary placeholder:text-muted-foreground"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {lang === "vi" ? "Ghi ch\u00fa" : "Notes"}
                  </label>
                  <textarea
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    rows={2}
                    placeholder={lang === "vi" ? "H\u01b0\u1edbng d\u1eabn th\u00eam cho \u0111\u1ed9i thu gom..." : "Additional instructions for the pickup team..."}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm outline-none border border-border focus:border-primary placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={submitBooking}
                  disabled={!selectedDate || !bookVolume}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t("submitRequest")}
                </button>
              </div>
            )}
          </div>

          {/* Upcoming bookings list */}
          {bookings.length > 0 && (
            <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                {lang === "vi" ? "L\u1ecbch thu gom s\u1eafp t\u1edbi" : "Upcoming Pickups"}
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{bookings.length}</span>
              </h3>
              <div className="flex flex-col gap-2">
                {bookings.slice(-3).reverse().map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{b.date} &middot; {b.type === "battery" ? t("battery") : b.type === "ewaste" ? t("eWaste") : b.type === "bulky" ? t("bulkyWaste") : t("hazardous")}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{b.volume} {b.unit} &middot; {b.location || (lang === "vi" ? "Ch\u01b0a c\u00f3 \u0111\u1ecba ch\u1ec9" : "No location")}</p>
                      {b.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic truncate">{b.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {view === "corporate" && (
        <>
          {/* EPR Report */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t("eprReport")} ({lang === "vi" ? "theo th\u01b0\u01a1ng hi\u1ec7u" : "by brand"})</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eprDataLocalized} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,200,120,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#4a5568" }} />
                  <YAxis type="category" dataKey="brandLocalized" tick={{ fontSize: 10, fill: "#4a5568" }} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid rgba(80,200,120,0.2)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name={lang === "vi" ? "S\u1ed1 l\u01b0\u1ee3ng thu gom" : "Items Collected"}>
                    {eprDataLocalized.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Share of Waste by Sector */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                {lang === "vi" ? "T\u1ef7 l\u1ec7 r\u00e1c th\u1ea3i theo ng\u00e0nh" : "Waste Market Share by Sector"}
              </h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sectorData.map((_, index) => (
                      <Cell key={`sec-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid rgba(80,200,120,0.2)", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EPR Detail Table */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#fbbf24]" />
              <h3 className="text-sm font-semibold text-foreground">
                {lang === "vi" ? "B\u00e1o c\u00e1o EPR chi ti\u1ebft" : "EPR Detailed Report"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-[10px] font-semibold text-muted-foreground pb-2 pr-1">{lang === "vi" ? "Th\u01b0\u01a1ng hi\u1ec7u" : "Brand"}</th>
                    <th className="text-[10px] font-semibold text-muted-foreground pb-2 pr-1">{lang === "vi" ? "V\u1eadt li\u1ec7u" : "Material"}</th>
                    <th className="text-[10px] font-semibold text-muted-foreground pb-2 pr-1">{lang === "vi" ? "Ng\u00e0nh" : "Sector"}</th>
                    <th className="text-[10px] font-semibold text-muted-foreground pb-2 pr-1 text-right">{lang === "vi" ? "SL" : "Qty"}</th>
                    <th className="text-[10px] font-semibold text-muted-foreground pb-2 text-right">CO{"\u2082"}</th>
                  </tr>
                </thead>
                <tbody>
                  {eprData.map((row, i) => (
                    <tr key={i} className={i < eprData.length - 1 ? "border-b border-border/50" : ""}>
                      <td className="text-[10px] font-medium text-foreground py-1.5 pr-1">{brandLabel[row.brand]?.[lang] || row.brand}</td>
                      <td className="text-[10px] text-muted-foreground py-1.5 pr-1">{categoryLabel[row.category]?.[lang] || row.category}</td>
                      <td className="py-1.5 pr-1">
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full ${
                          row.sector === "Beverages" ? "bg-[#3b82f6]/10 text-[#1d4ed8]"
                          : row.sector === "Food & Snacks" ? "bg-[#f97316]/10 text-[#c2410c]"
                          : row.sector === "Dairy" ? "bg-[#fbbf24]/10 text-[#92400e]"
                          : "bg-secondary text-muted-foreground"
                        }`}>
                          {sectorLabel[row.sector]?.[lang] || row.sector}
                        </span>
                      </td>
                      <td className="text-[10px] font-mono text-foreground py-1.5 pr-1 text-right">{row.value}</td>
                      <td className="text-[10px] font-mono text-foreground py-1.5 text-right">{fmtNum(row.co2)}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ESG Index */}
          <div className="rounded-xl bg-card backdrop-blur-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">{t("esgIndex")} (CO{"\u2082"} {lang === "vi" ? "gi\u1ea3m" : "reduction"})</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={esgDataMap[lang]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {esgDataMap[lang].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid rgba(80,200,120,0.2)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projected impact from bookings */}
          {bookings.length > 0 && (
            <div className="rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                {lang === "vi" ? "D\u1ef1 b\u00e1o ESG t\u1eeb l\u1ecbch thu gom" : "Projected ESG from Bookings"}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{projectedWaste} kg</p>
                  <p className="text-[10px] text-muted-foreground">{t("wasteVolume")}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-accent">{Math.round(projectedWaste * 0.3)} kg</p>
                  <p className="text-[10px] text-muted-foreground">{t("co2Reduced")}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{bookings.length}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === "vi" ? "L\u1ecbch h\u1eb9n" : "Bookings"}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}


    </div>
  )
}
