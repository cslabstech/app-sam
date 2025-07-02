import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

interface ProcessImageOptions {
  uri: string;
  targetSizeKB?: number;
  minSizeKB?: number;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface ProcessImageResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  fileSizeKB: number;
}

/**
 * Get file size in bytes from URI
 */
export const getFileSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists ? fileInfo.size || 0 : 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
};

/**
 * Process image with iterative compression to achieve target file size
 * Specifically designed to handle Android camera issues on devices like Asus Zenfone Live L1
 */
export const processImageWithTargetSize = async (
  options: ProcessImageOptions
): Promise<ProcessImageResult> => {
  const {
    uri,
    targetSizeKB = 75, // Target 75KB (middle of 50-100KB range)
    minSizeKB = 50,
    maxSizeKB = 100,
    maxWidth = 1280,
    maxHeight = 1280,
    quality: initialQuality = 0.8
  } = options;

  let currentUri = uri;
  let currentQuality = initialQuality;
  let currentWidth = maxWidth;
  let currentHeight = maxHeight;
  let iteration = 0;
  const maxIterations = 8;

  try {
    // First pass: Get image info and resize if necessary
    const imageInfo = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Calculate optimal dimensions
    const optimalDimensions = calculateOptimalDimensions(
      imageInfo.width,
      imageInfo.height,
      maxWidth,
      maxHeight
    );

    currentWidth = optimalDimensions.width;
    currentHeight = optimalDimensions.height;

    console.log(`[ImageProcessor] Starting processing: ${imageInfo.width}x${imageInfo.height} -> ${currentWidth}x${currentHeight}`);

    while (iteration < maxIterations) {
      const actions: ImageManipulator.Action[] = [
        {
          resize: {
            width: currentWidth,
            height: currentHeight,
          },
        },
      ];

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: currentQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const fileSize = await getFileSize(result.uri);
      const fileSizeKB = Math.round(fileSize / 1024);

      console.log(`[ImageProcessor] Iteration ${iteration + 1}: ${fileSizeKB}KB (quality: ${currentQuality}, dimensions: ${currentWidth}x${currentHeight})`);

      // Check if we're in the acceptable range
      if (fileSizeKB >= minSizeKB && fileSizeKB <= maxSizeKB) {
        console.log(`[ImageProcessor] Target achieved: ${fileSizeKB}KB`);
        return {
          uri: result.uri,
          width: result.width,
          height: result.height,
          fileSize,
          fileSizeKB,
        };
      }

      // Adjust parameters for next iteration
      if (fileSizeKB > maxSizeKB) {
        // File too large - reduce quality or dimensions
        if (currentQuality > 0.3) {
          currentQuality = Math.max(0.3, currentQuality - 0.1);
        } else {
          // If quality is already low, reduce dimensions
          currentWidth = Math.round(currentWidth * 0.9);
          currentHeight = Math.round(currentHeight * 0.9);
          currentQuality = Math.min(0.8, currentQuality + 0.1); // Reset quality slightly
        }
      } else if (fileSizeKB < minSizeKB) {
        // File too small - increase quality or dimensions (but be careful not to go too high)
        if (currentQuality < 0.9 && fileSizeKB < minSizeKB * 0.7) {
          currentQuality = Math.min(0.9, currentQuality + 0.1);
        } else {
          // Accept it if it's close to minimum
          console.log(`[ImageProcessor] Accepting file slightly under target: ${fileSizeKB}KB`);
          return {
            uri: result.uri,
            width: result.width,
            height: result.height,
            fileSize,
            fileSizeKB,
          };
        }
      }

      currentUri = result.uri;
      iteration++;
    }

    // Fallback: Return the last result if we couldn't achieve target
    const finalInfo = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width: currentWidth, height: currentHeight } }],
      { compress: Math.max(0.3, currentQuality), format: ImageManipulator.SaveFormat.JPEG }
    );

    const finalFileSize = await getFileSize(finalInfo.uri);
    const finalFileSizeKB = Math.round(finalFileSize / 1024);

    console.log(`[ImageProcessor] Max iterations reached. Final: ${finalFileSizeKB}KB`);

    return {
      uri: finalInfo.uri,
      width: finalInfo.width,
      height: finalInfo.height,
      fileSize: finalFileSize,
      fileSizeKB: finalFileSizeKB,
    };

  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Simple image compression without watermark
 * For standalone image processing
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.7,
  maxWidth: number = 1280,
  maxHeight: number = 1280
): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Check if image is corrupted or too small
 */
export const validateImage = async (uri: string): Promise<{ isValid: boolean; fileSize: number; fileSizeKB: number }> => {
  try {
    const fileSize = await getFileSize(uri);
    const fileSizeKB = Math.round(fileSize / 1024);
    
    // Consider image invalid if it's too small (likely corrupted)
    const isValid = fileSize > 0 && fileSizeKB >= 10; // At least 10KB
    
    return {
      isValid,
      fileSize,
      fileSizeKB,
    };
  } catch (error) {
    console.error('Error validating image:', error);
    return {
      isValid: false,
      fileSize: 0,
      fileSizeKB: 0,
    };
  }
}; 