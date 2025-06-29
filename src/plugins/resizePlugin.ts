import {Frame} from 'react-native-vision-camera';

declare global {
  var __cachedArrayForResizer: Int8Array | undefined;
}

const CACHE_ID = '__cachedArrayForResizer';

function getArrayFromCache(size: number): Int8Array {
  'worklet';
  if (global[CACHE_ID] == null || global[CACHE_ID].length != size) {
    global[CACHE_ID] = new Int8Array(size);
  }
  return global[CACHE_ID];
}

/**
 * Resizes the given Frame to the given target width and height.
 * Handles both BGRA (iOS) and RGB/RGBA (Android) formats automatically.
 */
export function resize(frame: Frame, width: number, height: number): Int8Array {
  'worklet';
  
  const inputBytesPerRow = frame.bytesPerRow;
  const inputWidth = frame.width;
  const inputHeight = frame.height;
  const inputPixelSize = Math.floor(inputBytesPerRow / inputWidth);
  const padding = inputBytesPerRow - inputWidth * inputPixelSize;
  
  // Debug logging (remove after testing)
  console.log(`Frame info: ${inputWidth}x${inputHeight}, bytesPerRow: ${inputBytesPerRow}, pixelSize: ${inputPixelSize}, padding: ${padding}`);
  
  const targetWidth = width;
  const targetHeight = height;
  const targetPixelSize = 3; // Output RGB
  
  const arrayBuffer = frame.toArrayBuffer();
  const arrayData = new Uint8Array(arrayBuffer);
  
  console.log(`Array buffer length: ${arrayData.length}, expected: ${inputBytesPerRow * inputHeight}`);
  
  const outputFrame = getArrayFromCache(
    targetWidth * targetHeight * targetPixelSize,
  );

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // Map destination pixel position to source pixel
      const srcX = Math.floor((x / targetWidth) * inputWidth);
      const srcY = Math.floor((y / targetHeight) * inputHeight);
      
      // Compute the source index using bytesPerRow (not width * pixelSize)
      const srcIndex = srcY * inputBytesPerRow + srcX * inputPixelSize;
      const destIndex = (y * targetWidth + x) * targetPixelSize;

      // Bounds checking to prevent crashes
      if (srcIndex + 3 >= arrayData.length) {
        console.warn(`Source index ${srcIndex} out of bounds for array length ${arrayData.length}`);
        // Fill with black pixel instead of crashing
        outputFrame[destIndex] = 0;
        outputFrame[destIndex + 1] = 0;
        outputFrame[destIndex + 2] = 0;
        continue;
      }

      // Since your frame shows pixelSize 4 but format "rgb", treat as RGBA
      // Android commonly uses RGBA format even when reported as RGB
      outputFrame[destIndex] = arrayData[srcIndex];         // R
      outputFrame[destIndex + 1] = arrayData[srcIndex + 1]; // G  
      outputFrame[destIndex + 2] = arrayData[srcIndex + 2]; // B
      // Skip alpha channel (srcIndex + 3)
    }
  }

  return outputFrame;
}