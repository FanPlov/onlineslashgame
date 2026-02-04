
import React, { useRef } from 'react';
import { SymbolType } from '../types';

interface CellProps {
  symbol: SymbolType | null;
  isValid: boolean;
  onClick: () => void;
  onLongPress: () => void;
  isLastMove: boolean;
  isLocked: boolean;
  disabled: boolean;
}

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-amber-500 drop-shadow-md" stroke="currentColor" strokeWidth="2.5">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const Cell: React.FC<CellProps> = React.memo(({ symbol, isValid, onClick, onLongPress, isLastMove, isLocked, disabled }) => {
  const timerRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    
    isLongPressTriggered.current = false;
    
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      onLongPress();
    }, 500); 
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (disabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isLongPressTriggered.current) {
       // Allow click if valid, or if it's a block (to trigger neutralizer menu via click if desired, though long press is standard)
       if (isValid || symbol === SymbolType.BLOCK) { 
         onClick();
       }
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const getSymbolContent = () => {
    switch (symbol) {
      case SymbolType.VERTICAL:
        return <div className="h-[75%] w-[14%] bg-cyan-500 rounded-full shadow-sm shadow-cyan-900/50" />;
      case SymbolType.HORIZONTAL:
        return <div className="w-[75%] h-[14%] bg-rose-500 rounded-full shadow-sm shadow-rose-900/50" />;
      case SymbolType.PLUS:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute h-[70%] w-[12%] bg-white rounded-full shadow-sm" />
            <div className="absolute w-[70%] h-[12%] bg-white rounded-full shadow-sm" />
          </div>
        );
      case SymbolType.SLASH:
        return <div className="w-[80%] h-[14%] bg-amber-400 rotate-45 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />;
      case SymbolType.BLOCK:
        return (
          <div className="w-[60%] h-[60%] border-[5px] border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`
        relative w-full h-full min-h-[45px] 
        flex items-center justify-center
        transition-all duration-150
        ${symbol === SymbolType.BLOCK ? 'bg-amber-900/20' : symbol ? 'bg-white/10' : 'bg-white/[0.03]'}
        ${isValid && !disabled ? 'cursor-pointer active:bg-white/20' : ''}
        ${isLastMove ? 'ring-1 ring-amber-500/50 bg-amber-500/10' : 'ring-1 ring-transparent'}
        rounded-xl overflow-hidden select-none
      `}
    >
      {getSymbolContent()}
      
      {/* Helper dot for valid empty moves */}
      {isValid && !symbol && !disabled && <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />}
      
      {/* Lock Icon for Last Move (Ko Rule) */}
      {isLocked && (
        <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
          <IconLock />
        </div>
      )}
    </div>
  );
});

export default Cell;
