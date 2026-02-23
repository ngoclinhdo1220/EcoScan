"use client"

import { useI18n } from "@/lib/i18n"
import { usePoints } from "@/lib/points-context"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  ScanLine, Camera, Check, Leaf, X, Sparkles, Hash, VideoOff,
  Wifi, Cpu, RefreshCw, ShieldCheck, CloudUpload, ArrowRight, CheckCircle2,
  HelpCircle, Lightbulb
} from "lucide-react"

type ScanPhase = "idle" | "analyzing" | "result" | "verifying" | "syncing" | "done"
type WasteGroup = "recyclable" | "organic" | "residual"
type MaterialType = "plastic" | "metal" | "paper" | "glass" | "organic"
type ShapeType = "bottle" | "can" | "box" | "pouch" | "cup" | "bag" | "other"
type GeometryClass = "cylindrical" | "rectangular" | "pouch_pillow" | "conical" | "irregular"
type ProductCategory = "beverage" | "food_snack" | "dairy" | "coffee_shop" | "general"

const shapeGeometry: Record<ShapeType, GeometryClass> = {
  bottle: "cylindrical", can: "cylindrical", cup: "conical", 
  box: "rectangular", pouch: "pouch_pillow", bag: "pouch_pillow", other: "irregular",
}

const geometryForbidden: Record<GeometryClass, ProductCategory[]> = {
  rectangular: [], pouch_pillow: [], cylindrical: [], conical: [], irregular: [],
}

interface KnownBrand {
  brand: string; material: MaterialType; shape: ShapeType; group: WasteGroup;
  productCategory: ProductCategory; name_vi: string; name_en: string;
  confidence: number; tip_vi: string; tip_en: string;
}

const knownBrands: KnownBrand[] = [
  { brand: "Lavie", material: "plastic", shape: "bottle", group: "recyclable", productCategory: "beverage", confidence: 99.9, name_vi: "Chai nước Lavie", name_en: "Lavie Water Bottle", tip_vi: "Rửa sạch và bỏ vào thùng nhựa tái chế", tip_en: "Rinse and place in plastic recycling bin" },
  { brand: "Coca-Cola", material: "metal", shape: "can", group: "recyclable", productCategory: "beverage", confidence: 99.9, name_vi: "Lon nhôm Coca-Cola", name_en: "Coca-Cola Aluminum Can", tip_vi: "Ép dẹp và bỏ vào thùng kim loại tái chế", tip_en: "Crush and place in metal recycling bin" },
  { brand: "Vinamilk", material: "paper", shape: "box", group: "recyclable", productCategory: "dairy", confidence: 94.1, name_vi: "Hộp sữa Vinamilk", name_en: "Vinamilk Carton", tip_vi: "Làm phẳng và bỏ vào thùng giấy tái chế", tip_en: "Flatten and place in paper recycling bin" },
];

const genericItems = [
  { material: "plastic", shape: "bottle", group: "recyclable", name_vi: "Vật phẩm nhựa", name_en: "Plastic Item", tip_vi: "Rửa sạch và tái chế đúng quy định", tip_en: "Rinse and recycle according to guidelines" },
];

const co2Impact: Record<MaterialType, number> = { plastic: 82, metal: 170, paper: 17, glass: 86, organic: 5 };

function simulateDetection(totalScans: number) {
  const rand = Math.random();
  
  // 75% trường hợp: Nhận diện đúng thương hiệu (Ưu tiên theo kịch bản demo)
  if (rand < 0.75) {
    const isEven = totalScans % 2 === 0;
    const item = isEven ? knownBrands[0] : knownBrands[2];
    return {
      result: { ...item, isKnownBrand: true, needsFeedback: false },
      eprLog: { brand: item.brand, category: item.material, shape: item.shape, group: item.group, recyclable: true, estimatedCO2g: co2Impact[item.material], timestamp: Date.now() }
    };
  }

  // 25% trường hợp: Gặp rác lạ -> Kích hoạt Learning Loop
  const unidentified = genericItems[0];
  return {
    result: { ...unidentified, brand: "Chưa xác định", isKnownBrand: false, confidence: 68.5, needsFeedback: true },
    eprLog: { brand: null, category: unidentified.material, shape: unidentified.shape, group: unidentified.group, recyclable: true, estimatedCO2g: co2Impact[unidentified.material], timestamp: Date.now() }
  };
}

function generateTxHash() {
  return "0x" + Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

export function ScanTab() {
  const { lang, t } = useI18n();
  const { addPoints, addScan, addScanEntry, totalScans } = usePoints();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [detectedItem, setDetectedItem] = useState<any>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [earnedPts, setEarnedPts] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [disposalPhoto, setDisposalPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setCameraReady(true); }
      } catch { console.error("Camera access denied"); }
    }
    initCamera();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      return canvas.toDataURL("image/jpeg");
    }
    return null;
  };

  const captureAndAnalyze = () => {
    const photo = captureFrame();
    if (photo) {
      setCapturedPhoto(photo);
      setPhase("analyzing");
      setScanProgress(0);
    }
  };

  useEffect(() => {
    if (phase !== "analyzing" || !capturedPhoto) return;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const { result } = simulateDetection(totalScans);
          setDetectedItem(result); 
          setTxHash(generateTxHash());
          setEarnedPts(25); 
          setPhase("result");
          return 100;
        }
        return prev + 5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, capturedPhoto, totalScans]);

  useEffect(() => {
    if (phase !== "syncing") return;
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          addPoints(earnedPts); addScan();
          addScanEntry({ item_vi: detectedItem.name_vi, item_en: detectedItem.name_en, points: earnedPts, txHash: txHash.slice(0, 10) });
          setPhase("done");
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [phase, earnedPts, detectedItem, txHash, addPoints, addScan, addScanEntry]);

  const resetScan = () => { setPhase("idle"); setScanProgress(0); setSyncProgress(0); setDetectedItem(null); setCapturedPhoto(null); };

  const materialColors: any = { plastic: "bg-blue-100 text-blue-700", metal: "bg-purple-100 text-purple-700", paper: "bg-yellow-100 text-yellow-700" };

  return (
    <div className="flex flex-col items-center gap-5 pb-4 w-full max-w-[320px] mx-auto">
      <canvas ref={canvasRef} className="hidden" />
      
      {phase === "idle" && (
        <div className="w-full space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-black shadow-inner">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center border-2 border-primary/20 m-6 rounded-2xl pointer-events-none">
                <ScanLine className="w-12 h-12 text-primary/40 animate-pulse" />
            </div>
          </div>
          <button onClick={captureAndAnalyze} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <Camera className="w-5 h-5" /> {lang === "vi" ? "Chụp ảnh để quét" : "Capture to Scan"}
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="w-full space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary shadow-xl">
            <img src={capturedPhoto!} className="w-full h-full object-cover opacity-50" alt="Captured" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mb-2" />
              <p className="text-primary font-bold drop-shadow-sm">AI Analyzing {scanProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {phase === "result" && detectedItem && (
        <div className="w-full p-5 bg-card border rounded-2xl space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center border-b pb-2">
             <h3 className="font-bold flex items-center gap-2 text-primary"><Sparkles className="w-4 h-4"/> {t("itemDetected")}</h3>
             <X className="w-5 h-5 cursor-pointer text-muted-foreground" onClick={resetScan} />
          </div>
          <img src={capturedPhoto!} className="w-full aspect-video object-cover rounded-xl border border-border" alt="Result" />
          
          <div className="flex gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${materialColors[detectedItem.material] || "bg-secondary"}`}>
              {detectedItem.material}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
              CONFIDENCE: {detectedItem.confidence}%
            </span>
          </div>

          <div className="text-sm space-y-1">
            <p className="flex justify-between"><b>Sản phẩm:</b> <span>{lang === "vi" ? detectedItem.name_vi : detectedItem.name_en}</span></p>
            <p className="flex justify-between"><b>Thương hiệu:</b> <span className={detectedItem.isKnownBrand ? "text-foreground" : "italic text-muted-foreground"}>{detectedItem.brand}</span></p>
          </div>

          {/* LEARNING LOOP UI */}
          {detectedItem.needsFeedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1"><HelpCircle className="w-3 h-3"/> AI đang học hỏi:</p>
              <p className="text-xs text-amber-800 leading-tight">Mẫu rác này lạ quá, bạn xác nhận vật liệu giúp AI nhé?</p>
              <div className="flex gap-1.5">
                {["Nhựa", "Giấy", "Kim loại"].map(m => (
                  <button key={m} onClick={() => alert("Cảm ơn! AI đã ghi nhớ.")} className="px-2 py-1 bg-white border border-amber-300 rounded text-[9px] hover:bg-amber-100 transition-colors">{m}</button>
                ))}
              </div>
            </div>
          )}

          {/* DISPOSAL TIP */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-[10px] font-bold text-primary flex items-center gap-1 mb-1 uppercase"><Lightbulb className="w-3 h-3"/> Cách xử lý:</p>
            <p className="text-xs text-foreground leading-relaxed">{lang === "vi" ? detectedItem.tip_vi : detectedItem.tip_en}</p>
          </div>

          <button onClick={() => setPhase("verifying")} className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <ShieldCheck className="w-5 h-5" /> Xác minh xử lý
          </button>
        </div>
      )}

      {phase === "verifying" && (
        <div className="w-full space-y-4">
           <div className="p-3 bg-primary/10 rounded-xl text-xs font-medium text-primary flex items-center gap-2">
             <Camera className="w-4 h-4"/> Chụp ảnh rác đã bỏ vào thùng để xác minh.
           </div>
           <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border-2 border-primary/40">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <div className="absolute inset-0 border-2 border-dashed border-white/20 m-10 rounded-xl pointer-events-none" />
           </div>
           <button onClick={() => { setDisposalPhoto(captureFrame()); setPhase("syncing"); }} className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-xl">
              Chụp bằng chứng xử lý
           </button>
        </div>
      )}

      {phase === "syncing" && (
        <div className="w-full p-8 bg-card border rounded-2xl text-center space-y-5 shadow-inner">
           <CloudUpload className="w-12 h-12 text-primary mx-auto animate-bounce" />
           <div>
             <p className="font-bold text-primary">Đang đồng bộ Blockchain... {syncProgress}%</p>
             <p className="text-[10px] text-muted-foreground mt-1">Đảm bảo tính minh bạch dữ liệu EPR</p>
           </div>
           <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${syncProgress}%` }} />
           </div>
        </div>
      )}

      {phase === "done" && (
        <div className="w-full p-6 bg-card border-2 border-primary rounded-2xl text-center space-y-5 shadow-2xl animate-in zoom-in-95">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <h3 className="font-bold text-xl text-primary">Phân loại thành công!</h3>
           <div className="p-4 bg-primary/10 rounded-xl text-3xl font-black text-primary">+{earnedPts} Điểm</div>
           <p className="text-[10px] text-muted-foreground font-mono bg-muted p-2 rounded break-all border">{txHash}</p>
           <button onClick={resetScan} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all">Tiếp tục quét rác</button>
        </div>
      )}
      
      <p className="text-[9px] text-muted-foreground text-center mt-4 uppercase tracking-widest opacity-50 italic">Powered by EcoScan AI Engine</p>
    </div>
  );
}
