import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Image as ImageIcon, BrainCircuit, ArrowUp, X, Sparkles, Radio } from 'lucide-react';
import { ModelMode } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface InputBarProps {
  onSendMessage: (text: string, options: { mode: ModelMode; image?: File }) => void;
  onLiveToggle: () => void;
  onOpenCeezaVoiceInput?: () => void;
  isLive: boolean;
  isLoading: boolean;
  followUpChips?: string[];
  onSelectChip?: (text: string) => void;
  currentMode?: ModelMode;
  onToggleMode?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({ 
  onSendMessage, 
  onLiveToggle, 
  onOpenCeezaVoiceInput,
  isLive, 
  isLoading, 
  followUpChips = [], 
  onSelectChip,
  currentMode = ModelMode.Pro,
  onToggleMode
}) => {
  const [text, setText] = useState('');
  const [isThinking, setIsThinking] = useState(currentMode === ModelMode.Thinking);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsThinking(currentMode === ModelMode.Thinking);
  }, [currentMode]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !attachedImage) || isLoading) return;

    triggerHaptic(20);
    onSendMessage(text.trim(), { 
      mode: isThinking ? ModelMode.Thinking : ModelMode.Pro,
      image: attachedImage || undefined
    });

    setText('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerHaptic(15);
      setAttachedImage(e.target.files[0]);
    }
  };

  const canSubmit = (text.trim().length > 0 || attachedImage !== null) && !isLoading;

  return (
    <div className="w-full max-w-3xl mx-auto">
      
      {/* Follow-up / Suggestion Prompt Chips */}
      <AnimatePresence>
        {followUpChips.length > 0 && !isLive && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1 no-scrollbar px-1"
          >
            {followUpChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic(15);
                  if (onSelectChip) {
                    const cleanText = chip.replace(/^[^\w\s]+/, '').trim();
                    onSelectChip(cleanText);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111827]/90 hover:bg-[#1f293d] text-slate-300 hover:text-white border border-white/10 hover:border-[#FAAD3F]/40 text-xs font-medium whitespace-nowrap shadow-sm transition-all cursor-pointer flex-shrink-0"
              >
                <Sparkles size={11} className="text-[#FAAD3F]" />
                <span>{chip}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Thumbnail */}
      <AnimatePresence>
        {attachedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mb-2 px-1"
          >
            <div className="relative inline-block">
              <img 
                src={URL.createObjectURL(attachedImage)} 
                alt="Upload preview" 
                className="h-20 w-20 object-cover rounded-xl border border-white/20 shadow-lg" 
              />
              <button 
                onClick={() => {
                  triggerHaptic(10);
                  setAttachedImage(null);
                }}
                className="absolute -top-1.5 -right-1.5 bg-black text-white hover:bg-red-500 rounded-full p-1 shadow-md transition-colors"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal AI Chat Input Box Container */}
      <div className="relative rounded-2xl bg-[#0f172a]/95 border border-white/15 shadow-2xl backdrop-blur-xl focus-within:border-[#FAAD3F]/50 transition-all p-3">
        
        {/* Multiline Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isLive ? "Live audio session in progress..." : "Ask GOD AI anything... (Shift + Enter for new line)"}
          className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base outline-none resize-none leading-relaxed min-h-[38px] max-h-[160px] px-1 py-1"
          disabled={isLive || isLoading}
        />

        {/* Bottom Action Bar inside input template */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
          
          {/* Left Action Buttons: Image, Thinking Mode, Ceeza Mic */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Attach Image */}
            <button 
              type="button"
              onClick={() => {
                triggerHaptic(15);
                fileInputRef.current?.click();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
              title="Attach Image"
            >
              <ImageIcon size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />

            {/* Thinking Mode Toggle */}
            <button 
              type="button"
              onClick={() => {
                triggerHaptic(15);
                const next = !isThinking;
                setIsThinking(next);
                if (onToggleMode) onToggleMode();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                isThinking 
                  ? 'bg-[#4285F4]/20 text-[#4285F4] border-[#4285F4]/50 font-bold' 
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
              }`}
              title="Toggle Thinking Deep Reasoning"
            >
              <BrainCircuit size={14} className={isThinking ? 'text-[#4285F4] animate-pulse' : ''} />
              <span className="hidden sm:inline">Thinking</span>
            </button>

            {/* Ceeza Mic DSP */}
            {onOpenCeezaVoiceInput && (
              <button 
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onOpenCeezaVoiceInput();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-[#FAAD3F] hover:bg-[#FAAD3F]/10 border border-[#FAAD3F]/20 hover:border-[#FAAD3F]/40 transition-all cursor-pointer"
                title="Ceeza Voice Input DSP"
              >
                <Mic size={14} />
                <span className="hidden sm:inline font-bold">Ceeza Mic</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons: Live Stream & Send */}
          <div className="flex items-center gap-2">
            
            {/* Live Audio Call / Session */}
            <button 
              type="button"
              onClick={() => {
                triggerHaptic(25);
                onLiveToggle();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                isLive 
                  ? 'bg-[#F38020] text-black border-[#F38020] font-bold shadow-lg shadow-orange-500/30' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
              }`}
              title="Start Live Voice Session"
            >
              <Radio size={14} className={isLive ? 'animate-pulse text-black' : 'text-[#F38020]'} />
              <span>{isLive ? 'Live On' : 'Live Voice'}</span>
            </button>

            {/* Send Button */}
            <button 
              type="button"
              onClick={() => handleSubmit()}
              disabled={!canSubmit}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Disclaimer */}
      <p className="text-[11px] text-center text-slate-500 font-sans mt-2">
        GOD AI Ceeza v3.6 · AI responses may vary. Check critical details.
      </p>

    </div>
  );
};

export default InputBar;
