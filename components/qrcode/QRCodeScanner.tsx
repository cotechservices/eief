"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Capacitor?: {
      isNative: boolean;
    };
  }
}

export function QRCodeScanner({ onScan }: { onScan: (data: string) => void }) {
  const [scanning, setScanning] = useState(false);

  const startMobileScan = async () => {
    if (window.Capacitor?.isNative) {
      try {
        const { BarcodeScanner } = await import("@capacitor/barcode-scanner");
        const result = await BarcodeScanner.scan();
        if (result.hasContent) {
          onScan(result.content);
        }
      } catch (error) {
        console.error("Scan error:", error);
      }
    }
    setScanning(false);
  };

  return (
    <div>
      {!scanning ? (
        <Button onClick={() => setScanning(true)} className="bg-blue-600">
          📷 Scanner QR code
        </Button>
      ) : (
        <div>
          <Button onClick={startMobileScan} className="bg-green-600">
            Lancer le scan
          </Button>
          <Button variant="ghost" onClick={() => setScanning(false)} className="ml-2">
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}