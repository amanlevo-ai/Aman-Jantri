import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Maximize2 } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedDataUrl: string) => void;
  onUseOriginal: () => void;
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'move' | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
  onUseOriginal,
}) => {
  // Crop box in percentages (0 to 100)
  const [crop, setCrop] = useState({ x: 5, y: 5, w: 90, h: 90 });
  const activeHandleRef = useRef<HandleType>(null);
  const startDragRef = useRef<{ clientX: number; clientY: number; initialCrop: typeof crop }>({
    clientX: 0,
    clientY: 0,
    initialCrop: { x: 5, y: 5, w: 90, h: 90 },
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 5, y: 5, w: 90, h: 90 });
    }
  }, [isOpen, imageUrl]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, handle: HandleType) => {
    e.stopPropagation();
    activeHandleRef.current = handle;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startDragRef.current = {
      clientX,
      clientY,
      initialCrop: { ...crop },
    };
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeHandleRef.current || !imgRef.current) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = ((clientX - startDragRef.current.clientX) / rect.width) * 100;
    const dy = ((clientY - startDragRef.current.clientY) / rect.height) * 100;
    const init = startDragRef.current.initialCrop;

    setCrop(() => {
      let next = { ...init };
      const minSize = 10; // minimum 10% size

      if (activeHandleRef.current === 'move') {
        const newX = Math.max(0, Math.min(100 - init.w, init.x + dx));
        const newY = Math.max(0, Math.min(100 - init.h, init.y + dy));
        next = { ...init, x: newX, y: newY };
      } else if (activeHandleRef.current === 'tl') {
        const right = init.x + init.w;
        const bottom = init.y + init.h;
        const newX = Math.max(0, Math.min(right - minSize, init.x + dx));
        const newY = Math.max(0, Math.min(bottom - minSize, init.y + dy));
        next = { x: newX, y: newY, w: right - newX, h: bottom - newY };
      } else if (activeHandleRef.current === 'tr') {
        const left = init.x;
        const bottom = init.y + init.h;
        const newW = Math.max(minSize, Math.min(100 - left, init.w + dx));
        const newY = Math.max(0, Math.min(bottom - minSize, init.y + dy));
        next = { x: left, y: newY, w: newW, h: bottom - newY };
      } else if (activeHandleRef.current === 'bl') {
        const right = init.x + init.w;
        const top = init.y;
        const newX = Math.max(0, Math.min(right - minSize, init.x + dx));
        const newH = Math.max(minSize, Math.min(100 - top, init.h + dy));
        next = { x: newX, y: top, w: right - newX, h: newH };
      } else if (activeHandleRef.current === 'br') {
        const left = init.x;
        const top = init.y;
        const newW = Math.max(minSize, Math.min(100 - left, init.w + dx));
        const newH = Math.max(minSize, Math.min(100 - top, init.h + dy));
        next = { x: left, y: top, w: newW, h: newH };
      }

      return next;
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    activeHandleRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isOpen, handlePointerMove, handlePointerUp]);

  if (!isOpen) return null;

  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img) {
      onUseOriginal();
      return;
    }

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const sx = (crop.x / 100) * naturalWidth;
    const sy = (crop.y / 100) * naturalHeight;
    const sWidth = (crop.w / 100) * naturalWidth;
    const sHeight = (crop.h / 100) * naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(10, Math.round(sWidth));
    canvas.height = Math.max(10, Math.round(sHeight));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onUseOriginal();
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        onUseOriginal();
        return;
      }
      const file = new File([blob], 'cropped_parchi_' + Date.now() + '.jpg', { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(file, dataUrl);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 select-none touch-none">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm sm:text-base">Crop Photo</span>
          <span className="text-xs text-slate-400 hidden sm:inline">(Drag corners to crop)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUseOriginal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Use Full Photo</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Touch Cropping Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-black/80"
      >
        <div className="relative inline-block max-w-full max-h-[70vh]">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="To Crop"
            draggable={false}
            className="max-h-[70vh] max-w-full object-contain pointer-events-none rounded select-none block"
          />

          {/* Semi-transparent Dimmed Mask Outside Crop Box */}
          {/* Top Mask */}
          <div
            className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-none"
            style={{ height: crop.y + '%' }}
          />
          {/* Bottom Mask */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-none"
            style={{ height: (100 - (crop.y + crop.h)) + '%' }}
          />
          {/* Left Mask */}
          <div
            className="absolute left-0 bg-black/60 pointer-events-none"
            style={{
              top: crop.y + '%',
              height: crop.h + '%',
              width: crop.x + '%',
            }}
          />
          {/* Right Mask */}
          <div
            className="absolute right-0 bg-black/60 pointer-events-none"
            style={{
              top: crop.y + '%',
              height: crop.h + '%',
              width: (100 - (crop.x + crop.w)) + '%',
            }}
          />

          {/* Interactive Crop Box */}
          <div
            className="absolute border-2 border-amber-400 cursor-move"
            style={{
              top: crop.y + '%',
              left: crop.x + '%',
              width: crop.w + '%',
              height: crop.h + '%',
            }}
            onMouseDown={(e) => handlePointerDown(e, 'move')}
            onTouchStart={(e) => handlePointerDown(e, 'move')}
          >
            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-r border-b border-white/50" />
              <div className="border-b border-white/50" />
              <div className="border-r border-white/50" />
              <div className="border-r border-white/50" />
              <div />
            </div>

            {/* Corner Drag Handles (Large touch targets for fingers) */}
            {/* Top-Left */}
            <div
              className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20"
              onMouseDown={(e) => handlePointerDown(e, 'tl')}
              onTouchStart={(e) => handlePointerDown(e, 'tl')}
            >
              <div className="w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-sm shadow-md" />
            </div>

            {/* Top-Right */}
            <div
              className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20"
              onMouseDown={(e) => handlePointerDown(e, 'tr')}
              onTouchStart={(e) => handlePointerDown(e, 'tr')}
            >
              <div className="w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-sm shadow-md" />
            </div>

            {/* Bottom-Left */}
            <div
              className="absolute -bottom-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-20"
              onMouseDown={(e) => handlePointerDown(e, 'bl')}
              onTouchStart={(e) => handlePointerDown(e, 'bl')}
            >
              <div className="w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-sm shadow-md" />
            </div>

            {/* Bottom-Right */}
            <div
              className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-20"
              onMouseDown={(e) => handlePointerDown(e, 'br')}
              onTouchStart={(e) => handlePointerDown(e, 'br')}
            >
              <div className="w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-sm shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <p className="text-[11px] text-slate-400">
          Drag corners to adjust crop box
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Crop & Use</span>
          </button>
        </div>
      </div>
    </div>
  );
};
