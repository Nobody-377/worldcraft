import React from "react";
import type { CanvasElement } from "@/types/worldcraft";

interface CanvasControlsProps {
  selectedElement: CanvasElement | null;
  onBringToFront: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDelete: (id: string) => void;
  onDeselect: () => void;
}

export function CanvasControls({
  selectedElement,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onDelete,
  onDeselect,
}: CanvasControlsProps) {
  if (!selectedElement) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-24px)] flex items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-[#E8E8DA] border-2 border-[#171D1B] shadow-[3px_3px_0px_#171D1B] text-xs text-[#171D1B] animate-in fade-in slide-in-from-top-2 duration-150 overflow-x-auto">
      {/* Selected Object Indicator */}
      <div className="flex items-center gap-1.5 px-2 border-r-2 border-[#171D1B]/20 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#F5BD2D] border border-[#171D1B]" />
        <span className="font-extrabold font-mono text-[11px] text-[#171D1B] max-w-[100px] truncate" title={selectedElement.name}>
          {selectedElement.name.toUpperCase()}
        </span>
      </div>

      {/* Layer Depth Controls - 44px touch targets */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onBringToFront(selectedElement.id)}
          title="Bring to Front"
          className="min-h-[44px] min-w-[40px] px-2 rounded-lg bg-[#FAF9F0] hover:bg-[#F5BD2D] border border-[#171D1B] text-[#171D1B] font-bold flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onBringForward(selectedElement.id)}
          title="Bring Forward"
          className="min-h-[44px] min-w-[40px] px-2 rounded-lg bg-[#FAF9F0] hover:bg-[#F5BD2D] border border-[#171D1B] text-[#171D1B] font-bold flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onSendBackward(selectedElement.id)}
          title="Send Backward"
          className="min-h-[44px] min-w-[40px] px-2 rounded-lg bg-[#FAF9F0] hover:bg-[#F5BD2D] border border-[#171D1B] text-[#171D1B] font-bold flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => onSendToBack(selectedElement.id)}
          title="Send to Back"
          className="min-h-[44px] min-w-[40px] px-2 rounded-lg bg-[#FAF9F0] hover:bg-[#F5BD2D] border border-[#171D1B] text-[#171D1B] font-bold flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7M19 5l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="h-6 w-[2px] bg-[#171D1B]/20 shrink-0 mx-0.5" />

      {/* Delete Object Action with Pixel Coral - 44px touch target */}
      <button
        type="button"
        onClick={() => onDelete(selectedElement.id)}
        title="Delete object (Del / Backspace)"
        className="min-h-[44px] flex items-center gap-1.5 px-3 rounded-lg bg-[#E98083] hover:bg-[#f29396] border border-[#171D1B] shadow-[1px_1px_0px_#171D1B] text-[#171D1B] font-bold shrink-0 font-mono text-[11px] uppercase transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </button>

      {/* Deselect button */}
      <button
        type="button"
        onClick={onDeselect}
        title="Deselect"
        className="min-h-[44px] min-w-[36px] flex items-center justify-center rounded-lg bg-[#FAF9F0] hover:bg-[#E8E8DA] border border-[#171D1B] text-[#171D1B] font-black shrink-0 transition-colors ml-0.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
