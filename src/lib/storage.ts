import { get, set, del, clear } from "idb-keyval";
import type { InventoryItem, CanvasElement } from "@/types/worldcraft";

const BLOB_PREFIX = "worldcraft_blob_";
const WORLD_STATE_KEY = "worldcraft_persisted_state_v1";

export interface StoredInventoryItem {
  id: string;
  name: string;
  blobKey: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: number;
}

export interface StoredCanvasElement {
  id: string;
  inventoryItemId: string;
  blobKey: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
}

export interface StoredWorldState {
  version: number;
  savedAt: number;
  inventory: StoredInventoryItem[];
  canvasElements: StoredCanvasElement[];
}

/**
 * Saves an image blob to IndexedDB to avoid localStorage quota limits.
 */
export async function saveImageBlob(id: string, blob: Blob): Promise<void> {
  await set(`${BLOB_PREFIX}${id}`, blob);
}

/**
 * Retrieves an image blob from IndexedDB.
 */
export async function getImageBlob(id: string): Promise<Blob | undefined> {
  return await get<Blob>(`${BLOB_PREFIX}${id}`);
}

/**
 * Deletes an image blob from IndexedDB.
 */
export async function deleteImageBlob(id: string): Promise<void> {
  await del(`${BLOB_PREFIX}${id}`);
}

/**
 * Clears all stored image blobs.
 */
export async function clearAllImages(): Promise<void> {
  await clear();
}

/**
 * Saves both complete inventory and canvas layout metadata to IndexedDB.
 */
export async function saveWorldState(
  inventory: InventoryItem[],
  canvasElements: CanvasElement[]
): Promise<void> {
  const storedInventory: StoredInventoryItem[] = inventory.map((it) => ({
    id: it.id,
    name: it.name,
    blobKey: it.blobKey,
    fileSize: it.fileSize,
    width: it.width,
    height: it.height,
    createdAt: it.createdAt,
  }));

  const storedCanvasElements: StoredCanvasElement[] = canvasElements.map((el) => ({
    id: el.id,
    inventoryItemId: el.inventoryItemId,
    blobKey: el.blobKey,
    name: el.name,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    scaleX: el.scaleX,
    scaleY: el.scaleY,
    zIndex: el.zIndex,
  }));

  const state: StoredWorldState = {
    version: 1,
    savedAt: Date.now(),
    inventory: storedInventory,
    canvasElements: storedCanvasElements,
  };

  await set(WORLD_STATE_KEY, state);
}

/**
 * Loads stored world state from IndexedDB.
 */
export async function loadWorldState(): Promise<StoredWorldState | null> {
  try {
    const state = await get<StoredWorldState>(WORLD_STATE_KEY);
    return state || null;
  } catch (err) {
    console.error("Failed to read world state from IndexedDB:", err);
    return null;
  }
}

/**
 * Reference-counted URL manager to prevent dangling/broken image references
 * when multiple canvas elements share the same inventory photo.
 */
const urlRefCounts = new Map<string, number>();

export function createManagedObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  urlRefCounts.set(url, 1);
  return url;
}

export function retainObjectUrl(url: string): void {
  const count = urlRefCounts.get(url) || 0;
  urlRefCounts.set(url, count + 1);
}

export function releaseObjectUrl(url: string): void {
  const count = urlRefCounts.get(url);
  if (count !== undefined) {
    if (count <= 1) {
      URL.revokeObjectURL(url);
      urlRefCounts.delete(url);
    } else {
      urlRefCounts.set(url, count - 1);
    }
  }
}

export function revokeAllManagedObjectUrls(): void {
  for (const [url] of urlRefCounts) {
    URL.revokeObjectURL(url);
  }
  urlRefCounts.clear();
}
