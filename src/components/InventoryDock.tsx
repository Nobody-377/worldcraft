"use client";

import React, { useRef, useState } from "react";
import type { InventoryItem } from "@/types/worldcraft";

interface InventoryDockProps {
  items: InventoryItem[];
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onPlaceOnCanvas: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onRenameItem?: (id: string, newName: string) => void;
  onOpenCamera?: () => void;
}

export function InventoryDock({
  items,
  onUploadFiles,
  onPlaceOnCanvas,
  onDeleteItem,
  onRenameItem,
  onOpenCamera,
}: InventoryDockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      await onUploadFiles(e.target.files);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    setErrorMessage(null);
    setIsProcessing(true);
    try {
      await onUploadFiles(e.dataTransfer.files);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload dropped files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRenaming = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditNameValue(item.name);
  };

  const submitRenaming = (id: string) => {
    if (editNameValue.trim() && onRenameItem) {
      onRenameItem(id, editNameValue.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-full lg:w-80 bg-[#E8E8DA] rounded-2xl border-2 border-[#171D1B] shadow-[3px_3px_0px_#171D1B] p-3.5 sm:p-4 flex flex-col gap-3.5">
      {/* Dock Header */}
      <div className="flex items-center justify-between pb-1 border-b-2 border-[#171D1B]/15">
        <div>
          <h2 className="text-xs sm:text-sm font-extrabold text-[#171D1B] flex items-center gap-1.5 font-mono tracking-wider uppercase">
            <span className="w-2.5 h-2.5 bg-[#F5BD2D] border border-[#171D1B] inline-block" />
            Inventory
          </h2>
          <p className="text-[11px] text-[#304C48] font-medium">Your natural elements collection</p>
        </div>
        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-[#F5BD2D] text-[#171D1B] border border-[#171D1B] shadow-[1px_1px_0px_#171D1B]">
          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Buttons: 44px touch targets */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 min-h-[44px] p-2 rounded-xl border-2 border-[#171D1B] bg-[#F5BD2D] hover:bg-[#ffcb47] text-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press cursor-pointer text-center"
        >
          <svg className="w-4 h-4 shrink-0 text-[#171D1B]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-xs font-extrabold uppercase font-mono">Upload</span>
        </button>

        <button
          type="button"
          onClick={onOpenCamera}
          className="flex items-center justify-center gap-2 min-h-[44px] p-2 rounded-xl border-2 border-[#171D1B] bg-[#8BB4DE] hover:bg-[#9dc0e5] text-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press cursor-pointer text-center"
        >
          <svg className="w-4 h-4 shrink-0 text-[#171D1B]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-extrabold uppercase font-mono">Camera</span>
        </button>
      </div>

      {/* Dropzone Hint */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center p-2 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
          isDraggingOver
            ? "border-[#171D1B] bg-[#F5BD2D]/30"
            : "border-[#171D1B]/40 bg-[#FAF9F0] hover:bg-[#FAF9F0]/80"
        }`}
      >
        <span className="text-[11px] font-mono text-[#304C48] font-bold">
          {isProcessing ? "PROCESSING PHOTOS..." : "OR DROP FILES HERE"}
        </span>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-[#E98083] border-2 border-[#171D1B] text-[#171D1B] text-[11px] font-bold flex items-start gap-1.5 shadow-[2px_2px_0px_#171D1B]">
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#171D1B] font-black text-sm px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Items Grid */}
      <div className="flex-1 min-h-[200px] max-h-[380px] lg:max-h-[500px] overflow-y-auto rounded-xl border-2 border-[#171D1B] bg-[#FAF9F0] p-2">
        {items.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-[#F5BD2D] border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] flex items-center justify-center text-[#171D1B] mb-2.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-xs font-mono font-bold uppercase text-[#171D1B]">No objects yet</p>
            <p className="text-[11px] text-[#304C48] max-w-[200px] mt-1 leading-relaxed">
              Snap real-world elements or upload photos to populate your retro collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/worldcraft-item-id", item.id);
                }}
                className="group relative flex flex-col bg-[#E8E8DA] rounded-xl border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] overflow-hidden transition-all cursor-grab active:cursor-grabbing hover:border-[#F5BD2D]"
              >
                {/* Thumbnail Preview */}
                <div className="w-full h-24 bg-white flex items-center justify-center overflow-hidden relative border-b-2 border-[#171D1B]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* AI Vision Status Badge */}
                  {item.isClassifying ? (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-[#304C48] text-[#E8E8DA] border border-[#171D1B] text-[9px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5BD2D] animate-ping" />
                      <span>AI SCAN...</span>
                    </div>
                  ) : item.aiLabel ? (
                    <div
                      className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-[#8BB4DE] text-[#171D1B] border border-[#171D1B] text-[9px] font-mono font-bold flex items-center gap-1 shadow-[1px_1px_0px_#171D1B]"
                      title={`Identified by ${item.aiModel || "MobileNet"}`}
                    >
                      <span>AI: {item.aiLabel}</span>
                      {item.aiConfidence !== undefined && (
                        <span className="font-normal">
                          ({Math.round(item.aiConfidence * 100)}%)
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Delete Item Button (Touch friendly) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    title="Remove from inventory"
                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-[#E98083] text-[#171D1B] border border-[#171D1B] shadow-[1px_1px_0px_#171D1B] flex items-center justify-center hover:bg-rose-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Details & Quick Action */}
                <div className="p-2 flex flex-col gap-1.5">
                  {/* Inline Renaming or Display */}
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRenaming(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="w-full text-[11px] px-1 py-0.5 border-2 border-[#171D1B] rounded font-bold text-[#171D1B] bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => submitRenaming(item.id)}
                        className="text-[11px] text-[#171D1B] font-black px-1.5 py-0.5 bg-[#F5BD2D] border border-[#171D1B] rounded"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-[#171D1B] truncate" title={item.name}>
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming(item);
                        }}
                        title="Edit name"
                        className="text-[11px] p-1 text-[#304C48] hover:text-[#171D1B] min-h-[24px] min-w-[24px] flex items-center justify-center"
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  {/* 44px Touch Target Place Button */}
                  <button
                    type="button"
                    onClick={() => onPlaceOnCanvas(item)}
                    className="w-full min-h-[44px] py-1.5 px-2 rounded-lg bg-[#F5BD2D] hover:bg-[#ffcb47] text-[#171D1B] text-xs font-mono font-black uppercase border-2 border-[#171D1B] shadow-[1px_1px_0px_#171D1B] retro-press transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Place
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
