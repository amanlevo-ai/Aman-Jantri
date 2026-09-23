import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Crop } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
}) => {
  const [cropBox, setCropBox] = useState({ top: 5, left: 5, width: 90, height: 90 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCropBox({ top: 5, left: 5, width: 90, height: 90 });
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const sx = (cropBox.left / 100) * naturalWidth;
    const sy = (cropBox.top / 100) * naturalHeight;
    const sWidth = (cropBox.width / 100) * naturalWidth;
    const sHeight = (cropBox.height / 100) * naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(10, Math.round(sWidth));
    canvas.height = Math.max(10, Math.round(sHeight));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], cropped_parchi_.jpg, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(file, dataUrl);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">Crop Parchi Photo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 flex-1 flex flex-col items-center justify-center bg-black/60 overflow-hidden select-none">
          <div className="relative max-w-full max-h-[48vh] flex items-center justify-center">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              className="max-h-[48vh] max-w-full object-contain pointer-events-none rounded"
            />

            <div
              className="absolute border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none rounded-xs"
              style={{
                top: `${cropBox.top}%`,
                left: `${cropBox.left}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
              }}
            >
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-black rounded-xs" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-black rounded-xs" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-400 border border-black rounded-xs" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-black rounded-xs" />
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2.5 text-xs">
          <p className="text-slate-400 font-medium text-center text-[11px]">
            Adjust frame sliders to crop only the parchi numbers:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex justify-between text-slate-300 font-mono text-[10px] mb-0.5">
                <span>Top</span>
                <span>{cropBox.top}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, 100 - cropBox.height)}
                value={cropBox.top}
                onChange={(e) => setCropBox((b) => ({ ...b, top: Number(e.target.value) }))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono text-[10px] mb-0.5">
                <span>Bottom</span>
                <span>{Math.round(100 - (cropBox.top + cropBox.height))}%</span>
              </div>
              <input
                type="range"
                min="10"
                max={100 - cropBox.top}
                value={cropBox.height}
                onChange={(e) => setCropBox((b) => ({ ...b, height: Number(e.target.value) }))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono text-[10px] mb-0.5">
                <span>Left</span>
                <span>{cropBox.left}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, 100 - cropBox.width)}
                value={cropBox.left}
                onChange={(e) => setCropBox((b) => ({ ...b, left: Number(e.target.value) }))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono text-[10px] mb-0.5">
                <span>Right</span>
                <span>{Math.round(100 - (cropBox.left + cropBox.width))}%</span>
              </div>
              <input
                type="range"
                min="10"
                max={100 - cropBox.left}
                value={cropBox.width}
                onChange={(e) => setCropBox((b) => ({ ...b, width: Number(e.target.value) }))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCropBox({ top: 0, left: 0, width: 100, height: 100 })}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] cursor-pointer"
            >
              Full Image
            </button>
            <button
              type="button"
              onClick={() => setCropBox({ top: 10, left: 5, width: 90, height: 75 })}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] cursor-pointer"
            >
              Center Slip
            </button>
            <button
              type="button"
              onClick={() => setCropBox({ top: 0, left: 5, width: 90, height: 80 })}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] cursor-pointer"
            >
              Top Message
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
