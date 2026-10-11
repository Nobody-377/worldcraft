/**
 * Open-Source Client-Side Vision Classification Engine
 *
 * Library: @xenova/transformers (Apache-2.0 License)
 * Model: Xenova/mobilenet_v1_1.0_224 (Apache-2.0 License)
 * Download Size: ~4.3 MB (Quantized ONNX weights, cached by browser)
 * Supported Labels: 1,000 ImageNet-1K natural categories (plants, flowers, animals, birds, geology, structures)
 */

export interface VisionPrediction {
  label: string;
  confidence: number; // Genuine confidence score from softmax output (0.0 to 1.0)
  model: string;
}

// Singleton classifier pipeline holder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let classifierPromise: Promise<any> | null = null;
let modelLoadError: Error | null = null;

export async function getVisionClassifier() {
  if (typeof window === "undefined") return null;

  if (modelLoadError) {
    throw modelLoadError;
  }

  if (!classifierPromise) {
    classifierPromise = (async () => {
      try {
        const { pipeline, env } = await import("@xenova/transformers");
        // Disable local filesystem models in browser environment; use CDN
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        const classifier = await pipeline(
          "image-classification",
          "Xenova/mobilenet_v1_1.0_224",
          {
            quantized: true,
          }
        );
        return classifier;
      } catch (err) {
        modelLoadError = err instanceof Error ? err : new Error(String(err));
        classifierPromise = null;
        throw modelLoadError;
      }
    })();
  }

  return classifierPromise;
}

/**
 * Clean up raw ImageNet labels into concise, human-friendly titles
 * Example: "daisy" -> "Daisy", "cock, rooster" -> "Rooster"
 */
function formatLabel(rawLabel: string): string {
  // If multiple comma-separated synonyms exist, pick the first
  const primary = rawLabel.split(",")[0].trim();
  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

/**
 * Classifies an image asynchronously using client-side ONNX runtime.
 * Returns null if the model fails to load, the device is offline, or prediction fails.
 */
export async function classifyImage(
  imageSource: string
): Promise<VisionPrediction | null> {
  try {
    const classifier = await getVisionClassifier();
    if (!classifier) return null;

    const results = await classifier(imageSource, { topk: 1 });
    if (!results || results.length === 0) return null;

    const topResult = results[0];
    return {
      label: formatLabel(topResult.label),
      confidence: Math.round(topResult.score * 100) / 100, // Round to 2 decimal places
      model: "MobileNet-v1 (ONNX Quantized)",
    };
  } catch (err) {
    console.warn("Client-side AI vision classification skipped/failed:", err);
    return null;
  }
}
