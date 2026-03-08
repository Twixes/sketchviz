/**
 * Aspect ratio utilities for image generation
 */

export const ASPECT_RATIOS = {
  "9:16": "Portrait 9:16",
  "2:3": "Portrait 2:3",
  "3:4": "Portrait 3:4",
  "4:5": "Portrait 4:5",
  "1:1": "Square",
  "5:4": "Landscape 5:4",
  "4:3": "Landscape 4:3",
  "3:2": "Landscape 3:2",
  "16:9": "Landscape 16:9",
  "21:9": "Ultra-wide 21:9",
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

/**
 * Convert aspect ratio string to numeric ratio
 * @example parseAspectRatio("16:9") => 16/9 ≈ 1.778
 */
export function parseAspectRatio(ratio: AspectRatio): number {
  const [width, height] = ratio.split(":").map(Number);
  return width / height;
}

/**
 * Find the closest aspect ratio to a given width/height ratio
 * @param imageRatio - The current width/height ratio of the image
 * @returns The closest predefined aspect ratio
 */
export function findClosestAspectRatio(imageRatio: number): AspectRatio {
  let closestRatio: AspectRatio = "1:1";
  let minDifference = Number.POSITIVE_INFINITY;
  for (const ratio of Object.keys(ASPECT_RATIOS)) {
    const targetRatio = parseAspectRatio(ratio as AspectRatio);
    const difference = Math.abs(imageRatio - targetRatio);
    if (difference < minDifference) {
      minDifference = difference;
      closestRatio = ratio as AspectRatio;
    }
  }
  return closestRatio;
}

/**
 * Calculate output dimensions for a target megapixel count while maintaining aspect ratio.
 * Used for BFL models that require explicit width and height.
 * @param aspectRatio - The aspect ratio string (e.g., "16:9") or numeric ratio
 * @param megapixels - Target total pixels in millions (1 for 1K, 2 for 1.5K)
 * @param maxDimension - Maximum allowed width or height (default: no limit)
 * @returns Object with width and height in pixels
 */
export function calculateDimensionsForMegapixels(params: {
  aspectRatio: AspectRatio | number;
  megapixels: number;
  maxDimension?: number;
}): { width: number; height: number } {
  const { aspectRatio, megapixels, maxDimension } = params;
  const ratio =
    typeof aspectRatio === "number"
      ? aspectRatio
      : parseAspectRatio(aspectRatio);

  const totalPixels = megapixels * 1_000_000;
  // width * height = totalPixels, width / height = ratio
  // height = sqrt(totalPixels / ratio), width = height * ratio
  let height = Math.floor(Math.sqrt(totalPixels / ratio));
  let width = Math.floor(height * ratio);

  // Cap dimensions if maxDimension is specified
  if (maxDimension) {
    if (width > maxDimension) {
      width = maxDimension;
      height = Math.floor(width / ratio);
    }
    if (height > maxDimension) {
      height = maxDimension;
      width = Math.floor(height * ratio);
    }
    // Final clamp to ensure neither dimension exceeds max after all calculations
    width = Math.min(width, maxDimension);
    height = Math.min(height, maxDimension);
  }

  return { width, height };
}

/**
 * Calculate dimensions to crop an image to match target aspect ratio
 * using "cover" logic (image fills the aspect ratio, content may be cut off)
 * @returns Object with width, height, left, top for cropping
 */
export function calculateCropDimensions(params: {
  imageWidth: number;
  imageHeight: number;
  targetRatio: AspectRatio;
}): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  const { imageWidth, imageHeight, targetRatio } = params;
  const targetNumericRatio = parseAspectRatio(targetRatio);
  const imageRatio = imageWidth / imageHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (imageRatio > targetNumericRatio) {
    // Image is wider than target - crop width to match target ratio
    cropHeight = imageHeight;
    cropWidth = Math.round(cropHeight * targetNumericRatio);
  } else {
    // Image is taller than target - crop height to match target ratio
    cropWidth = imageWidth;
    cropHeight = Math.round(cropWidth / targetNumericRatio);
  }

  return {
    width: cropWidth,
    height: cropHeight,
    left: Math.round((imageWidth - cropWidth) / 2),
    top: Math.round((imageHeight - cropHeight) / 2),
  };
}
