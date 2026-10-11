"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import dynamic from "next/dynamic";
import type { CanvasElement } from "@/types/worldcraft";
import type { WorldStageHandle } from "@/components/canvas/WorldStage";
import { CanvasControls } from "@/components/canvas/CanvasControls";

// Dynamically load Konva WorldStage without SSR to prevent window/canvas hydration errors
const WorldStage = dynamic(() => import("@/components/canvas/WorldStage"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] flex items-center justify-center text-xs font-mono font-bold text-[#171D1B]">
      <div className="flex items-center gap-2 p-3 bg-[#E8E8DA] border-2 border-[#171D1B] rounded-xl shadow-[2px_2px_0px_#171D1B]">
        <span className="w-3 h-3 rounded-full bg-[#F5BD2D] animate-ping" />
        <span>INITIALIZING PIXEL ENGINE...</span>
      </div>
    </div>
  ),
});

export interface CanvasViewportHandle {
  exportPng: (pixelRatio?: number) => string | null;
}

interface CanvasViewportProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onTransformEnd: (
    id: string,
    attrs: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
  ) => void;
  onDropFromInventory: (itemId: string, x: number, y: number) => void;
  onBringToFront: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

export const CanvasViewport = forwardRef<CanvasViewportHandle, CanvasViewportProps>(
  function CanvasViewport(
    {
      elements,
      selectedId,
      onSelect,
      onElementMove,
      onTransformEnd,
      onDropFromInventory,
      onBringToFront,
      onBringForward,
      onSendBackward,
      onSendToBack,
      onDeleteElement,
    },
    ref
  ) {
    const worldStageRef = useRef<WorldStageHandle | null>(null);
    const selectedElement = elements.find((el) => el.id === selectedId) || null;

    useImperativeHandle(ref, () => ({
      exportPng: (pixelRatio = 2) => {
        if (!worldStageRef.current) return null;
        return worldStageRef.current.exportPng(pixelRatio);
      },
    }));

    return (
      <div className="relative flex-1 w-full min-h-[350px] sm:min-h-[440px] lg:min-h-[620px] rounded-2xl border-2 border-[#171D1B] shadow-[3px_3px_0px_#171D1B] overflow-hidden pixel-canvas-grid flex flex-col items-center justify-center select-none bg-[#FAF9F0]">
        {/* Floating Canvas Controls for Selected Object */}
        <CanvasControls
          selectedElement={selectedElement}
          onBringToFront={onBringToFront}
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
          onSendToBack={onSendToBack}
          onDelete={onDeleteElement}
          onDeselect={() => onSelect(null)}
        />

        {/* WorldStage Konva Canvas Layer */}
        <div className="absolute inset-0 z-10 w-full h-full">
          <WorldStage
            ref={worldStageRef}
            elements={elements}
            selectedId={selectedId}
            onSelect={onSelect}
            onElementMove={onElementMove}
            onTransformEnd={onTransformEnd}
            onDropFromInventory={onDropFromInventory}
          />
        </div>

        {/* Empty State Overlay when no elements are on the canvas */}
        {elements.length === 0 && (
          <div className="relative z-20 pointer-events-none max-w-sm sm:max-w-md text-center p-5 sm:p-6 rounded-2xl bg-[#E8E8DA]/95 border-2 border-[#171D1B] shadow-[3px_3px_0px_#171D1B] mx-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#F5BD2D] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] flex items-center justify-center text-[#171D1B] mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold font-mono uppercase text-[#171D1B]">
              Interactive World Canvas
            </h3>
            <p className="text-xs text-[#304C48] mt-1.5 leading-relaxed font-medium">
              Upload natural elements like flowers, trees, rocks, and creatures, then place them here to build your retro world.
            </p>
            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FAF9F0] border-2 border-[#171D1B] text-[10px] font-mono font-bold text-[#171D1B]">
              <span className="w-2 h-2 rounded-full bg-[#E98083]" />
              <span>TAP OR DRAG TO PLACE &bull; SELECT TO ROTATE</span>
            </div>
          </div>
        )}

        {/* Floating Canvas Meta Badges */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-[#171D1B] bg-[#E8E8DA] px-2.5 py-1 rounded-lg border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B]">
          <span>OBJECTS: {elements.length}</span>
          {selectedElement && (
            <span className="text-[#3D5E59]">
              &bull; ACTIVE: {selectedElement.name.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  }
);
