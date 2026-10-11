export interface InventoryItem {
  id: string;
  name: string;
  blobKey: string; // Key in IndexedDB
  previewUrl: string; // Active object URL
  fileSize: number;
  width: number;
  height: number;
  createdAt: number;
  aiLabel?: string; // Recognized label from vision model
  aiConfidence?: number; // 0.0 - 1.0 confidence score
  aiModel?: string; // Model identifier used
  isClassifying?: boolean; // Async classification in progress
}

export interface CanvasElement {
  id: string;
  inventoryItemId: string;
  blobKey: string;
  previewUrl: string;
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
