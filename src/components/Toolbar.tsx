import React from "react";

export type SaveStatus = "idle" | "saving" | "success" | "error";

interface ToolbarProps {
  canClear: boolean;
  canExport: boolean;
  saveStatus: SaveStatus;
  onClearCanvas: () => void;
  onSaveWorld: () => void;
  onExportPng: () => void;
}

export function Toolbar({
  canClear,
  canExport,
  saveStatus,
  onClearCanvas,
  onSaveWorld,
  onExportPng,
}: ToolbarProps) {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-[#E8E8DA] rounded-2xl border-2 border-[#171D1B] shadow-[3px_3px_0px_#171D1B]">
      {/* Primary Action Buttons - 44px touch-friendly targets */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Save World Button with Arcade Yellow Styling */}
        <button
          type="button"
          onClick={onSaveWorld}
          disabled={saveStatus === "saving"}
          className={`flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press cursor-pointer transition-colors ${
            saveStatus === "saving"
              ? "bg-[#F5BD2D]/70 text-[#171D1B] cursor-wait"
              : saveStatus === "success"
              ? "bg-[#3D5E59] text-[#E8E8DA]"
              : saveStatus === "error"
              ? "bg-[#E98083] text-[#171D1B]"
              : "bg-[#F5BD2D] hover:bg-[#ffcb47] text-[#171D1B]"
          }`}
          title="Save world layout and inventory to storage"
        >
          {saveStatus === "saving" ? (
            <>
              <svg className="w-4 h-4 animate-spin shrink-0 text-[#171D1B]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Saving...</span>
            </>
          ) : saveStatus === "success" ? (
            <>
              <svg className="w-4 h-4 text-[#E8E8DA] shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Saved!</span>
            </>
          ) : saveStatus === "error" ? (
            <>
              <svg className="w-4 h-4 text-[#171D1B] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Save Failed</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save World</span>
            </>
          )}
        </button>

        {/* Export PNG Button with Pixel Blue Styling */}
        <button
          type="button"
          onClick={onExportPng}
          disabled={!canExport}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-[#171D1B] bg-[#8BB4DE] hover:bg-[#9dc0e5] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          title="Export high-resolution PNG snapshot of your world"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Export PNG</span>
        </button>

        {/* Clear Canvas Button with Pixel Coral Styling */}
        <button
          type="button"
          disabled={!canClear}
          onClick={onClearCanvas}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-[#171D1B] bg-[#E98083] hover:bg-[#f29396] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          title="Clear all canvas elements"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Clear Canvas</span>
          <span className="sm:hidden">Clear</span>
        </button>
      </div>

      {/* Retro Status Chips */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[10px] font-mono font-bold text-[#171D1B] px-2.5 py-1 rounded-md bg-[#8BB4DE]/40 border border-[#171D1B]">
          AUTO-SAVE: ON
        </span>
        <span className="text-[10px] font-mono font-bold text-[#171D1B] px-2.5 py-1 rounded-md bg-[#FAF9F0] border border-[#171D1B]">
          GRID: PIXEL
        </span>
      </div>
    </div>
  );
}
