'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, size = 200, className = '' }: QRCodeDisplayProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="border border-stroke bg-parchment p-3">
        <QRCodeCanvas
          value={value || ' '}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#0C0B0A"
          bgColor="#EAE5DC"
        />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-subtle">
        Scan to join
      </p>
    </div>
  );
}
