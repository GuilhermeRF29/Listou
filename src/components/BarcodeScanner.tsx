import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { motion } from 'motion/react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");
    
    scannerRef.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            onScan(decodedText);
          });
        }
      },
      (errorMessage) => {
        // Ignorar erros de scan contínuos (ocorrem quando não há barcode na frente)
      }
    ).catch((err) => {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center">
      <div className="w-full max-w-md p-6 relative">
        <button 
           onClick={onClose}
           className="absolute top-8 right-6 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-8 text-white">
          <Camera size={32} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Ler Código de Barras</h2>
          <p className="opacity-70 text-sm">Aponte a câmera para o código do produto.</p>
        </div>

        <div className="rounded-3xl overflow-hidden bg-black border border-white/20 aspect-[4/3] shadow-2xl relative">
          <div id="reader" className="w-full h-full"></div>
          {error && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center text-sm">
                {error}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
