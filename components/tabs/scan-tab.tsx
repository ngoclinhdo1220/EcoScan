"use client"

import * as tflite from '@tensorflow/tfjs-tflite';
import { usePoints } from "@/lib/points-context"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  ScanLine, Camera, Check, Leaf, X, Sparkles, Hash, VideoOff,
  Wifi, Cpu, RefreshCw, ShieldCheck, CloudUpload, ArrowRight, CheckCircle2,
  HelpCircle, Lightbulb
} from "lucide-react"

// Flow: idle -> analyzing -> result -> verifying -> syncing -> done
type ScanPhase = "idle" | "analyzing" | "result" | "verifying" | "syncing" | "done"
type WasteGroup = "recyclable" | "organic" | "residual"
type MaterialType = "plastic" | "metal" | "paper" | "glass" | "organic"
type ShapeType = "bottle" | "can" | "box" | "pouch" | "cup" | "bag" | "other"
type GeometryClass = "cylindrical" | "rectangular" | "pouch_pillow" | "conical" | "irregular"
type ProductCategory = "beverage" | "food_snack" | "dairy" | "coffee_shop" | "general"

// Shape -> Geometry mapping (strict)
const shapeGeometry: Record<ShapeType, GeometryClass> = {
  bottle: "cylindrical",
  can: "cylindrical",
  cup: "conical",
  box: "rectangular",
  pouch: "pouch_pillow",
  bag: "pouch_pillow",
  other: "irregular",
}

// Geometry -> forbidden categories (HARD RULES)
// Rectangular/flat/pouch items can NEVER be classified as beverages
const geometryForbidden: Record<GeometryClass, ProductCategory[]> = {
  rectangular: [],       // boxes are NEVER beverages
  pouch_pillow: [],      // pouches are NEVER beverages
  cylindrical: [],     // bottles/cans are NEVER food_snack
  conical: [],                     // cups can be anything
  irregular: [],                   // no constraints
}

// ---- KNOWN BRANDS DATABASE ----
interface KnownBrand {
  brand: string
  material: MaterialType
  shape: ShapeType
  group: WasteGroup
  productCategory: ProductCategory
  name_vi: string
  name_en: string
  confidence: number
  tip_vi: string
  tip_en: string
}

const knownBrands: confidence: 99.9[] = [
  // -- Plastic Bottles (Beverages) --
  { brand: "Lavie", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 96.2, name_vi: "Chai n\u01b0\u1edbc Lavie", name_en: "Lavie Water Bottle", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse and place in plastic recycling bin" },
  { brand: "Aquafina", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 95.4, name_vi: "Chai n\u01b0\u1edbc Aquafina", name_en: "Aquafina Water Bottle", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse and place in plastic recycling bin" },
  { brand: "Sting (PepsiCo)", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 95.8, name_vi: "Chai PET Sting Energy", name_en: "Sting Energy PET Bottle", tip_vi: "Th\u00e1o nh\u00e3n, r\u1eeda s\u1ea1ch v\u00e0 t\u00e1i ch\u1ebf", tip_en: "Remove label, rinse, and recycle" },
  { brand: "C2 (URC)", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 94.9, name_vi: "Chai tr\u00e0 C2", name_en: "C2 Tea Bottle", tip_vi: "Th\u00e1o nh\u00e3n, r\u1eeda s\u1ea1ch v\u00e0 t\u00e1i ch\u1ebf", tip_en: "Remove label, rinse, and recycle" },
  { brand: "Trung Nguy\u00ean", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 92.3, name_vi: "Chai c\u00e0 ph\u00ea Trung Nguy\u00ean", name_en: "Trung Nguyen Coffee Bottle", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 t\u00e1i ch\u1ebf", tip_en: "Rinse and recycle" },
  // -- Metal Cans (Beverages) --
  { brand: "Coca-Cola", material: "metal", shape: "can", group: "recyclable", productCategory: "beverage", confidence: 98.7, name_vi: "Lon nh\u00f4m Coca-Cola", name_en: "Coca-Cola Aluminum Can", tip_vi: "\u00c9p d\u1eb9p v\u00e0 b\u1ecf v\u00e0o th\u00f9ng kim lo\u1ea1i t\u00e1i ch\u1ebf", tip_en: "Crush and place in metal recycling bin" },
  { brand: "Pepsi", material: "metal", shape: "can", group: "recyclable", productCategory: "beverage", confidence: 97.3, name_vi: "Lon Pepsi", name_en: "Pepsi Can", tip_vi: "\u00c9p d\u1eb9p v\u00e0 b\u1ecf v\u00e0o th\u00f9ng kim lo\u1ea1i t\u00e1i ch\u1ebf", tip_en: "Crush and place in metal recycling bin" },
  { brand: "Red Bull", material: "metal", shape: "can", group: "recyclable", productCategory: "beverage", confidence: 96.5, name_vi: "Lon Red Bull", name_en: "Red Bull Can", tip_vi: "\u00c9p d\u1eb9p v\u00e0 b\u1ecf v\u00e0o th\u00f9ng kim lo\u1ea1i t\u00e1i ch\u1ebf", tip_en: "Crush and place in metal recycling bin" },
  // -- Paper/Cardboard Boxes (Food & Dairy) --
  { brand: "Vinamilk", material: "paper", shape: "box", group: "recyclable", productCategory: "dairy", confidence: 94.1, name_vi: "H\u1ed9p s\u1eefa Vinamilk", name_en: "Vinamilk Carton", tip_vi: "L\u00e0m ph\u1eb3ng v\u00e0 b\u1ecf v\u00e0o th\u00f9ng gi\u1ea5y t\u00e1i ch\u1ebf", tip_en: "Flatten and place in paper recycling bin" },
  { brand: "TH True Milk", material: "paper", shape: "box", group: "recyclable", productCategory: "dairy", confidence: 93.5, name_vi: "H\u1ed9p s\u1eefa TH True Milk", name_en: "TH True Milk Carton", tip_vi: "L\u00e0m ph\u1eb3ng v\u00e0 b\u1ecf v\u00e0o th\u00f9ng gi\u1ea5y t\u00e1i ch\u1ebf", tip_en: "Flatten and place in paper recycling bin" },
  { brand: "Orion (Custas)", material: "paper", shape: "box", group: "recyclable", productCategory: "food_snack", confidence: 91.8, name_vi: "H\u1ed9p b\u00e1nh Custas Orion", name_en: "Orion Custas Box", tip_vi: "L\u00e0m ph\u1eb3ng h\u1ed9p gi\u1ea5y v\u00e0 t\u00e1i ch\u1ebf. Bao b\u00ec b\u00ean trong b\u1ecf ri\u00eang.", tip_en: "Flatten cardboard and recycle. Separate inner plastic packaging." },
  { brand: "Oishi", material: "paper", shape: "box", group: "recyclable", productCategory: "food_snack", confidence: 90.2, name_vi: "H\u1ed9p b\u00e1nh Oishi", name_en: "Oishi Snack Box", tip_vi: "L\u00e0m ph\u1eb3ng h\u1ed9p gi\u1ea5y v\u00e0 t\u00e1i ch\u1ebf", tip_en: "Flatten cardboard and recycle" },
  { brand: "Acecook", material: "paper", shape: "box", group: "recyclable", productCategory: "food_snack", confidence: 90.5, name_vi: "H\u1ed9p m\u00ec Acecook", name_en: "Acecook Noodle Box", tip_vi: "L\u00e0m ph\u1eb3ng v\u00e0 t\u00e1i ch\u1ebf h\u1ed9p gi\u1ea5y", tip_en: "Flatten and recycle cardboard" },
  { brand: "Masan", material: "paper", shape: "box", group: "recyclable", productCategory: "food_snack", confidence: 90.0, name_vi: "H\u1ed9p s\u1ea3n ph\u1ea9m Masan", name_en: "Masan Product Box", tip_vi: "L\u00e0m ph\u1eb3ng v\u00e0 t\u00e1i ch\u1ebf", tip_en: "Flatten and recycle" },
  // -- Plastic Pouches (Food & Snacks) --
  { brand: "Oishi", material: "plastic", shape: "pouch", group: "residual", productCategory: "food_snack", confidence: 91.0, name_vi: "T\u00fai snack Oishi", name_en: "Oishi Snack Pouch", tip_vi: "Bao b\u00ec nhi\u1ec1u l\u1edbp, kh\u00f3 t\u00e1i ch\u1ebf. B\u1ecf v\u00e0o th\u00f9ng r\u00e1c c\u00f2n l\u1ea1i.", tip_en: "Multi-layer packaging, hard to recycle. Place in residual bin." },
  { brand: "Lay's (PepsiCo)", material: "plastic", shape: "pouch", group: "residual", productCategory: "food_snack", confidence: 92.4, name_vi: "T\u00fai snack Lay's", name_en: "Lay's Snack Pouch", tip_vi: "Bao b\u00ec nhi\u1ec1u l\u1edbp, kh\u00f3 t\u00e1i ch\u1ebf. B\u1ecf v\u00e0o th\u00f9ng r\u00e1c c\u00f2n l\u1ea1i.", tip_en: "Multi-layer packaging, hard to recycle. Place in residual bin." },
  { brand: "Acecook", material: "plastic", shape: "pouch", group: "residual", productCategory: "food_snack", confidence: 90.8, name_vi: "G\u00f3i m\u00ec Acecook", name_en: "Acecook Noodle Pack", tip_vi: "Bao b\u00ec nhi\u1ec1u l\u1edbp. B\u1ecf v\u00e0o th\u00f9ng r\u00e1c c\u00f2n l\u1ea1i.", tip_en: "Multi-layer packaging. Place in residual bin." },
  // -- Glass Bottles (Beverages) --
  { brand: "Heineken", material: "glass", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 99.1, name_vi: "Chai th\u1ee7y tinh Heineken", name_en: "Heineken Glass Bottle", tip_vi: "B\u1ecf nguy\u00ean v\u1eb9n v\u00e0o th\u00f9ng th\u1ee7y tinh", tip_en: "Place intact in glass recycling bin" },
  { brand: "Saigon Beer", material: "glass", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 98.2, name_vi: "Chai bia S\u00e0i G\u00f2n", name_en: "Saigon Beer Bottle", tip_vi: "B\u1ecf nguy\u00ean v\u1eb9n v\u00e0o th\u00f9ng th\u1ee7y tinh", tip_en: "Place intact in glass recycling bin" },
  { brand: "Tiger Beer", material: "glass", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 97.6, name_vi: "Chai bia Tiger", name_en: "Tiger Beer Bottle", tip_vi: "B\u1ecf nguy\u00ean v\u1eb9n v\u00e0o th\u00f9ng th\u1ee7y tinh", tip_en: "Place intact in glass recycling bin" },
  // -- Plastic Cups (Coffee Shops) --
  { brand: "Highlands Coffee", material: "plastic", shape: "cup", group: "recyclable", productCategory: "coffee_shop", confidence: 90.5, name_vi: "Ly Highlands Coffee", name_en: "Highlands Coffee Cup", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse and place in plastic recycling bin" },
  { brand: "Phuc Long", material: "plastic", shape: "cup", group: "recyclable", productCategory: "coffee_shop", confidence: 90.1, name_vi: "Ly Ph\u00fac Long", name_en: "Phuc Long Cup", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse and place in plastic recycling bin" },
]

// ---- GENERIC MATERIAL TEMPLATES ----
interface GenericItem {
  material: MaterialType
  shape: ShapeType
  group: WasteGroup
  name_vi: string
  name_en: string
  tip_vi: string
  tip_en: string
}

const genericItems: GenericItem[] = [
  { material: "plastic", shape: "bottle", group: "recyclable", name_vi: "Chai nh\u1ef1a", name_en: "Plastic Bottle", tip_vi: "R\u1eeda s\u1ea1ch, th\u00e1o n\u1eafp v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse, remove cap, and place in plastic recycling bin" },
  { material: "plastic", shape: "bag", group: "residual", name_vi: "T\u00fai ni l\u00f4ng", name_en: "Plastic Bag", tip_vi: "Gom l\u1ea1i v\u00e0 \u0111em \u0111\u1ebfn \u0111i\u1ec3m thu gom chuy\u00ean d\u1ee5ng", tip_en: "Collect and bring to a dedicated collection point" },
  { material: "plastic", shape: "cup", group: "recyclable", name_vi: "Ly nh\u1ef1a", name_en: "Plastic Cup", tip_vi: "R\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng nh\u1ef1a t\u00e1i ch\u1ebf", tip_en: "Rinse and place in plastic recycling bin" },
  { material: "plastic", shape: "pouch", group: "residual", name_vi: "T\u00fai m\u1ec1m nh\u1ef1a", name_en: "Plastic Pouch", tip_vi: "C\u1eaft g\u00f3c, r\u1eeda s\u1ea1ch v\u00e0 b\u1ecf v\u00e0o th\u00f9ng t\u00e1i ch\u1ebf", tip_en: "Cut corner, rinse, and place in recycling bin" },
  { material: "metal", shape: "can", group: "recyclable", name_vi: "Lon kim lo\u1ea1i", name_en: "Metal Can", tip_vi: "\u00c9p d\u1eb9p v\u00e0 b\u1ecf v\u00e0o th\u00f9ng kim lo\u1ea1i t\u00e1i ch\u1ebf", tip_en: "Crush and place in metal recycling bin" },
  { material: "metal", shape: "other", group: "recyclable", name_vi: "M\u1ea3nh kim lo\u1ea1i", name_en: "Metal Piece", tip_vi: "B\u1ecf v\u00e0o th\u00f9ng kim lo\u1ea1i t\u00e1i ch\u1ebf", tip_en: "Place in metal recycling bin" },
  { material: "paper", shape: "box", group: "recyclable", name_vi: "H\u1ed9p gi\u1ea5y", name_en: "Paper Box", tip_vi: "L\u00e0m ph\u1eb3ng v\u00e0 b\u1ecf v\u00e0o th\u00f9ng gi\u1ea5y t\u00e1i ch\u1ebf", tip_en: "Flatten and place in paper recycling bin" },
  { material: "paper", shape: "other", group: "recyclable", name_vi: "Gi\u1ea5y / B\u00e1o", name_en: "Paper / Newspaper", tip_vi: "G\u1ea5p g\u1ecdn v\u00e0 b\u1ecf v\u00e0o th\u00f9ng gi\u1ea5y t\u00e1i ch\u1ebf", tip_en: "Fold neatly and place in paper recycling bin" },
  { material: "glass", shape: "bottle", group: "recyclable", name_vi: "Chai th\u1ee7y tinh", name_en: "Glass Bottle", tip_vi: "B\u1ecf nguy\u00ean v\u1eb9n v\u00e0o th\u00f9ng th\u1ee7y tinh", tip_en: "Place intact in glass recycling bin" },
  { material: "glass", shape: "other", group: "recyclable", name_vi: "M\u1ea3nh th\u1ee7y tinh", name_en: "Glass Piece", tip_vi: "Bao c\u1ea9n th\u1eadn v\u00e0 b\u1ecf v\u00e0o th\u00f9ng th\u1ee7y tinh", tip_en: "Wrap carefully and place in glass bin" },
  { material: "organic", shape: "other", group: "organic", name_vi: "R\u00e1c h\u1eefu c\u01a1", name_en: "Organic Waste", tip_vi: "B\u1ecf v\u00e0o th\u00f9ng r\u00e1c h\u1eefu c\u01a1 \u0111\u1ec3 \u1ee7 ph\u00e2n", tip_en: "Place in organic bin for composting" },
]

// ---- DETECTION RESULT TYPE ----
interface DetectionResult {
  name_vi: string
  name_en: string
  brand: string | null       // null means unknown
  material: MaterialType
  shape: ShapeType
  group: WasteGroup
  confidence: number
  tip_vi: string
  tip_en: string
  isKnownBrand: boolean
  lowConfidenceBrand?: string // brand detected but confidence < 90%
}

// ---- EPR SCAN LOG ----
interface EprLogEntry {
  brand: string | null
  category: MaterialType
  shape: ShapeType
  group: WasteGroup
  recyclable: boolean
  estimatedCO2g: number
  timestamp: number
}

// CO2 impact estimates (grams) per material type
const co2Impact: Record<MaterialType, number> = {
  plastic: 82, metal: 170, paper: 17, glass: 86, organic: 5,
}

// ===================================================================
// AI SIMULATION: Mandatory Geometric Filtering -> Material -> Brand
// ===================================================================
// PIPELINE:
//   Step 1: GEOMETRIC VALIDATION -- classify 3D shape
//   Step 2: MATERIAL ANALYSIS -- detect surface texture (Transparent PET vs Opaque Film etc.)
//   Step 3: CATEGORY GATE -- geometry FORBIDS certain product categories
//   Step 4: BRAND LOOKUP -- only within allowed brands; confidence > 90% or fallback to generic
// ===================================================================
function simulateDetection(): { result: DetectionResult; eprLog: EprLogEntry } {
  // STEP 1: Geometric shape classification
  const detectedShapes: ShapeType[] = ["bottle", "can", "box", "pouch", "cup", "bag", "other"]
  const shapeWeights = [0.22, 0.13, 0.22, 0.16, 0.1, 0.1, 0.07]
  let rand = Math.random()
  let detectedShape: ShapeType = "other"
  for (let i = 0; i < detectedShapes.length; i++) {
    rand -= shapeWeights[i]
    if (rand <= 0) { detectedShape = detectedShapes[i]; break }
  }

  // STEP 2: Derive geometry class from shape
  const geometry = shapeGeometry[detectedShape]

  // STEP 3: Get forbidden product categories for this geometry
  const forbidden = geometryForbidden[geometry] || []

  // STEP 4: Filter brands -- MUST match shape AND NOT be in forbidden category
  const eligibleBrands = knownBrands.filter(
    b => b.shape === detectedShape && !forbidden.includes(b.productCategory)
  )
  const matchingGenerics = genericItems.filter(g => g.shape === detectedShape)

  // STEP 5: 65% chance to attempt brand identification if eligible brands exist
  const hasBrandMatch = eligibleBrands.length > 0
  const brandRoll = Math.random()

  if (hasBrandMatch && brandRoll < 0.65) {
    const item = eligibleBrands[Math.floor(Math.random() * eligibleBrands.length)]
    const rawConf = item.confidence + (Math.random() * 6 - 3) // wider variance
    const conf = Math.min(99.9, Math.max(68, rawConf))

    // SAFETY FALLBACK: If confidence < 90%, AI is FORBIDDEN from guessing
    // Output: "Unidentified Brand | Category: [Material Type]"
    if (conf < 90) {
      const fallback = matchingGenerics.length > 0
        ? matchingGenerics[Math.floor(Math.random() * matchingGenerics.length)]
        : genericItems.find(g => g.material === item.material) || genericItems[0]
      return {
        result: {
          name_vi: fallback.name_vi,
          name_en: fallback.name_en,
          brand: null,
          material: item.material,
          shape: detectedShape,
          group: fallback.group,
          confidence: conf,
          tip_vi: fallback.tip_vi,
          tip_en: fallback.tip_en,
          isKnownBrand: false,
          lowConfidenceBrand: item.brand, // suggest, but don't assert
        },
        eprLog: {
          brand: null,
          category: item.material,
          shape: detectedShape,
          group: fallback.group,
          recyclable: fallback.group === "recyclable",
          estimatedCO2g: co2Impact[item.material],
          timestamp: Date.now(),
        },
      }
    }

    // High confidence (>= 90%) -- safe to display brand
    return {
      result: {
        name_vi: item.name_vi,
        name_en: item.name_en,
        brand: item.brand,
        material: item.material,
        shape: detectedShape,
        group: item.group,
        confidence: conf,
        tip_vi: item.tip_vi,
        tip_en: item.tip_en,
        isKnownBrand: true,
      },
      eprLog: {
        brand: item.brand,
        category: item.material,
        shape: detectedShape,
        group: item.group,
        recyclable: item.group === "recyclable",
        estimatedCO2g: co2Impact[item.material],
        timestamp: Date.now(),
      },
    }
  }

  // No brand match or random decided generic
  const pool = matchingGenerics.length > 0
    ? matchingGenerics
    : genericItems.filter(g => g.shape === "other")
  const item = pool[Math.floor(Math.random() * pool.length)] || genericItems[0]
  const conf = 75 + Math.random() * 14

  return {
    result: {
      name_vi: item.name_vi,
      name_en: item.name_en,
      brand: null,
      material: item.material,
      shape: detectedShape,
      group: item.group,
      confidence: conf,
      tip_vi: item.tip_vi,
      tip_en: item.tip_en,
      isKnownBrand: false,
    },
    eprLog: {
      brand: null,
      category: item.material,
      shape: detectedShape,
      group: item.group,
      recyclable: item.group === "recyclable",
      estimatedCO2g: co2Impact[item.material],
      timestamp: Date.now(),
    },
  }
}

const shapeLabel: Record<ShapeType, { vi: string; en: string }> = {
  bottle: { vi: "Chai", en: "Bottle" },
  can: { vi: "Lon", en: "Can" },
  box: { vi: "H\u1ed9p", en: "Box" },
  pouch: { vi: "T\u00fai", en: "Pouch" },
  cup: { vi: "Ly", en: "Cup" },
  bag: { vi: "T\u00fai", en: "Bag" },
  other: { vi: "Kh\u00e1c", en: "Other" },
}

function generateTxHash() {
  const chars = "0123456789abcdef"
  let hash = "0x"
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)]
  return hash
}

export function ScanTab() {export function ScanTab() {
  const { lang, t } = useI18n() // Dòng có sẵn của bạn
  
  // DÁN ĐOẠN NÀY VÀO ĐÂY:
  useEffect(() => {
    async function loadModel() {
      try {
        await tflite.loadTFLiteModel('/best_float32 (1).tflite');
        console.log("AI Model Ready!");
      } catch (e) {
        console.log("Running in simulation mode");
      }
    }
    loadModel();
  }, []);

  const { addPoints, addScan, addScanEntry, totalScans } = usePoints() // Dòng có sẵn tiếp theo
  // ... các dòng code còn lại
  const { lang, t } = useI18n()
  const { addPoints, addScan, addScanEntry, totalScans } = usePoints()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<ScanPhase>("idle")
  const [detectedItem, setDetectedItem] = useState<DetectionResult | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [syncProgress, setSyncProgress] = useState(0)
  const [txHash, setTxHash] = useState("")
  const [earnedPts, setEarnedPts] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [disposalPhoto, setDisposalPhoto] = useState<string | null>(null)

  // "Help us learn" state
  const [showLearnPrompt, setShowLearnPrompt] = useState(false)
  const [userConfirmedMaterial, setUserConfirmedMaterial] = useState<MaterialType | null>(null)
  const [userCorrectedBrand, setUserCorrectedBrand] = useState<string | null>(null)
  const [learnThankYou, setLearnThankYou] = useState(false)
  const [eprLog, setEprLog] = useState<EprLogEntry | null>(null)

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    setIsOnline(typeof window !== "undefined" ? navigator.onLine : true)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline) }
  }, [])

  // Camera init
  useEffect(() => {
    let mounted = true
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (mounted) setCameraReady(true)
        }
      } catch {
        if (mounted) setCameraError(true)
      }
    }
    initCamera()
    return () => { mounted = false; streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  // Reattach stream when returning to camera phases
  useEffect(() => {
    if ((phase === "idle" || phase === "verifying") && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [phase])

  // Capture photo from camera
  function captureFrame(): string | null {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && cameraReady) {
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 320
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL("image/jpeg", 0.8)
      }
    }
    return null
  }

  // STEP 1: Capture photo and start AI analysis
  const captureAndAnalyze = useCallback(() => {
    const photo = captureFrame()
    setCapturedPhoto(photo)
    setPhase("analyzing")
    setScanProgress(0)
    setShowLearnPrompt(false)
    setUserConfirmedMaterial(null)
    setLearnThankYou(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady])

  // STEP 2: AI analysis progress -- material-first detection
  useEffect(() => {
    if (phase !== "analyzing") return
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          const { result, eprLog: logEntry } = simulateDetection()
          setDetectedItem(result)
          setEprLog(logEntry)
          setTxHash(generateTxHash())
          setEarnedPts(Math.floor(Math.random() * 20) + 10)
          setPhase("result")
          return 100
        }
        return prev + 2
      })
    }, isOnline ? 50 : 40)
    return () => clearInterval(interval)
  }, [phase, isOnline])

  // STEP 3: User reviews result -> move to verification
  const startVerification = useCallback(() => {
    setDisposalPhoto(null)
    setPhase("verifying")
  }, [])

  // STEP 4: User captures disposal proof photo
  const captureDisposalProof = useCallback(() => {
    const photo = captureFrame()
    setDisposalPhoto(photo)
    setPhase("syncing")
    setSyncProgress(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady])

  // STEP 5: Data sync animation
  useEffect(() => {
    if (phase !== "syncing") return
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          addPoints(earnedPts)
          addScan()
          // Push to shared scan history
          if (detectedItem) {
            const matLabels: Record<string, { vi: string; en: string }> = {
              plastic: { vi: "Nh\u1ef1a", en: "Plastic" },
              metal: { vi: "Kim lo\u1ea1i", en: "Metal" },
              paper: { vi: "Gi\u1ea5y", en: "Paper" },
              glass: { vi: "Th\u1ee7y tinh", en: "Glass" },
              organic: { vi: "H\u1eefu c\u01a1", en: "Organic" },
            }
            addScanEntry({
              item_vi: detectedItem.name_vi,
              item_en: detectedItem.name_en,
              brand: detectedItem.brand,
              category_vi: matLabels[detectedItem.material]?.vi || detectedItem.material,
              category_en: matLabels[detectedItem.material]?.en || detectedItem.material,
              material: detectedItem.material,
              points: earnedPts,
              txHash: txHash.slice(0, 6) + "..." + txHash.slice(-4),
            })
          }
          setPhase("done")
          return 100
        }
        return prev + 4
      })
    }, 50)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, earnedPts, addPoints, addScan, addScanEntry])

  // "Help us learn" -- user confirms material
  function handleLearnConfirm(mat: MaterialType) {
    setUserConfirmedMaterial(mat)
    if (detectedItem) {
      setDetectedItem({ ...detectedItem, material: mat })
    }
    setLearnThankYou(true)
    setTimeout(() => {
      setShowLearnPrompt(false)
      setLearnThankYou(false)
    }, 2000)
  }

  // Reset
  const resetScan = useCallback(() => {
    setPhase("idle")
    setScanProgress(0)
    setSyncProgress(0)
    setCapturedPhoto(null)
    setDisposalPhoto(null)
    setDetectedItem(null)
    setShowLearnPrompt(false)
    setUserConfirmedMaterial(null)
    setUserCorrectedBrand(null)
    setLearnThankYou(false)
    setEprLog(null)
  }, [])

  const materialColors: Record<string, string> = {
    plastic: "bg-[#3b82f6]/10 text-[#1d4ed8]",
    metal: "bg-[#a855f7]/10 text-[#7e22ce]",
    paper: "bg-[#fbbf24]/10 text-[#92400e]",
    glass: "bg-accent/10 text-accent-foreground",
    organic: "bg-primary/10 text-primary",
  }
  const materialLabel: Record<string, { vi: string; en: string }> = {
    plastic: { vi: "Nh\u1ef1a", en: "Plastic" },
    metal: { vi: "Kim lo\u1ea1i", en: "Metal" },
    paper: { vi: "Gi\u1ea5y", en: "Paper" },
    glass: { vi: "Th\u1ee7y tinh", en: "Glass" },
    organic: { vi: "H\u1eefu c\u01a1", en: "Organic" },
  }
  const groupColors: Record<WasteGroup, string> = {
    recyclable: "bg-primary/10 text-[#059669]",
    organic: "bg-[#fbbf24]/10 text-[#92400e]",
    residual: "bg-[#ef4444]/10 text-[#dc2626]",
  }
  const groupLabel: Record<WasteGroup, { vi: string; en: string }> = {
    recyclable: { vi: "T\u00e1i ch\u1ebf \u0111\u01b0\u1ee3c", en: "Recyclable" },
    organic: { vi: "H\u1eefu c\u01a1", en: "Organic" },
    residual: { vi: "R\u00e1c c\u00f2n l\u1ea1i", en: "Residual" },
  }

  const weeklyGoalRemaining = Math.max(0, 20 - (12 + (totalScans - 47)))

  return (
    <div className="flex flex-col items-center gap-5 pb-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* ============================================================ */}
      {/* PHASE: IDLE -- Live camera with capture button                */}
      {/* ============================================================ */}
      {phase === "idle" && (
        <>
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-foreground/95">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/95 gap-3">
                <VideoOff className="w-10 h-10 text-white/40" />
                <p className="text-white/50 text-xs text-center px-6">
                  {lang === "vi" ? "Camera kh\u00f4ng kh\u1ea3 d\u1ee5ng. \u0110ang d\u00f9ng ch\u1ebf \u0111\u1ed9 m\u00f4 ph\u1ecfng." : "Camera unavailable. Using simulation mode."}
                </p>
              </div>
            )}

            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/8" />)}
            </div>

            {/* Scan reticle */}
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute -top-px -left-px w-7 h-7 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-7 h-7 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-7 h-7 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-7 h-7 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />
            </div>

            {/* Center instruction */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {!cameraReady && !cameraError && (
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-white/40 mx-auto mb-2 animate-spin" />
                  <p className="text-white/50 text-xs">{lang === "vi" ? "\u0110ang k\u1ebft n\u1ed1i camera..." : "Connecting camera..."}</p>
                </div>
              )}
              {(cameraReady || cameraError) && (
                <div className="text-center">
                  <ScanLine className="w-10 h-10 text-primary/70 mx-auto mb-2" />
                  <p className="text-white/80 text-sm font-medium">{t("scanInstructions")}</p>
                  <p className="text-white/50 text-[10px] mt-1">{lang === "vi" ? "Nh\u1eadn d\u1ea1ng v\u1eadt li\u1ec7u & h\u00ecnh d\u1ea1ng t\u1ef1 \u0111\u1ed9ng" : "Auto-detects material & shape"}</p>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-white/90 font-medium">ResNet-50</span>
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
              <span className="text-[10px] text-white/70 font-mono">30 FPS</span>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
              {isOnline
                ? <><Wifi className="w-3 h-3 text-primary" /><span className="text-[10px] text-white/80 font-medium">{lang === "vi" ? "X\u1eed l\u00fd \u0111\u00e1m m\u00e2y" : "Cloud Processing"}</span></>
                : <><Cpu className="w-3 h-3 text-[#fbbf24]" /><span className="text-[10px] text-[#fbbf24] font-medium">{lang === "vi" ? "X\u1eed l\u00fd n\u1ed9i b\u1ed9" : "Local Processing"}</span></>
              }
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
              {cameraReady
                ? <><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span className="text-[10px] text-white/70">LIVE</span></>
                : <><div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" /><span className="text-[10px] text-white/70">SIM</span></>
              }
            </div>
          </div>

          <button
            onClick={captureAndAnalyze}
            className="w-full max-w-[320px] py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {lang === "vi" ? "Ch\u1ee5p \u1ea3nh \u0111\u1ec3 qu\u00e9t" : "Capture to Scan"}
          </button>
        </>
      )}

      {/* ============================================================ */}
      {/* PHASE: ANALYZING -- Captured photo + AI progress              */}
      {/* ============================================================ */}
      {phase === "analyzing" && (
        <div className="w-full max-w-[320px] space-y-4 animate-in fade-in">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-foreground/95 border-2 border-primary/40">
            {capturedPhoto
              ? <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" crossOrigin="anonymous" />
              : <div className="w-full h-full flex items-center justify-center bg-foreground/95"><Camera className="w-12 h-12 text-white/20" /></div>
            }
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin mb-3" />
              <p className="text-primary text-sm font-bold">ResNet-50 AI</p>
              <div className="mt-2 space-y-1 text-left max-w-[200px]">
                <AnalysisStep active={scanProgress < 25} done={scanProgress >= 25}
                  text={lang === "vi" ? "1. X\u00e1c nh\u1eadn h\u00ecnh h\u1ecdc 3D" : "1. Geometric Validation"} />
                <AnalysisStep active={scanProgress >= 25 && scanProgress < 50} done={scanProgress >= 50}
                  text={lang === "vi" ? "2. Ph\u00e2n t\u00edch b\u1ec1 m\u1eb7t v\u1eadt li\u1ec7u" : "2. Material Surface Analysis"} />
                <AnalysisStep active={scanProgress >= 50 && scanProgress < 75} done={scanProgress >= 75}
                  text={lang === "vi" ? "3. L\u1ecdc danh m\u1ee5c s\u1ea3n ph\u1ea9m" : "3. Category Gate Filter"} />
                <AnalysisStep active={scanProgress >= 75 && scanProgress < 100} done={scanProgress >= 100}
                  text={lang === "vi" ? "4. Tra c\u1ee9u th\u01b0\u01a1ng hi\u1ec7u" : "4. Brand Lookup"} />
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-white/90 font-medium">
                {isOnline ? (lang === "vi" ? "X\u1eed l\u00fd \u0111\u00e1m m\u00e2y" : "Cloud Processing") : (lang === "vi" ? "X\u1eed l\u00fd n\u1ed9i b\u1ed9" : "Local Processing")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{t("scanning")}</span>
              <span className="text-xs font-mono text-primary">{scanProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
          </div>

          <button onClick={resetScan} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            {lang === "vi" ? "H\u1ee7y" : "Cancel"}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHASE: RESULT -- Detection result with material-first layout  */}
      {/* ============================================================ */}
      {phase === "result" && detectedItem && (
        <div className="w-full max-w-[320px] rounded-2xl bg-card backdrop-blur-sm border border-border p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">{t("itemDetected")}</h3>
            </div>
            <button onClick={resetScan} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {capturedPhoto && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
              <img src={capturedPhoto} alt="Scanned" className="w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[9px] font-bold">
                <Camera className="w-2.5 h-2.5" />
                {lang === "vi" ? "\u1ea2nh g\u1ed1c" : "Source Photo"}
              </div>
            </div>
          )}

          {/* PRIMARY: Material Category + Group (shown prominently) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${materialColors[detectedItem.material]}`}>
              {materialLabel[detectedItem.material]?.[lang]}
            </span>
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${groupColors[detectedItem.group]}`}>
              {groupLabel[detectedItem.group]?.[lang]}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
              {shapeLabel[detectedItem.shape]?.[lang]}
            </span>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">{lang === "vi" ? "\u0110\u1ed9 tin c\u1eady" : "Confidence"}</span>
                <span className="text-xs font-bold text-primary">{detectedItem.confidence.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${detectedItem.confidence}%` }} />
              </div>
            </div>
          </div>

          {/* Details: Category primary, Brand secondary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">{t("materialType")}</span>
              <span className="text-sm font-semibold text-foreground">{materialLabel[detectedItem.material]?.[lang]}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">{t("shape")}</span>
              <span className="text-sm font-semibold text-foreground">{shapeLabel[detectedItem.shape]?.[lang]}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">{t("product")}</span>
              <span className="text-sm font-semibold text-foreground">{lang === "vi" ? detectedItem.name_vi : detectedItem.name_en}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">{t("brand")}</span>
              <span className={`text-sm font-semibold ${detectedItem.isKnownBrand ? "text-foreground" : "text-muted-foreground italic"}`}>
                {detectedItem.brand || t("unidentifiedBrand")}
              </span>
            </div>
            <div className="py-2">
              <span className="text-sm text-muted-foreground block mb-1">{t("disposalTip")}</span>
              <p className="text-sm text-foreground">{lang === "vi" ? detectedItem.tip_vi : detectedItem.tip_en}</p>
            </div>
          </div>

          {/* ---- USER VERIFICATION PROMPT ---- */}
          {/* Case A: Low confidence brand -- ask user to confirm brand */}
          {!detectedItem.isKnownBrand && detectedItem.lowConfidenceBrand && !userCorrectedBrand && !userConfirmedMaterial && (
            <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-xs font-bold text-foreground">
                  {lang === "vi" ? "X\u00e1c nh\u1eadn th\u01b0\u01a1ng hi\u1ec7u" : "Confirm Brand"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {lang === "vi"
                  ? `Ch\u00fang t\u00f4i ph\u00e1t hi\u1ec7n ${materialLabel[detectedItem.material]?.vi}. Th\u01b0\u01a1ng hi\u1ec7u l\u00e0 "${detectedItem.lowConfidenceBrand}" hay kh\u00e1c?`
                  : `We detected ${materialLabel[detectedItem.material]?.en}. Is the brand "${detectedItem.lowConfidenceBrand}" or something else?`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setUserCorrectedBrand(detectedItem.lowConfidenceBrand!)
                    setDetectedItem({ ...detectedItem, brand: detectedItem.lowConfidenceBrand!, isKnownBrand: true })
                    setLearnThankYou(true)
                    setTimeout(() => setLearnThankYou(false), 2000)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
                >
                  {detectedItem.lowConfidenceBrand}
                </button>
                {knownBrands
                  .filter(b => b.shape === detectedItem.shape && b.brand !== detectedItem.lowConfidenceBrand)
                  .slice(0, 3)
                  .map(b => (
                    <button
                      key={b.brand}
                      onClick={() => {
                        setUserCorrectedBrand(b.brand)
                        setDetectedItem({ ...detectedItem, brand: b.brand, isKnownBrand: true, name_vi: b.name_vi, name_en: b.name_en })
                        setLearnThankYou(true)
                        setTimeout(() => setLearnThankYou(false), 2000)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-primary/10"
                    >
                      {b.brand}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    setUserCorrectedBrand("other")
                    setLearnThankYou(true)
                    setTimeout(() => setLearnThankYou(false), 2000)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:bg-primary/10"
                >
                  {lang === "vi" ? "Kh\u00e1c" : "Other"}
                </button>
              </div>
            </div>
          )}

          {/* Case B: Unknown brand, no low-confidence guess -- ask material */}
          {!detectedItem.isKnownBrand && !detectedItem.lowConfidenceBrand && !userConfirmedMaterial && (
            <div className="rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-xs font-bold text-foreground">{t("helpUsLearn")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{t("newBrandDetected")} {t("isThisCorrect")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["plastic", "metal", "paper", "glass", "organic"] as MaterialType[]).map(mat => (
                  <button
                    key={mat}
                    onClick={() => handleLearnConfirm(mat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      detectedItem.material === mat
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-secondary text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {materialLabel[mat]?.[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thank you after learning */}
          {learnThankYou && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-primary">{t("thankYou")}</p>
                <p className="text-[10px] text-muted-foreground">{t("learningData")}</p>
              </div>
            </div>
          )}

          {/* User already confirmed */}
          {(userConfirmedMaterial || userCorrectedBrand) && !learnThankYou && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                {userCorrectedBrand
                  ? (lang === "vi" ? "Th\u01b0\u01a1ng hi\u1ec7u: " : "Brand: ")
                  : (lang === "vi" ? "V\u1eadt li\u1ec7u: " : "Material: ")}
                <span className="font-semibold text-foreground">
                  {userCorrectedBrand
                    ? (userCorrectedBrand === "other" ? (lang === "vi" ? "Th\u01b0\u01a1ng hi\u1ec7u kh\u00e1c" : "Other brand") : userCorrectedBrand)
                    : materialLabel[userConfirmedMaterial!]?.[lang]}
                </span>
              </p>
            </div>
          )}

          {/* EPR Log preview */}
          {eprLog && (
            <div className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {lang === "vi" ? "D\u1eef li\u1ec7u EPR" : "EPR Data Point"}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-[10px] text-muted-foreground">{lang === "vi" ? "Th\u01b0\u01a1ng hi\u1ec7u" : "Brand"}</span>
                <span className="text-[10px] font-medium text-foreground">{detectedItem.brand || (lang === "vi" ? "\u0110\u1ecba ph\u01b0\u01a1ng/Kh\u00e1c" : "Local/Other")}</span>
                <span className="text-[10px] text-muted-foreground">{lang === "vi" ? "Ph\u00e2n lo\u1ea1i" : "Category"}</span>
                <span className="text-[10px] font-medium text-foreground">{materialLabel[eprLog.category]?.[lang]}</span>
                <span className="text-[10px] text-muted-foreground">{lang === "vi" ? "T\u00e1i ch\u1ebf" : "Recyclable"}</span>
                <span className={`text-[10px] font-medium ${eprLog.recyclable ? "text-primary" : "text-[#ef4444]"}`}>{eprLog.recyclable ? (lang === "vi" ? "C\u00f3" : "Yes") : (lang === "vi" ? "Kh\u00f4ng" : "No")}</span>
                <span className="text-[10px] text-muted-foreground">CO{"\u2082"}</span>
                <span className="text-[10px] font-medium text-foreground">~{eprLog.estimatedCO2g}g</span>
              </div>
            </div>
          )}

          {/* Proceed to Verification */}
          <button
            onClick={startVerification}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            {lang === "vi" ? "X\u00e1c minh vi\u1ec7c x\u1eed l\u00fd" : "Verify Disposal"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHASE: VERIFYING -- Camera reopens for Proof of Disposal      */}
      {/* ============================================================ */}
      {phase === "verifying" && (
        <div className="w-full max-w-[320px] space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">
                {lang === "vi" ? "X\u00e1c minh vi\u1ec7c x\u1eed l\u00fd" : "Verification Capture"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lang === "vi"
                  ? "Vui l\u00f2ng ch\u1ee5p \u1ea3nh r\u00e1c trong th\u00f9ng \u0111\u1ec3 x\u00e1c minh."
                  : "Please take a photo of the waste inside the designated bin as Proof of Disposal."}
              </p>
            </div>
          </div>

          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-foreground/95 border-2 border-primary/30">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/95 gap-3">
                <VideoOff className="w-10 h-10 text-white/40" />
                <p className="text-white/50 text-xs text-center px-6">
                  {lang === "vi" ? "Camera kh\u00f4ng kh\u1ea3 d\u1ee5ng" : "Camera unavailable"}
                </p>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-10 border-2 border-dashed border-primary/40 rounded-xl" />
              <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md">
                  <span className="text-[10px] text-white/90 font-medium">
                    {lang === "vi" ? "H\u01b0\u1edbng v\u00e0o th\u00f9ng r\u00e1c" : "Point at recycling bin"}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-white/90 font-medium">
                {lang === "vi" ? "X\u00e1c minh x\u1eed l\u00fd" : "Disposal Verify"}
              </span>
            </div>

            {cameraReady && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-white/70">LIVE</span>
              </div>
            )}
          </div>

          <button
            onClick={captureDisposalProof}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            {lang === "vi" ? "Ch\u1ee5p b\u1eb1ng ch\u1ee9ng x\u1eed l\u00fd" : "Capture Disposal Proof"}
          </button>

          <button onClick={resetScan} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            {lang === "vi" ? "H\u1ee7y" : "Cancel"}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHASE: SYNCING -- Data integrity confirmation                 */}
      {/* ============================================================ */}
      {phase === "syncing" && (
        <div className="w-full max-w-[320px] rounded-2xl bg-card backdrop-blur-sm border border-border p-5 space-y-5 animate-in fade-in">
          {disposalPhoto && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-primary/20">
              <img src={disposalPhoto} alt="Disposal proof" className="w-full h-full object-cover" crossOrigin="anonymous" />
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[9px] font-bold">
                <ShieldCheck className="w-2.5 h-2.5" />
                {lang === "vi" ? "B\u1eb1ng ch\u1ee9ng x\u1eed l\u00fd" : "Disposal Proof"}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <SyncStep done={syncProgress > 20} active={syncProgress <= 20} icon={ShieldCheck}
              text={lang === "vi" ? "X\u00e1c minh vi\u1ec7c x\u1eed l\u00fd..." : "Verifying disposal..."}
              doneText={lang === "vi" ? "\u0110\u1ed9 to\u00e0n v\u1eb9n d\u1eef li\u1ec7u \u0111\u00e3 x\u00e1c nh\u1eadn" : "Data integrity confirmed"} />
            <SyncStep done={syncProgress > 50} active={syncProgress > 20 && syncProgress <= 50} icon={CloudUpload}
              text={lang === "vi" ? "\u0110\u1ed3ng b\u1ed9 d\u1eef li\u1ec7u..." : "Data synchronization..."}
              doneText={lang === "vi" ? "\u0110\u00e3 \u0111\u1ed3ng b\u1ed9 l\u00ean SaaS Dashboard" : "Synced to SaaS Dashboard"} />
            <SyncStep done={syncProgress > 80} active={syncProgress > 50 && syncProgress <= 80} icon={Hash}
              text={lang === "vi" ? "Ghi blockchain..." : "Writing to blockchain..."}
              doneText={txHash.slice(0, 10) + "..." + txHash.slice(-4)} />
            <SyncStep done={syncProgress >= 100} active={syncProgress > 80 && syncProgress < 100} icon={Leaf}
              text={lang === "vi" ? "C\u1eadp nh\u1eadt \u0111i\u1ec3m..." : "Crediting points..."}
              doneText={`+${earnedPts} ${t("points")}`} />
          </div>

          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${syncProgress}%` }} />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHASE: DONE -- Success with milestone info                    */}
      {/* ============================================================ */}
      {phase === "done" && (
        <div className="w-full max-w-[320px] rounded-2xl bg-card backdrop-blur-sm border-2 border-primary/30 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === "vi" ? "M\u1ee5c ti\u00eau \u0111\u00e3 c\u1eadp nh\u1eadt!" : "Goal Updated!"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {weeklyGoalRemaining > 0
                ? (lang === "vi" ? `C\u00f2n ${weeklyGoalRemaining} l\u1ea7n qu\u00e9t n\u1eefa \u0111\u1ec3 \u0111\u1ea1t m\u1ee5c ti\u00eau h\u00e0ng tu\u1ea7n.` : `${weeklyGoalRemaining} more scans to reach your weekly target.`)
                : (lang === "vi" ? "\u0110\u00e3 \u0111\u1ea1t m\u1ee5c ti\u00eau tu\u1ea7n!" : "Weekly target achieved!")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-primary">+{earnedPts}</span>
            <span className="text-sm text-muted-foreground">{t("points")}</span>
          </div>

          {/* Detected item summary */}
          {detectedItem && (
            <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-lg bg-secondary/50">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${materialColors[detectedItem.material]}`}>
                {materialLabel[detectedItem.material]?.[lang]}
              </span>
              <span className="text-xs text-foreground font-medium">{lang === "vi" ? detectedItem.name_vi : detectedItem.name_en}</span>
              {detectedItem.brand && <span className="text-[10px] text-muted-foreground">({detectedItem.brand})</span>}
            </div>
          )}

          {/* Verified photos */}
          <div className="grid grid-cols-2 gap-2">
            {disposalPhoto && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <img src={disposalPhoto} alt="Disposal" className="w-full h-full object-cover" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[8px] font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {t("verified")}
                  </div>
                </div>
              </div>
            )}
            {capturedPhoto && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                <img src={capturedPhoto} alt="Scanned" className="w-full h-full object-cover" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[8px] font-bold">
                    <Camera className="w-2.5 h-2.5" />
                    {lang === "vi" ? "\u1ea2nh g\u1ed1c" : "Source"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
            <CloudUpload className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              {lang === "vi" ? "D\u1eef li\u1ec7u \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u1ed3ng b\u1ed9 l\u00ean B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n SaaS." : "Data has been synced to your SaaS Dashboard."}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/5">
            <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] font-mono text-muted-foreground truncate">{txHash}</span>
          </div>

          <button onClick={resetScan} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" />
            {t("startScan")}
          </button>
        </div>
      )}

      <p className="text-[9px] text-muted-foreground text-center px-4 leading-relaxed">{t("poweredBy")}</p>
    </div>
  )
}

function AnalysisStep({ active, done, text }: { active: boolean; done: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 transition-all ${done ? "opacity-100" : active ? "opacity-100" : "opacity-30"}`}>
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {done ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        ) : active ? (
          <div className="w-3 h-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-white/30" />
        )}
      </div>
      <span className={`text-[10px] font-medium ${done ? "text-primary" : active ? "text-white" : "text-white/40"}`}>{text}</span>
    </div>
  )
}

function SyncStep({ done, active, icon: Icon, text, doneText }: {
  done: boolean; active: boolean; icon: typeof ShieldCheck; text: string; doneText: string
}) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${done ? "bg-primary/5" : active ? "bg-secondary/50" : "opacity-40"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? "bg-primary/10" : active ? "bg-secondary" : "bg-secondary/50"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4 text-primary" /> : active ? <Icon className="w-3.5 h-3.5 text-foreground animate-pulse" /> : <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <span className={`text-xs ${done ? "text-primary font-semibold" : active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {done ? doneText : text}
      </span>
    </div>
  )
}
