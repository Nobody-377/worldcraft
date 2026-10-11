"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Toolbar, type SaveStatus } from "@/components/Toolbar";
import { InventoryDock } from "@/components/InventoryDock";
import { CanvasViewport, type CanvasViewportHandle } from "@/components/CanvasViewport";
import { CameraModal } from "@/components/CameraModal";
import type { InventoryItem, CanvasElement } from "@/types/worldcraft";
import {
  saveImageBlob,
  getImageBlob,
  deleteImageBlob,
  saveWorldState,
  loadWorldState,
  createManagedObjectUrl,
  retainObjectUrl,
  releaseObjectUrl,
  revokeAllManagedObjectUrls,
} from "@/lib/storage";
import { classifyImage } from "@/lib/vision";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const viewportRef = useRef<CanvasViewportHandle | null>(null);

  // Initial Rehydration from IndexedDB on page load
  useEffect(() => {
    let isCancelled = false;

    async function rehydrate() {
      try {
        const stored = await loadWorldState();
        if (!stored || isCancelled) {
          setIsHydrated(true);
          return;
        }

        const blobUrlMap = new Map<string, string>();
        const rehydratedInventory: InventoryItem[] = [];

        // 1. Restore Inventory Items
        for (const item of stored.inventory) {
          try {
            const blob = await getImageBlob(item.blobKey);
            if (!blob) {
              console.warn(`Skipping missing blob for inventory item: ${item.name}`);
              continue;
            }
            let url = blobUrlMap.get(item.blobKey);
            if (!url) {
              url = createManagedObjectUrl(blob);
              blobUrlMap.set(item.blobKey, url);
            }
            rehydratedInventory.push({
              id: item.id,
              name: item.name,
              blobKey: item.blobKey,
              previewUrl: url,
              fileSize: item.fileSize,
              width: item.width,
              height: item.height,
              createdAt: item.createdAt,
            });
          } catch (itemErr) {
            console.error(`Failed to rehydrate inventory item ${item.name}:`, itemErr);
          }
        }

        // 2. Restore Canvas Elements
        const rehydratedElements: CanvasElement[] = [];
        for (const el of stored.canvasElements) {
          try {
            let url = blobUrlMap.get(el.blobKey);
            if (!url) {
              const blob = await getImageBlob(el.blobKey);
              if (!blob) {
                console.warn(`Skipping missing blob for canvas element: ${el.name}`);
                continue;
              }
              url = createManagedObjectUrl(blob);
              blobUrlMap.set(el.blobKey, url);
            } else {
              retainObjectUrl(url);
            }

            rehydratedElements.push({
              id: el.id,
              inventoryItemId: el.inventoryItemId,
              blobKey: el.blobKey,
              previewUrl: url,
              name: el.name,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation,
              scaleX: el.scaleX,
              scaleY: el.scaleY,
              zIndex: el.zIndex,
            });
          } catch (elErr) {
            console.error(`Failed to rehydrate canvas element ${el.name}:`, elErr);
          }
        }

        if (!isCancelled) {
          setInventory(rehydratedInventory);
          setCanvasElements(rehydratedElements);
        }
      } catch (err) {
        console.error("Error during IndexedDB rehydration:", err);
      } finally {
        if (!isCancelled) {
          setIsHydrated(true);
        }
      }
    }

    rehydrate();

    return () => {
      isCancelled = true;
      revokeAllManagedObjectUrls();
    };
  }, []);

  // Debounced auto-save to persist inventory and canvas layout to IndexedDB
  useEffect(() => {
    if (!isHydrated) return;

    const timeout = setTimeout(async () => {
      try {
        await saveWorldState(inventory, canvasElements);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [inventory, canvasElements, isHydrated]);

  /**
   * Manual save world handler with user feedback
   */
  const handleSaveWorld = async () => {
    setSaveStatus("saving");
    try {
      await saveWorldState(inventory, canvasElements);
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2500);
    } catch (err) {
      console.error("Manual save failed:", err);
      setSaveStatus("error");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };

  /**
   * Export high-resolution PNG snapshot from the Konva stage
   */
  const handleExportPng = () => {
    if (!viewportRef.current) return;
    try {
      const dataUrl = viewportRef.current.exportPng(2);
      if (!dataUrl) {
        alert("Unable to generate canvas image. Please ensure the canvas is active.");
        return;
      }

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `worldcraft-${timestamp}.png`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Canvas export failed:", err);
      alert("Failed to export image: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * Helper to load image dimensions safely in the browser.
   */
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 160,
          height: img.naturalHeight || 160,
        });
      };
      img.onerror = () => {
        resolve({ width: 160, height: 160 });
      };
      img.src = url;
    });
  };

  /**
   * Asynchronous AI vision classification pipeline.
   * Runs in the background without blocking the UI or canvas.
   */
  const triggerAiClassification = async (itemId: string, previewUrl: string) => {
    try {
      const prediction = await classifyImage(previewUrl);
      if (prediction) {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  aiLabel: prediction.label,
                  aiConfidence: prediction.confidence,
                  aiModel: prediction.model,
                  isClassifying: false,
                  // If name is still generic, update to AI identified label
                  name:
                    item.name === "Natural Element" || item.name.startsWith("photo capture")
                      ? prediction.label
                      : item.name,
                }
              : item
          )
        );
      } else {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, isClassifying: false } : item
          )
        );
      }
    } catch {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isClassifying: false } : item
        )
      );
    }
  };

  /**
   * Handle uploading one or more image files.
   */
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newItems: InventoryItem[] = [];

    for (const file of fileArray) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(
          `Unsupported file type "${file.name}". Please upload standard photos (PNG, JPG, or WebP).`
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File "${file.name}" exceeds the 15MB size limit.`);
      }

      // Check for duplicate items already in inventory
      const existingItem = inventory.find(
        (it) => it.name === file.name.replace(/\.[^/.]+$/, "") && it.fileSize === file.size
      );
      if (existingItem) {
        continue;
      }

      const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Save binary blob to IndexedDB
      await saveImageBlob(id, file);

      // Create managed preview object URL
      const previewUrl = createManagedObjectUrl(file);
      const dimensions = await getImageDimensions(previewUrl);

      // Derive human-readable clean name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      const newItem: InventoryItem = {
        id,
        name: cleanName || "Natural Element",
        blobKey: id,
        previewUrl,
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        createdAt: Date.now(),
        isClassifying: true,
      };

      newItems.push(newItem);

      // Asynchronously trigger AI identification without awaiting
      triggerAiClassification(id, previewUrl);
    }

    if (newItems.length > 0) {
      setInventory((prev) => [...prev, ...newItems]);
    }
  };

  /**
   * Handle live camera capture photo
   */
  const handleCameraCapture = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: "image/jpeg" });
    await handleUploadFiles([file]);
  };

  /**
   * Place an inventory item onto the canvas.
   */
  const handlePlaceOnCanvas = (item: InventoryItem) => {
    retainObjectUrl(item.previewUrl);

    const maxSide = Math.max(item.width, item.height);
    const scale = maxSide > 160 ? 160 / maxSide : 1;
    const initialWidth = Math.round(item.width * scale);
    const initialHeight = Math.round(item.height * scale);

    const offset = (canvasElements.length % 6) * 24;

    const newElement: CanvasElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      inventoryItemId: item.id,
      blobKey: item.blobKey,
      previewUrl: item.previewUrl,
      name: item.name,
      x: 120 + offset,
      y: 100 + offset,
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: canvasElements.length + 1,
    };

    setCanvasElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  /**
   * Place an inventory item at specific dropped coordinates on canvas.
   */
  const handleDropFromInventory = (itemId: string, dropX: number, dropY: number) => {
    const item = inventory.find((it) => it.id === itemId);
    if (!item) return;

    retainObjectUrl(item.previewUrl);

    const maxSide = Math.max(item.width, item.height);
    const scale = maxSide > 160 ? 160 / maxSide : 1;
    const initialWidth = Math.round(item.width * scale);
    const initialHeight = Math.round(item.height * scale);

    const newElement: CanvasElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      inventoryItemId: item.id,
      blobKey: item.blobKey,
      previewUrl: item.previewUrl,
      name: item.name,
      x: Math.max(0, dropX - initialWidth / 2),
      y: Math.max(0, dropY - initialHeight / 2),
      width: initialWidth,
      height: initialHeight,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: canvasElements.length + 1,
    };

    setCanvasElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  /**
   * Update position when an element is dragged on the Konva stage.
   */
  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    setCanvasElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  }, []);

  /**
   * Update scale, rotation, and position after transformation.
   */
  const handleTransformEnd = useCallback(
    (
      id: string,
      attrs: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
    ) => {
      setCanvasElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...attrs } : el))
      );
    },
    []
  );

  /**
   * Layer ordering controls
   */
  const handleBringToFront = (id: string) => {
    setCanvasElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const item = prev[idx];
      const without = prev.filter((_, i) => i !== idx);
      return [...without, item];
    });
  };

  const handleBringForward = (id: string) => {
    setCanvasElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const copy = [...prev];
      const next = copy[idx + 1];
      copy[idx + 1] = copy[idx];
      copy[idx] = next;
      return copy;
    });
  };

  const handleSendBackward = (id: string) => {
    setCanvasElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const prevItem = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = prevItem;
      return copy;
    });
  };

  const handleSendToBack = (id: string) => {
    setCanvasElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx <= 0) return prev;
      const item = prev[idx];
      const without = prev.filter((_, i) => i !== idx);
      return [item, ...without];
    });
  };

  /**
   * Delete canvas element
   */
  const handleDeleteCanvasElement = useCallback((id: string) => {
    setCanvasElements((prev) => {
      const el = prev.find((item) => item.id === id);
      if (el) {
        releaseObjectUrl(el.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    setSelectedElementId((current) => (current === id ? null : current));
  }, []);

  /**
   * Clear all canvas elements
   */
  const handleClearCanvas = () => {
    for (const el of canvasElements) {
      releaseObjectUrl(el.previewUrl);
    }
    setCanvasElements([]);
    setSelectedElementId(null);
  };

  /**
   * Delete item from inventory
   */
  const handleDeleteInventoryItem = async (id: string) => {
    const itemToDelete = inventory.find((it) => it.id === id);
    if (itemToDelete) {
      const isUsedOnCanvas = canvasElements.some(
        (el) => el.inventoryItemId === id
      );
      if (!isUsedOnCanvas) {
        await deleteImageBlob(itemToDelete.blobKey);
      }
      releaseObjectUrl(itemToDelete.previewUrl);
    }
    setInventory((prev) => prev.filter((it) => it.id !== id));
  };

  /**
   * Manual rename item
   */
  const handleRenameItem = (id: string, newName: string) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
    setCanvasElements((prev) =>
      prev.map((el) => (el.inventoryItemId === id ? { ...el, name: newName } : el))
    );
  };

  /**
   * Keyboard shortcut listener: Delete / Backspace
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (selectedElementId) {
        e.preventDefault();
        handleDeleteCanvasElement(selectedElementId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, handleDeleteCanvasElement]);

  return (
    <div className="flex flex-col min-h-screen bg-[#304C48] overflow-x-hidden">
      {/* Brand Header */}
      <Header />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 flex flex-col gap-3.5 sm:gap-4 overflow-x-hidden">
        {/* Top Control Bar */}
        <Toolbar
          canClear={canvasElements.length > 0}
          canExport={canvasElements.length > 0}
          saveStatus={saveStatus}
          onClearCanvas={handleClearCanvas}
          onSaveWorld={handleSaveWorld}
          onExportPng={handleExportPng}
        />

        {/* Studio Workspace: Mobile canvas-first single column, desktop side-by-side */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch w-full max-w-full">
          {/* Main Interactive Canvas Area (rendered first on mobile) */}
          <CanvasViewport
            ref={viewportRef}
            elements={canvasElements}
            selectedId={selectedElementId}
            onSelect={setSelectedElementId}
            onElementMove={handleElementMove}
            onTransformEnd={handleTransformEnd}
            onDropFromInventory={handleDropFromInventory}
            onBringToFront={handleBringToFront}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onSendToBack={handleSendToBack}
            onDeleteElement={handleDeleteCanvasElement}
          />

          {/* Side / Bottom Inventory Dock (rendered conveniently below canvas on mobile) */}
          <InventoryDock
            items={inventory}
            onUploadFiles={handleUploadFiles}
            onPlaceOnCanvas={handlePlaceOnCanvas}
            onDeleteItem={handleDeleteInventoryItem}
            onRenameItem={handleRenameItem}
            onOpenCamera={() => setIsCameraOpen(true)}
          />
        </div>
      </main>

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Retro 8-Bit Footer */}
      <footer className="w-full py-3 px-4 text-center text-[11px] font-mono font-bold text-[#E8E8DA] border-t-2 border-[#171D1B] bg-[#3D5E59]">
        WORLDCRAFT &bull; RETRO 2D CANVAS STUDIO &bull; HACKTOBERFEST 2026
      </footer>
    </div>
  );
}
