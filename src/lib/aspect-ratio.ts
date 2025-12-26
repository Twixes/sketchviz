/**
 * Aspect ratio utilities for image generation
 */

export const ASPECT_RATIOS = [
  "1:1",
  "21:9",
  "16:9",
  "3:2",
  "4:3",
  "5:4",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  "1:1": "Square",
  "2:3": "Portrait 2:3",
  "3:2": "Landscape 3:2",
  "3:4": "Portrait 3:4",
  "4:3": "Landscape 4:3",
  "4:5": "Portrait 4:5",
  "5:4": "Landscape 5:4",
  "9:16": "Portrait 9:16",
  "16:9": "Landscape 16:9",
  "21:9": "Ultra-wide 21:9",
};

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
  let closestRatio: AspectRatio = ASPECT_RATIOS[0];
  let minDifference = Number.POSITIVE_INFINITY;

  for (const ratio of ASPECT_RATIOS) {
    const targetRatio = parseAspectRatio(ratio);
    const difference = Math.abs(imageRatio - targetRatio);

    if (difference < minDifference) {
      minDifference = difference;
      closestRatio = ratio;
    }
  }

  return closestRatio;
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
