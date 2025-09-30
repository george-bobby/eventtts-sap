'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { cn } from '@/lib/utils';

interface QRCodeProps {
  data: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate?: boolean;
  };
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCode({
  data,
  size = 200,
  level = 'M',
  includeMargin = true,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  className,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !data) return;

      try {
        setError(null);
        await QRCodeLib.toCanvas(canvasRef.current, data, {
          errorCorrectionLevel: level,
          margin: includeMargin ? 1 : 0,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          width: size,
        });
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQRCode();
  }, [data, size, level, includeMargin, bgColor, fgColor]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border border-red-200 bg-red-50 text-red-600 rounded-lg",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-center px-2">{error}</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("border border-gray-200 rounded-lg", className)}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

// Additional utility component for easy QR code generation with common styling
export function TicketQRCode({
  entryCode,
  size = 150,
  className
}: {
  entryCode: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <QRCode
        data={entryCode}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
        className="shadow-sm"
      />
      <p className="text-xs text-gray-500 font-mono">{entryCode}</p>
    </div>
  );
}
