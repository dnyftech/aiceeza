import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Reset state when a new image opens
    setScale(1);
    setRotation(0);
  }, [src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.35, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.35, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `god_ai_attachment_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none"
        onClick={onClose}
      >
        {/* Modal Controls Top Floating Android Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111726]/90 border border-[#F38020]/30 shadow-2xl backdrop-blur-xl"
        >
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Rotate 90°"
          >
            <RotateCw size={18} />
          </button>
          <div className="w-[1px] h-5 bg-white/15 mx-1" />
          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-slate-300 hover:text-[#FAAD3F] hover:bg-white/10 transition-colors"
            title="Download Image"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Close Preview (Esc)"
          >
            <X size={18} />
          </button>
        </motion.div>

        {/* Zoom Level Indicator Tag */}
        <div className="absolute bottom-6 left-6 z-20 px-3 py-1.5 rounded-full bg-[#111726]/80 border border-white/10 text-[11px] font-mono text-slate-300 uppercase tracking-widest backdrop-blur-md">
          {Math.round(scale * 100)}% • {rotation}°
        </div>

        {/* Image Display Area with Drag & Scale */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            src={src}
            alt="Full Preview"
            drag={scale > 1}
            dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
            animate={{ scale, rotate: rotation }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
