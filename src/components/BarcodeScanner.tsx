import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannedItem {
  barcode: string;
  name: string;
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onContinuousAdd: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onContinuousAdd, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [continuous, setContinuous] = useState(false);
  const [scanned, setScanned] = useState<ScannedItem[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  const addItem = useCallback((barcode: string) => {
    setLastAdded(barcode);
    onContinuousAdd(barcode);
    setTimeout(() => setLastAdded(null), 2000);
  }, [onContinuousAdd]);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");
    
    scannerRef.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        if (scanningRef.current) return;
        scanningRef.current = true;

        if (continuous) {
          setScanned(prev => [...prev, { barcode: decodedText, name: decodedText }]);
          addItem(decodedText);
          setTimeout(() => { scanningRef.current = false; }, 1000);
        } else {
          scannerRef.current?.stop().then(() => {
            onScan(decodedText);
          });
        }
      },
      () => {}
    ).catch(() => {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [continuous, onScan, addItem]);

  const formatBarcode = (b: string) =>
    b.length > 16 ? b.slice(0, 16) + '...' : b;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center">
      <div className="w-full max-w-md p-6 relative flex flex-col items-center">
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-4 text-white pt-12">
          <Camera size={32} className="mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-bold mb-1">Ler Código de Barras</h2>
          <p className="opacity-70 text-sm">Aponte a câmera para o código do produto.</p>
        </div>

        <div className="rounded-3xl overflow-hidden bg-black border border-white/20 aspect-[4/3] w-full shadow-2xl relative">
          <div id="reader" className="w-full h-full"></div>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center text-sm">
              {error}
            </div>
          )}
        </div>

        <button onClick={() => setContinuous(!continuous)}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all bg-white/10 text-white hover:bg-white/20">
          {continuous ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
          {continuous ? 'Contínuo' : 'Único'}
        </button>

        <AnimatePresence>
          {lastAdded && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              <CheckCircle size={14} /> {formatBarcode(lastAdded)} adicionado
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {continuous && scanned.length > 0 && (
        <div className="w-full max-w-md px-6 pb-6 flex-1 overflow-y-auto">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
            Escaneados ({scanned.length})
          </p>
          <div className="space-y-1">
            {scanned.map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-white font-medium truncate mr-2">{formatBarcode(s.barcode)}</span>
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
