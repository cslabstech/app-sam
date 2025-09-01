/**
 * Image Processor Utility Tests - Basic Version
 * Essential tests for utils/imageProcessor.ts functionality
 * Focuses on core functionality with simplified mocking
 */

import {
  getFileSize,
  compressImage,
  validateImage,
} from '@/utils/imageProcessor';

// Mock Expo modules with proper function mocks
const mockFileSystemGetInfo = jest.fn();
const mockImageManipulatorManipulate = jest.fn();

jest.mock('expo-file-system', () => ({
  getInfoAsync: mockFileSystemGetInfo,
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: mockImageManipulatorManipulate,
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

describe('Image Processor Utility - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console functions to reduce test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getFileSize Function', () => {
    it('should return file size for existing file', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: 102400,
      });

      const result = await getFileSize('file://test.jpg');
      expect(result).toBe(102400);
      expect(mockFileSystemGetInfo).toHaveBeenCalledWith('file://test.jpg');
    });

    it('should return 0 for non-existent file', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: false,
      });

      const result = await getFileSize('file://none.jpg');
      expect(result).toBe(0);
    });

    it('should return 0 for file with undefined size', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: undefined,
      });

      const result = await getFileSize('file://undefined.jpg');
      expect(result).toBe(0);
    });

    it('should handle file system errors gracefully', async () => {
      mockFileSystemGetInfo.mockRejectedValue(new Error('File error'));

      const result = await getFileSize('file://error.jpg');
      expect(result).toBe(0);
    });
  });

  describe('compressImage Function', () => {
    it('should compress image successfully', async () => {
      mockImageManipulatorManipulate.mockResolvedValue({
        uri: 'file://compressed.jpg',
        width: 1280,
        height: 960,
      });

      const result = await compressImage('file://original.jpg');
      expect(result).toBe('file://compressed.jpg');
    });

    it('should use custom quality and dimensions', async () => {
      mockImageManipulatorManipulate.mockResolvedValue({
        uri: 'file://custom.jpg',
        width: 800,
        height: 600,
      });

      const result = await compressImage('file://test.jpg', 0.5, 800, 600);
      expect(result).toBe('file://custom.jpg');
      
      expect(mockImageManipulatorManipulate).toHaveBeenCalledWith(
        'file://test.jpg',
        [{ resize: { width: 800, height: 600 } }],
        {
          compress: 0.5,
          format: 'jpeg',
        }
      );
    });

    it('should handle compression errors', async () => {
      mockImageManipulatorManipulate.mockRejectedValue(new Error('Compress failed'));

      await expect(compressImage('file://error.jpg')).rejects.toThrow('Compress failed');
    });
  });

  describe('validateImage Function', () => {
    it('should validate large file as valid', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: 50000, // 49KB - above 10KB threshold
      });

      const result = await validateImage('file://large.jpg');
      
      expect(result.isValid).toBe(true);
      expect(result.fileSize).toBe(50000);
      expect(result.fileSizeKB).toBe(49);
    });

    it('should validate small file as invalid', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: 5000, // 5KB - below 10KB threshold
      });

      const result = await validateImage('file://small.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.fileSize).toBe(5000);
      expect(result.fileSizeKB).toBe(5);
    });

    it('should validate exactly 10KB as valid', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: 10240, // Exactly 10KB
      });

      const result = await validateImage('file://threshold.jpg');
      
      expect(result.isValid).toBe(true);
      expect(result.fileSize).toBe(10240);
      expect(result.fileSizeKB).toBe(10);
    });

    it('should validate just under 10KB as invalid', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: true,
        size: 10239, // Just under 10KB
      });

      const result = await validateImage('file://under.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.fileSize).toBe(10239);
      expect(result.fileSizeKB).toBe(10); // Rounds to 10 but still invalid
    });

    it('should handle non-existent files', async () => {
      mockFileSystemGetInfo.mockResolvedValue({
        exists: false,
      });

      const result = await validateImage('file://none.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.fileSize).toBe(0);
      expect(result.fileSizeKB).toBe(0);
    });

    it('should handle validation errors', async () => {
      mockFileSystemGetInfo.mockRejectedValue(new Error('Access error'));

      const result = await validateImage('file://error.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.fileSize).toBe(0);
      expect(result.fileSizeKB).toBe(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle various file states', async () => {
      const testCases = [
        { exists: false, size: 0, expectedValid: false },
        { exists: true, size: 0, expectedValid: false },
        { exists: true, size: 9000, expectedValid: false }, // 9KB
        { exists: true, size: 11000, expectedValid: true }, // 11KB
        { exists: true, size: 100000, expectedValid: true }, // 98KB
      ];

      for (const testCase of testCases) {
        mockFileSystemGetInfo.mockResolvedValueOnce({
          exists: testCase.exists,
          size: testCase.size,
        });

        const result = await validateImage(`file://test-${testCase.size}.jpg`);
        expect(result.isValid).toBe(testCase.expectedValid);
        expect(result.fileSize).toBe(testCase.size);
      }
    });

    it('should handle malformed URIs gracefully', async () => {
      const malformedUris = [
        null,
        undefined,
        '',
        'not-a-uri',
        'http://invalid',
      ];

      for (const uri of malformedUris) {
        mockFileSystemGetInfo.mockRejectedValueOnce(new Error('Invalid URI'));
        
        const result = await getFileSize(uri as any);
        expect(result).toBe(0);
      }
    });

    it('should handle different image formats', async () => {
      const formats = [
        'file://image.jpg',
        'file://image.jpeg',
        'file://image.png',
        'file://image.webp',
      ];

      formats.forEach(uri => {
        mockImageManipulatorManipulate.mockResolvedValueOnce({
          uri: uri.replace(/\.[^.]+$/, '.compressed.jpg'),
          width: 1280,
          height: 960,
        });
      });

      for (const uri of formats) {
        const result = await compressImage(uri);
        expect(result).toContain('.compressed.jpg');
      }
    });
  });

  describe('Basic Integration', () => {
    it('should validate and process workflow', async () => {
      // Step 1: Validate original (large file)
      mockFileSystemGetInfo.mockResolvedValueOnce({
        exists: true,
        size: 500000, // 488KB
      });

      const validation = await validateImage('file://large.jpg');
      expect(validation.isValid).toBe(true);
      expect(validation.fileSizeKB).toBe(488);

      // Step 2: Compress the file
      mockImageManipulatorManipulate.mockResolvedValueOnce({
        uri: 'file://compressed.jpg',
        width: 1280,
        height: 960,
      });

      const compressed = await compressImage('file://large.jpg');
      expect(compressed).toBe('file://compressed.jpg');

      // Step 3: Validate result (smaller file)
      mockFileSystemGetInfo.mockResolvedValueOnce({
        exists: true,
        size: 80000, // 78KB
      });

      const finalValidation = await validateImage(compressed);
      expect(finalValidation.isValid).toBe(true);
      expect(finalValidation.fileSizeKB).toBe(78);
    });
  });
});