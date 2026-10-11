import React from "react";

export function Header() {
  return (
    <header className="w-full bg-[#3D5E59] border-b-2 border-[#171D1B] sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Retro Pixel Emblem */}
          <div className="w-10 h-10 rounded-xl bg-[#F5BD2D] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[#171D1B]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9 9 0 100-18 9 9 0 000 18z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.6 9h16.8M3.6 15h16.8"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-[#E8E8DA] drop-shadow-xs">
                WORLDCRAFT
              </span>
              <span className="text-[10px] font-mono tracking-widest font-black px-2 py-0.5 rounded-md bg-[#F5BD2D] text-[#171D1B] border-2 border-[#171D1B] shadow-[1px_1px_0px_#171D1B]">
                2026
              </span>
            </div>
            <p className="text-xs text-[#E8E8DA]/85 font-medium hidden sm:block">
              Capture the world. Create your own.
            </p>
          </div>
        </div>

        {/* Studio Badge / Hacktoberfest Theme Chip */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8E8DA] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] text-[11px] font-mono font-bold text-[#171D1B]">
            <span className="w-2 h-2 rounded-full bg-[#E98083] animate-pulse" />
            <span className="hidden xs:inline">PIXEL CANVAS</span>
            <span className="xs:hidden">STUDIO</span>
          </div>
        </div>
      </div>
    </header>
  );
}
